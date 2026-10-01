from datetime import datetime
from app.extensions import db

class Sale(db.Model):
    __tablename__ = 'sales'

    id = db.Column(db.Integer, primary_key=True)
    sale_number = db.Column(db.String(60), unique=True, nullable=False, index=True)
    date = db.Column(db.Date, default=datetime.utcnow, nullable=False, index=True)
    time_str = db.Column(db.String(20), default=lambda: datetime.utcnow().strftime('%H:%M:%S'))
    
    cashier_name = db.Column(db.String(150), default='John Cashier')
    cashier_id = db.Column(db.Integer, nullable=True)

    customer_id = db.Column(db.Integer, db.ForeignKey('customers.id', ondelete='SET NULL'), nullable=True)
    customer_name = db.Column(db.String(150), default='Walk-in Customer')
    customer_phone = db.Column(db.String(50), default='+255 700 000 000')

    items_count = db.Column(db.Integer, default=0)
    subtotal = db.Column(db.Float, default=0.0)
    tax = db.Column(db.Float, default=0.0)
    total = db.Column(db.Float, nullable=False, default=0.0)
    amount_paid = db.Column(db.Float, default=0.0)
    change_amount = db.Column(db.Float, default=0.0)

    payment_method = db.Column(db.String(50), default='CASH')  # 'CASH' | 'MOBILE MONEY' | 'CARD / BANK'
    payment_provider = db.Column(db.String(50), nullable=True)  # 'M-Pesa' | 'Airtel Money' | 'CRDB Bank' | etc.
    payment_status = db.Column(db.String(30), default='SUCCESS')  # 'SUCCESS' | 'PENDING' | 'FAILED'
    payment_ref = db.Column(db.String(100), nullable=True)

    # Tanzania TRA VFD Fiscal Compliance Attributes
    fiscal_status = db.Column(db.String(30), default='SUCCESS')  # 'SUCCESS' | 'PENDING' | 'FAILED'
    fiscal_receipt_no = db.Column(db.String(100), nullable=False)
    fiscal_device = db.Column(db.String(100), default='EFD-TZ-DAR-001')
    z_number = db.Column(db.String(100), default='Z-2026-0930-01')
    verification_code = db.Column(db.String(100), nullable=False)
    fiscal_date = db.Column(db.String(30), default=lambda: datetime.utcnow().strftime('%Y-%m-%d'))
    fiscal_time = db.Column(db.String(30), default=lambda: datetime.utcnow().strftime('%H:%M:%S'))

    # PDF Receipt Storage (Binary Byte Data)
    pdf_data = db.Column(db.LargeBinary, nullable=True)
    pdf_filename = db.Column(db.String(255), nullable=True)

    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationships
    items = db.relationship('SaleItem', backref='sale', lazy=True, cascade='all, delete-orphan')

    def to_dict(self):
        return {
            'id': self.sale_number,
            'dbId': self.id,
            'sale_number': self.sale_number,
            'saleNumber': self.sale_number,
            'receiptNo': self.sale_number,
            'date': self.date.strftime('%Y-%m-%d') if self.date else self.created_at.strftime('%Y-%m-%d'),
            'time': self.time_str or self.created_at.strftime('%H:%M:%S'),
            'cashier': self.cashier_name,
            'cashier_name': self.cashier_name,
            'customer': self.customer_name,
            'customer_name': self.customer_name,
            'customerPhone': self.customer_phone,
            'customer_phone': self.customer_phone,
            'itemsCount': self.items_count or len(self.items),
            'items_count': self.items_count or len(self.items),
            'subtotal': self.subtotal,
            'tax': self.tax,
            'total': self.total,
            'amountPaid': self.amount_paid,
            'amount_paid': self.amount_paid,
            'changeAmount': self.change_amount,
            'change_amount': self.change_amount,
            'paymentMethod': self.payment_method,
            'payment_method': self.payment_method,
            'provider': self.payment_provider,
            'payment_provider': self.payment_provider,
            'paymentStatus': self.payment_status,
            'payment_status': self.payment_status,
            'paymentRef': self.payment_ref,
            'payment_ref': self.payment_ref,
            'fiscalStatus': self.fiscal_status,
            'fiscal_status': self.fiscal_status,
            'fiscalReceiptNo': self.fiscal_receipt_no,
            'fiscal_receipt_no': self.fiscal_receipt_no,
            'fiscalDevice': self.fiscal_device,
            'fiscal_device': self.fiscal_device,
            'zNumber': self.z_number,
            'z_number': self.z_number,
            'verificationCode': self.verification_code,
            'verification_code': self.verification_code,
            'fiscalDate': self.fiscal_date,
            'fiscal_date': self.fiscal_date,
            'fiscalTime': self.fiscal_time,
            'fiscal_time': self.fiscal_time,
            'hasPdf': bool(self.pdf_data),
            'pdfFilename': self.pdf_filename or f"Receipt-{self.sale_number}.pdf",
            'pdfDownloadUrl': f"/api/sales/{self.sale_number}/receipt/pdf",
            'items': [item.to_dict() for item in self.items],
            'createdAt': self.created_at.strftime('%Y-%m-%d %H:%M:%S') if self.created_at else None
        }


class SaleItem(db.Model):
    __tablename__ = 'sale_items'

    id = db.Column(db.Integer, primary_key=True)
    sale_id = db.Column(db.Integer, db.ForeignKey('sales.id', ondelete='CASCADE'), nullable=False, index=True)
    product_id = db.Column(db.Integer, db.ForeignKey('products.id', ondelete='SET NULL'), nullable=True)

    product_name = db.Column(db.String(200), nullable=False)
    sku = db.Column(db.String(100), nullable=True)
    barcode = db.Column(db.String(100), nullable=True)
    category = db.Column(db.String(100), default='Beverages')

    unit_price = db.Column(db.Float, nullable=False, default=0.0)
    buying_price = db.Column(db.Float, default=0.0)
    quantity = db.Column(db.Integer, nullable=False, default=1)
    discount_percent = db.Column(db.Float, default=0.0)
    tax = db.Column(db.Float, default=0.0)
    total = db.Column(db.Float, nullable=False, default=0.0)

    def to_dict(self):
        return {
            'id': str(self.id),
            'productId': str(self.product_id) if self.product_id else '',
            'product': self.product_name,
            'productName': self.product_name,
            'sku': self.sku or '',
            'barcode': self.barcode or '',
            'category': self.category or '',
            'unitPrice': self.unit_price,
            'buyingPrice': self.buying_price,
            'quantity': self.quantity,
            'discountPercent': self.discount_percent,
            'tax': self.tax,
            'total': self.total
        }
