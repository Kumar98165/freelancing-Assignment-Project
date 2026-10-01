from flask import Blueprint, request, jsonify, current_app
from datetime import datetime, timedelta, date
from sqlalchemy import or_, and_, func
from app.extensions import db
from app.models.product import Product
from app.models.inventory_movement import InventoryMovement

inventory_bp = Blueprint('inventory_bp', __name__, url_prefix='/api/inventory')

def parse_date_str(date_str):
    if not date_str:
        return None
    try:
        return datetime.strptime(date_str, '%Y-%m-%d').date()
    except Exception:
        return None

def build_inventory_query(args):
    search = args.get('search', '').strip()
    category = args.get('category', 'All').strip()
    status = args.get('status', 'ALL').strip().upper()
    date_filter = args.get('dateFilter', 'ALL').strip().upper()
    start_date_str = args.get('startDate', '').strip()
    end_date_str = args.get('endDate', '').strip()

    query = Product.query

    # Search across Name, SKU, Barcode, and Category
    if search:
        search_pattern = f"%{search}%"
        query = query.filter(
            or_(
                Product.name.ilike(search_pattern),
                Product.sku.ilike(search_pattern),
                Product.barcode.ilike(search_pattern),
                Product.category.ilike(search_pattern)
            )
        )

    # Filter by Category
    if category and category != 'All':
        query = query.filter(func.lower(Product.category) == category.lower())

    # Filter by Stock Status (Global DB Filtering)
    stock_col = func.coalesce(Product.stock, 0)
    min_stock_col = func.coalesce(Product.min_stock, 0)

    if status == 'OUT OF STOCK':
        query = query.filter(stock_col == 0)
    elif status == 'LOW STOCK':
        query = query.filter(and_(stock_col > 0, stock_col <= min_stock_col))
    elif status == 'IN STOCK':
        query = query.filter(stock_col > min_stock_col)

    # Filter by Date
    now = datetime.utcnow()
    today = now.date()
    if date_filter == 'TODAY':
        query = query.filter(func.date(Product.updated_at) == today)
    elif date_filter == 'WEEK':
        week_ago = today - timedelta(days=7)
        query = query.filter(func.date(Product.updated_at) >= week_ago)
    elif date_filter == 'MONTH':
        month_ago = today - timedelta(days=30)
        query = query.filter(func.date(Product.updated_at) >= month_ago)
    elif date_filter == 'CUSTOM' and start_date_str and end_date_str:
        s_date = parse_date_str(start_date_str)
        e_date = parse_date_str(end_date_str)
        if s_date and e_date:
            query = query.filter(and_(func.date(Product.updated_at) >= s_date, func.date(Product.updated_at) <= e_date))

    return query


@inventory_bp.route('', methods=['GET'])
def get_inventory():
    try:
        # Apply search, category, stock-status, and date filters first.
        query = build_inventory_query(request.args)

        # Pagination is always enabled: page 1 and 20 items per page by default.
        page = request.args.get('page', default=1, type=int) or 1
        per_page = request.args.get('limit', type=int)
        if per_page is None:
            per_page = request.args.get('per_page', default=20, type=int)
        if not per_page:
            per_page = 20

        # Keep page number positive and page size between 1 and 100.
        page = max(1, page)
        per_page = max(1, min(per_page, 100))

        # Count all matching products before applying pagination.
        total_count = query.count()
        total_pages = (total_count + per_page - 1) // per_page

        # Retrieve only the requested page. Product.id provides stable tie-breaking.
        products = (
            query
            .order_by(Product.name.asc(), Product.id.asc())
            .offset((page - 1) * per_page)
            .limit(per_page)
            .all()
        )

        return jsonify({
            'success': True,
            'count': len(products),
            'total': total_count,
            'page': page,
            'per_page': per_page,
            'total_pages': total_pages,
            'has_next': page < total_pages,
            'has_previous': page > 1,
            'data': [product.to_inventory_dict() for product in products]
        }), 200

    except Exception:
        db.session.rollback()
        # Log the exception on the server rather than returning internal details to clients.
        current_app.logger.exception('Failed to retrieve inventory')
        return jsonify({
            'success': False,
            'message': 'Failed to retrieve inventory'
        }), 500


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


@inventory_bp.route('/stats', methods=['GET'])
def get_inventory_stats():
    try:
        query = build_inventory_query(request.args)
        products = query.all()

        total_value = 0.0
        total_units = 0
        low_stock_count = 0
        out_of_stock_count = 0
        in_stock_count = 0

        for p in products:
            curr_stock = p.stock or 0
            buying_price = float(p.buying_price or 0.0)
            min_stock = p.min_stock or 0

            total_value += (curr_stock * buying_price)
            total_units += curr_stock

            if curr_stock == 0:
                out_of_stock_count += 1
            elif curr_stock <= min_stock:
                low_stock_count += 1
            else:
                in_stock_count += 1

        return jsonify({
            'success': True,
            'data': {
                'totalStockValue': round(total_value, 2),
                'totalStockValueCompact': f"TSh {_format_compact(total_value)}",
                'totalStockUnits': total_units,
                'totalStockUnitsCompact': f"{_format_compact(total_units)} Units",
                'lowStockCount': low_stock_count,
                'outOfStockCount': out_of_stock_count,
                'inStockCount': in_stock_count,
                'totalProducts': len(products)
            }
        }), 200

    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Failed to compute inventory stats: {str(e)}'
        }), 500


@inventory_bp.route('/receive', methods=['POST'])
def receive_stock():
    """
    Drawer API: Log inward stock shipment & update stock count
    """
    try:
        data = request.get_json()
        if not data:
            return jsonify({'success': False, 'message': 'Request body is missing'}), 400

        product_id = data.get('productId')
        if not product_id:
            return jsonify({'success': False, 'message': 'productId is required'}), 400

        try:
            qty_to_add = int(data.get('quantity', 0))
        except (ValueError, TypeError):
            return jsonify({'success': False, 'message': 'Valid integer quantity is required'}), 400

        if qty_to_add <= 0:
            return jsonify({'success': False, 'message': 'Quantity must be greater than 0'}), 400

        product = Product.query.get(product_id)
        if not product:
            return jsonify({'success': False, 'message': f'Product with ID {product_id} not found'}), 404

        previous_stock = product.stock or 0
        new_stock = previous_stock + qty_to_add
        product.stock = new_stock

        # Unit cost / Buying Price update (if provided)
        unit_cost = None
        if 'unitCost' in data and data['unitCost'] is not None and data['unitCost'] != '':
            try:
                unit_cost = float(data['unitCost'])
                if unit_cost > 0:
                    product.buying_price = unit_cost
            except (ValueError, TypeError):
                pass

        # Selling Price update (if provided)
        if 'sellingPrice' in data and data['sellingPrice'] is not None and data['sellingPrice'] != '':
            try:
                selling_price = float(data['sellingPrice'])
                if selling_price > 0:
                    product.selling_price = selling_price
            except (ValueError, TypeError):
                pass

        # Barcode update (if provided)
        if data.get('barcode') and str(data.get('barcode')).strip():
            product.barcode = str(data.get('barcode')).strip()

        # Expiry date update (if provided)
        expiry_date_obj = None
        if data.get('expiryDate') or data.get('batchExpiry'):
            exp_str = data.get('expiryDate') or data.get('batchExpiry')
            expiry_date_obj = parse_date_str(exp_str)
            if expiry_date_obj:
                product.expiry_date = expiry_date_obj

        reference_no = data.get('referenceNo') or data.get('poRef') or data.get('ref') or ''
        notes = data.get('notes', '')

        # Audit log movement
        movement = InventoryMovement(
            product_id=product.id,
            movement_type='RECEIVE',
            quantity=qty_to_add,
            previous_stock=previous_stock,
            new_stock=new_stock,
            unit_cost=unit_cost,
            reference_no=reference_no,
            batch_expiry=expiry_date_obj,
            notes=notes
        )
        db.session.add(movement)

        product.updated_at = datetime.utcnow()
        db.session.commit()

        return jsonify({
            'success': True,
            'message': f'Successfully received +{qty_to_add} {product.unit or "Units"} for {product.name}',
            'data': product.to_inventory_dict(),
            'movement': movement.to_dict()
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'message': f'Failed to receive stock: {str(e)}'
        }), 500


@inventory_bp.route('/adjust', methods=['POST'])
def adjust_stock():
    """
    Drawer API: Adjust physical shelf stock count
    """
    try:
        data = request.get_json()
        if not data:
            return jsonify({'success': False, 'message': 'Request body is missing'}), 400

        product_id = data.get('productId')
        if not product_id:
            return jsonify({'success': False, 'message': 'productId is required'}), 400

        try:
            new_stock = int(data.get('newStock', 0))
        except (ValueError, TypeError):
            return jsonify({'success': False, 'message': 'Valid integer newStock is required'}), 400

        if new_stock < 0:
            return jsonify({'success': False, 'message': 'Stock cannot be negative'}), 400

        product = Product.query.get(product_id)
        if not product:
            return jsonify({'success': False, 'message': f'Product with ID {product_id} not found'}), 404

        previous_stock = product.stock or 0
        diff = new_stock - previous_stock
        product.stock = new_stock

        reason = data.get('reason', 'PHYSICAL_COUNT')
        notes = data.get('notes', '')

        # Expiry date update (if provided)
        expiry_date_obj = None
        if data.get('expiryDate'):
            expiry_date_obj = parse_date_str(data.get('expiryDate'))
            if expiry_date_obj:
                product.expiry_date = expiry_date_obj

        # Audit movement
        movement = InventoryMovement(
            product_id=product.id,
            movement_type='ADJUSTMENT',
            quantity=diff,
            previous_stock=previous_stock,
            new_stock=new_stock,
            reason=reason,
            batch_expiry=expiry_date_obj,
            notes=notes
        )
        db.session.add(movement)

        product.updated_at = datetime.utcnow()
        db.session.commit()

        return jsonify({
            'success': True,
            'message': f'Stock updated for {product.name} ({new_stock} {product.unit or "Units"})',
            'data': product.to_inventory_dict(),
            'movement': movement.to_dict()
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'message': f'Failed to adjust stock: {str(e)}'
        }), 500


@inventory_bp.route('/movements', methods=['GET'])
def get_movements():
    try:
        product_id = request.args.get('productId')
        query = InventoryMovement.query

        if product_id:
            query = query.filter(InventoryMovement.product_id == product_id)

        movements = query.order_by(InventoryMovement.created_at.desc()).limit(100).all()

        return jsonify({
            'success': True,
            'count': len(movements),
            'data': [m.to_dict() for m in movements]
        }), 200

    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Failed to retrieve inventory movements: {str(e)}'
        }), 500
