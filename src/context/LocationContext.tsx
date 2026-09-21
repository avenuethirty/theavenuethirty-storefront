import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { PAKISTAN_CITIES } from '../utils/pakistanCities';

const STORAGE_KEY_CITY = 'ta30_location_city';
const STORAGE_KEY_DETECTED_AT = 'ta30_location_detectedAt';

interface LocationState {
  city: string;
  isDetecting: boolean;
  error: string | null;
}

interface LocationContextValue extends LocationState {
  setLocation: (city: string) => void;
  detect: () => Promise<void>;
  clear: () => void;
}

const LocationContext = createContext<LocationContextValue | undefined>(undefined);

const safeGet = (key: string): string | null => {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
};

const safeSet = (key: string, value: string) => {
  try {
    localStorage.setItem(key, value);
  } catch {
    // storage unavailable
  }
};

const safeRemove = (key: string) => {
  try {
    localStorage.removeItem(key);
  } catch {
    // storage unavailable
  }
};

export const LocationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [city, setCity] = useState<string>(() => safeGet(STORAGE_KEY_CITY) || '');
  const [isDetecting, setIsDetecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const persist = useCallback((newCity: string, detectedAt?: string) => {
    setCity(newCity);
    safeSet(STORAGE_KEY_CITY, newCity);
    if (detectedAt) {
      safeSet(STORAGE_KEY_DETECTED_AT, detectedAt);
    }
  }, []);

  const detect = useCallback(async () => {
    setIsDetecting(true);
    setError(null);
    try {
      let usedFallback = false;

      if (typeof navigator !== 'undefined' && navigator.geolocation) {
        try {
          const position = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              enableHighAccuracy: true,
              timeout: 10000,
              maximumAge: 0,
            });
          });

          const { latitude, longitude } = position.coords;
          const geoRes = await fetch(`/api/location/reverse-geocode?latitude=${encodeURIComponent(String(latitude))}&longitude=${encodeURIComponent(String(longitude))}`);
          if (geoRes.ok) {
            const geoData = await geoRes.json();
            if (geoData.success && geoData.city) {
              const detectedCity = geoData.city || '';
              const matched = PAKISTAN_CITIES.find((c) => c.name.toLowerCase() === detectedCity.toLowerCase());
              const normalizedCity = matched ? matched.name : detectedCity;
              const detectedAt = new Date().toISOString();
              persist(normalizedCity, detectedAt);
              return;
            }
            if (!geoData.success && geoData.error) {
              setError(geoData.error);
              setIsDetecting(false);
              return;
            }
          }
        } catch (gpsErr: any) {
          const message = gpsErr?.message || '';
          if (message.includes('User denied') || message.includes('Permission denied') || message.includes('timeout')) {
            usedFallback = true;
          } else {
            throw gpsErr;
          }
        }
      } else {
        usedFallback = true;
      }

      if (usedFallback) {
        const res = await fetch('/api/location/detect');
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || `Location detection failed (${res.status}). Check your BDC_API_KEY and network, or choose a city manually.`);
        }
        const data = await res.json();
        if (!data.success) {
          throw new Error(data.error || 'Location detection failed');
        }
        const detectedCity = data.city || '';
        const matched = PAKISTAN_CITIES.find((c) => c.name.toLowerCase() === detectedCity.toLowerCase());
        const normalizedCity = matched ? matched.name : detectedCity;
        const detectedAt = new Date().toISOString();
        persist(normalizedCity, detectedAt);
      }
    } catch (err: any) {
      setError(err?.message || 'Unable to detect location');
    } finally {
      setIsDetecting(false);
    }
  }, [persist]);

  const setLocation = useCallback((newCity: string) => {
    persist(newCity, new Date().toISOString());
  }, [persist]);

  const clear = useCallback(() => {
    setCity('');
    setError(null);
    safeRemove(STORAGE_KEY_CITY);
    safeRemove(STORAGE_KEY_DETECTED_AT);
  }, []);

  return (
    <LocationContext.Provider value={{ city, isDetecting, error, setLocation, detect, clear }}>
      {children}
    </LocationContext.Provider>
  );
};

export const useDeliveryLocation = (): LocationContextValue => {
  const ctx = useContext(LocationContext);
  if (!ctx) throw new Error('useDeliveryLocation must be used within LocationProvider');
  return ctx;
};
