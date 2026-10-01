from datetime import datetime
from app.extensions import db

class Customer(db.Model):
    __tablename__ = 'customers'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(150), nullable=False)
    phone = db.Column(db.String(30), nullable=False, index=True)
    email = db.Column(db.String(120), nullable=True)
    total_purchases = db.Column(db.Float, default=0.0)
    last_purchase = db.Column(db.Date, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Purchases relationship
    purchases = db.relationship('CustomerPurchase', backref='customer', lazy=True, cascade='all, delete-orphan')

    @property
    def tier(self):
        if self.total_purchases >= 1000000:
            return 'VIP'
        elif self.total_purchases >= 100000:
            return 'REGULAR'
        return 'NEW'

    def to_dict(self, include_purchases=True):
        data = {
            'id': str(self.id),
            'customerId': f"#CST-{str(self.id).zfill(3)}",
            'name': self.name,
            'phone': self.phone,
            'email': self.email or '',
            'totalPurchases': float(self.total_purchases or 0),
            'lastPurchase': self.last_purchase.strftime('%Y-%m-%d') if self.last_purchase else 'No purchases yet',
            'tier': self.tier,
            'createdDate': self.created_at.strftime('%Y-%m-%d') if self.created_at else ''
        }
        if include_purchases:
            data['purchases'] = [p.to_dict() for p in self.purchases]
        return data


class CustomerPurchase(db.Model):
    __tablename__ = 'customer_purchases'

    id = db.Column(db.Integer, primary_key=True)
    customer_id = db.Column(db.Integer, db.ForeignKey('customers.id'), nullable=False)
    sale_number = db.Column(db.String(50), nullable=False)
    date = db.Column(db.Date, default=datetime.utcnow)
    items_summary = db.Column(db.String(255), nullable=False)
    total = db.Column(db.Float, nullable=False)
    payment_method = db.Column(db.String(50), default='CASH') # 'CASH', 'MOBILE MONEY', 'CARD / BANK'
    items_json = db.Column(db.JSON, nullable=True) # list of item details

    def to_dict(self):
        return {
            'id': str(self.id),
            'saleNumber': self.sale_number,
            'date': self.date.strftime('%Y-%m-%d') if self.date else '',
            'items': self.items_summary,
            'total': float(self.total),
            'paymentMethod': self.payment_method,
            'itemList': self.items_json or []
        }
