from flask import Flask, json
from flask import render_template
from flask import request
import json

from handler import MySQLConnect, CalculateResult, DataPreprocess


app = Flask(__name__, static_url_path='/static',template_folder="static/templates")
app.config['MYSQL_HOST'] = '127.0.0.1'
app.config['MYSQL_USER'] = 'root'
app.config['MYSQL_PASSWORD'] = '1Password!'
# app.config['MYSQL_PASSWORD'] = '1234'
app.config['MYSQL_DB'] = 'procter'

app.config['DEBUG'] = True
app.config['TEMPLATES_AUTO_RELOAD'] = True

sql = MySQLConnect(app)
score_calculator = CalculateResult(sql)
calc = DataPreprocess(sql)

@app.route("/", methods=['GET'])
def hello_world_get(): return render_template("page.html")

@app.route("/", methods=['POST'])
def hello_world_post():
    data = request.json
    if not data:
        beacon_log = request.data.decode('utf8')
        data = json.loads(beacon_log)
    # print(len(data["image"]))
    
    if data["event"] == "IMAGE":
        # print(data)
        sql.log_image_db(data)
    else:
        sql.log_to_db(data)

    return {'comment': 'received'}

@app.route("/test/", methods=['GET'])
def test():
    cost = 5
    session_name = 'Sample Examination 2021 Day 1'
    # penalties = score_calculator.calculate_score(session_name, cost)

    cost = {
        "missing for": 5,
        "looking away": 5,
        "tab changed": 5,
        "looking down": 5,
        "client lost focus": 5,
        "Alt key press": 5,
        "Windows key press": 5,
        "Key press": 5,
        "Left click": 5,
        "Right click": 5,
        "Page leave": 5,
        "Copy": 5,
        "Paste": 5,
    }

    r1 = calc.generate_results(session_name, cost)
    # calc.check_senarios()
    
    data = {
        # 'penalties': penalties, 
        'result 2': r1}

    return render_template("test.html", value=data)

from encrypt.t import Encrypt
@app.route("/encrypt/", methods=['GET'])
def encrypt():
    data = "141".encode('utf-8')
    print(data)
    e= Encrypt()
    key = e.read_key()
    print(key)
    n, t, d = e.encrypt(key, data)
    print(n, t, d)
    print(type(n), type(t), type(d))
    # sql.log_encryption_details({'roll_no': '141', 'session': 'session sample 141 A', 'nounce': n, 'tag': t, 'data': d})
    a = sql.get_nounce_tag_data(data.decode('utf-8'), 'session sample 141 A')
    print(a[0], type(a[0][0]))
    org = e.decrypt(key, a, t, d)
    # org = e.decrypt(key, n, t, d)
    print(org.decode('utf-8'))
    return "HELLO"

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5002,debug=False)


# {title: '  ', weight: ' ', time: ' '}