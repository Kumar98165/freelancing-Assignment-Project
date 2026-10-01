from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from datetime import datetime, date, timedelta
from app.extensions import db
from app.models.category import Category
from app.models.product import Product

category_bp = Blueprint('category_bp', __name__, url_prefix='/api/categories')

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


def build_category_query(args):
    query = Category.query

    # 1. Search (Name or Description)
    search = (args.get('search') or '').strip()
    if search:
        search_pattern = f"%{search}%"
        query = query.filter(
            (Category.name.ilike(search_pattern)) |
            (Category.description.ilike(search_pattern))
        )

    # 2. Status Filter
    status = (args.get('status') or '').strip()
    if status and status != 'All':
        query = query.filter(Category.status == status)

    # 3. Date Filter
    date_filter = (args.get('dateFilter') or 'ALL').strip().upper()
    start_date_str = (args.get('startDate') or '').strip()
    end_date_str = (args.get('endDate') or '').strip()
    today = date.today()

    if date_filter == 'TODAY':
        query = query.filter(db.func.date(Category.created_at) == today)
    elif date_filter == 'WEEK':
        start_of_week = today - timedelta(days=today.weekday())
        query = query.filter(db.func.date(Category.created_at) >= start_of_week)
    elif date_filter == 'MONTH':
        start_of_month = today.replace(day=1)
        query = query.filter(db.func.date(Category.created_at) >= start_of_month)
    elif date_filter == 'CUSTOM' and start_date_str and end_date_str:
        try:
            s_date = datetime.strptime(start_date_str, '%Y-%m-%d').date()
            e_date = datetime.strptime(end_date_str, '%Y-%m-%d').date()
            query = query.filter(
                db.func.date(Category.created_at) >= s_date,
                db.func.date(Category.created_at) <= e_date
            )
        except ValueError:
            pass

    return query


@category_bp.route('', methods=['GET'])
def get_categories():
    """List categories with search, status, date filtering, and 20-item backend pagination."""
    try:
        query = build_category_query(request.args)
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
        categories = query.order_by(Category.id.asc()).offset((page - 1) * per_page).limit(per_page).all()

        # Count products per category in one aggregation
        prod_counts = db.session.query(
            Product.category, db.func.count(Product.id)
        ).group_by(Product.category).all()
        count_map = {cat_name: count for cat_name, count in prod_counts}

        data = [c.to_dict(product_count=count_map.get(c.name, 0)) for c in categories]

        return jsonify({
            'success': True,
            'count': len(data),
            'total': total_count,
            'page': page,
            'per_page': per_page,
            'total_pages': total_pages,
            'has_next': page < total_pages,
            'has_previous': page > 1,
            'data': data
        }), 200

    except Exception as e:
        return jsonify({'success': False, 'message': f'Error fetching categories: {str(e)}'}), 500


@category_bp.route('/stats', methods=['GET'])
def get_category_stats():
    """Return live filter-aware KPI calculations for Categories Management cards."""
    try:
        query = build_category_query(request.args)
        categories = query.all()
        total_categories = len(categories)
        active_categories = sum(1 for c in categories if c.status == 'Active')

        # Product count per category
        prod_counts = db.session.query(
            Product.category, db.func.count(Product.id)
        ).group_by(Product.category).all()
        count_map = {cat_name: count for cat_name, count in prod_counts}

        total_linked_products = sum(count_map.get(c.name, 0) for c in categories)

        # Top category in this filtered subset
        top_cat_name = 'None'
        top_cat_count = 0
        for c in categories:
            c_count = count_map.get(c.name, 0)
            if c_count > top_cat_count:
                top_cat_count = c_count
                top_cat_name = c.name

        if top_cat_name == 'None' and categories:
            top_cat_name = categories[0].name
            top_cat_count = count_map.get(categories[0].name, 0)

        return jsonify({
            'success': True,
            'data': {
                'totalCategories': total_categories,
                'totalCategoriesCompact': _format_compact(total_categories),
                'activeCategories': active_categories,
                'activeCategoriesCompact': _format_compact(active_categories),
                'linkedProducts': total_linked_products,
                'linkedProductsCompact': _format_compact(total_linked_products),
                'topCategory': {
                    'name': top_cat_name,
                    'productCount': top_cat_count,
                    'productCountCompact': _format_compact(top_cat_count)
                }
            }
        }), 200

    except Exception as e:
        return jsonify({'success': False, 'message': f'Error calculating category stats: {str(e)}'}), 500


@category_bp.route('/<int:category_id>', methods=['GET'])
def get_category(category_id):
    """Retrieve single category by ID."""
    category = Category.query.get_or_404(category_id)
    return jsonify({
        'success': True,
        'data': category.to_dict()
    }), 200


@category_bp.route('', methods=['POST'])
@jwt_required()
def create_category():
    """Create a new category."""
    data = request.get_json() or {}
    name = data.get('name', '').strip()
    description = data.get('description', '').strip()
    status = data.get('status', 'Active').strip()

    if not name:
        return jsonify({'success': False, 'message': 'Category name is required'}), 400

    # Uniqueness check
    if Category.query.filter_by(name=name).first():
        return jsonify({'success': False, 'message': f'Category "{name}" already exists'}), 409

    try:
        new_category = Category(
            name=name,
            description=description,
            status=status
        )
        db.session.add(new_category)
        db.session.commit()

        return jsonify({
            'success': True,
            'message': f'Category "{name}" created successfully',
            'data': new_category.to_dict(product_count=0)
        }), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': f'Failed to create category: {str(e)}'}), 500


@category_bp.route('/<int:category_id>', methods=['PUT'])
@jwt_required()
def update_category(category_id):
    """Update existing category and synchronize linked product category names."""
    category = Category.query.get_or_404(category_id)
    data = request.get_json() or {}
    new_name = data.get('name', category.name).strip()
    description = data.get('description', category.description).strip()
    status = data.get('status', category.status).strip()

    if not new_name:
        return jsonify({'success': False, 'message': 'Category name cannot be empty'}), 400

    # Check unique name excluding self
    existing = Category.query.filter(Category.name == new_name, Category.id != category_id).first()
    if existing:
        return jsonify({'success': False, 'message': f'Category "{new_name}" already exists'}), 409

    old_name = category.name
    try:
        category.name = new_name
        category.description = description
        category.status = status
        category.updated_at = datetime.utcnow()

        # If name changed, synchronize linked products
        if old_name != new_name:
            Product.query.filter_by(category=old_name).update({'category': new_name})

        db.session.commit()
        return jsonify({
            'success': True,
            'message': f'Category "{new_name}" updated successfully',
            'data': category.to_dict()
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': f'Failed to update category: {str(e)}'}), 500


@category_bp.route('/<int:category_id>/toggle-status', methods=['PATCH'])
@jwt_required()
def toggle_category_status(category_id):
    """Toggle category status between Active and Inactive."""
    category = Category.query.get_or_404(category_id)
    try:
        category.status = 'Inactive' if category.status == 'Active' else 'Active'
        category.updated_at = datetime.utcnow()
        db.session.commit()

        return jsonify({
            'success': True,
            'message': f'Category "{category.name}" marked as {category.status}',
            'data': category.to_dict()
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': f'Failed to toggle category status: {str(e)}'}), 500


@category_bp.route('/<int:category_id>', methods=['DELETE'])
@jwt_required()
def delete_category(category_id):
    """Delete a category from the database."""
    category = Category.query.get_or_404(category_id)
    name = category.name
    try:
        db.session.delete(category)
        db.session.commit()
        return jsonify({
            'success': True,
            'message': f'Category "{name}" deleted successfully'
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': f'Failed to delete category: {str(e)}'}), 500
