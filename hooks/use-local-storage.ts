"use client";

import { useState, useEffect, useCallback } from "react";

const CUSTOM_STORAGE_EVENT = "app-local-storage-change";

function readValue<T>(key: string, initialValue: T): T {
  if (typeof window === "undefined") return initialValue;
  try {
    const raw = window.localStorage.getItem(key);
    return raw !== null ? (JSON.parse(raw) as T) : initialValue;
  } catch {
    return initialValue;
  }
}

export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((prev: T) => T)) => void] {
  const [storedValue, setStoredValue] = useState<T>(() =>
    readValue(key, initialValue)
  );

  const setValue = useCallback(
    (value: T | ((prev: T) => T)) => {
      setStoredValue((prev) => {
        const next = value instanceof Function ? value(prev) : value;
        try {
          window.localStorage.setItem(key, JSON.stringify(next));
          window.dispatchEvent(
            new CustomEvent(CUSTOM_STORAGE_EVENT, { detail: { key } })
          );
        } catch {
          // quota exceeded or unavailable — state still updates in-memory
        }
        return next;
      });
    },
    [key]
  );

  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === key) {
        setStoredValue(readValue(key, initialValue));
      }
    };

    const handleCustom = (e: Event) => {
      const detail = (e as CustomEvent<{ key: string }>).detail;
      if (detail.key === key) {
        setStoredValue(readValue(key, initialValue));
      }
    };

    window.addEventListener("storage", handleStorage);
    window.addEventListener(CUSTOM_STORAGE_EVENT, handleCustom);
    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener(CUSTOM_STORAGE_EVENT, handleCustom);
    };
  }, [key, initialValue]);

  return [storedValue, setValue];
}
