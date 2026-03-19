import { useEffect, useState } from 'react';

import { ApiEvent, EventListResponse, EventQueryParams, fetchEventsWithQuery } from '../lib/api';

type LoadStatus = 'loading' | 'success' | 'error';

export function useEvents(query: EventQueryParams) {
  const [events, setEvents] = useState<ApiEvent[]>([]);
  const [meta, setMeta] = useState<EventListResponse['meta'] | null>(null);
  const [status, setStatus] = useState<LoadStatus>('loading');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadEvents() {
      setStatus('loading');
      setError(null);

      try {
        const payload = await fetchEventsWithQuery(query);

        if (!active) {
          return;
        }

        setEvents(payload.items);
        setMeta(payload.meta);
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
  }, [query.category, query.limit, query.page, query.priceType, query.q]);

  return { events, meta, status, error };
}
