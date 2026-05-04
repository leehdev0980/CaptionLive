import { useState, useEffect, useRef, useCallback } from 'react';
import * as signalR from '@microsoft/signalr';
import AudioRecorder from './components/AudioRecorder';

function App() {
  const [captions, setCaptions] = useState([]);
  const connectionRef = useRef(null);

  // Set up SignalR connection for receiving captions
  useEffect(() => {
    const connection = new signalR.HubConnectionBuilder()
      .withUrl("http://localhost:5260/captionHub")   // adjust port if needed
      .withAutomaticReconnect()
      .build();
    connectionRef.current = connection;

    connection.on('ReceiveCaption', (englishText) => {
      console.log("Caption received:", englishText);
      setCaptions(prev => [...prev, {
        text: englishText,
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
    formData.append('audio', audioBlob, `chunk_${chunkId}.webm`);
    try {
      await fetch('http://localhost:5260/api/audio/upload', {
        method: 'POST',
        body: formData
      });
    } catch (err) {
      console.error(`Error sending chunk ${chunkId}:`, err);
    }
  }, []);

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial', maxWidth: '900px', margin: '0 auto' }}>
      <h1>🎙️ Real-Time Captioning (English)</h1>
      <AudioRecorder onChunkReady={handleChunkReady} />

      {/* Live caption display */}
      <div style={{
        backgroundColor: '#2c3e50',
        color: 'white',
        padding: '20px',
        borderRadius: '8px',
        minHeight: '80px',
        fontSize: '24px',
        fontWeight: 'bold',
        margin: '20px 0'
      }}>
        {captions.length > 0
          ? captions[captions.length - 1].text
          : "Speak to see live caption..."}
      </div>

      {/* Caption history */}
      <h3>Caption History</h3>
      <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
        {captions.slice().reverse().map((c, i) => (
          <div key={i} style={{ padding: '8px', borderBottom: '1px solid #eee' }}>
            <span>{c.text}</span>
            <span style={{ color: '#999', fontSize: '12px', marginLeft: '10px' }}>{c.timestamp}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;