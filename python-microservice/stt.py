from faster_whisper import WhisperModel
import math
import os
import tempfile
import time

WHISPER_MODEL = os.getenv("WHISPER_MODEL", "base.en")
WHISPER_DEVICE = os.getenv("WHISPER_DEVICE", "cpu")
WHISPER_COMPUTE_TYPE = os.getenv("WHISPER_COMPUTE_TYPE", "int8")
REVIEW_CONFIDENCE = float(os.getenv("REVIEW_CONFIDENCE", "0.45"))
ACCEPT_CONFIDENCE = float(os.getenv("ACCEPT_CONFIDENCE", "0.65"))

def load_model():
    try:
        print(f"Loading Whisper model: {WHISPER_MODEL}")
        return WhisperModel(
            WHISPER_MODEL,
            device=WHISPER_DEVICE,
            compute_type=WHISPER_COMPUTE_TYPE
        )
    except Exception as exc:
        fallback_model = "tiny"
        print(f"Could not load {WHISPER_MODEL}: {exc}")
        print(f"Falling back to Whisper model: {fallback_model}")
        return WhisperModel(
            fallback_model,
            device=WHISPER_DEVICE,
            compute_type=WHISPER_COMPUTE_TYPE
        )


model = load_model()


def transcribe_audio(audio_bytes: bytes, suffix: str = ".wav") -> dict:
    start_time = time.time()
    # Save bytes to a temporary media file so ffmpeg can inspect the container.
    with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp_wav:
        tmp_wav.write(audio_bytes)
        wav_path = tmp_wav.name

    try:
        segments, _ = model.transcribe(
            wav_path,
            beam_size=3,
            best_of=3,
            temperature=0.0,
            language="en",
            vad_filter=True,
            vad_parameters={
                "min_silence_duration_ms": 500,
                "speech_pad_ms": 250
            },
            condition_on_previous_text=False,
            no_speech_threshold=0.55,
            log_prob_threshold=-1.0,
            hallucination_silence_threshold=1.0
        )
        segments = list(segments)
        text = " ".join(seg.text.strip() for seg in segments)
        confidence = calculate_confidence(segments)
        status, rejection_reason = classify_transcript(text, confidence, segments)
        processing_time = round(time.time() - start_time, 2)
        return {
            "english": text.strip(),
            "processing_time_seconds": processing_time,
            "confidence": confidence,
            "status": status,
            "rejection_reason": rejection_reason
        }
    finally:
        if os.path.exists(wav_path):
            os.unlink(wav_path)


def calculate_confidence(segments) -> float:
    if not segments:
        return 0.0

    weighted_total = 0.0
    total_weight = 0.0

    for segment in segments:
        text_weight = max(len(segment.text.strip()), 1)
        avg_logprob = getattr(segment, "avg_logprob", -1.5)
        no_speech_prob = getattr(segment, "no_speech_prob", 0.0)
        segment_confidence = math.exp(avg_logprob) * max(0.0, 1.0 - no_speech_prob)
        weighted_total += segment_confidence * text_weight
        total_weight += text_weight

    return round(max(0.0, min(1.0, weighted_total / total_weight)), 3)


def classify_transcript(text: str, confidence: float, segments) -> tuple[str, str]:
    if not text.strip():
        return "suppressed", "likely silence/noise"

    if not segments:
        return "suppressed", "no speech detected"

    if confidence < REVIEW_CONFIDENCE:
        return "suppressed", "low confidence"

    if confidence < ACCEPT_CONFIDENCE:
        return "review", "needs review"

    return "accepted", ""
