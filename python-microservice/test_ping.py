from flask import Flask
app = Flask(__name__)

@app.route('/ping')
def ping():
    return 'pong'

if __name__ == '__main__':
    print('--- Python Microservice Test ---')
    print('Running on http://localhost:5001/ping')
    app.run(host='0.0.0.0', port=5001)
