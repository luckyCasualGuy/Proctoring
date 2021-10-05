from flask import Flask, json
from flask import render_template
from flask import request
# import json

from flask.globals import session
from numpy.core.numeric import roll
from handler import MySQLConnect, CalculateResult, DataPreprocess


app = Flask(__name__, static_url_path='/static',template_folder="static/templates")
app.config['MYSQL_HOST'] = '127.0.0.1'
app.config['MYSQL_USER'] = 'root'
app.config['MYSQL_PASSWORD'] = '1Password!'
# app.config['MYSQL_PASSWORD'] = '1234'
app.config['MYSQL_DB'] = 'procter'

app.config['DEBUG'] = True
app.config['TEMPLATES_AUTO_RELOAD'] = True
app.config["send_file"] = True
app.config["send_from_directory"] = True

sql = MySQLConnect(app)
score_calculator = CalculateResult(sql)
calc = DataPreprocess(sql)

@app.route("/client/register/", methods=['GET'])
def client_get_register():
    return render_template("client/client_register.html")

@app.route("/client/register/", methods=['POST'])
def client_register():
    sql.log_new_client(request.form)
    return render_template("client/client_login.html", msg = "Succesfully registered!")

@app.route("/client/login/", methods=['GET'])
def client_get_login():
    return render_template("client/client_login.html", msg = "")

@app.route("/client/login/", methods=['POST'])
def login_client():
    dashboard = sql.login_user(request.form)
    return render_template("client/client_dashboard.html", dash_data = json.dumps(dashboard))
    # return json.dumps(dashboard)

@app.route("/get_img/", methods=['POST'])
def handle_img_req():
    session = request.json["session"]
    roll_no = request.json["roll_no"]
    # return json.dumps(sql.get_img_paths(session,roll_no))
    return sql.get_img_paths(session,roll_no)

@app.route("/", methods=['GET'])
def hello_world_get(): return render_template("page.html")

@app.route("/", methods=['POST'])
def hello_world_post():
    data = request.json
    if not data:
        beacon_log = request.data.decode('utf8')
        data = json.loads(beacon_log)
    
    if data["event"] == "IMAGE":
        # print(data)
        sql.log_image_db(data)
    else:
        sql.log_to_db(data)

    # print("----------------------->", data)

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

from encrypt.t import Tokenizer
@app.route("/encrypt/", methods=['POST'])
def encrypt():
    data = request.json
    result = {"status": "NA"}

    print('--------------------->', data)
    for key in ['session_name', 'roll_no']:
        if key not in data:
            result['status'] = 'ERROR <REQUIREMENTS DID NOT MATCH>'
            break

    t = Tokenizer(sql)
    token = t.set_roll_no(data['session_name'], data['roll_no'])
    print('--------------------->', token)
    if not token:
        result['status'] = "INVALID"
    else:
        result['status'] = "REGISTERED"
        result['token'] = token

    return result

@app.route("/sample/", methods=['GET'])
def sample():
    return render_template('sample.html')

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5002, debug=False)


# {title: '  ', weight: ' ', time: ' '}