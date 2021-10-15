from flask import Flask, render_template

app = Flask(__name__, static_url_path='/static',template_folder="static/templates")

app.config['DEBUG'] = True
app.config['TEMPLATES_AUTO_RELOAD'] = True
app.config["send_file"] = True
app.config["send_from_directory"] = True

@app.route("/thankyou/", methods=['GET'])
def thankyou():return render_template("thankyoupage.html")

@app.route("/", methods=['GET'])
def page():return render_template("page.html")

@app.route("/page_one/", methods=['GET'])
def pageone():return render_template("client_page_1.html")

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5002, debug=False)