from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from datetime import datetime, date, timedelta
from app.extensions import db
from app.models.product import Product
from app.models.category import Category
from app.utils.decorators import admin_required

product_bp = Blueprint('product_bp', __name__, url_prefix='/api/products')

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


def build_product_query(args):
    query = Product.query

    # 1. Search (Name, SKU, Barcode)
    search = (args.get('search') or '').strip()
    if search:
        search_pattern = f"%{search}%"
        query = query.filter(
            (Product.name.ilike(search_pattern)) |
            (Product.sku.ilike(search_pattern)) |
            (Product.barcode.ilike(search_pattern))
        )

    # 2. Category Filter
    category = (args.get('category') or '').strip()
    if category and category != 'All':
        query = query.filter(Product.category == category)

    # 3. Status Filter
    status = (args.get('status') or '').strip()
    if status and status != 'All':
        query = query.filter(Product.status == status)

    # 4. Date Filtering
    date_filter = (args.get('dateFilter') or 'ALL').strip().upper()
    start_date_str = (args.get('startDate') or '').strip()
    end_date_str = (args.get('endDate') or '').strip()
    today = date.today()

    if date_filter == 'TODAY':
        query = query.filter(db.func.date(Product.created_at) == today)
    elif date_filter == 'WEEK':
        start_of_week = today - timedelta(days=today.weekday())
        query = query.filter(db.func.date(Product.created_at) >= start_of_week)
    elif date_filter == 'MONTH':
        start_of_month = today.replace(day=1)
        query = query.filter(db.func.date(Product.created_at) >= start_of_month)
    elif date_filter == 'CUSTOM' and start_date_str and end_date_str:
        try:
            s_date = datetime.strptime(start_date_str, '%Y-%m-%d').date()
            e_date = datetime.strptime(end_date_str, '%Y-%m-%d').date()
            query = query.filter(
                db.func.date(Product.created_at) >= s_date,
                db.func.date(Product.created_at) <= e_date
            )
        except ValueError:
            pass

    return query


@product_bp.route('', methods=['GET'])
def get_products():
    """List products with server search, category, status, date range filtering, and 20-item pagination."""
    try:
        query = build_product_query(request.args)
        total_count = query.count()

        sort_by = (request.args.get('sortBy') or 'RECENT').strip().upper()
        if sort_by == 'NAME_ASC':
            query = query.order_by(Product.name.asc())
        elif sort_by == 'PRICE_DESC':
            query = query.order_by(Product.selling_price.desc())
        elif sort_by == 'PRICE_ASC':
            query = query.order_by(Product.selling_price.asc())
        elif sort_by == 'STOCK_ASC':
            query = query.order_by(Product.stock.asc())
        else:
            query = query.order_by(Product.id.desc())

        # Pagination: default 20 items per page
        page = request.args.get('page', default=1, type=int) or 1
        per_page = request.args.get('limit', type=int)
        if per_page is None:
            per_page = request.args.get('per_page', default=20, type=int)
        if not per_page:
            per_page = 20

        page = max(1, page)
        per_page = max(1, min(per_page, 100))

        total_pages = (total_count + per_page - 1) // per_page if total_count > 0 else 1
        products = query.offset((page - 1) * per_page).limit(per_page).all()

        return jsonify({
            'success': True,
            'count': len(products),
            'total': total_count,
            'page': page,
            'per_page': per_page,
            'total_pages': total_pages,
            'has_next': page < total_pages,
            'has_previous': page > 1,
            'data': [p.to_dict() for p in products]
        }), 200

    except Exception as e:
        return jsonify({'success': False, 'message': f'Error fetching products: {str(e)}'}), 500


@product_bp.route('/stats', methods=['GET'])
def get_product_stats():
    """Return live filter-aware KPI calculations with Indian compact scale formatting."""
    try:
        query = build_product_query(request.args)
        filtered_products = query.all()

        total_products = len(filtered_products)
        active_products = sum(1 for p in filtered_products if p.status == 'Active')
        low_stock_count = sum(1 for p in filtered_products if p.stock <= p.min_stock)
        total_inventory_value = sum(p.stock * p.selling_price for p in filtered_products)
        total_stock_units = sum(p.stock for p in filtered_products)

        # All categories from Category table and Product records
        cat_records = Category.query.all()
        cat_names = [c.name for c in cat_records if c.name]
        prod_cats = [r[0] for r in db.session.query(Product.category).distinct().all() if r[0]]
        categories = sorted(list(set(cat_names + prod_cats)))
        if not categories:
            categories = ['Beverages', 'Groceries', 'Dairy & Eggs', 'Fresh Produce', 'Personal Care', 'Household Items']

        return jsonify({
            'success': True,
            'data': {
                'totalProducts': total_products,
                'totalProductsCompact': _format_compact(total_products),
                'activeProducts': active_products,
                'activeProductsCompact': _format_compact(active_products),
                'lowStockCount': low_stock_count,
                'totalInventoryValue': round(total_inventory_value, 2),
                'totalInventoryValueCompact': _format_compact(total_inventory_value),
                'totalStockUnits': total_stock_units,
                'totalStockUnitsCompact': _format_compact(total_stock_units),
                'categories': categories
            }
        }), 200

    except Exception as e:
        return jsonify({'success': False, 'message': f'Error calculating product stats: {str(e)}'}), 500


@product_bp.route('/categories', methods=['GET'])
def get_product_categories():
    """Return all categories currently registered in categories table and products."""
    try:
        cat_records = Category.query.order_by(Category.name.asc()).all()
        cat_names = [c.name for c in cat_records if c.name]
        prod_cats = [r[0] for r in db.session.query(Product.category).distinct().all() if r[0]]
        merged_categories = sorted(list(set(cat_names + prod_cats)))
        if not merged_categories:
            merged_categories = ['Beverages', 'Groceries', 'Dairy & Eggs', 'Fresh Produce', 'Personal Care', 'Household Items']
        return jsonify({
            'success': True,
            'data': merged_categories
        }), 200
    except Exception as e:
        return jsonify({'success': False, 'message': f'Error fetching categories: {str(e)}'}), 500


@product_bp.route('/<int:product_id>', methods=['GET'])
def get_product(product_id):
    """Retrieve single product by ID."""
    product = Product.query.get_or_404(product_id)
    return jsonify({
        'success': True,
        'data': product.to_dict()
    }), 200


@product_bp.route('', methods=['POST'])
@jwt_required()
def create_product():
    """Create a new product."""
    data = request.get_json() or {}

    name = data.get('name', '').strip()
    sku = data.get('sku', '').strip()
    barcode = data.get('barcode', '').strip()
    category = data.get('category', 'Beverages').strip()
    barcode_type = data.get('barcodeType', 'MANUFACTURER')
    buying_price = float(data.get('buyingPrice', 0))
    selling_price = float(data.get('sellingPrice', 0))
    stock = int(data.get('stock', 0))
    min_stock = int(data.get('minStock', 10))
    tax = data.get('tax', '18% VAT')
    status = data.get('status', 'Active')
    expiry_date_str = data.get('expiryDate')

    # Basic validations
    if not name:
        return jsonify({'success': False, 'message': 'Product name is required'}), 400
    if not sku:
        return jsonify({'success': False, 'message': 'Product SKU is required'}), 400
    if not barcode:
        return jsonify({'success': False, 'message': 'Product barcode is required'}), 400
    if selling_price <= 0:
        return jsonify({'success': False, 'message': 'Selling price must be greater than 0'}), 400

    # Check unique SKU
    if Product.query.filter_by(sku=sku).first():
        return jsonify({'success': False, 'message': f'Product with SKU "{sku}" already exists'}), 409

    # Check unique Barcode
    if Product.query.filter_by(barcode=barcode).first():
        return jsonify({'success': False, 'message': f'Product with Barcode "{barcode}" already exists'}), 409

    expiry_date = None
    if expiry_date_str:
        try:
            expiry_date = datetime.strptime(expiry_date_str, '%Y-%m-%d').date()
        except ValueError:
            pass

    try:
        new_product = Product(
            name=name,
            sku=sku,
            category=category,
            barcode=barcode,
            barcode_type=barcode_type,
            buying_price=buying_price,
            selling_price=selling_price,
            stock=stock,
            min_stock=min_stock,
            tax=tax,
            status=status,
            expiry_date=expiry_date
        )
        db.session.add(new_product)
        db.session.commit()

        return jsonify({
            'success': True,
            'message': f'Product "{name}" added successfully',
            'data': new_product.to_dict()
        }), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': f'Failed to create product: {str(e)}'}), 500


@product_bp.route('/<int:product_id>', methods=['PUT'])
@jwt_required()
def update_product(product_id):
    """Update existing product details."""
    product = Product.query.get_or_404(product_id)
    data = request.get_json() or {}

    name = data.get('name', product.name).strip()
    sku = data.get('sku', product.sku).strip()
    barcode = data.get('barcode', product.barcode).strip()
    category = data.get('category', product.category).strip()
    barcode_type = data.get('barcodeType', product.barcode_type)
    buying_price = float(data.get('buyingPrice', product.buying_price))
    selling_price = float(data.get('sellingPrice', product.selling_price))
    stock = int(data.get('stock', product.stock))
    min_stock = int(data.get('minStock', product.min_stock))
    tax = data.get('tax', product.tax)
    status = data.get('status', product.status)
    expiry_date_str = data.get('expiryDate')

    if not name:
        return jsonify({'success': False, 'message': 'Product name cannot be empty'}), 400
    if not sku:
        return jsonify({'success': False, 'message': 'Product SKU cannot be empty'}), 400
    if not barcode:
        return jsonify({'success': False, 'message': 'Product barcode cannot be empty'}), 400
    if selling_price <= 0:
        return jsonify({'success': False, 'message': 'Selling price must be greater than 0'}), 400

    # SKU uniqueness check (excluding self)
    existing_sku = Product.query.filter(Product.sku == sku, Product.id != product_id).first()
    if existing_sku:
        return jsonify({'success': False, 'message': f'Another product with SKU "{sku}" already exists'}), 409

    # Barcode uniqueness check (excluding self)
    existing_barcode = Product.query.filter(Product.barcode == barcode, Product.id != product_id).first()
    if existing_barcode:
        return jsonify({'success': False, 'message': f'Another product with Barcode "{barcode}" already exists'}), 409

    expiry_date = product.expiry_date
    if expiry_date_str:
        try:
            expiry_date = datetime.strptime(expiry_date_str, '%Y-%m-%d').date()
        except ValueError:
            pass
    elif 'expiryDate' in data and data['expiryDate'] is None:
        expiry_date = None

    try:
        product.name = name
        product.sku = sku
        product.barcode = barcode
        product.category = category
        product.barcode_type = barcode_type
        product.buying_price = buying_price
        product.selling_price = selling_price
        product.stock = stock
        product.min_stock = min_stock
        product.tax = tax
        product.status = status
        product.expiry_date = expiry_date
        product.updated_at = datetime.utcnow()

        db.session.commit()
        return jsonify({
            'success': True,
            'message': f'Product "{name}" updated successfully',
            'data': product.to_dict()
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': f'Failed to update product: {str(e)}'}), 500


@product_bp.route('/<int:product_id>/toggle-status', methods=['PATCH'])
@jwt_required()
def toggle_product_status(product_id):
    """Toggle product status between Active and Inactive."""
    product = Product.query.get_or_404(product_id)
    try:
        product.status = 'Inactive' if product.status == 'Active' else 'Active'
        product.updated_at = datetime.utcnow()
        db.session.commit()
        return jsonify({
            'success': True,
            'message': f'Product "{product.name}" is now {product.status}',
            'data': product.to_dict()
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': f'Failed to toggle status: {str(e)}'}), 500


@product_bp.route('/<int:product_id>', methods=['DELETE'])
@jwt_required()
def delete_product(product_id):
    """Delete a product from the database."""
    product = Product.query.get_or_404(product_id)
    name = product.name
    try:
        db.session.delete(product)
        db.session.commit()
        return jsonify({
            'success': True,
            'message': f'Product "{name}" deleted successfully'
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': f'Failed to delete product: {str(e)}'}), 500
