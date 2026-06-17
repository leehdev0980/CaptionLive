import { useCallback, useEffect, useRef, useState } from 'react';
import * as signalR from '@microsoft/signalr';

function getApiBase() {
  const envBase = import.meta?.env?.VITE_API_BASE;
  if (envBase) return envBase;

  // Most common local dev ports/profile variants
  const candidates = ['http://localhost:5260', 'http://localhost:12761'];
  for (const base of candidates) {
    try {
      const u = new URL(base);
      if (u.hostname && u.port) return base;
    } catch {
      // ignore
    }
  }

  // Fallback: same-origin
  return window.location.origin;
}

export function useCaptionHub({ onReceiveCaption, enabled = true }) {
  const [isConnected, setIsConnected] = useState(false);
  const connectionIdRef = useRef('');

  const onReceiveCaptionRef = useRef(onReceiveCaption);
  useEffect(() => {
    onReceiveCaptionRef.current = onReceiveCaption;
  }, [onReceiveCaption]);

  useEffect(() => {
    if (!enabled) return;

    const connection = new signalR.HubConnectionBuilder()
      .withUrl(`${getApiBase()}/captionHub`)
      .withAutomaticReconnect()
      .build();

    connection.on('ReceiveCaption', (english, swahili, metadata = {}) => {
      onReceiveCaptionRef.current?.({ english, swahili, metadata });
    });

    connection.onclose(() => setIsConnected(false));
    connection.onreconnecting(() => setIsConnected(false));
    connection.onreconnected(() => {
      connectionIdRef.current = connection.connectionId;
      setIsConnected(true);
    });

    connection.start()
      .then(() => {
        connectionIdRef.current = connection.connectionId;
        setIsConnected(true);
      })
      .catch(() => setIsConnected(false));

    return () => {
      connection.stop();
    };
  }, [enabled]);

  const getConnectionId = useCallback(() => connectionIdRef.current, []);

  return {
    isConnected,
    getConnectionId,
  };
}

