from flask import Blueprint, request, jsonify
from datetime import datetime, timedelta
from app.extensions import db
from app.models.audit_log import AuditLog

audit_bp = Blueprint('audit', __name__, url_prefix='/api/audit-logs')

DEFAULT_SAMPLE_LOGS = [
    {
        'action': 'USER_LOGIN_SUCCESS',
        'category': 'AUTH',
        'user_name': 'System Administrator',
        'user_role': 'Administrator',
        'ip_address': '192.168.1.102',
        'device_info': 'Chrome 122.0 (Windows 11 POS Terminal)',
        'details': 'Administrator authenticated successfully via password.',
        'status': 'SUCCESS',
        'offset_minutes': 5
    },
    {
        'action': 'POS_SALE_COMPLETED',
        'category': 'SALES',
        'user_name': 'John Cashier',
        'user_role': 'Cashier',
        'ip_address': '192.168.1.104',
        'device_info': 'Cashier Terminal 1 (Edge 120.0)',
        'details': 'Completed sale SALE-TZ-2026-90412. Total TZS 184,500 via CASH.',
        'status': 'SUCCESS',
        'offset_minutes': 18
    },
    {
        'action': 'UPDATE_STORE_SETTINGS',
        'category': 'SETTINGS',
        'user_name': 'System Administrator',
        'user_role': 'Administrator',
        'ip_address': '192.168.1.102',
        'device_info': 'Chrome 122.0 (Windows 11)',
        'details': 'Updated store VAT rate to 18% and modified receipt tagline.',
        'status': 'SUCCESS',
        'offset_minutes': 45
    },
    {
        'action': 'INVENTORY_STOCK_ADJUSTMENT',
        'category': 'INVENTORY',
        'user_name': 'John Cashier',
        'user_role': 'Cashier',
        'ip_address': '192.168.1.104',
        'device_info': 'Cashier Terminal 1',
        'details': 'Adjusted stock quantity for "Mo Sunflower Oil (5L)" +15 units.',
        'status': 'SUCCESS',
        'offset_minutes': 75
    },
    {
        'action': 'FAILED_LOGIN_ATTEMPT',
        'category': 'AUTH',
        'user_name': 'unknown_user',
        'user_role': 'Guest',
        'ip_address': '41.222.180.44',
        'device_info': 'Firefox 119.0 (Linux x86_64)',
        'details': 'Invalid password attempt for username "manager". Account locked for 5m.',
        'status': 'FAILED',
        'offset_minutes': 120
    },
    {
        'action': 'PRODUCT_CREATED',
        'category': 'INVENTORY',
        'user_name': 'System Administrator',
        'user_role': 'Administrator',
        'ip_address': '192.168.1.102',
        'device_info': 'Chrome 122.0 (Windows 11)',
        'details': 'Added new product SKU-890 "Azam Wheat Flour 2kg" at TZS 4,500.',
        'status': 'SUCCESS',
        'offset_minutes': 180
    },
    {
        'action': 'TRA_VFD_FISCAL_SYNC_WARNING',
        'category': 'SETTINGS',
        'user_name': 'System Process',
        'user_role': 'Background Worker',
        'ip_address': '127.0.0.1',
        'device_info': 'TRA VFD Gateway Service v2.4',
        'details': 'TRA fiscal gateway connection timed out after 3 retries. Queued for auto-resync.',
        'status': 'WARNING',
        'offset_minutes': 240
    },
    {
        'action': 'USER_REGISTERED',
        'category': 'USERS',
        'user_name': 'System Administrator',
        'user_role': 'Administrator',
        'ip_address': '192.168.1.102',
        'device_info': 'Chrome 122.0 (Windows 11)',
        'details': 'Created new cashier account "manoj" with username @manoj123.',
        'status': 'SUCCESS',
        'offset_minutes': 360
    }
]

def seed_default_audit_logs():
    try:
        if AuditLog.query.count() == 0:
            now = datetime.utcnow()
            for sample in DEFAULT_SAMPLE_LOGS:
                log = AuditLog(
                    action=sample['action'],
                    category=sample['category'],
                    user_name=sample['user_name'],
                    user_role=sample['user_role'],
                    ip_address=sample['ip_address'],
                    device_info=sample['device_info'],
                    details=sample['details'],
                    status=sample['status'],
                    created_at=now - timedelta(minutes=sample['offset_minutes'])
                )
                db.session.add(log)
            db.session.commit()
    except Exception as e:
        db.session.rollback()
        print(f"[Audit] Seeding error: {e}")

@audit_bp.route('', methods=['GET'])
def get_audit_logs():
    try:
        seed_default_audit_logs()

        search = request.args.get('search', '').strip().lower()
        category = request.args.get('category', '').strip().upper()
        status = request.args.get('status', '').strip().upper()
        date_filter = request.args.get('dateFilter', 'ALL').strip().upper()
        start_date = request.args.get('startDate', '').strip()
        end_date = request.args.get('endDate', '').strip()
        page = max(1, int(request.args.get('page', 1)))
        limit = max(1, min(100, int(request.args.get('limit', 20))))

        query = AuditLog.query

        if search:
            query = query.filter(
                (AuditLog.action.ilike(f'%{search}%')) |
                (AuditLog.user_name.ilike(f'%{search}%')) |
                (AuditLog.user_role.ilike(f'%{search}%')) |
                (AuditLog.ip_address.ilike(f'%{search}%')) |
                (AuditLog.details.ilike(f'%{search}%'))
            )

        if category and category != 'ALL':
            query = query.filter(AuditLog.category == category)

        if status and status != 'ALL':
            query = query.filter(AuditLog.status == status)

        # Date Filtering
        now = datetime.utcnow()
        if date_filter == 'TODAY':
            today_start = datetime(now.year, now.month, now.day)
            query = query.filter(AuditLog.created_at >= today_start)
        elif date_filter == 'WEEK':
            week_start = now - timedelta(days=7)
            query = query.filter(AuditLog.created_at >= week_start)
        elif date_filter == 'MONTH':
            month_start = now - timedelta(days=30)
            query = query.filter(AuditLog.created_at >= month_start)
        elif date_filter == 'CUSTOM' and start_date and end_date:
            try:
                s_dt = datetime.strptime(start_date, '%Y-%m-%d')
                e_dt = datetime.strptime(end_date, '%Y-%m-%d') + timedelta(days=1)
                query = query.filter(AuditLog.created_at >= s_dt, AuditLog.created_at < e_dt)
            except ValueError:
                pass

        query = query.order_by(AuditLog.created_at.desc())

        total = query.count()
        total_pages = max(1, (total + limit - 1) // limit)
        logs = query.offset((page - 1) * limit).limit(limit).all()

        # Stats Overview
        total_all = AuditLog.query.count()
        security_alerts = AuditLog.query.filter(AuditLog.status.in_(['WARNING', 'FAILED'])).count()
        auth_events = AuditLog.query.filter(AuditLog.category == 'AUTH').count()
        active_users_count = db.session.query(db.func.count(db.func.distinct(AuditLog.user_name))).scalar() or 1

        return jsonify({
            'success': True,
            'data': {
                'logs': [l.to_dict() for l in logs],
                'total': total,
                'page': page,
                'limit': limit,
                'totalPages': total_pages,
                'stats': {
                    'totalLogs': total_all,
                    'securityAlerts': security_alerts,
                    'authEvents': auth_events,
                    'activeOperators': active_users_count
                }
            }
        }), 200

    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Failed to fetch audit logs: {str(e)}'
        }), 500

@audit_bp.route('', methods=['POST'])
def create_audit_log():
    try:
        data = request.get_json() or {}
        action = (data.get('action') or '').strip().upper()
        if not action:
            return jsonify({'success': False, 'message': 'Action name is required.'}), 400

        log = AuditLog(
            action=action,
            category=(data.get('category') or 'SYSTEM').strip().upper(),
            user_name=(data.get('userName') or 'System Administrator').strip(),
            user_role=(data.get('userRole') or 'Administrator').strip(),
            ip_address=(data.get('ipAddress') or request.remote_addr or '127.0.0.1').strip(),
            device_info=(data.get('deviceInfo') or request.headers.get('User-Agent', 'Web Browser')).strip()[:250],
            details=(data.get('details') or '').strip(),
            status=(data.get('status') or 'SUCCESS').strip().upper()
        )
        db.session.add(log)
        db.session.commit()

        return jsonify({
            'success': True,
            'message': 'Audit log recorded successfully.',
            'data': {'log': log.to_dict()}
        }), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'message': f'Failed to create audit log: {str(e)}'
        }), 500
