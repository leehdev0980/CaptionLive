from flask import Flask, request, jsonify
from stt import transcribe_audio

app = Flask(__name__)

@app.route('/process', methods=['POST'])
def process():
    """
    Accepts raw audio bytes, returns JSON with transcription.
    """
    audio_bytes = request.data
    
    # Safety check: ignore empty or too‑small chunks (valid WAV header is at least 44 bytes)
    if not audio_bytes or len(audio_bytes) < 44:
        return jsonify({
            "english": "",
            "processing_time_seconds": 0
        })

    
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
    app.run(host='0.0.0.0', port=5001, threaded=True)