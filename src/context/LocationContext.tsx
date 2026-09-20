import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { PAKISTAN_CITIES } from '../utils/pakistanCities';

const STORAGE_KEY_CITY = 'ta30_location_city';
const STORAGE_KEY_POSTAL = 'ta30_location_postalCode';
const STORAGE_KEY_DETECTED_AT = 'ta30_location_detectedAt';

interface LocationState {
  city: string;
  postalCode?: string;
  isDetecting: boolean;
  error: string | null;
}

interface LocationContextValue extends LocationState {
  setLocation: (city: string, postalCode?: string) => void;
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
  const [postalCode, setPostalCode] = useState<string | undefined>(() => safeGet(STORAGE_KEY_POSTAL) || undefined);
  const [isDetecting, setIsDetecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const persist = useCallback((newCity: string, newPostal?: string, detectedAt?: string) => {
    setCity(newCity);
    setPostalCode(newPostal);
    safeSet(STORAGE_KEY_CITY, newCity);
    if (newPostal) {
      safeSet(STORAGE_KEY_POSTAL, newPostal);
    } else {
      safeRemove(STORAGE_KEY_POSTAL);
    }
    if (detectedAt) {
      safeSet(STORAGE_KEY_DETECTED_AT, detectedAt);
    }
  }, []);

  const detect = useCallback(async () => {
    setIsDetecting(true);
    setError(null);
    try {
      const apiKey = import.meta.env.VITE_BDC_API_KEY;
      if (!apiKey) {
        throw new Error('Missing VITE_BDC_API_KEY');
      }
      const res = await fetch(`https://api.bigdatacloud.net/data/ip-geolocation-client?key=${encodeURIComponent(apiKey)}`);
      if (!res.ok) throw new Error(`Location detection failed (${res.status}). Check your BDC_API_KEY and network, or choose a city manually.`);
      const data = await res.json();
      const detectedCity = data.city || '';
      const detectedPostal = data.postalCode || '';
      const matched = PAKISTAN_CITIES.find((c) => c.name.toLowerCase() === detectedCity.toLowerCase());
      const normalizedCity = matched ? matched.name : detectedCity;
      const normalizedPostal = matched?.postalCode || detectedPostal || undefined;
      const detectedAt = new Date().toISOString();
      persist(normalizedCity, normalizedPostal, detectedAt);
    } catch (err: any) {
      setError(err?.message || 'Unable to detect location');
    } finally {
      setIsDetecting(false);
    }
  }, [persist]);

  useEffect(() => {
    try {
      const storedDetectedAt = safeGet(STORAGE_KEY_DETECTED_AT);
      const shouldAutoDetect = !storedDetectedAt || (Date.now() - new Date(storedDetectedAt).getTime() > 24 * 60 * 60 * 1000);
      if (shouldAutoDetect && !city) {
        detect();
      }
    } catch {
      // storage unavailable
    }
  }, [city, detect]);

  const setLocation = useCallback((newCity: string, newPostal?: string) => {
    persist(newCity, newPostal, new Date().toISOString());
  }, [persist]);

  const clear = useCallback(() => {
    setCity('');
    setPostalCode(undefined);
    setError(null);
    safeRemove(STORAGE_KEY_CITY);
    safeRemove(STORAGE_KEY_POSTAL);
    safeRemove(STORAGE_KEY_DETECTED_AT);
  }, []);

  return (
    <LocationContext.Provider value={{ city, postalCode, isDetecting, error, setLocation, detect, clear }}>
      {children}
    </LocationContext.Provider>
  );
};

export const useDeliveryLocation = (): LocationContextValue => {
  const ctx = useContext(LocationContext);
  if (!ctx) throw new Error('useDeliveryLocation must be used within LocationProvider');
  return ctx;
};
