from datetime import datetime
from app.extensions import db

class AuditLog(db.Model):
    __tablename__ = 'audit_logs'

    id = db.Column(db.Integer, primary_key=True)
    action = db.Column(db.String(120), nullable=False)
    category = db.Column(db.String(50), nullable=False, default='SYSTEM')
    user_name = db.Column(db.String(100), nullable=False, default='System Administrator')
    user_role = db.Column(db.String(50), nullable=False, default='Administrator')
    ip_address = db.Column(db.String(45), nullable=True, default='127.0.0.1')
    device_info = db.Column(db.String(255), nullable=True, default='Chrome / Windows 11')
    details = db.Column(db.Text, nullable=True)
    status = db.Column(db.String(20), nullable=False, default='SUCCESS')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': f'LOG-{self.id:05d}',
            'raw_id': self.id,
            'action': self.action,
            'category': self.category,
            'userName': self.user_name,
            'userRole': self.user_role,
            'ipAddress': self.ip_address,
            'deviceInfo': self.device_info,
            'details': self.details or '',
            'status': self.status,
            'createdAt': self.created_at.strftime('%Y-%m-%d %H:%M:%S') if self.created_at else datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')
        }
