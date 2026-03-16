import { useEffect, useState } from 'react';

import { ApiEvent, fetchEvents } from '../lib/api';

type LoadStatus = 'loading' | 'success' | 'error';

export function useEvents() {
  const [events, setEvents] = useState<ApiEvent[]>([]);
  const [status, setStatus] = useState<LoadStatus>('loading');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadEvents() {
      setStatus('loading');
      setError(null);

      try {
        const payload = await fetchEvents();

        if (!active) {
          return;
        }

        setEvents(payload);
        setStatus('success');
      } catch (loadError) {
        if (!active) {
          return;
        }

        setError(
          loadError instanceof Error
            ? loadError.message
            : 'Failed to load events',
        );
        setStatus('error');
      }
    }

    void loadEvents();

    return () => {
      active = false;
    };
  }, []);

  return { events, status, error };
}
