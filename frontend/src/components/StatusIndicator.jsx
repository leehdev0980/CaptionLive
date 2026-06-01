export default function StatusIndicator({ status }) {
  const config = {
    idle:      { color: '#95a5a6', text: '⏸ Idle', icon: '⏸' },
    listening: { color: '#2ecc71', text: '🎤 Listening...', icon: '🎤' },
    processing:{ color: '#f39c12', text: '⚙️ Processing...', icon: '⚙️' },
    error:     { color: '#e74c3c', text: '❌ Error', icon: '❌' }
  };

  const current = config[status] || config.idle;

  return (
    <div style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '6px',
      padding: '8px 16px',
      backgroundColor: current.color,
      color: 'white',
      borderRadius: '20px',
      fontSize: '14px',
      fontWeight: '600',
      transition: 'background-color 0.3s ease'
    }}>
      <span style={{ fontSize: '16px' }}>{current.icon}</span>
      <span>{current.text}</span>
    </div>
  );
}