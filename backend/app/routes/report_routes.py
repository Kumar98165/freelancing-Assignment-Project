from flask import Blueprint, jsonify, request
from datetime import datetime, date, timedelta
from sqlalchemy import func
from app.extensions import db
from app.models.sale import Sale
from app.models.product import Product
from app.models.category import Category
from app.models.customer import Customer

report_bp = Blueprint('reports', __name__, url_prefix='/api/reports')

@report_bp.route('/summary', methods=['GET', 'OPTIONS'])
def get_reports_summary():
    """
    Returns dynamic live reports & analytics metrics for Sales, Inventory, Low Stock, Payments, and TRA Fiscalization.
    """
    if request.method == 'OPTIONS':
        return jsonify({'success': True}), 200

    try:
        today = date.today()
        preset = request.args.get('preset', 'LAST_7_DAYS').upper()
        start_date_param = request.args.get('startDate', '').strip()
        end_date_param = request.args.get('endDate', '').strip()

        # 1. SALES FILTERING
        sales_query = Sale.query

        if preset in ['TODAY', 'DAILY']:
            sales_query = sales_query.filter((Sale.date == today) | (func.date(Sale.created_at) == today))
        elif preset in ['LAST_7_DAYS', 'WEEKLY', 'THIS_WEEK']:
            sales_query = sales_query.filter(Sale.date >= (today - timedelta(days=7)))
        elif preset in ['THIS_MONTH', 'MONTHLY']:
            sales_query = sales_query.filter(Sale.date >= today.replace(day=1))
        elif preset == 'CUSTOM' and start_date_param and end_date_param:
            try:
                s_date = datetime.strptime(start_date_param, '%Y-%m-%d').date()
                e_date = datetime.strptime(end_date_param, '%Y-%m-%d').date()
                sales_query = sales_query.filter(Sale.date >= s_date, Sale.date <= e_date)
            except Exception as e:
                print(f"[Reports Custom Date Error]: {e}")

        filtered_sales = sales_query.order_by(Sale.created_at.desc(), Sale.id.desc()).all()
        all_sales = Sale.query.order_by(Sale.created_at.desc(), Sale.id.desc()).all()

        # Fallback to all sales if filtered selection has 0 records
        sales_list = filtered_sales if len(filtered_sales) > 0 else all_sales

        # --- TAB 1: SALES REPORT METRICS ---
        total_period_revenue = sum(s.total or 0.0 for s in sales_list)
        total_orders = len(sales_list)
        avg_order_value = round(total_period_revenue / total_orders, 2) if total_orders > 0 else 0.0

        # Peak sales day calculation
        date_revenue_map = {}
        date_orders_map = {}
        for s in sales_list:
            d_str = s.date.strftime('%d %b') if s.date else 'Today'
            date_revenue_map[d_str] = date_revenue_map.get(d_str, 0.0) + (s.total or 0.0)
            date_orders_map[d_str] = date_orders_map.get(d_str, 0) + 1

        if date_revenue_map:
            peak_day = max(date_revenue_map, key=date_revenue_map.get)
            peak_rev = date_revenue_map[peak_day]
            peak_orders = date_orders_map[peak_day]
            peak_sales_day_str = f"{peak_day} (TSh {Math_round_str(peak_rev)})"
            peak_badge_str = f"{peak_orders} Orders peak"
        else:
            peak_sales_day_str = "N/A"
            peak_badge_str = "0 Orders"

        sales_trend_data = [{'date': d, 'revenue': round(amt, 2), 'orders': date_orders_map.get(d, 0)} for d, amt in date_revenue_map.items()]

        # --- TAB 2 & 3: INVENTORY & LOW STOCK METRICS ---
        all_products = Product.query.all()
        total_products_count = len(all_products)
        total_stock_valuation = sum((p.stock or 0) * (p.buying_price or 0.0) for p in all_products)
        
        healthy_skus = [p for p in all_products if (p.stock or 0) > (p.min_stock or 10)]
        low_stock_products = [p for p in all_products if 0 < (p.stock or 0) <= (p.min_stock or 10)]
        out_of_stock_products = [p for p in all_products if (p.stock or 0) == 0]

        in_stock_health_pct = round((len(healthy_skus) / total_products_count) * 100, 1) if total_products_count > 0 else 100.0

        category_val_map = {}
        category_items_map = {}
        for p in all_products:
            cat = p.category or 'General'
            category_val_map[cat] = category_val_map.get(cat, 0.0) + ((p.stock or 0) * (p.buying_price or 0.0))
            category_items_map[cat] = category_items_map.get(cat, 0) + 1

        if category_val_map:
            top_cat = max(category_val_map, key=category_val_map.get)
            top_cat_val = category_val_map[top_cat]
            top_cat_items = category_items_map[top_cat]
        else:
            top_cat = "Groceries"
            top_cat_val = 0.0
            top_cat_items = 0

        category_valuation_chart = [{'category': c, 'value': round(val, 2), 'items': category_items_map[c]} for c, val in category_val_map.items()]

        # Restock cost needed calculation
        restock_cost_needed = sum(((p.min_stock or 10) - (p.stock or 0)) * (p.buying_price or 0.0) for p in (low_stock_products + out_of_stock_products))

        # --- TAB 4: PAYMENT CHANNELS METRICS ---
        cash_sales = [s for s in sales_list if 'CASH' in (s.payment_method or '').upper()]
        mobile_sales = [s for s in sales_list if any(x in (s.payment_method or '').upper() for x in ['MOBILE', 'M-PESA', 'MPESA', 'AIRTEL', 'TIGO'])]
        card_sales = [s for s in sales_list if any(x in (s.payment_method or '').upper() for x in ['CARD', 'BANK', 'CRDB', 'NMB'])]

        cash_val = sum(s.total for s in cash_sales)
        mobile_val = sum(s.total for s in mobile_sales)
        card_val = sum(s.total for s in card_sales)

        payment_pie_data = [
          { 'name': 'Cash', 'value': round(cash_val, 2), 'count': len(cash_sales), 'color': '#4f46e5' },
          { 'name': 'Mobile Money', 'value': round(mobile_val, 2), 'count': len(mobile_sales), 'color': '#10b981' },
          { 'name': 'Card / Bank POS', 'value': round(card_val, 2), 'count': len(card_sales), 'color': '#8b5cf6' },
        ]

        # --- TAB 5: FISCALIZATION METRICS ---
        synced_sales = [s for s in sales_list if (s.fiscal_status or '').upper() == 'SUCCESS']
        pending_sales = [s for s in sales_list if (s.fiscal_status or '').upper() != 'SUCCESS']
        
        vat_tax_collected = sum(s.tax or (s.total * 0.1525) for s in sales_list)
        fiscal_sync_rate = round((len(synced_sales) / total_orders) * 100, 1) if total_orders > 0 else 100.0

        # Fiscal trend breakdown per date
        fiscal_date_map = {}
        for s in sales_list:
            d_str = s.date.strftime('%d %b') if s.date else 'Today'
            if d_str not in fiscal_date_map:
                fiscal_date_map[d_str] = {'synced': 0, 'pending': 0, 'vat': 0.0}
            vat_val = s.tax or (s.total * 0.1525)
            fiscal_date_map[d_str]['vat'] += vat_val
            if (s.fiscal_status or '').upper() == 'SUCCESS':
                fiscal_date_map[d_str]['synced'] += 1
            else:
                fiscal_date_map[d_str]['pending'] += 1

        fiscal_trend_data = [
            {
                'date': d,
                'synced': info['synced'],
                'pending': info['pending'],
                'vat': round(info['vat'], 2)
            }
            for d, info in fiscal_date_map.items()
        ]

        return jsonify({
            'success': True,
            'preset': preset,
            'salesKPIs': {
                'totalPeriodRevenue': total_period_revenue,
                'totalOrders': total_orders,
                'avgOrderValue': avg_order_value,
                'peakSalesDay': peak_sales_day_str,
                'peakBadge': peak_badge_str,
            },
            'inventoryKPIs': {
                'totalStockValuation': total_stock_valuation,
                'totalActiveSKUs': total_products_count,
                'inStockHealthPct': in_stock_health_pct,
                'healthySKUs': len(healthy_skus),
                'topValuedCategory': top_cat,
                'topCategoryBadge': f"TSh {Math_round_str(top_cat_val)} ({top_cat_items} SKUs)",
            },
            'lowStockKPIs': {
                'criticalOutOfStockCount': len(out_of_stock_products),
                'criticalOutOfStockName': out_of_stock_products[0].name if len(out_of_stock_products) > 0 else 'None',
                'lowStockWarningsCount': len(low_stock_products),
                'lowStockNames': ', '.join([p.name for p in low_stock_products[:3]]) if low_stock_products else 'Stock Healthy',
                'restockCostNeeded': restock_cost_needed,
                'stockHealthIndex': in_stock_health_pct,
                'attentionSKUsCount': len(low_stock_products) + len(out_of_stock_products),
            },
            'paymentKPIs': {
                'cashCollectionsVal': cash_val,
                'cashTxnCount': len(cash_sales),
                'mobileMoneyVal': mobile_val,
                'mobileTxnCount': len(mobile_sales),
                'cardBankVal': card_val,
                'cardTxnCount': len(card_sales),
                'totalChannelVolume': total_period_revenue,
                'totalTxnCount': total_orders,
            },
            'fiscalKPIs': {
                'syncedReceiptsCount': len(synced_sales),
                'pendingReceiptsCount': len(pending_sales),
                'vatTaxCollected': vat_tax_collected,
                'complianceSyncRate': fiscal_sync_rate,
                'syncedRatio': f"{len(synced_sales)}/{total_orders} Orders Synced",
            },
            'salesTrend': sales_trend_data,
            'categoryValuation': category_valuation_chart,
            'paymentPieData': payment_pie_data,
            'fiscalTrend': fiscal_trend_data,
            'salesTable': [s.to_dict() for s in sales_list],
            'inventoryTable': [p.to_inventory_dict() for p in all_products],
            'fiscalTable': [s.to_dict() for s in sales_list]
        }), 200

    except Exception as e:
        print(f"[Reports Summary Error]: {e}")
        return jsonify({
            'success': False,
            'message': f'Failed to fetch reports summary: {str(e)}'
        }), 500


def Math_round_str(val):
    if val >= 1000000:
        return f"{round(val / 1000000, 2)}M"
    elif val >= 1000:
        return f"{round(val / 1000, 1)}k"
    return f"{Math_round(val)}"

def Math_round(val):
    return int(round(val or 0))
