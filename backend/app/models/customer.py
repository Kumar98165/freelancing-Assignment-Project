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
        total = sum(p.total for p in self.purchases) if self.purchases else (self.total_purchases or 0.0)
        if total >= 1000000:
            return 'VIP'
        elif total >= 100000:
            return 'REGULAR'
        return 'NEW'

    def to_dict(self, include_purchases=True):
        sorted_purchases = sorted(self.purchases, key=lambda p: p.date or datetime.min.date(), reverse=True) if self.purchases else []
        purchases_dicts = [p.to_dict() for p in sorted_purchases]
        
        calc_total = sum(p.total for p in sorted_purchases) if sorted_purchases else float(self.total_purchases or 0.0)
        order_count = len(sorted_purchases)
        avg_order = round(calc_total / order_count) if order_count > 0 else 0.0
        
        last_date_str = 'No purchases yet'
        if sorted_purchases and sorted_purchases[0].date:
            last_date_str = sorted_purchases[0].date.strftime('%Y-%m-%d')
        elif self.last_purchase:
            last_date_str = self.last_purchase.strftime('%Y-%m-%d')

        data = {
            'id': str(self.id),
            'customerId': f"#CST-{str(self.id).zfill(3)}",
            'name': self.name,
            'phone': self.phone,
            'email': self.email or '',
            'address': 'Dar es Salaam, TZ',
            'status': 'Active',
            'totalPurchases': calc_total,
            'totalOrders': order_count,
            'orderCount': order_count,
            'avgOrderValue': avg_order,
            'lastPurchase': last_date_str,
            'tier': self.tier,
            'createdDate': self.created_at.strftime('%Y-%m-%d') if self.created_at else ''
        }
        if include_purchases:
            data['purchases'] = purchases_dicts
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
