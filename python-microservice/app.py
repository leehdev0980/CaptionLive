from flask import Flask, request, jsonify
from stt import transcribe_audio
from translate import translate_to_swahili

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
            "swahili": "",
            "processing_time_seconds": 0
        })
    
    should_translate = request.headers.get('X-Translate', 'false').lower() == 'true'

    
    try:
        result = transcribe_audio(audio_bytes)
        english = result["english"]
        swahili = ""
        if should_translate and english:
            swahili = translate_to_swahili(english)

        return jsonify({
            "english": english,
            "swahili": swahili,
            "processing_time_seconds": result["processing_time_seconds"]
        })
    except Exception as e:
        print(f"Processing error: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/ping', methods=['GET'])
def ping():
    return jsonify({"status": "ok"})

if __name__ == '__main__':
    print("Starting Python microservice on port 5001...")
    app.run(host='0.0.0.0', port=5001, threaded=True)