from datetime import datetime
from app.extensions import db

class InventoryMovement(db.Model):
    __tablename__ = 'inventory_movements'

    id = db.Column(db.Integer, primary_key=True)
    product_id = db.Column(db.Integer, db.ForeignKey('products.id', ondelete='CASCADE'), nullable=False, index=True)
    movement_type = db.Column(db.String(50), nullable=False)  # 'RECEIVE' | 'ADJUSTMENT' | 'SALE' | 'RETURN' | 'DAMAGE' | 'EXPIRED'
    quantity = db.Column(db.Integer, nullable=False)
    previous_stock = db.Column(db.Integer, nullable=False, default=0)
    new_stock = db.Column(db.Integer, nullable=False, default=0)
    unit_cost = db.Column(db.Float, nullable=True)
    reference_no = db.Column(db.String(100), nullable=True)  # e.g. PO-TZ-9479
    batch_expiry = db.Column(db.Date, nullable=True)
    reason = db.Column(db.String(100), nullable=True)
    notes = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    product = db.relationship('Product', backref=db.backref('movements', lazy=True, cascade='all, delete-orphan'))

    def to_dict(self):
        return {
            'id': str(self.id),
            'productId': str(self.product_id),
            'productName': self.product.name if self.product else '',
            'sku': self.product.sku if self.product else '',
            'movementType': self.movement_type,
            'quantity': self.quantity,
            'previousStock': self.previous_stock,
            'newStock': self.new_stock,
            'unitCost': self.unit_cost,
            'referenceNo': self.reference_no or '',
            'batchExpiry': self.batch_expiry.strftime('%Y-%m-%d') if self.batch_expiry else None,
            'reason': self.reason or '',
            'notes': self.notes or '',
            'createdAt': self.created_at.strftime('%Y-%m-%d %H:%M:%S') if self.created_at else None,
        }
