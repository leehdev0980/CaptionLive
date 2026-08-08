export const API_ORIGIN =
  import.meta.env.VITE_API_ORIGIN ?? "http://localhost:5260";
export const API_BASE_URL = `${API_ORIGIN}/api`;
export const CAPTION_HUB_URL = `${API_ORIGIN}/captionHub`;

export async function fetchSessionCaptions(sessionId, options = {}) {
  const response = await fetch(
    `${API_BASE_URL}/sessions/${encodeURIComponent(sessionId)}/captions`,
    { signal: options.signal },
  );

  if (!response.ok) {
    throw new Error(`Failed to load captions (${response.status})`);
  }

  const captions = await response.json();
  return Array.isArray(captions)
    ? captions.map(normalizeCaption).filter(Boolean)
    : [];
}

export async function fetchSessions(limit = 50, options = {}) {
  const url = new URL(`${API_BASE_URL}/sessions`);
  url.searchParams.set("limit", String(limit));

  const response = await fetch(url, { signal: options.signal });
  if (!response.ok) {
    throw new Error(`Failed to load sessions (${response.status})`);
  }

  return await response.json();
}

export async function createSession({ sessionId, title }, options = {}) {
  const response = await fetch(`${API_BASE_URL}/sessions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sessionId, title }),
    signal: options.signal,
  });

  if (!response.ok) {
    throw new Error(`Create session failed (${response.status})`);
  }

  return await response.json();
}

export async function endSession({ sessionId }, options = {}) {
  const response = await fetch(
    `${API_BASE_URL}/sessions/${encodeURIComponent(sessionId)}/end`,
    {
      method: "PATCH",
      signal: options.signal,
    },
  );

  if (!response.ok) {
    throw new Error(`End session failed (${response.status})`);
  }

  return await response.json();
}

export async function updateSessionTitle({ sessionId, title }, options = {}) {
  const response = await fetch(
    `${API_BASE_URL}/sessions/${encodeURIComponent(sessionId)}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title }),
      signal: options.signal,
    },
  );

  if (!response.ok) {
    throw new Error(`Update session failed (${response.status})`);
  }

  return await response.json();
}

export async function uploadAudioChunk({
  audioBlob,
  sessionId,
  sessionTitle,
  chunkId,
}) {
  const formData = new FormData();

  const ext = (() => {
    const type = audioBlob?.type || "";
    if (type.includes("ogg")) return "ogg";
    return "webm";
  })();

  formData.append("audio", audioBlob, `chunk_${chunkId}.${ext}`);
  formData.append("sessionId", sessionId);

  if (sessionTitle) {
    formData.append("sessionTitle", sessionTitle);
  }

  const response = await fetch(`${API_BASE_URL}/audio/upload`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`Audio upload failed (${response.status})`);
  }

  const result = await response.json();
  return {
    ...result,
    caption: normalizeCaption(result.caption),
  };
}

export function normalizeCaption(payload) {
  if (!payload) return null;

  // If backend sends plain strings, treat as confirmed text.
  if (typeof payload === "string") {
    return {
      captionId: null,
      sessionId: null,
      timestamp: new Date().toISOString(),
      language: "en",
      text: payload,
      confidence: null,
      speakerId: null,

      kind: "confirmed",
      noAudio: false,
      translationError: false,
      speakerName: null,
      speakerColor: null,
    };
  }

  const captionId = payload.captionId ?? payload.CaptionId ?? null;
  const sessionId = payload.sessionId ?? payload.SessionId ?? null;
  const timestamp =
    payload.timestamp ?? payload.Timestamp ?? new Date().toISOString();
  const language = payload.language ?? payload.Language ?? "en";

  const text = (payload.text ?? payload.Text ?? "").toString();
  const confidence = payload.confidence ?? payload.Confidence ?? null;

  const speakerId = payload.speakerId ?? payload.SpeakerId ?? null;
  const speakerName = payload.speakerName ?? payload.SpeakerName ?? null;
  const speakerColor = payload.speakerColor ?? payload.SpeakerColor ?? null;

  const kind =
    payload.kind ??
    payload.Kind ??
    (payload.isPartial || payload.partial ? "partial" : undefined) ??
    (payload.isConfirmed || payload.confirmed ? "confirmed" : undefined) ??
    "confirmed";

  const isPartial =
    kind === "partial" ||
    Boolean(payload.isPartial) ||
    Boolean(payload.partial);
  const translationError = Boolean(
    payload.translationError ??
    payload.TranslationError ??
    payload.translateError ??
    payload.TranslateError,
  );

  const noAudio =
    Boolean(payload.noAudio ?? payload.NoAudio) ||
    Boolean(payload.isNoAudio ?? payload.IsNoAudio);

  if (!text.trim() && !noAudio && !translationError) return null;

  return {
    captionId,
    sessionId,
    timestamp,
    language,
    text,

    confidence,
    speakerId,

    kind: isPartial ? "partial" : "confirmed",
    noAudio,
    translationError,

    speakerName,
    speakerColor,
  };
}
