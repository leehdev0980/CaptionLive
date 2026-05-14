import { useRef, useCallback, useState, useEffect } from 'react';

/**
 * Enhanced audio analyzer hook for real-time audio monitoring
 * Provides audio levels, frequency data, and speech detection
 */
export function useAudioAnalyzer({
  onChunkReady,
  onRecordingStateChange,
  onAudioLevelChange,
  fftSize = 256,
  smoothingTimeConstant = 0.8
}) {
  const [isRecording, setIsRecording] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [frequencyData, setFrequencyData] = useState(new Uint8Array(fftSize / 2));
  const [waveformData, setWaveformData] = useState(new Uint8Array(fftSize));
  const [noiseFloor, setNoiseFloor] = useState(0);
  const [peakLevel, setPeakLevel] = useState(0);
  const [devices, setDevices] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState(null);
  
  const audioContextRef = useRef(null);
  const streamRef = useRef(null);
  const analyzerRef = useRef(null);
  const recordingRef = useRef(false);
  const animationFrameRef = useRef(null);
  const speechTimeoutRef = useRef(null);
  const noiseFloorSamplesRef = useRef([]);

  // Get available audio devices
  const refreshDevices = useCallback(async () => {
    try {
      const deviceList = await navigator.mediaDevices.enumerateDevices();
      const audioInputs = deviceList.filter(d => d.kind === 'audioinput');
      setDevices(audioInputs);
      if (!selectedDevice && audioInputs.length > 0) {
        setSelectedDevice(audioInputs[0].deviceId);
      }
    } catch (err) {
      console.error('Failed to enumerate devices:', err);
    }
  }, [selectedDevice]);

  useEffect(() => {
    refreshDevices();
    navigator.mediaDevices.addEventListener('devicechange', refreshDevices);
    return () => {
      navigator.mediaDevices.removeEventListener('devicechange', refreshDevices);
    };
  }, [refreshDevices]);

  // Analyze audio in animation frame loop
  const analyzeAudio = useCallback(() => {
    if (!analyzerRef.current || !recordingRef.current) return;

    const analyzer = analyzerRef.current;
    const freqData = new Uint8Array(analyzer.frequencyBinCount);
    const timeData = new Uint8Array(analyzer.fftSize);

    analyzer.getByteFrequencyData(freqData);
    analyzer.getByteTimeDomainData(timeData);

    // Calculate RMS level (0-1)
    let sum = 0;
    for (let i = 0; i < timeData.length; i++) {
      const normalized = (timeData[i] - 128) / 128;
      sum += normalized * normalized;
    }
    const rms = Math.sqrt(sum / timeData.length);
    const level = Math.min(1, rms * 3); // Scale up for visibility

    // Update noise floor (rolling average of quiet moments)
    if (level < 0.1) {
      noiseFloorSamplesRef.current.push(level);
      if (noiseFloorSamplesRef.current.length > 30) {
        noiseFloorSamplesRef.current.shift();
      }
      const avgNoise = noiseFloorSamplesRef.current.reduce((a, b) => a + b, 0) / 
                       noiseFloorSamplesRef.current.length;
      setNoiseFloor(avgNoise);
    }

    // Peak detection
    if (level > peakLevel) {
      setPeakLevel(level);
    } else {
      setPeakLevel(prev => Math.max(level, prev * 0.995)); // Slow decay
    }

    // Speech detection with hysteresis
    const speechThreshold = Math.max(0.08, noiseFloor * 2);
    if (level > speechThreshold) {
      setIsSpeaking(true);
      if (speechTimeoutRef.current) {
        clearTimeout(speechTimeoutRef.current);
      }
      speechTimeoutRef.current = setTimeout(() => {
        setIsSpeaking(false);
      }, 300);
    }

    setAudioLevel(level);
    setFrequencyData(new Uint8Array(freqData));
    setWaveformData(new Uint8Array(timeData));

    if (onAudioLevelChange) {
      onAudioLevelChange(level, isSpeaking);
    }

    animationFrameRef.current = requestAnimationFrame(analyzeAudio);
  }, [onAudioLevelChange, isSpeaking, noiseFloor, peakLevel]);

  const start = useCallback(async (deviceId) => {
    try {
      const constraints = {
        audio: {
          channelCount: 1,
          sampleRate: 16000,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          ...(deviceId && { deviceId: { exact: deviceId } })
        }
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      const audioContext = new AudioContext();
      audioContextRef.current = audioContext;

      const source = audioContext.createMediaStreamSource(stream);

      // Create analyzer for visualization
      const analyzer = audioContext.createAnalyser();
      analyzer.fftSize = fftSize;
      analyzer.smoothingTimeConstant = smoothingTimeConstant;
      analyzerRef.current = analyzer;
      source.connect(analyzer);

      // Create processor for chunked recording
      const processor = audioContext.createScriptProcessor(4096, 1, 1);
      source.connect(processor);
      processor.connect(audioContext.destination);

      const chunks = [];
      let chunkStartTime = Date.now();

      processor.onaudioprocess = (event) => {
        if (!recordingRef.current) return;
        const input = event.inputBuffer.getChannelData(0);
        const sampleRate = audioContext.sampleRate;
        
        let samples;
        if (sampleRate === 16000) {
          samples = new Float32Array(input);
        } else {
          const ratio = 16000 / sampleRate;
          const newLen = Math.round(input.length * ratio);
          samples = new Float32Array(newLen);
          for (let i = 0; i < newLen; i++) {
            samples[i] = input[Math.round(i / ratio)];
          }
        }
        chunks.push(samples);

        if (Date.now() - chunkStartTime >= 2000) {
          const allSamples = concatenateFloat32(chunks);
          if (allSamples.length > 0) {
            const wavBlob = float32ToWavBlob(allSamples, 16000);
            if (onChunkReady) onChunkReady(wavBlob);
          }
          chunks.length = 0;
          chunkStartTime = Date.now();
        }
      };

      recordingRef.current = true;
      setIsRecording(true);
      noiseFloorSamplesRef.current = [];
      
      if (onRecordingStateChange) onRecordingStateChange(true);
      
      // Start analysis loop
      analyzeAudio();

    } catch (err) {
      console.error('Microphone error:', err);
      throw err;
    }
  }, [fftSize, smoothingTimeConstant, onChunkReady, onRecordingStateChange, analyzeAudio]);

  const stop = useCallback(() => {
    recordingRef.current = false;
    
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    
    if (speechTimeoutRef.current) {
      clearTimeout(speechTimeoutRef.current);
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
    }
    
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }
    
    setIsRecording(false);
    setAudioLevel(0);
    setIsSpeaking(false);
    setPeakLevel(0);
    setFrequencyData(new Uint8Array(fftSize / 2));
    setWaveformData(new Uint8Array(fftSize));
    
    if (onRecordingStateChange) onRecordingStateChange(false);
  }, [fftSize, onRecordingStateChange]);

  return {
    // State
    isRecording,
    audioLevel,
    isSpeaking,
    frequencyData,
    waveformData,
    noiseFloor,
    peakLevel,
    devices,
    selectedDevice,
    // Actions
    start,
    stop,
    setSelectedDevice,
    refreshDevices
  };
}

// Helper functions
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
