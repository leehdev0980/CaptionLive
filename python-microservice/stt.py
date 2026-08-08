from faster_whisper import WhisperModel
import tempfile
import os
import time
import subprocess

model = WhisperModel("tiny", device="cpu", compute_type="int8")


def _decode_to_16k_mono_wav(opus_bytes: bytes) -> str | None:
    """Decode incoming Opus container bytes (webm/ogg) to 16kHz mono WAV using ffmpeg.

    Returns path to a temporary wav file, or None when decoding fails.
    """
    if not opus_bytes or len(opus_bytes) < 32:
        return None

    with tempfile.NamedTemporaryFile(suffix=".webm", delete=False) as tmp_in:
        tmp_in.write(opus_bytes)
        in_path = tmp_in.name

    wav_fd = None
    wav_path = None
    try:
        wav_fd, wav_path = tempfile.mkstemp(suffix=".wav")
        os.close(wav_fd)

        # ffmpeg decoding can fail on truncated/partial MediaRecorder segments.
        # Use non-throwing mode and return None instead of crashing the whole request.
        result = subprocess.run(
            [
                "ffmpeg",
                "-hide_banner",
                "-loglevel",
                "error",
                "-fflags",
                "+genpts",
                "-err_detect",
                "ignore_err",
                "-i",
                in_path,
                "-ac",
                "1",
                "-ar",
                "16000",
                "-c:a",
                "pcm_s16le",
                wav_path,
                "-y",
            ],
            check=False,
        )

        if result.returncode != 0:
            return None

        if wav_path and os.path.exists(wav_path) and os.path.getsize(wav_path) > 0:
            return wav_path

        return None
    finally:
        try:
            if os.path.exists(in_path):
                os.unlink(in_path)
        except Exception:
            pass


def transcribe_audio(audio_bytes: bytes) -> dict:
    start_time = time.time()

    # The incoming bytes are now Opus container data (from the browser MediaRecorder).
    wav_path = None
    try:
        wav_path = _decode_to_16k_mono_wav(audio_bytes)
        if not wav_path:
            # MediaRecorder segments can be truncated/invalid; decoding failure
            # should not crash the request pipeline.
            processing_time = round(time.time() - start_time, 2)
            return {"english": "", "processing_time_seconds": processing_time}

        segments, _ = model.transcribe(wav_path, beam_size=1, language="en")
        text = " ".join(seg.text.strip() for seg in segments)
        processing_time = round(time.time() - start_time, 2)
        return {"english": text.strip(), "processing_time_seconds": processing_time}
    finally:
        if wav_path and os.path.exists(wav_path):
            try:
                os.unlink(wav_path)
            except Exception:
                pass

