from flask import Blueprint, request, jsonify
from datetime import datetime
from app.extensions import db
from app.models.setting import Setting

setting_bp = Blueprint('setting_bp', __name__, url_prefix='/api/settings')


def _get_or_create_settings() -> Setting:
    """Helper to get primary settings record or initialize with default values."""
    settings = Setting.query.first()
    if not settings:
        settings = Setting(
            store_name='TZA Mart Supermarket',
            branch_name='Kariakoo Main Flagship, Dar es Salaam',
            currency='TZS',
            store_phone='+255 754 892 100',
            store_email='info@tzamart.co.tz',
            store_address='Plot 42, Msimbazi Street, Kariakoo',
            tin='102-394-857',
            vrn='40012983-T',
            vat_rate=18.0,
            vfd_server_url='https://vfd.tra.go.tz/api/v1',
            vfd_device_id='EFD-TZ-DAR-001',
            receipt_paper_width='80mm',
            receipt_header_tagline='Fresh Groceries & Household Essentials',
            receipt_footer='Asante kwa kununua nasi TzSuperPOS! Karibu tena.'
        )
        db.session.add(settings)
        db.session.commit()
    return settings


@setting_bp.route('', methods=['GET'])
def get_settings():
    """Retrieve system settings."""
    try:
        settings = _get_or_create_settings()
        return jsonify({
            'success': True,
            'data': settings.to_dict()
        }), 200
    except Exception as e:
        return jsonify({'success': False, 'message': f'Error fetching system settings: {str(e)}'}), 500


@setting_bp.route('', methods=['PUT', 'POST'])
def update_settings():
    """Update system settings."""
    try:
        settings = _get_or_create_settings()
        data = request.get_json() or {}

        if 'storeName' in data:
            settings.store_name = (data.get('storeName') or '').strip() or settings.store_name
        if 'branchName' in data:
            settings.branch_name = (data.get('branchName') or '').strip()
        if 'currency' in data:
            settings.currency = (data.get('currency') or 'TZS').strip().upper()
        if 'storePhone' in data:
            settings.store_phone = (data.get('storePhone') or '').strip()
        if 'storeEmail' in data:
            settings.store_email = (data.get('storeEmail') or '').strip()
        if 'storeAddress' in data:
            settings.store_address = (data.get('storeAddress') or '').strip()
        if 'tin' in data:
            settings.tin = (data.get('tin') or '').strip()
        if 'vrn' in data:
            settings.vrn = (data.get('vrn') or '').strip()
        if 'vatRate' in data:
            try:
                settings.vat_rate = float(data.get('vatRate', 18))
            except (ValueError, TypeError):
                settings.vat_rate = 18.0
        if 'vfdServerUrl' in data:
            settings.vfd_server_url = (data.get('vfdServerUrl') or '').strip()
        if 'vfdDeviceId' in data:
            settings.vfd_device_id = (data.get('vfdDeviceId') or '').strip()
        if 'receiptPaperWidth' in data:
            settings.receipt_paper_width = data.get('receiptPaperWidth') or '80mm'
        if 'receiptHeaderTagline' in data:
            settings.receipt_header_tagline = (data.get('receiptHeaderTagline') or '').strip()
        if 'receiptFooter' in data:
            settings.receipt_footer = (data.get('receiptFooter') or '').strip()

        settings.updated_at = datetime.utcnow()
        db.session.commit()

        return jsonify({
            'success': True,
            'message': 'System settings updated successfully',
            'data': settings.to_dict()
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': f'Failed to save settings: {str(e)}'}), 500


@setting_bp.route('/reset', methods=['POST'])
def reset_settings():
    """Reset system settings to defaults."""
    try:
        settings = _get_or_create_settings()
        settings.store_name = 'TZA Mart Supermarket'
        settings.branch_name = 'Kariakoo Main Flagship, Dar es Salaam'
        settings.currency = 'TZS'
        settings.store_phone = '+255 754 892 100'
        settings.store_email = 'info@tzamart.co.tz'
        settings.store_address = 'Plot 42, Msimbazi Street, Kariakoo'
        settings.tin = '102-394-857'
        settings.vrn = '40012983-T'
        settings.vat_rate = 18.0
        settings.vfd_server_url = 'https://vfd.tra.go.tz/api/v1'
        settings.vfd_device_id = 'EFD-TZ-DAR-001'
        settings.receipt_paper_width = '80mm'
        settings.receipt_header_tagline = 'Fresh Groceries & Household Essentials'
        settings.receipt_footer = 'Asante kwa kununua nasi TzSuperPOS! Karibu tena.'
        settings.updated_at = datetime.utcnow()

        db.session.commit()

        return jsonify({
            'success': True,
            'message': 'System settings restored to factory defaults',
            'data': settings.to_dict()
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': f'Failed to reset settings: {str(e)}'}), 500
