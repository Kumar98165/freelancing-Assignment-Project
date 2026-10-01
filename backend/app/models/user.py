from datetime import datetime
from werkzeug.security import generate_password_hash, check_password_hash
from app.extensions import db

class User(db.Model):
    __tablename__ = 'users'

    id = db.Column(db.Integer, primary_key=True)
    full_name = db.Column(db.String(150), nullable=False)
    username = db.Column(db.String(80), unique=True, nullable=False, index=True)
    phone = db.Column(db.String(30), nullable=True)
    role = db.Column(db.String(20), nullable=False, default='CASHIER')  # 'ADMIN', 'CASHIER'
    password_hash = db.Column(db.String(255), nullable=False)
    status = db.Column(db.String(20), nullable=False, default='Active') # 'Active', 'Inactive'
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    last_active = db.Column(db.DateTime, nullable=True)

    def set_password(self, password: str):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password: str) -> bool:
        return check_password_hash(self.password_hash, password)

    def to_dict(self):
        return {
            'id': str(self.id),
            'fullName': self.full_name,
            'username': self.username,
            'phone': self.phone or '',
            'role': self.role,
            'status': self.status,
            'createdDate': self.created_at.strftime('%Y-%m-%d') if self.created_at else '',
            'lastActive': self.last_active.strftime('%Y-%m-%d %H:%M') if self.last_active else 'Never'
        }
