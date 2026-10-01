from datetime import datetime, date
from app.extensions import db

class Category(db.Model):
    __tablename__ = 'categories'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), unique=True, nullable=False, index=True)
    description = db.Column(db.Text, nullable=True)
    status = db.Column(db.String(20), default='Active')  # 'Active' | 'Inactive'
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self, product_count=None):
        if product_count is None:
            from app.models.product import Product
            product_count = Product.query.filter_by(category=self.name).count()

        return {
            'id': str(self.id),
            'name': self.name,
            'description': self.description or '',
            'status': self.status,
            'createdDate': self.created_at.strftime('%Y-%m-%d') if self.created_at else None,
            'updatedDate': self.updated_at.strftime('%Y-%m-%d') if self.updated_at else None,
            'productCount': product_count
        }
