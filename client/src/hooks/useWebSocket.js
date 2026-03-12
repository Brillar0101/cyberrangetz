import { useEffect, useRef, useCallback, useState } from 'react';

export function useWebSocket(sessionId, token) {
  const wsRef = useRef(null);
  const [connected, setConnected] = useState(false);

  const connect = useCallback(() => {
    if (!sessionId || !token) return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    const url = `${protocol}//${host}/ws?sessionId=${sessionId}`;

    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => {
      // Send auth token in first message instead of URL query string
      ws.send(JSON.stringify({ type: 'auth', token }));
    };

    ws.onmessage = (event) => {
      // Handle auth confirmation
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'auth' && data.success) {
          setConnected(true);
          return;
        }
        if (data.error) {
          console.error('WebSocket auth error:', data.error);
          setConnected(false);
          return;
        }
      } catch (e) {
        // Not JSON — normal terminal data, handled by caller
      }
    };

    ws.onclose = () => setConnected(false);
    ws.onerror = () => setConnected(false);

    return ws;
  }, [sessionId, token]);

  useEffect(() => {
    const ws = connect();
    return () => {
      if (ws && ws.readyState <= 1) {
        ws.close();
      }
    };
  }, [connect]);

  const send = useCallback((data) => {
    const ws = wsRef.current;
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(data);
    }
  }, []);

  return { ws: wsRef, connected, send };
}
