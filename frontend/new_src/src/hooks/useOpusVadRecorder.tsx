import { useCallback, useEffect, useRef, useState } from "react";

function clamp01(x: number) {
  if (Number.isNaN(x)) return 0;
  return Math.max(0, Math.min(1, x));
}

type VadState = {
  status: "idle" | "loading" | "ready" | "fallback";
  lastProb?: number | null;
};

async function loadVadModelIfPossible({
  setVadDebug,
  onnxModelPath,
}: {
  setVadDebug: React.Dispatch<
    React.SetStateAction<{
      status: VadState["status"];
      lastProb: number | null;
    }>
  >;
  onnxModelPath: string;
}) {
  try {
    const ort = await import("onnxruntime-web");
    setVadDebug((s) => ({ ...s, status: "loading" }));

    const session = await ort.InferenceSession.create(onnxModelPath);
    setVadDebug((s) => ({ ...s, status: "ready" }));

    return session;
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn(
      "[VAD] ONNX model could not be loaded; using fallback energy gate.",
      e,
    );
    setVadDebug((s) => ({ ...s, status: "fallback" }));
    return null;
  }
}

function energyGateScore(pcmFloat32: Float32Array | number[]) {
  let sum = 0;
  for (let i = 0; i < pcmFloat32.length; i++) {
    const s = pcmFloat32[i] as number;
    sum += s * s;
  }
  const rms = Math.sqrt(sum / Math.max(1, pcmFloat32.length));
  const score = 1 - Math.exp(-rms * 12);
  return clamp01(score);
}

export function useOpusVadRecorder({
  onChunkReady,
  onRecordingStateChange,
  onError,
  vadThreshold = 0.7,
  chunkMs = 2000, // kept for API compatibility; actual cadence driven by MediaRecorder timeslice
  vadWindowMs = 400,
  vadModelPath = "/models/silero_vad.onnx",
}: {
  onChunkReady?: (blob: Blob) => void;
  onRecordingStateChange?: (recording: boolean) => void;
  onError?: (message: string) => void;
  vadThreshold?: number;
  chunkMs?: number;
  vadWindowMs?: number;
  vadModelPath?: string;
}) {
  const [isRecording, setIsRecording] = useState(false);
  const [vadDebug, setVadDebug] = useState<{
    status: VadState["status"];
    lastProb: number | null;
  }>({
    status: "idle",
    lastProb: null,
  });

  const sessionRef = useRef<import("onnxruntime-web").InferenceSession | null>(
    null,
  );
  const audioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const rafRef = useRef<number | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const pcmBufferRef = useRef<number[]>([]);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordingActiveRef = useRef(false);

  // Hangover state (avoid setTimeout/clearTimeout typing + race issues)
  const hangoverUntilRef = useRef<number | null>(null);

  useEffect(() => {
    void loadVadModelIfPossible({
      setVadDebug,
      onnxModelPath: vadModelPath,
    }).then((session) => {
      sessionRef.current = session;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vadModelPath]);

  const stopMediaRecorder = useCallback(() => {
    const mr = mediaRecorderRef.current;
    if (mr && mr.state !== "inactive") {
      try {
        mr.stop();
      } catch {
        // ignore
      }
    }
  }, []);

  const startMediaRecorder = useCallback(
    async (stream: MediaStream, onChunkReadyCb?: (blob: Blob) => void) => {
      if (mediaRecorderRef.current) return;

      // Prefer Opus in WebM; fall back to generic Opus WebM.
      const candidateTypes = [
        "audio/webm;codecs=opus",
        "audio/ogg;codecs=opus",
        "audio/webm",
      ] as const;

      let mimeType = "";
      for (const t of candidateTypes) {
        if (
          typeof MediaRecorder !== "undefined" &&
          MediaRecorder.isTypeSupported?.(t)
        ) {
          mimeType = t;
          break;
        }
      }

      const options = mimeType ? { mimeType } : undefined;

      const pendingBlobsRef = { current: [] as Blob[] };

      const minBlobBytes = 2048;

      const mr = new MediaRecorder(stream, options);

      mr.ondataavailable = (evt: BlobEvent) => {
        if (evt.data && evt.data.size >= minBlobBytes) {
          pendingBlobsRef.current.push(evt.data);
        }
      };

      mr.onstop = async () => {
        const blobs = pendingBlobsRef.current || [];
        pendingBlobsRef.current = [];
        mediaRecorderRef.current = null;

        if (!blobs.length) return;

        // Combine all blobs from the speaking window so ffmpeg has a
        // higher chance of decoding a non-truncated WebM container.
        try {
          const last = blobs[blobs.length - 1];
          const blobType = last?.type || "audio/webm";

          const parts = await Promise.all(
            blobs.map(async (b) => new Uint8Array(await b.arrayBuffer())),
          );

          const combined = new Blob(parts, { type: blobType });
          onChunkReadyCb?.(combined);
        } catch {
          // Fallback to last blob if concatenation fails for any reason.
          onChunkReadyCb?.(blobs[blobs.length - 1]);
        }
      };

      // Emit data periodically; we only upload on stop so the WebM header/trailer is finalized.
      mr.start(250);

      mediaRecorderRef.current = mr;
    },
    [],
  );

  const decideSpeechProb = useCallback(
    async (pcmFloat32: number[] /* sampleRate unused */) => {
      const session = sessionRef.current;
      if (!session) return energyGateScore(pcmFloat32);

      try {
        const inputTensor = new Float32Array(pcmFloat32);
        const ort = await import("onnxruntime-web");
        const tensor = new ort.Tensor("float32", inputTensor, [
          1,
          inputTensor.length,
        ]);

        const outputs = await session.run({ input: tensor });

        const firstKey =
          outputs && typeof outputs === "object"
            ? Object.keys(outputs)[0]
            : null;
        const out = firstKey ? outputs[firstKey] : null;

        const prob = Array.isArray(out?.data) ? out.data[0] : out?.data?.[0];
        return clamp01(
          typeof prob === "number" ? prob : energyGateScore(pcmFloat32),
        );
      } catch (e) {
        // eslint-disable-next-line no-console
        console.warn("[VAD] Inference failed; using fallback energy gate.", e);
        return energyGateScore(pcmFloat32);
      }
    },
    [],
  );

  const stop = useCallback(() => {
    recordingActiveRef.current = false;

    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }

    hangoverUntilRef.current = null;

    stopMediaRecorder();

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }

    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    setIsRecording(false);
    onRecordingStateChange?.(false);
  }, [onRecordingStateChange, stopMediaRecorder]);

  const start = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { channelCount: 1, sampleRate: 16000 },
      });

      streamRef.current = stream;

      audioContextRef.current = new AudioContext();
      const source = audioContextRef.current.createMediaStreamSource(stream);

      const analyser = audioContextRef.current.createAnalyser();
      analyser.fftSize = 2048;
      analyserRef.current = analyser;

      source.connect(analyser);

      const sampleRate = audioContextRef.current.sampleRate;
      const vadWindowSamples = Math.floor((sampleRate * vadWindowMs) / 1000);

      pcmBufferRef.current = [];
      recordingActiveRef.current = true;

      setIsRecording(true);
      onRecordingStateChange?.(true);

      let wasSpeaking = false;

      const loop = async () => {
        if (!recordingActiveRef.current) return;

        const analyserNode = analyserRef.current;
        if (!analyserNode) return;

        const timeData = new Float32Array(analyserNode.fftSize);
        analyserNode.getFloatTimeDomainData(timeData);

        pcmBufferRef.current.push(...Array.from(timeData));

        const maxSamples = vadWindowSamples * 3;
        if (pcmBufferRef.current.length > maxSamples) {
          pcmBufferRef.current.splice(
            0,
            pcmBufferRef.current.length - maxSamples,
          );
        }

        if (pcmBufferRef.current.length >= vadWindowSamples) {
          const window = pcmBufferRef.current.slice(-vadWindowSamples);
          const prob = await decideSpeechProb(window);
          setVadDebug((s) => ({ ...s, lastProb: prob }));

          const speakingNow = prob >= vadThreshold;

          // Simple hangover to avoid rapid start/stop thrashing around the threshold.
          // After detecting speech -> keep recording for a short period even if prob dips.
          const hangoverMs = 400;

          if (speakingNow && !wasSpeaking) {
            // Speech just started: clear any hangover stop.
            hangoverUntilRef.current = null;

            await startMediaRecorder(stream, onChunkReady);
            wasSpeaking = true;
          } else if (!speakingNow && wasSpeaking) {
            // If we're below threshold, start hangover window if not already started.
            if (hangoverUntilRef.current == null) {
              hangoverUntilRef.current = performance.now() + hangoverMs;
            }

            // Stop only after hangover window has elapsed.
            if (performance.now() >= hangoverUntilRef.current) {
              hangoverUntilRef.current = null;
              stopMediaRecorder();
              wasSpeaking = false;
            }
          } else if (speakingNow && wasSpeaking) {
            // Still speaking: extend/clear hangover.
            hangoverUntilRef.current = null;
          }
        }

        rafRef.current = requestAnimationFrame(loop);
      };

      rafRef.current = requestAnimationFrame(loop);
    } catch (e) {
      const msg =
        e instanceof Error
          ? e.message
          : typeof e === "string"
            ? e
            : "Microphone access failed";
      // eslint-disable-next-line no-console
      console.error("[Recorder] start failed:", e);
      onError?.(msg);
      alert("Microphone access required");
    }
  }, [
    decideSpeechProb,
    onChunkReady,
    onRecordingStateChange,
    startMediaRecorder,
    stopMediaRecorder,
    vadModelPath, // kept to mirror original behavior; not directly used in callback logic
    vadThreshold,
    vadWindowMs,
  ]);

  return { start, stop, isRecording, vadDebug };
}
