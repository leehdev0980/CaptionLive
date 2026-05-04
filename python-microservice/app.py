from flask import Flask, request, jsonify
from stt import transcribe_audio

app = Flask(__name__)

@app.route('/process', methods=['POST'])
def process():
    """
    Accepts raw audio bytes, returns JSON with transcription.
    """
    audio_bytes = request.data
    
    if not audio_bytes:
        return jsonify({"error": "No audio data received"}), 400
    
    try:
        result = transcribe_audio(audio_bytes)
        return jsonify(result)
    except Exception as e:
        print(f"Processing error: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/ping', methods=['GET'])
def ping():
    return jsonify({"status": "ok"})

if __name__ == '__main__':
    print("Starting Python microservice on port 5001...")
    app.run(host='0.0.0.0', port=5001, threaded=False)