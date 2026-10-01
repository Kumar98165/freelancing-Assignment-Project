from datetime import datetime
from app.extensions import db

class Setting(db.Model):
    __tablename__ = 'settings'

    id = db.Column(db.Integer, primary_key=True)
    store_name = db.Column(db.String(150), nullable=False, default='TZA Mart Supermarket')
    branch_name = db.Column(db.String(150), nullable=False, default='Kariakoo Main Flagship, Dar es Salaam')
    currency = db.Column(db.String(20), nullable=False, default='TZS')
    store_phone = db.Column(db.String(50), nullable=True, default='+255 754 892 100')
    store_email = db.Column(db.String(100), nullable=True, default='info@tzamart.co.tz')
    store_address = db.Column(db.String(255), nullable=True, default='Plot 42, Msimbazi Street, Kariakoo')
    
    # TRA & VFD
    tin = db.Column(db.String(50), nullable=False, default='102-394-857')
    vrn = db.Column(db.String(50), nullable=False, default='40012983-T')
    vat_rate = db.Column(db.Float, nullable=False, default=18.0)
    vfd_server_url = db.Column(db.String(255), nullable=True, default='https://vfd.tra.go.tz/api/v1')
    vfd_device_id = db.Column(db.String(100), nullable=True, default='EFD-TZ-DAR-001')
    
    # Thermal Receipt
    receipt_paper_width = db.Column(db.String(20), nullable=False, default='80mm')
    receipt_header_tagline = db.Column(db.String(255), nullable=True, default='Fresh Groceries & Household Essentials')
    receipt_footer = db.Column(db.String(255), nullable=True, default='Asante kwa kununua nasi TzSuperPOS! Karibu tena.')
    
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        return {
            'id': str(self.id),
            'storeName': self.store_name,
            'branchName': self.branch_name,
            'currency': self.currency,
            'storePhone': self.store_phone or '',
            'storeEmail': self.store_email or '',
            'storeAddress': self.store_address or '',
            'tin': self.tin,
            'vrn': self.vrn,
            'vatRate': str(self.vat_rate) if self.vat_rate is not None else '18',
            'vfdServerUrl': self.vfd_server_url or '',
            'vfdDeviceId': self.vfd_device_id or '',
            'receiptPaperWidth': self.receipt_paper_width or '80mm',
            'receiptHeaderTagline': self.receipt_header_tagline or '',
            'receiptFooter': self.receipt_footer or '',
            'updatedAt': self.updated_at.strftime('%Y-%m-%d %H:%M:%S') if self.updated_at else ''
        }
