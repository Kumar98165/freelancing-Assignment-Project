from flask import Blueprint, request
from datetime import datetime, timedelta, date
from sqlalchemy import or_, and_, func
from app.extensions import db
from app.models.customer import Customer, CustomerPurchase
from app.utils.responses import success_response, error_response
from app.utils.decorators import role_required

customer_bp = Blueprint('customers', __name__, url_prefix='/api/customers')


def _format_compact(val: float) -> str:
    if not val:
        return "0"
    abs_v = abs(val)
    if abs_v >= 10_000_000_000:  # 1 Arab
        return f"{val / 10_000_000_000:.2f} Arab"
    if abs_v >= 10_000_000:  # 1 Crore
        return f"{val / 10_000_000:.2f} Crore"
    if abs_v >= 100_000:  # 1 Lakh
        return f"{val / 100_000:.2f} Lakh"
    if abs_v >= 1_000:  # 1 Thousand
        return f"{val / 1_000:.1f} Thousand"
    return f"{val:,.0f}"


def build_customer_query(args):
    query = Customer.query

    # Search filter (Name, Phone, Email, Customer ID)
    search = (args.get('search') or '').strip().lower()
    if search:
        clean_search = search.replace('#cst-', '').replace('cst-', '').lstrip('0')
        or_clauses = [
            func.lower(Customer.name).contains(search),
            Customer.phone.contains(search),
            func.lower(Customer.email).contains(search)
        ]
        if clean_search.isdigit():
            or_clauses.append(Customer.id == int(clean_search))
        query = query.filter(or_(*or_clauses))

    # Tier filter (VIP: >= 1M, REGULAR: 100k - 1M, NEW: < 100k)
    tier = args.get('tier')
    if tier == 'VIP':
        query = query.filter(Customer.total_purchases >= 1000000)
    elif tier == 'REGULAR':
        query = query.filter(Customer.total_purchases >= 100000, Customer.total_purchases < 1000000)
    elif tier == 'NEW':
        query = query.filter(Customer.total_purchases < 100000)

    # Date filter
    date_filter = args.get('dateFilter')
    today = date.today()
    if date_filter == 'TODAY':
        query = query.filter(func.date(Customer.created_at) == today)
    elif date_filter == 'WEEK':
        start_of_week = today - timedelta(days=today.weekday())
        query = query.filter(func.date(Customer.created_at) >= start_of_week)
    elif date_filter == 'MONTH':
        start_of_month = today.replace(day=1)
        query = query.filter(func.date(Customer.created_at) >= start_of_month)
    elif date_filter == 'CUSTOM':
        start_str = args.get('startDate')
        end_str = args.get('endDate')
        if start_str and end_str:
            try:
                s_date = datetime.strptime(start_str, '%Y-%m-%d').date()
                e_date = datetime.strptime(end_str, '%Y-%m-%d').date()
                query = query.filter(and_(func.date(Customer.created_at) >= s_date, func.date(Customer.created_at) <= e_date))
            except Exception:
                pass

    return query


@customer_bp.route('', methods=['GET'])
def get_customers():
    try:
        query = build_customer_query(request.args)

        # Sorting
        sort_by = request.args.get('sortBy', 'TOTAL_DESC')
        if sort_by == 'TOTAL_DESC':
            query = query.order_by(Customer.total_purchases.desc(), Customer.id.asc())
        elif sort_by == 'TOTAL_ASC':
            query = query.order_by(Customer.total_purchases.asc(), Customer.id.asc())
        elif sort_by == 'NAME_ASC':
            query = query.order_by(Customer.name.asc(), Customer.id.asc())
        elif sort_by == 'NAME_DESC':
            query = query.order_by(Customer.name.desc(), Customer.id.asc())
        elif sort_by == 'RECENT':
            query = query.order_by(Customer.last_purchase.desc().nullslast(), Customer.id.asc())
        else:
            query = query.order_by(Customer.created_at.desc(), Customer.id.asc())

        total_count = query.count()

        # Pagination: 20 items per page by default
        page = request.args.get('page', default=1, type=int) or 1
        per_page = request.args.get('limit', type=int)
        if per_page is None:
            per_page = request.args.get('per_page', default=20, type=int)
        if not per_page:
            per_page = 20

        page = max(1, page)
        per_page = max(1, min(per_page, 100))

        total_pages = (total_count + per_page - 1) // per_page if total_count > 0 else 1
        customers = query.offset((page - 1) * per_page).limit(per_page).all()

        return success_response({
            'customers': [c.to_dict(include_purchases=True) for c in customers],
            'total': total_count,
            'page': page,
            'per_page': per_page,
            'total_pages': total_pages,
            'has_next': page < total_pages,
            'has_previous': page > 1
        })
    except Exception as e:
        return error_response(f"Failed to retrieve customers: {str(e)}", 500)


@customer_bp.route('/stats', methods=['GET'])
def get_customer_stats():
    try:
        query = build_customer_query(request.args)
        total_customers = query.count()
        customers = query.all()

        revenue_sum = sum(c.total_purchases or 0.0 for c in customers)
        avg_lifetime_value = round(revenue_sum / total_customers) if total_customers > 0 else 0.0
        vip_count = sum(1 for c in customers if (c.total_purchases or 0.0) >= 1000000)

        top_cust = max(customers, key=lambda c: c.total_purchases or 0.0, default=None)
        top_spender = top_cust.name if top_cust and (top_cust.total_purchases or 0.0) > 0 else 'None'

        return success_response({
            'totalCustomers': total_customers,
            'customerRevenue': float(revenue_sum),
            'customerRevenueCompact': _format_compact(revenue_sum),
            'avgLifetimeValue': float(avg_lifetime_value),
            'avgLifetimeValueCompact': _format_compact(avg_lifetime_value),
            'vipCount': vip_count,
            'topSpender': top_spender
        })
    except Exception as e:
        return error_response(f"Failed to retrieve customer stats: {str(e)}", 500)



@customer_bp.route('/<int:customer_id>', methods=['GET'])
@role_required(['ADMIN', 'CASHIER'])
def get_customer(customer_id):
    customer = Customer.query.get(customer_id)
    if not customer:
        return error_response('Customer not found', 404)
    return success_response({'customer': customer.to_dict(include_purchases=True)})


@customer_bp.route('', methods=['POST'])
@role_required(['ADMIN', 'CASHIER'])
def create_customer():
    data = request.get_json() or {}
    name = (data.get('name') or '').strip()
    phone = (data.get('phone') or '').strip()
    email = (data.get('email') or '').strip()

    if not name:
        return error_response('Customer Name is required', 400)
    if not phone:
        return error_response('Phone Number is required', 400)

    # Check for duplicate phone
    existing = Customer.query.filter_by(phone=phone).first()
    if existing:
        return error_response(f"A customer with phone '{phone}' already exists ({existing.name})", 400)

    new_customer = Customer(
        name=name,
        phone=phone,
        email=email if email else None,
        total_purchases=0.0
    )

    db.session.add(new_customer)
    db.session.commit()

    return success_response({'customer': new_customer.to_dict()}, message='Customer registered successfully', status_code=201)


@customer_bp.route('/<int:customer_id>', methods=['PUT'])
@role_required(['ADMIN', 'CASHIER'])
def update_customer(customer_id):
    customer = Customer.query.get(customer_id)
    if not customer:
        return error_response('Customer not found', 404)

    data = request.get_json() or {}
    name = (data.get('name') or '').strip()
    phone = (data.get('phone') or '').strip()
    email = (data.get('email') or '').strip()

    if name:
        customer.name = name
    if phone:
        # Check duplicate phone for other customer
        existing = Customer.query.filter(Customer.phone == phone, Customer.id != customer_id).first()
        if existing:
            return error_response(f"Phone '{phone}' is already used by another customer", 400)
        customer.phone = phone
        
    customer.email = email if email else None

    db.session.commit()
    return success_response({'customer': customer.to_dict()}, message='Customer profile updated successfully')


@customer_bp.route('/<int:customer_id>', methods=['DELETE'])
@role_required(['ADMIN'])
def delete_customer(customer_id):
    customer = Customer.query.get(customer_id)
    if not customer:
        return error_response('Customer not found', 404)

    db.session.delete(customer)
    db.session.commit()
    return success_response(message='Customer deleted successfully')
