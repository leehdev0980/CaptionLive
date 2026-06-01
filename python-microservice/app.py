from flask import Flask, jsonify, request
from stt import transcribe_audio
from translate import translate_to_swahili
import os

app = Flask(__name__)

SUPPORTED_EXTENSIONS = {".wav", ".mp3", ".webm", ".mp4", ".m4a", ".ogg"}


def media_suffix_from_request():
    filename = request.headers.get("X-Filename", "")
    _, extension = os.path.splitext(filename.lower())
    if extension in SUPPORTED_EXTENSIONS:
        return extension
    return ".wav"


@app.route("/process", methods=["POST"])
def process():
    audio_bytes = request.data

    # Safety check: ignore empty or too-small chunks.
    if not audio_bytes or len(audio_bytes) < 44:
        return jsonify({
            "english": "",
            "swahili": "",
            "processing_time_seconds": 0,
            "confidence": 0,
            "status": "suppressed",
            "rejection_reason": "empty audio chunk"
        })

    should_translate = request.headers.get("X-Translate", "false").lower() == "true"

    try:
        result = transcribe_audio(audio_bytes, media_suffix_from_request())
        english = result["english"]
        swahili = ""

        if should_translate and english:
            swahili = translate_to_swahili(english)

        return jsonify({
            "english": english,
            "swahili": swahili,
            "processing_time_seconds": result["processing_time_seconds"],
            "confidence": result.get("confidence", 0),
            "status": result.get("status", "review"),
            "rejection_reason": result.get("rejection_reason", "")
        })
    except Exception as e:
        print(f"Processing error: {e}")
        return jsonify({"error": str(e)}), 500


@app.route("/ping", methods=["GET"])
def ping():
    return jsonify({"status": "ok"})


if __name__ == "__main__":
    print("Starting Python microservice on port 5001...")
    app.run(host="0.0.0.0", port=5001, threaded=True)
