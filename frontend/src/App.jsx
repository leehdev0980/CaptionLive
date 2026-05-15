import { useState, useEffect, useRef, useCallback } from 'react';
import * as signalR from '@microsoft/signalr';
import AudioRecorderPcm from './components/AudioRecorderPcm';
import StatusIndicator from './components/StatusIndicator';
import { useHistory } from './hooks/useHistory';

function App() {
  // State
  const [latestCaption, setLatestCaption] = useState(null);
  const [status, setStatus] = useState('idle');
  const [translate, setTranslate] = useState(false);
  const [latency, setLatency] = useState(null);
  const [errorCount, setErrorCount] = useState(0);

  // Refs
  const connectionRef = useRef(null);
  const translateRef = useRef(false);
  const sendTimeRef = useRef(null);

  // Custom history hook
  const { history, addEntry, clearHistory } = useHistory();

  // Sync translate ref
  useEffect(() => { translateRef.current = translate; }, [translate]);

  // SignalR connection
  useEffect(() => {
    const connection = new signalR.HubConnectionBuilder()
      .withUrl("http://localhost:5260/captionHub")
      .withAutomaticReconnect()
      .build();
    connectionRef.current = connection;

    connection.on('ReceiveCaption', (english, swahili) => {
      const entry = {
        english: english || "",
        swahili: swahili || "",
        timestamp: new Date().toLocaleTimeString()
      };

      setLatestCaption(entry);
      addEntry(entry);
      setStatus('idle');

      // Calculate latency
      if (sendTimeRef.current) {
        const ms = Math.round(performance.now() - sendTimeRef.current);
        setLatency(ms);
      }
    });

    connection.onclose(() => console.log("SignalR disconnected"));
    connection.start()
      .then(() => console.log("SignalR connected"))
      .catch(err => console.error("SignalR error:", err));

    return () => connection.stop();
  }, [addEntry]);

  // Handle audio chunks
  const handleChunkReady = useCallback(async (wavBlob, chunkId) => {
    setStatus('processing');
    sendTimeRef.current = performance.now();

    const formData = new FormData();
    formData.append('audio', wavBlob, `chunk_${chunkId}.wav`);
    const url = `http://localhost:5260/api/audio/upload?translate=${translateRef.current}`;

    try {
      const response = await fetch(url, { method: 'POST', body: formData });
      if (!response.ok) {
        setErrorCount(prev => prev + 1);
        setStatus('error');
        setTimeout(() => setStatus('listening'), 2000);
      }
    } catch (err) {
      console.error('Upload error:', err);
      setErrorCount(prev => prev + 1);
      setStatus('error');
      setTimeout(() => setStatus('listening'), 3000);
    }
  }, []);

  // Recording state change handler
  const handleRecordingStateChange = useCallback((isRecording) => {
    setStatus(isRecording ? 'listening' : 'idle');
    if (!isRecording) {
      setLatency(null);
      setErrorCount(0);
    }
  }, []);

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#ecf0f1',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif'
    }}>
      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '20px' }}>
        
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <h1 style={{ fontSize: '32px', margin: '0 0 5px 0', color: '#2c3e50' }}>
            🎙️ Real-Time Captioning
          </h1>
          <p style={{ color: '#7f8c8d', margin: '0', fontSize: '14px' }}>
            English Speech-to-Text with Kiswahili Translation
          </p>
        </div>

        {/* Controls Bar */}
        <div style={{
          display: 'flex',
          gap: '12px',
          alignItems: 'center',
          flexWrap: 'wrap',
          padding: '15px',
          backgroundColor: 'white',
          borderRadius: '10px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
          marginBottom: '20px'
        }}>
          <AudioRecorderPcm 
            onChunkReady={handleChunkReady} 
            onRecordingStateChange={handleRecordingStateChange}
          />
          
          <button
            onClick={() => setTranslate(t => !t)}
            style={{
              padding: '12px 20px',
              fontSize: '14px',
              fontWeight: '600',
              backgroundColor: translate ? '#2980b9' : '#95a5a6',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              transition: 'background-color 0.2s'
            }}
          >
            🌍 Translate: {translate ? 'ON' : 'OFF'}
          </button>

          <StatusIndicator status={status} />

          {latency !== null && (
            <span style={{
              fontSize: '13px',
              color: '#7f8c8d',
              fontWeight: '500',
              backgroundColor: '#f0f0f0',
              padding: '6px 12px',
              borderRadius: '15px'
            }}>
              ⚡ Latency: {(latency / 1000).toFixed(1)}s
            </span>
          )}

          {errorCount > 0 && (
            <span style={{
              fontSize: '13px',
              color: '#e74c3c',
              fontWeight: '500'
            }}>
              ⚠️ Errors: {errorCount}
            </span>
          )}
        </div>

        {/* Live Caption Display */}
        <div style={{
          padding: '25px',
          backgroundColor: '#2c3e50',
          color: 'white',
          borderRadius: '10px',
          minHeight: '120px',
          marginBottom: '20px',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
          transition: 'all 0.3s ease'
        }}>
          {latestCaption ? (
            <>
              <div style={{
                fontSize: '30px',
                fontWeight: '600',
                marginBottom: '8px',
                lineHeight: '1.3'
              }}>
                {latestCaption.english || '\u00A0'}
              </div>
              {latestCaption.swahili && (
                <div style={{
                  fontSize: '24px',
                  color: '#3498db',
                  fontStyle: 'italic',
                  lineHeight: '1.3'
                }}>
                  {latestCaption.swahili}
                </div>
              )}
              <div style={{
                fontSize: '12px',
                color: '#95a5a6',
                marginTop: '12px'
              }}>
                {latestCaption.timestamp}
              </div>
            </>
          ) : (
            <div style={{
              fontSize: '22px',
              color: '#7f8c8d',
              textAlign: 'center',
              padding: '30px 0'
            }}>
              Click "Start Recording" and speak to see live captions...
            </div>
          )}
        </div>

        {/* Caption History */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '10px',
          padding: '20px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '15px'
          }}>
            <h3 style={{ margin: 0, color: '#2c3e50' }}>
              📝 Caption History ({history.length})
            </h3>
            {history.length > 0 && (
              <button
                onClick={clearHistory}
                style={{
                  padding: '6px 14px',
                  fontSize: '13px',
                  backgroundColor: '#e74c3c',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                🗑 Clear History
              </button>
            )}
          </div>

          <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
            {history.length === 0 ? (
              <p style={{
                color: '#bdc3c7',
                textAlign: 'center',
                padding: '30px',
                fontStyle: 'italic'
              }}>
                No captions yet. Start recording to build history.
              </p>
            ) : (
              history.map((entry, i) => (
                <div key={i} style={{
                  padding: '12px',
                  borderBottom: i !== history.length - 1 ? '1px solid #ecf0f1' : 'none',
                  backgroundColor: i === 0 ? '#f8f9fa' : 'transparent'
                }}>
                  <div style={{ fontWeight: '500' }}>
                    <strong style={{ color: '#2c3e50' }}>EN:</strong> {entry.english || '(silence)'}
                  </div>
                  {entry.swahili && (
                    <div style={{ color: '#2980b9', marginTop: '4px' }}>
                      <strong>SW:</strong> {entry.swahili}
                    </div>
                  )}
                  <div style={{
                    fontSize: '11px',
                    color: '#bdc3c7',
                    marginTop: '6px'
                  }}>
                    {entry.timestamp}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Footer Info */}
        <div style={{
          textAlign: 'center',
          marginTop: '20px',
          fontSize: '12px',
          color: '#bdc3c7'
        }}>
          Captions are stored locally in your browser • No data is sent to external servers
        </div>
      </div>
    </div>
  );
}

export default App;