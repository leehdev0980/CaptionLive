import { useState, useEffect, useRef, useCallback } from 'react';
import * as signalR from '@microsoft/signalr';
import AudioRecorder from './components/AudioRecorderPcm';

function App() {
  const [captions, setCaptions] = useState([]);
  const [translate, setTranslate] = useState(false);
  const connectionRef = useRef(null);
  const translateRef = useRef(false);

  // Keep translate ref in sync for use in fetch callback
  useEffect(() => { translateRef.current = translate; }, [translate]);

  // Set up SignalR connection for receiving captions
  useEffect(() => {
    const connection = new signalR.HubConnectionBuilder()
      .withUrl("http://localhost:5260/captionHub")
      .withAutomaticReconnect()
      .build();
    connectionRef.current = connection;

    connection.on('ReceiveCaption', (english, swahili) => {
      setCaptions(prev => [...prev, {
        english,
        swahili: swahili || "",
        timestamp: new Date().toLocaleTimeString()
      }]);
    });

    connection.onclose(() => console.log("SignalR disconnected"));
    connection.start().catch(err => console.error("SignalR error:", err));

    return () => connection.stop();
  }, []);

  // Send each audio chunk from AudioRecorder to the .NET backend
  const handleChunkReady = useCallback(async (audioBlob, chunkId) => {
  const formData = new FormData();
  formData.append('audio', audioBlob, `chunk_${chunkId}.wav`);
  const url = `http://localhost:5260/api/audio/upload?translate=${translateRef.current}`;
    try {
      await fetch(url, { method: 'POST', body: formData });
    } catch (err) {
      console.error('Upload error:', err);
    }
  }, []);

  const latest = captions.length > 0 ? captions[captions.length - 1] : null;

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial', maxWidth: '900px', margin: '0 auto' }}>
      <h1>🎙️ Real-Time Captioning</h1>
      <p>English – Kiswahili Translation</p>

      <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '20px' }}>
        <AudioRecorder onChunkReady={handleChunkReady} />
        <button
          onClick={() => setTranslate(t => !t)}
          style={{
            padding: '12px 24px',
            fontSize: '16px',
            backgroundColor: translate ? '#3498db' : '#95a5a6',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          🌍 Translate: {translate ? 'ON' : 'OFF'}
        </button>
      </div>

      {/* Live caption */}
      <div style={{
        padding: '25px',
        backgroundColor: '#2c3e50',
        color: 'white',
        borderRadius: '10px',
        minHeight: '100px',
        fontSize: '28px',
        fontWeight: 'bold',
        marginBottom: '20px'
      }}>
        {latest ? (
          <>
            <div>{latest.english || '...'}</div>
            {latest.swahili && (
              <div style={{ fontSize: '24px', color: '#3498db', fontStyle: 'italic', marginTop: '8px' }}>
                {latest.swahili}
              </div>
            )}
            <div style={{ fontSize: '12px', color: '#95a5a6', marginTop: '12px' }}>
              {latest.timestamp}
            </div>
          </>
        ) : (
          <div style={{ fontSize: '22px', color: '#7f8c8d', textAlign: 'center', padding: '30px' }}>
            Start speaking to see live captions...
          </div>
        )}
      </div>

      {/* Caption history */}
      <h3>📝 Caption History</h3>
      <div style={{ maxHeight: '350px', overflowY: 'auto' }}>
        {captions.slice().reverse().map((c, i) => (
          <div key={i} style={{
            padding: '12px',
            borderBottom: '1px solid #eee'
          }}>
            <div><strong>EN:</strong> {c.english}</div>
            {c.swahili && (
              <div style={{ color: '#2980b9' }}><strong>SW:</strong> {c.swahili}</div>
            )}
            <div style={{ fontSize: '11px', color: '#bdc3c7', marginTop: '4px' }}>{c.timestamp}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;