import { useState } from 'react';
import { usePcmRecorder } from './usePcmRecorder';

export default function AudioRecorderPcm({ onChunkReady, onRecordingStateChange }) {
  const [isRecording, setIsRecording] = useState(false);

  const { start, stop } = usePcmRecorder({
    onChunkReady: (wavBlob) => {
      onChunkReady(wavBlob);
    },
    onRecordingStateChange: (recording) => {
      setIsRecording(recording);
      if (onRecordingStateChange) onRecordingStateChange(recording);
    }
  });

  return (
    <div>
      <button
        onClick={isRecording ? stop : start}
        style={{
          padding: '12px 24px',
          fontSize: '16px',
          backgroundColor: isRecording ? '#e74c3c' : '#2ecc71',
          color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer'
        }}
      >
        {isRecording ? '⏹ Stop Recording' : '🎤 Start Recording'}
      </button>
      {isRecording && <span style={{ marginLeft: '10px' }}>Recording...</span>}
    </div>
  );
}