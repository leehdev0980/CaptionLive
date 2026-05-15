from flask import Flask, request, jsonify
from stt import transcribe_audio
from translate import translate_to_swahili
import threading

app = Flask(__name__)

def translate_and_log(english_text):
    """Runs translation in a background thread (fire‑and‑forget)."""
    try:
        swahili = translate_to_swahili(english_text)
        print(f"BG Translation: '{english_text}' → '{swahili}'")
    except Exception as e:
        print(f"Translation error: {e}")

@app.route('/process', methods=['POST'])
def process():
    audio_bytes = request.data

    # Safety check: ignore empty or too‑small chunks
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

        # Start translation in background if needed – do NOT wait for it
        if should_translate and english:
            threading.Thread(
                target=translate_and_log,
                args=(english,),
                daemon=True
            ).start()

        return jsonify({
            "english": english,
            "swahili": "",   # swahili will be logged in background for now
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