from flask import Flask, json
from flask import render_template
from flask import request
import json

from handler import MySQLConnect, CalculateResult


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

@app.route("/", methods=['GET'])
def hello_world_get(): return render_template("page.html")

@app.route("/", methods=['POST'])
def hello_world_post():
    data = request.json
    if not data:
        beacon_log = request.data.decode('utf8')
        data = json.loads(beacon_log)
    
    sql.log_to_db(data)

    return {'comment': 'received'}

@app.route("/test/", methods=['GET'])
def test():
    cost = 5
    session_name = 'Sample Examination 2021 Day 1'
    penalties = score_calculator.calculate_score(session_name, cost)
    data = {'penalties': penalties}

    return render_template("test.html", value=data)


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5002,debug=False)


# {title: '  ', weight: ' ', time: ' '}