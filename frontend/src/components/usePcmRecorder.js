import { useRef, useCallback, useState } from 'react';

export function usePcmRecorder({ onChunkReady, onRecordingStateChange }) {
  const [isRecording, setIsRecording] = useState(false);
  const audioContextRef = useRef(null);
  const streamRef = useRef(null);
  const recordingRef = useRef(false);   // actual flag for the audio callback

  const start = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { channelCount: 1, sampleRate: 16000 }
      });
      streamRef.current = stream;
      audioContextRef.current = new AudioContext();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      // ScriptProcessorNode (works in all browsers, though deprecated)
      const processor = audioContextRef.current.createScriptProcessor(4096, 1, 1);
      source.connect(processor);
      processor.connect(audioContextRef.current.destination);

      const chunks = [];
      let chunkStartTime = Date.now();

      processor.onaudioprocess = (event) => {
        if (!recordingRef.current) return;
        const input = event.inputBuffer.getChannelData(0);
        const sampleRate = audioContextRef.current.sampleRate;
        let samples;
        if (sampleRate === 16000) {
          samples = new Float32Array(input);
        } else {
          const ratio = 16000 / sampleRate;
          const newLen = Math.round(input.length * ratio);
          samples = new Float32Array(newLen);
          for (let i = 0; i < newLen; i++) samples[i] = input[Math.round(i / ratio)];
        }
        chunks.push(samples);

        if (Date.now() - chunkStartTime >= 2000) {
          const allSamples = concatenateFloat32(chunks);

          if (allSamples.length === 0) {
            chunks.length = 0;
            chunkStartTime = Date.now();
            return;   // skip empty chunk
          }

          const wavBlob = float32ToWavBlob(allSamples, 16000);
          onChunkReady(wavBlob);
          chunks.length = 0;
          chunkStartTime = Date.now();
        }
      };

      recordingRef.current = true;
      setIsRecording(true);
      if (onRecordingStateChange) onRecordingStateChange(true);
    } catch (err) {
      console.error('Microphone error:', err);
      alert('Microphone access required');
    }
  }, [onChunkReady, onRecordingStateChange]);

  const stop = useCallback(() => {
    recordingRef.current = false;
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }
    setIsRecording(false);
    if (onRecordingStateChange) onRecordingStateChange(false);
  }, [onRecordingStateChange]);

  return { start, stop, isRecording };   // now isRecording is a state variable
}

// ---------- helper functions (unchanged) ----------
function concatenateFloat32(chunks) {
  let totalLen = 0;
  chunks.forEach(c => (totalLen += c.length));
  const result = new Float32Array(totalLen);
  let offset = 0;
  chunks.forEach(c => {
    result.set(c, offset);
    offset += c.length;
  });
  return result;
}

function float32ToWavBlob(samples, sampleRate) {
  const buffer = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(buffer);
  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + samples.length * 2, true);
  writeString(view, 8, 'WAVE');
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeString(view, 36, 'data');
  view.setUint32(40, samples.length * 2, true);
  let offset = 44;
  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
    offset += 2;
  }
  return new Blob([buffer], { type: 'audio/wav' });
}

function writeString(view, offset, string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}
