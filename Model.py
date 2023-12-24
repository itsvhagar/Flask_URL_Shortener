from flask_sqlalchemy import SQLAlchemy
import string
import random
from sqlalchemy import ForeignKey
from sqlalchemy.orm import relationship

db = SQLAlchemy()

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(100), unique=True, nullable=False)
    password = db.Column(db.String(100), nullable=False)

    @classmethod
    def create_user(cls, username, password):
        new_user = User(username=username, password=password)
        db.session.add(new_user)
        db.session.commit()
        return new_user

    @classmethod
    def get_user_by_id(cls, user_id):
        return User.query.get(user_id)

    def update_password(self, new_password):
        self.password = new_password
        db.session.commit()
        return True

    def delete_user(self):
        db.session.delete(self)
        db.session.commit()

class Link(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    long_url = db.Column(db.String(2000), nullable=False)
    short_url = db.Column(db.String(50), unique=True, nullable=False)
    open_count = db.Column(db.Integer, default=0)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    user = relationship('User', backref='links')

    def __init__(self, long_url, back_half, user_id):
        self.long_url = long_url
        if back_half == "":
            self.short_url = self.default_short_url()
        else:
            self.short_url = self.custom_short_url(back_half)
        self.user_id = user_id

    def default_short_url(self):
        characters = string.ascii_letters + string.digits
        short_url = ''.join(random.choice(characters) for i in range(6))
        return short_url

    def custom_short_url(self, back_half):
        short_url = back_half
        return short_url

    def get_links_by_user_id(self, user_id):
        return Link.query.filter_by(user_id=user_id).all()
