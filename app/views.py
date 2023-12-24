import datetime
import json
import secrets

import requests
from flask import render_template, redirect, request
from flask import Flask, render_template, request, redirect, jsonify, send_file
from flask_sqlalchemy import SQLAlchemy
import random
import string
from flask_cors import CORS
from Model import db, Link, User
from app import app
CORS(app, resources={r"/*": {"origins": "*", "methods": ["POST", "OPTIONS"], "headers": "Content-Type"}})
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///links.db'
# db = SQLAlchemy(app)
db.init_app(app)


@app.before_first_request
def create_tables():
    db.create_all()

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/shorten_url_as_guest', methods = ['POST'])
def shorten_url_as_guest():
    url = request.form["url"]
    back_half = request.form["back-half"]
    if back_half == "":
        link = Link(url, "", "2")
        db.session.add(link)
        db.session.commit()
        short_url = request.url_root + link.short_url
        return render_template('index.html', short_url=short_url, response_status="p1")
    else:
        try:
            link = Link(url, back_half, "2")
            db.session.add(link)
            db.session.commit()
            short_url = request.url_root + link.short_url
            return render_template('index.html', short_url=short_url, response_status="p1")
        except:
            return render_template('index.html', short_url="This back-half is already taken", response_status="p2")

@app.route('/shorten_url', methods = ['POST'])
def shorten_url():
    url = request.form["url"]
    back_half = request.form["back-half"]
    user_id = request.form["user_id"]
    if back_half == "":
        link = Link(url, "", user_id)
        db.session.add(link)
        db.session.commit()
        short_url = request.url_root + link.short_url
        links = Link.query.filter_by(user_id=user_id).all()
        return render_template('customer.html', short_url=short_url, response_status="p1", user_id=user_id, links=links)
    else:
        try:
            existing_backhalf = Link.query.filter_by(short_url=back_half).first()
            if not existing_backhalf:
                link = Link(url, back_half, user_id)
                db.session.add(link)
                db.session.commit()
                short_url = request.url_root + link.short_url
                links = Link.query.filter_by(user_id=user_id).all()
                return render_template('customer.html', short_url=short_url, response_status="p1", user_id=user_id, links=links)
            else:
                links = Link.query.filter_by(user_id=user_id).all()
                return render_template('customer.html', short_url="This back-half is already taken",
                                       response_status="p2", user_id=user_id, links=links)
        except:
            links = Link.query.filter_by(user_id=user_id).all()
            return render_template('customer.html', short_url="This back-half is already taken", response_status="p2", user_id=user_id, links=links)


@app.route('/<short_url>', methods = ['GET'])
def redirect_to_long_url(short_url):
    link = Link.query.filter_by(short_url=short_url).first()
    if link:
        destination = link.long_url
        link.open_count += 1
        db.session.commit()
        return redirect(destination)
    else:
        return 'Link not found.'


@app.route('/update-link', methods=['POST'])
def update_link():
    data = request.get_json()
    linkid = data.get('linkID')
    new_long_url = data.get('newDestination')
    link = Link.query.filter_by(id=linkid).first()
    if link:
        link.long_url = new_long_url
        db.session.commit()
        response = {
            "responseCode": 0,
            "value": "Link updated successfully."
        }
        return response
    else:
        response = {
            "responseCode": 1,
            "value": 'Short URL not found'
        }
        return response

@app.route('/sign-in', methods = ['GET'])
def signin():
    return render_template('login.html')

@app.route('/sign-up', methods = ['GET'])
def signup():
    return render_template('sign_up.html')

@app.route('/login', methods = ['POST'])
def login():
    _username = request.form["username"]
    _password = request.form["password"]
    if _username == "" or _password == "":
        response = {
            "responseCode": -1,
            "value": "Please enter both username and password."
        }
        return response
    else:
        user = User.query.filter_by(username=_username).first()

        if user:
            if _password == user.password:
                if user.username == "admin":
                    users = User.query.filter(User.username != "admin").all()
                    user_id = user.id
                    return render_template('admin.html', users=users, user_id=user_id)
                else:
                    user_id = user.id
                    links = Link.query.filter_by(user_id=user_id).all()
                    return render_template('customer.html', links=links, user_id=user_id)
            else:
                return render_template('login.html', response_status = "p2", response_text = "Incorrect password")
        else:
            return render_template('login.html', response_status = "p2", response_text = "User not found.")

@app.route('/register', methods=['POST'])
def sign_up():
    _username = request.form["username"]
    _password = request.form["password"]
    _password_confirm = request.form["password_confirm"]
    if _username == "" or _password == "":
        return render_template('sign_up.html', response_status = "p2", response_text = "Please enter both username and password.")
    elif _password != _password_confirm:
        return render_template('sign_up.html', response_status = "p2", response_text = "Password should match.")
    existing_user = User.query.filter_by(username=_username).first()

    if existing_user:
        return render_template('sign_up.html', response_status = "p2", response_text = "Username already exists. Please choose another username.")
    else:
        # Create a new user
        user = User.create_user(username=_username, password=_password)
        user_id = user.id
        links = Link.query.filter_by(user_id=user_id).all()
        return render_template('customer.html', links=links, user_id=user_id)

@app.route('/update-password', methods=['POST'])
def update_password():
    data = request.get_json()
    _old_password = data["old_password"]
    _new_password = data["new_password"]
    _user_id = data["user_id"]  # Assuming you're sending the user ID

    user = User.query.get(_user_id)

    if not user:
        response = {
            "responseCode": 1,
            "value": "User not found."
        }
        return response
    else:
        if user.password != _old_password:
            response = {
                "responseCode": 1,
                "value": "Incorrect password."
            }
            return response
        if user.update_password(_new_password):
            response = {
                "responseCode": 0,
                "value": "Password updated successfully!"
            }
            return response

@app.route('/get-all-links', methods=['POST'])
def get_all_links():
    data = request.get_json()
    user_id = data['userID']
    user = User.query.get(user_id)
    if user:
        links = Link.query.filter_by(user_id=user_id).all()
        # Assuming you have a 'Link' model with a 'user_id' column
        # Customize the query based on your actual database schema
        links_data = [{
            'id': link.id,
            'long_url': link.long_url,
            'short_url': link.short_url,
            'open_count': link.open_count
        } for link in links]
        return jsonify(links_data)
    else:
        response = {
            "responseCode": 1,
            "value": "User not found"
        }
        return response, 404

@app.route('/delete-link', methods=['POST'])
def delete_link():
    data = request.get_json()
    link_id = data['linkID']
    link = Link.query.get(link_id)
    if link:
        db.session.delete(link)
        db.session.commit()
        response = {
            "responseCode": 0,
            "value": 'Link deleted successfully'
        }
        return response
    else:
        response = {
            "responseCode": 1,
            "value": "Link not found"
        }
        return response, 404

@app.route('/delete-selected-links', methods=['POST'])
def delete_selected_links():
    data = request.get_json()
    link_ids = data['linkIDs']
    deleted = 0
    for link_id in link_ids:
        link = Link.query.get(link_id)
        if link:
            db.session.delete(link)
            db.session.commit()
            deleted += 1
    if deleted == len(link_ids):
        response = {
            "responseCode": 0,
            "value": 'Link deleted successfully'
        }
        return response
    else:
        response = {
            "responseCode": 1,
            "value": "Link not found"
        }
        return response, 404

@app.route('/delete-user', methods=['POST'])
def delete_user():
    data = request.get_json()
    user_id = data['userID']
    user = User.query.get(user_id)
    if user:
        links = Link.query.filter_by(user_id=user_id).all()
        for link in links:
            db.session.delete(link)
        db.session.commit()
        db.session.delete(user)
        db.session.commit()
        response = {
            "responseCode": 0,
            "value": 'User deleted successfully'
        }
        return response
    else:
        response = {
            "responseCode": 1,
            "value": "User not found"
        }
        return response, 404

@app.route('/delete-selected-users', methods=['POST'])
def delete_selected_users():
    data = request.get_json()
    user_ids = data['userIDs']
    deleted = 0
    for user_id in user_ids:
        user = User.query.get(user_id)
        if user:
            links = Link.query.filter_by(user_id=user_id).all()
            for link in links:
                db.session.delete(link)
            db.session.commit()
            db.session.delete(user)
            db.session.commit()
            deleted += 1
    if deleted == len(user_ids):
        response = {
            "responseCode": 0,
            "value": 'User deleted successfully'
        }
        return response
    else:
        response = {
            "responseCode": 1,
            "value": "User not found"
        }
        return response, 404