from flask import Flask
from flask import render_template
from werkzeug.datastructures import RequestCacheControl
from flask import request, send_file

app = Flask(__name__, static_url_path='/static',template_folder="static/templates")
app.config['DEBUG'] = True
app.config['TEMPLATES_AUTO_RELOAD'] = True

@app.route("/", methods=['GET'])
def hello_world_get(): return render_template("page.html")

@app.route("/", methods=['POST'])
def hello_world_post():
    print(request.data)
    return {'comment': 'received'}
    

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5002,debug=False)
