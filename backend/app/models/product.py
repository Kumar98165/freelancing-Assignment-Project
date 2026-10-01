from datetime import datetime, date
from app.extensions import db

class Product(db.Model):
    __tablename__ = 'products'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(200), nullable=False)
    sku = db.Column(db.String(100), unique=True, nullable=False, index=True)
    category = db.Column(db.String(100), nullable=False, default='Beverages', index=True)
    barcode = db.Column(db.String(100), unique=True, nullable=False, index=True)
    barcode_type = db.Column(db.String(50), default='MANUFACTURER')  # 'MANUFACTURER' | 'INTERNAL'
    buying_price = db.Column(db.Float, default=0.0)
    selling_price = db.Column(db.Float, nullable=False, default=0.0)
    stock = db.Column(db.Integer, default=0)
    min_stock = db.Column(db.Integer, default=10)
    tax = db.Column(db.String(50), default='18% VAT')
    status = db.Column(db.String(20), default='Active')  # 'Active' | 'Inactive'
    expiry_date = db.Column(db.Date, nullable=True)
    unit = db.Column(db.String(50), default='Units')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        return {
            'id': str(self.id),
            'name': self.name,
            'sku': self.sku,
            'category': self.category,
            'barcode': self.barcode,
            'barcodeType': self.barcode_type or 'MANUFACTURER',
            'buyingPrice': self.buying_price,
            'sellingPrice': self.selling_price,
            'stock': self.stock,
            'minStock': self.min_stock,
            'unit': self.unit or 'Units',
            'tax': self.tax or '18% VAT',
            'status': self.status,
            'expiryDate': self.expiry_date.strftime('%Y-%m-%d') if self.expiry_date else None,
            'createdDate': self.created_at.strftime('%Y-%m-%d') if self.created_at else None,
            'updatedDate': self.updated_at.strftime('%Y-%m-%d') if self.updated_at else None,
        }

    def to_inventory_dict(self):
        return {
            'id': str(self.id),
            'product': self.name,
            'sku': self.sku,
            'barcode': self.barcode,
            'category': self.category,
            'currentStock': self.stock or 0,
            'minStock': self.min_stock or 0,
            'buyingPrice': self.buying_price or 0.0,
            'sellingPrice': self.selling_price or 0.0,
            'unit': self.unit or 'Units',
            'expiryDate': self.expiry_date.strftime('%Y-%m-%d') if self.expiry_date else '',
            'lastUpdated': self.updated_at.strftime('%Y-%m-%d') if self.updated_at else datetime.utcnow().strftime('%Y-%m-%d'),
        }

