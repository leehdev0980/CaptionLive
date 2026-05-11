from faster_whisper import WhisperModel
import tempfile
import os
import time

model = WhisperModel("tiny", device="cpu", compute_type="int8")

def transcribe_audio(audio_bytes: bytes) -> dict:
    start_time = time.time()
    # Save bytes to a temporary WAV file (already 16kHz mono)
    with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as tmp_wav:
        tmp_wav.write(audio_bytes)
        wav_path = tmp_wav.name

    try:
        segments, _ = model.transcribe(wav_path, beam_size=1, language="en")
        text = " ".join(seg.text.strip() for seg in segments)
        processing_time = round(time.time() - start_time, 2)
        return {"english": text.strip(), "processing_time_seconds": processing_time}
    finally:
        if os.path.exists(wav_path):
            os.unlink(wav_path)