import { useEffect, useRef } from 'react';
import { Terminal as XTerm } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import '@xterm/xterm/css/xterm.css';

export default function Terminal({ sessionId, token, onConnected }) {
  const termRef = useRef(null);
  const xtermRef = useRef(null);
  const wsRef = useRef(null);

  useEffect(() => {
    if (!sessionId || !token || !termRef.current) return;

    const term = new XTerm({
      cursorBlink: true,
      fontSize: 14,
      fontFamily: '"Cascadia Code", "Fira Code", "Consolas", monospace',
      theme: {
        background: '#0a0e17',
        foreground: '#e2e8f0',
        cursor: '#00ff88',
        selectionBackground: '#1e293b',
        black: '#0a0e17',
        green: '#00ff88',
        brightGreen: '#00ff88',
        red: '#ff4444',
        brightRed: '#ff6666',
        blue: '#4488ff',
        brightBlue: '#66aaff',
        yellow: '#ffbb33',
        brightYellow: '#ffdd66',
        cyan: '#00ddff',
        brightCyan: '#66eeff',
      },
      allowProposedApi: true,
    });

    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    term.open(termRef.current);

    // Delay to ensure DOM layout is ready before fitting
    setTimeout(() => fitAddon.fit(), 100);
    setTimeout(() => fitAddon.fit(), 500);

    xtermRef.current = term;

    // WebSocket connection — token sent in first message, not URL
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    const url = `${protocol}//${host}/ws?sessionId=${sessionId}`;

    const ws = new WebSocket(url);
    wsRef.current = ws;
    let authed = false;

    ws.onopen = () => {
      // Send auth token in first message instead of URL query string
      ws.send(JSON.stringify({ type: 'auth', token }));
    };

    ws.onmessage = (event) => {
      // Handle auth confirmation
      if (!authed) {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'auth' && data.success) {
            authed = true;
            onConnected?.(true);
            ws.send(JSON.stringify({ type: 'resize', cols: term.cols, rows: term.rows }));
            return;
          }
          if (data.error) {
            term.write(`\r\n\x1b[31m[Auth error: ${data.error}]\x1b[0m\r\n`);
            onConnected?.(false);
            return;
          }
        } catch (e) {
          // Not JSON
        }
      }
      term.write(event.data);
    };

    ws.onclose = () => {
      onConnected?.(false);
      term.write('\r\n\x1b[31m[Session ended]\x1b[0m\r\n');
    };

    ws.onerror = () => {
      onConnected?.(false);
    };

    // Send terminal input to WebSocket
    term.onData((data) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(data);
      }
    });

    // Handle resize
    const resizeObserver = new ResizeObserver(() => {
      try {
        fitAddon.fit();
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: 'resize', cols: term.cols, rows: term.rows }));
        }
      } catch (e) {
        // Ignore resize errors
      }
    });
    resizeObserver.observe(termRef.current);

    return () => {
      resizeObserver.disconnect();
      ws.close();
      term.dispose();
    };
  }, [sessionId, token]);

  return (
    <div
      ref={termRef}
      className="w-full h-full"
      style={{ padding: '8px', backgroundColor: '#0a0e17', minHeight: 0, overflow: 'hidden' }}
    />
  );
}
