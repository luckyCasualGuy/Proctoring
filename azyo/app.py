from flask import Flask, json
from flask import render_template
from flask import request
from flask_cors import CORS

from handler import MySQLConnect, CalculateResult, DataPreprocess


app = Flask(__name__, static_url_path='/static',template_folder="static/templates")
app.config['MYSQL_HOST'] = '127.0.0.1'
app.config['MYSQL_USER'] = 'root'
app.config['MYSQL_PASSWORD'] = '1Supermscp!'
app.config['MYSQL_DB'] = 'procter'

app.config['DEBUG'] = True
app.config['TEMPLATES_AUTO_RELOAD'] = True
app.config["send_file"] = True
app.config["send_from_directory"] = True

cors = CORS(app)
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


from request_validator import validate_secret_R
@app.route("/secret_code_check", methods=['POST'])
def secret_code_check():
    '''
    request: {
        "secret": 16digit varchar required
    }
    '''
    result = validate_secret_R(request)
    if not result['ERROR']:
        secret = result['secret']
        if not sql.check_client_licence_code_exists(secret):
            result = {'ERROR': True, 'secret': None, 'message': 'secret invalid', 'CODE': 4}

    # validate secret from client table here

    return result


@app.route("/", methods=['GET'])
def hello_world_get(): return render_template("hello.html")

@app.route("/log", methods=['GET'])
def log_greet():
    return render_template("log.html")

@app.route("/log", methods=['POST'])
def log():
    data = request.json
    if not data:
        beacon_log = request.data.decode('utf8')
        data = json.loads(beacon_log)
    
    if data["event"] == "IMAGE":
        print('loggging image')
        sql.log_image_db(data)
    else:
        sql.log_to_db(data)

    headers = {'Access-Control-Allow-Origin': '*'}
    return {'comment': 'received'}, headers

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



if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5003, debug=False)


# {title: '  ', weight: ' ', time: ' '}