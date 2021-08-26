from flask import Flask
from flask import render_template

app = Flask(__name__, static_url_path='/static',template_folder="static/templates")
app.config['DEBUG'] = True

@app.route("/", methods=['GET', 'POST'])
def hello_world():
    return render_template("page.html")

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5002,debug=False)
    