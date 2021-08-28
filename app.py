from flask import Flask
from flask import render_template
from flask_mysqldb import MySQL
from werkzeug.datastructures import RequestCacheControl
from flask import request, send_file

import mysql.connector
from mysql.connector import connection

# from handler import data_handler

app = Flask(__name__, static_url_path='/static',template_folder="static/templates")

app.config['MYSQL_HOST'] = '127.0.0.1'
app.config['MYSQL_USER'] = 'root'
app.config['MYSQL_PASSWORD'] = '1234'
app.config['MYSQL_DB'] = 'procter'

app.config['DEBUG'] = True
app.config['TEMPLATES_AUTO_RELOAD'] = True

mysql = MySQL(app)

def log_to_db(data):
    cursor = mysql.connection.cursor()
    cursor.execute("SELECT count(code) FROM user_docs WHERE code =%s",("hello",))

@app.route("/", methods=['GET'])
def hello_world_get(): return render_template("page.html")

@app.route("/", methods=['POST'])
def hello_world_post():
    user = 1
    session_name = "Sample MCQ Test"
    data = request.json
    # data_handler(data, user, session_name)
    # log_to_db(data)
    return {'comment': 'received'}
    

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5002,debug=False)


# {title: '  ', weight: ' ', time: ' '}