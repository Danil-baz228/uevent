import { useEffect, useRef, useState } from 'react';

type LeafletMap = {
  setView: (coords: [number, number], zoom: number) => void;
  on: (event: string, handler: (event: { latlng: { lat: number; lng: number } }) => void) => void;
  off: (event: string) => void;
  remove: () => void;
};

type LeafletMarker = {
  setLatLng: (coords: [number, number]) => void;
  addTo: (map: LeafletMap) => LeafletMarker;
};

type LeafletApi = {
  map: (element: HTMLElement) => LeafletMap;
  tileLayer: (url: string, options: Record<string, unknown>) => { addTo: (map: LeafletMap) => void };
  marker: (coords: [number, number]) => LeafletMarker;
};

declare global {
  interface Window {
    L?: LeafletApi;
  }
}

let leafletLoader: Promise<LeafletApi> | null = null;

function ensureLeaflet() {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('Leaflet is only available in the browser.'));
  }

  if (window.L) {
    return Promise.resolve(window.L);
  }

  if (leafletLoader) {
    return leafletLoader;
  }

  leafletLoader = new Promise((resolve, reject) => {
    const existingStylesheet = document.querySelector('link[data-leaflet="true"]');

    if (!existingStylesheet) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      link.dataset.leaflet = 'true';
      document.head.appendChild(link);
    }

    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.async = true;
    script.onload = () => {
      if (window.L) {
        resolve(window.L);
      } else {
        reject(new Error('Leaflet failed to initialize.'));
      }
    };
    script.onerror = () => reject(new Error('Leaflet failed to load.'));
    document.body.appendChild(script);
  });

  return leafletLoader;
}

function getMapMessage(language: string, key: 'resolvePoint' | 'resolveAddress' | 'loadMap' | 'selectedAddress') {
  if (language === 'uk') {
    switch (key) {
      case 'resolvePoint':
        return 'Не вдалося визначити вибрану точку.';
      case 'resolveAddress':
        return 'Не вдалося визначити адресу.';
      case 'loadMap':
        return 'Не вдалося завантажити мапу.';
      case 'selectedAddress':
        return 'Обрана адреса';
    }
  }

  switch (key) {
    case 'resolvePoint':
      return 'Failed to resolve the selected point.';
    case 'resolveAddress':
      return 'Failed to resolve address.';
    case 'loadMap':
      return 'Failed to load map.';
    case 'selectedAddress':
      return 'Selected address';
  }
}

export type MapPickerSelection = {
  address: string;
  city: string;
};

async function reverseGeocode(lat: number, lng: number, language: string): Promise<MapPickerSelection> {
  const response = await fetch(
    `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&accept-language=${language}`,
  );

  if (!response.ok) {
    throw new Error(getMapMessage(language, 'resolvePoint'));
  }

  const payload = (await response.json()) as {
    display_name?: string;
    address?: {
      city?: string;
      town?: string;
      village?: string;
      hamlet?: string;
      municipality?: string;
      county?: string;
      state?: string;
    };
  };

  return {
    address: payload.display_name ?? `${lat.toFixed(5)}, ${lng.toFixed(5)}`,
    city:
      payload.address?.city ??
      payload.address?.town ??
      payload.address?.village ??
      payload.address?.hamlet ??
      payload.address?.municipality ??
      payload.address?.county ??
      payload.address?.state ??
      '',
  };
}

type MapPickerModalProps = {
  open: boolean;
  title: string;
  confirmLabel: string;
  cancelLabel: string;
  hint: string;
  initialQuery?: string;
  language: string;
  onClose: () => void;
  onSelect: (value: MapPickerSelection) => void;
};

export function MapPickerModal({
  open,
  title,
  confirmLabel,
  cancelLabel,
  hint,
  initialQuery,
  language,
  onClose,
  onSelect,
}: MapPickerModalProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const markerRef = useRef<LeafletMarker | null>(null);
  const selectionRef = useRef<MapPickerSelection | null>(null);
  const [selectedAddress, setSelectedAddress] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!open || !containerRef.current) {
      return;
    }

    let active = true;

    async function mountMap() {
      try {
        setStatus('loading');
        setMessage('');
        const L = await ensureLeaflet();

        if (!active || !containerRef.current) {
          return;
        }

        const map = L.map(containerRef.current);
        mapRef.current = map;
        map.setView([50.4501, 30.5234], 13);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; OpenStreetMap contributors',
        }).addTo(map);

        if (initialQuery?.trim()) {
          setSelectedAddress(initialQuery.trim());
          selectionRef.current = { address: initialQuery.trim(), city: '' };
        }

        map.on('click', async (event) => {
          const { lat, lng } = event.latlng;
          setStatus('loading');
          setMessage('');

          if (!markerRef.current && window.L) {
            markerRef.current = window.L.marker([lat, lng]).addTo(map);
          } else {
            markerRef.current?.setLatLng([lat, lng]);
          }

          try {
            const selection = await reverseGeocode(lat, lng, language);

            if (!active) {
              return;
            }

            setSelectedAddress(selection.address);
            selectionRef.current = selection;
            setStatus('idle');
          } catch (error) {
            if (!active) {
              return;
            }

            setStatus('error');
            setMessage(
              error instanceof Error ? error.message : getMapMessage(language, 'resolveAddress'),
            );
          }
        });

        setStatus('idle');
      } catch (error) {
        if (!active) {
          return;
        }

        setStatus('error');
        setMessage(error instanceof Error ? error.message : getMapMessage(language, 'loadMap'));
      }
    }

    void mountMap();

    return () => {
      active = false;
      mapRef.current?.off('click');
      mapRef.current?.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
  }, [initialQuery, language, open]);

  if (!open) {
    return null;
  }

  return (
    <div className="map-picker-backdrop" onClick={onClose}>
      <div
        className="map-picker-modal"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className="map-picker-head">
          <strong>{title}</strong>
          <button type="button" className="secondary-button" onClick={onClose}>
            {cancelLabel}
          </button>
        </div>

        <p className="muted">{hint}</p>
        <div ref={containerRef} className="map-picker-canvas" />

        <label className="field">
          <span>{getMapMessage(language, 'selectedAddress')}</span>
          <input value={selectedAddress} readOnly />
        </label>

        {message ? <p className={`notice ${status === 'error' ? 'error' : ''}`}>{message}</p> : null}

        <div className="form-actions">
          <button
            type="button"
            className="primary-button"
            disabled={!selectedAddress || status === 'loading'}
            onClick={() =>
              onSelect(
                selectionRef.current ?? {
                  address: selectedAddress,
                  city: '',
                },
              )
            }
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
