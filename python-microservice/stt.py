from faster_whisper import WhisperModel
import tempfile
import os
import subprocess
import time

model = WhisperModel("tiny", device="cpu", compute_type="int8")

def transcribe_audio(audio_bytes: bytes) -> dict:
    start_time = time.time()

    # Save incoming webm bytes to a temporary file
    with tempfile.NamedTemporaryFile(suffix=".webm", delete=False) as tmp_webm:
        tmp_webm.write(audio_bytes)
        webm_path = tmp_webm.name

    wav_path = webm_path.replace(".webm", ".wav")

    try:
        # Use ffmpeg directly to convert webm to 16kHz mono WAV
        # Command breakdown:
        #   -i input.webm         : input file
        #   -ac 1                 : one channel (mono)
        #   -ar 16000             : sample rate 16kHz
        #   -sample_fmt s16       : 16-bit signed integer PCM
        #   output.wav            : output file
        subprocess.run([
            "ffmpeg",
            "-i", webm_path,
            "-ac", "1",
            "-ar", "16000",
            "-sample_fmt", "s16",
            wav_path
        ], check=True, capture_output=True, text=True)

        # Transcribe
        segments, _ = model.transcribe(wav_path, beam_size=1, language="en")
        text = " ".join(seg.text.strip() for seg in segments)

        processing_time = round(time.time() - start_time, 2)
        return {"english": text.strip(), "processing_time_seconds": processing_time}

    finally:
        if os.path.exists(webm_path):
            os.unlink(webm_path)
        if os.path.exists(wav_path):
            os.unlink(wav_path)