"use client";

import { useEffect, useState } from "react";

interface RealtimeData {
  type: string;
  [key: string]: unknown;
}

export function useRealtime(url: string) {
  const [data, setData] = useState<RealtimeData | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    let eventSource: EventSource | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout>;

    function connect() {
      eventSource = new EventSource(url);

      eventSource.onopen = () => setConnected(true);

      eventSource.onmessage = (e) => {
        try {
          setData(JSON.parse(e.data));
        } catch { }
      };

      eventSource.onerror = () => {
        setConnected(false);
        eventSource?.close();
        reconnectTimer = setTimeout(connect, 3000);
      };
    }

    connect();

    return () => {
      eventSource?.close();
      clearTimeout(reconnectTimer);
    };
  }, [url]);

  return { data, connected };
}
