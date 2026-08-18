// src/hooks/useNotificationStream.js
// Subscribes to the notification-service SSE endpoint (GET /api/notifications/stream)
// and invokes a callback for each incoming notification event.
// Automatically reconnects on error with exponential back-off.

import { useEffect, useRef } from 'react';
import keycloak from '../auth/keycloak';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';
const MAX_RETRY_DELAY_MS = 30_000;
const INITIAL_RETRY_MS = 2_000;

/**
 * @param {(notification: object) => void} onNotification  Called on each SSE event
 * @param {boolean} enabled  Set false to disable subscription (e.g. when unauthenticated)
 */
export function useNotificationStream(onNotification, enabled = true) {
  const esRef = useRef(null);
  const retryDelayRef = useRef(INITIAL_RETRY_MS);
  const retryTimerRef = useRef(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    if (!enabled) return;

    function connect() {
      if (!mountedRef.current) return;

      // Build URL with auth token as query param (EventSource doesn't support headers)
      const token = keycloak?.token || localStorage.getItem('medisphere_token');
      const url = token
        ? `${BASE_URL}/api/notifications/stream?token=${encodeURIComponent(token)}`
        : `${BASE_URL}/api/notifications/stream`;

      const es = new EventSource(url, { withCredentials: false });
      esRef.current = es;

      es.onopen = () => {
        retryDelayRef.current = INITIAL_RETRY_MS;
      };

      es.addEventListener('init', () => {
        retryDelayRef.current = INITIAL_RETRY_MS;
      });

      es.addEventListener('notification', (event) => {
        retryDelayRef.current = INITIAL_RETRY_MS; // reset back-off on success
        try {
          const data = JSON.parse(event.data);
          if (mountedRef.current && onNotification) {
            onNotification(data);
          }
        } catch (parseErr) {
          console.warn('[SSE] Failed to parse notification event:', parseErr);
        }
      });

      es.onerror = () => {
        es.close();
        esRef.current = null;
        if (!mountedRef.current) return;

        const delay = retryDelayRef.current;
        retryDelayRef.current = Math.min(delay * 2, MAX_RETRY_DELAY_MS);
        console.info(`[SSE] Connection lost. Reconnecting in ${delay}ms…`);
        retryTimerRef.current = setTimeout(connect, delay);
      };
    }

    connect();

    return () => {
      mountedRef.current = false;
      clearTimeout(retryTimerRef.current);
      if (esRef.current) {
        esRef.current.close();
        esRef.current = null;
      }
    };
  }, [enabled]); // only re-run if enabled changes; onNotification is stable ref
}

export default useNotificationStream;
