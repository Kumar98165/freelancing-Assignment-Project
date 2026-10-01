from flask import Blueprint, request
from datetime import datetime, timedelta, date
from sqlalchemy import or_, and_, func
from app.extensions import db
from app.models.user import User
from app.utils.responses import success_response, error_response
from app.utils.decorators import role_required, admin_required

user_bp = Blueprint('users', __name__, url_prefix='/api/users')


def _format_compact(val: float) -> str:
    if not val:
        return "0"
    abs_v = abs(val)
    if abs_v >= 10_000_000_000:
        return f"{val / 10_000_000_000:.2f} Arab"
    if abs_v >= 10_000_000:
        return f"{val / 10_000_000:.2f} Crore"
    if abs_v >= 100_000:
        return f"{val / 100_000:.2f} Lakh"
    if abs_v >= 1_000:
        return f"{val / 1_000:.1f} Thousand"
    return f"{val:,.0f}"


def build_user_query(args):
    query = User.query

    # Search filter (Full Name, Username, Phone)
    search = (args.get('search') or '').strip().lower()
    if search:
        query = query.filter(
            or_(
                func.lower(User.full_name).contains(search),
                func.lower(User.username).contains(search),
                User.phone.contains(search)
            )
        )

    # Role filter
    role = args.get('role')
    if role and role != 'ALL':
        query = query.filter(User.role == role)

    # Status filter
    status = args.get('status')
    if status and status != 'ALL':
        query = query.filter(User.status == status)

    # Date filter
    date_filter = args.get('dateFilter')
    today = date.today()
    if date_filter == 'TODAY':
        query = query.filter(func.date(User.created_at) == today)
    elif date_filter == 'WEEK':
        start_of_week = today - timedelta(days=today.weekday())
        query = query.filter(func.date(User.created_at) >= start_of_week)
    elif date_filter == 'MONTH':
        start_of_month = today.replace(day=1)
        query = query.filter(func.date(User.created_at) >= start_of_month)
    elif date_filter == 'CUSTOM':
        start_str = args.get('startDate')
        end_str = args.get('endDate')
        if start_str and end_str:
            try:
                s_date = datetime.strptime(start_str, '%Y-%m-%d').date()
                e_date = datetime.strptime(end_str, '%Y-%m-%d').date()
                query = query.filter(and_(func.date(User.created_at) >= s_date, func.date(User.created_at) <= e_date))
            except Exception:
                pass

    return query


@user_bp.route('', methods=['GET'])
def get_users():
    try:
        query = build_user_query(request.args)
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
        users = query.order_by(User.created_at.desc(), User.id.asc()).offset((page - 1) * per_page).limit(per_page).all()

        return success_response({
            'users': [u.to_dict() for u in users],
            'total': total_count,
            'page': page,
            'per_page': per_page,
            'total_pages': total_pages,
            'has_next': page < total_pages,
            'has_previous': page > 1
        })
    except Exception as e:
        return error_response(f"Failed to retrieve users: {str(e)}", 500)


@user_bp.route('/stats', methods=['GET'])
def get_user_stats():
    try:
        query = build_user_query(request.args)
        total_users = query.count()
        users = query.all()

        active_cashiers = sum(1 for u in users if u.role == 'CASHIER' and u.status == 'Active')
        total_cashiers = sum(1 for u in users if u.role == 'CASHIER')
        admin_accounts = sum(1 for u in users if u.role == 'ADMIN')
        active_users = sum(1 for u in users if u.status == 'Active')
        inactive_users = sum(1 for u in users if u.status == 'Inactive')
        health_percentage = round((active_users / total_users) * 100) if total_users > 0 else 100

        return success_response({
            'totalUsers': total_users,
            'totalUsersCompact': _format_compact(total_users),
            'activeCashiers': active_cashiers,
            'totalCashiers': total_cashiers,
            'adminAccounts': admin_accounts,
            'activeUsers': active_users,
            'inactiveUsers': inactive_users,
            'healthPercentage': health_percentage
        })
    except Exception as e:
        return error_response(f"Failed to retrieve user stats: {str(e)}", 500)



@user_bp.route('/<int:user_id>', methods=['GET'])
@admin_required()
def get_user(user_id):
    user = User.query.get(user_id)
    if not user:
        return error_response('User not found', 404)
    return success_response({'user': user.to_dict()})


@user_bp.route('', methods=['POST'])
@admin_required()
def create_user():
    data = request.get_json() or {}
    full_name = (data.get('fullName') or '').strip()
    username = (data.get('username') or '').strip().lower()
    phone = (data.get('phone') or '').strip()
    role = data.get('role', 'CASHIER')
    status = data.get('status', 'Active')
    password = data.get('password') or ''

    if not full_name:
        return error_response('Full Name is required', 400)
    if not username:
        return error_response('Username is required', 400)
    if not password:
        return error_response('Password is required for new user', 400)
    if role not in ['ADMIN', 'CASHIER']:
        return error_response('Invalid role specified. Only ADMIN and CASHIER are supported.', 400)

    # Check for existing username
    existing = User.query.filter(db.func.lower(User.username) == username).first()
    if existing:
        return error_response(f"Username '{username}' is already taken", 400)

    new_user = User(
        full_name=full_name,
        username=username,
        phone=phone,
        role=role,
        status=status
    )
    new_user.set_password(password)

    db.session.add(new_user)
    db.session.commit()

    return success_response({'user': new_user.to_dict()}, message='User created successfully', status_code=201)


@user_bp.route('/<int:user_id>', methods=['PUT'])
@admin_required()
def update_user(user_id):
    user = User.query.get(user_id)
    if not user:
        return error_response('User not found', 404)

    data = request.get_json() or {}
    full_name = (data.get('fullName') or '').strip()
    username = (data.get('username') or '').strip().lower()
    phone = (data.get('phone') or '').strip()
    role = data.get('role')
    status = data.get('status')
    password = data.get('password')

    if full_name:
        user.full_name = full_name
    if phone is not None:
        user.phone = phone
    if role and role in ['ADMIN', 'CASHIER']:
        user.role = role
    if status and status in ['Active', 'Inactive']:
        user.status = status

    if username and username != user.username:
        existing = User.query.filter(db.func.lower(User.username) == username, User.id != user_id).first()
        if existing:
            return error_response(f"Username '{username}' is already in use by another user", 400)
        user.username = username

    if password:
        user.set_password(password)

    db.session.commit()
    return success_response({'user': user.to_dict()}, message='User updated successfully')


@user_bp.route('/<int:user_id>/toggle-status', methods=['PATCH'])
@admin_required()
def toggle_user_status(user_id):
    user = User.query.get(user_id)
    if not user:
        return error_response('User not found', 404)

    user.status = 'Inactive' if user.status == 'Active' else 'Active'
    db.session.commit()

    return success_response({'user': user.to_dict()}, message=f"User status updated to {user.status}")


@user_bp.route('/<int:user_id>', methods=['DELETE'])
@admin_required()
def delete_user(user_id):
    user = User.query.get(user_id)
    if not user:
        return error_response('User not found', 404)

    # Prevent deleting the last admin
    if user.role == 'ADMIN':
        admin_count = User.query.filter_by(role='ADMIN').count()
        if admin_count <= 1:
            return error_response('Cannot delete the only remaining Administrator account', 400)

    db.session.delete(user)
    db.session.commit()
    return success_response(message='User deleted successfully')
