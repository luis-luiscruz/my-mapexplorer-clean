// React hooks for Highway Exits functionality
import { useState, useEffect, useCallback } from 'react';
import {
  highwayExitsApi,
  HighwayExit,
  GeolocationCoordinates,
  HighwayExitsResponse,
  CurrentHighwayResponse,
  formatDistance,
  formatExitInfo,
  getDirectionName,
} from '../services/api';

// Hook for geolocation
export const useGeolocation = () => {
  const [coordinates, setCoordinates] = useState<GeolocationCoordinates | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const getCurrentPosition = useCallback(() => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by this browser');
      return;
    }

    setLoading(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoordinates({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setLoading(false);
      },
      (error) => {
        setError(`Geolocation error: ${error.message}`);
        setLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000, // 1 minute
      }
    );
  }, []);

  useEffect(() => {
    getCurrentPosition();
  }, [getCurrentPosition]);

  return {
    coordinates,
    error,
    loading,
    refresh: getCurrentPosition,
  };
};

// Hook for nearby highway exits
export const useNearbyExits = (
  coordinates: GeolocationCoordinates | null,
  radiusKm: number = 5
) => {
  const [exits, setExits] = useState<HighwayExit[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchNearbyExits = useCallback(async () => {
    if (!coordinates) return;

    setLoading(true);
    setError(null);

    try {
      const result = await highwayExitsApi.getNearbyExits(coordinates, radiusKm);
      setExits(result.exits);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch nearby exits');
      setExits([]);
    } finally {
      setLoading(false);
    }
  }, [coordinates, radiusKm]);

  useEffect(() => {
    fetchNearbyExits();
  }, [fetchNearbyExits]);

  return {
    exits,
    loading,
    error,
    refresh: fetchNearbyExits,
  };
};

// Hook for current highway detection
export const useCurrentHighway = (coordinates: GeolocationCoordinates | null) => {
  const [highway, setHighway] = useState<string | null>(null);
  const [distance, setDistance] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const detectCurrentHighway = useCallback(async () => {
    if (!coordinates) return;

    setLoading(true);
    setError(null);

    try {
      const result = await highwayExitsApi.getCurrentHighway(coordinates);
      setHighway(result.highway);
      setDistance(result.min_distance_km);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to detect current highway');
      setHighway(null);
      setDistance(null);
    } finally {
      setLoading(false);
    }
  }, [coordinates]);

  useEffect(() => {
    detectCurrentHighway();
  }, [detectCurrentHighway]);

  return {
    highway,
    distance,
    loading,
    error,
    refresh: detectCurrentHighway,
  };
};

// Hook for next highway exit
export const useNextExit = (
  coordinates: GeolocationCoordinates | null,
  highway: string | null,
  direction?: string,
  heading?: number
) => {
  const [nextExit, setNextExit] = useState<HighwayExit | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchNextExit = useCallback(async () => {
    if (!coordinates || !highway) return;

    setLoading(true);
    setError(null);

    try {
      const result = await highwayExitsApi.getNextExit(coordinates, highway, direction, heading);
      setNextExit(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch next exit');
      setNextExit(null);
    } finally {
      setLoading(false);
    }
  }, [coordinates, highway, direction, heading]);

  useEffect(() => {
    fetchNextExit();
  }, [fetchNextExit]);

  return {
    nextExit,
    loading,
    error,
    refresh: fetchNextExit,
  };
};

// Complete highway exit detection hook
export const useHighwayExitDetection = (
  autoRefresh: boolean = true,
  refreshInterval: number = 30000 // 30 seconds
) => {
  const { coordinates, error: geoError, loading: geoLoading, refresh: refreshGeo } = useGeolocation();
  const [detectionResult, setDetectionResult] = useState<{
    currentHighway: string;
    nextExit: HighwayExit | null;
    distanceToHighway: number;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const performDetection = useCallback(async () => {
    if (!coordinates) return;

    setLoading(true);
    setError(null);

    try {
      const result = await highwayExitsApi.detectNextHighwayExit(coordinates);
      setDetectionResult(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to detect highway exit');
      setDetectionResult(null);
    } finally {
      setLoading(false);
    }
  }, [coordinates]);

  useEffect(() => {
    performDetection();
  }, [performDetection]);

  // Auto-refresh functionality
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      refreshGeo();
      performDetection();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, refreshGeo, performDetection]);

  return {
    coordinates,
    currentHighway: detectionResult?.currentHighway || null,
    nextExit: detectionResult?.nextExit || null,
    distanceToHighway: detectionResult?.distanceToHighway || null,
    loading: geoLoading || loading,
    error: geoError || error,
    refresh: () => {
      refreshGeo();
      performDetection();
    },
  };
};

// Setup functionality removed as requested

// Utility hooks
export const useFormattedDistance = (distanceKm: number | null) => {
  return distanceKm !== null ? formatDistance(distanceKm) : null;
};

export const useFormattedExitInfo = (exit: HighwayExit | null) => {
  return exit ? formatExitInfo(exit) : null;
};

export const useDirectionName = (direction?: string) => {
  return getDirectionName(direction);
};
