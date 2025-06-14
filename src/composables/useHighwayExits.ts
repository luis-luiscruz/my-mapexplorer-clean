// Vue 3 composables for Highway Exits functionality
import { ref, computed, watch, onUnmounted, type Ref } from 'vue';
import {
  highwayExitsApi,
  HighwayExit,
  GeolocationCoordinates,
  formatDistance,
  formatExitInfo,
  getDirectionName,
} from '../services/api';

// Composable for geolocation
export function useGeolocation() {
  const coordinates = ref<GeolocationCoordinates | null>(null);
  const error = ref<string | null>(null);
  const loading = ref(false);

  const getCurrentPosition = () => {
    if (!navigator.geolocation) {
      error.value = 'Geolocation is not supported by this browser';
      return Promise.reject(new Error('Geolocation not supported'));
    }

    loading.value = true;
    error.value = null;

    return new Promise<GeolocationCoordinates>((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          coordinates.value = coords;
          loading.value = false;
          resolve(coords);
        },
        (err) => {
          const errorMsg = `Geolocation error: ${err.message}`;
          error.value = errorMsg;
          loading.value = false;
          reject(new Error(errorMsg));
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000, // 1 minute
        }
      );
    });
  };

  return {
    coordinates,
    error,
    loading,
    getCurrentPosition,
  };
}

// Composable for nearby highway exits
export function useNearbyExits(
  coordinates: Ref<GeolocationCoordinates | null>,
  radiusKm: Ref<number> = ref(5)
) {
  const exits = ref<HighwayExit[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  const fetchNearbyExits = async () => {
    if (!coordinates.value) return;

    loading.value = true;
    error.value = null;

    try {
      const result = await highwayExitsApi.getNearbyExits(coordinates.value, radiusKm.value);
      exits.value = result.exits;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch nearby exits';
      exits.value = [];
    } finally {
      loading.value = false;
    }
  };

  // Watch for coordinate changes
  watch([coordinates, radiusKm], fetchNearbyExits, { immediate: true });

  return {
    exits,
    loading,
    error,
    refresh: fetchNearbyExits,
  };
}

// Composable for current highway detection
export function useCurrentHighway(coordinates: Ref<GeolocationCoordinates | null>) {
  const highway = ref<string | null>(null);
  const distance = ref<number | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);

  const detectCurrentHighway = async () => {
    if (!coordinates.value) return;

    loading.value = true;
    error.value = null;

    try {
      const result = await highwayExitsApi.getCurrentHighway(coordinates.value);
      highway.value = result.highway;
      distance.value = result.min_distance_km;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to detect current highway';
      highway.value = null;
      distance.value = null;
    } finally {
      loading.value = false;
    }
  };

  // Watch for coordinate changes
  watch(coordinates, detectCurrentHighway, { immediate: true });

  return {
    highway,
    distance,
    loading,
    error,
    refresh: detectCurrentHighway,
  };
}

// Composable for next highway exit
export function useNextExit(
  coordinates: Ref<GeolocationCoordinates | null>,
  highway: Ref<string | null>,
  direction?: Ref<string | undefined>,
  heading?: Ref<number | undefined>
) {
  const nextExit = ref<HighwayExit | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);

  const fetchNextExit = async () => {
    if (!coordinates.value || !highway.value) return;

    loading.value = true;
    error.value = null;

    try {
      const result = await highwayExitsApi.getNextExit(
        coordinates.value,
        highway.value,
        direction?.value,
        heading?.value
      );
      nextExit.value = result;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch next exit';
      nextExit.value = null;
    } finally {
      loading.value = false;
    }
  };

  // Watch for changes in dependencies
  watch([coordinates, highway, direction, heading], fetchNextExit, { immediate: true });

  return {
    nextExit,
    loading,
    error,
    refresh: fetchNextExit,
  };
}

// Complete highway exit detection composable
export function useHighwayExitDetection(
  autoRefresh: Ref<boolean> = ref(true),
  refreshInterval: Ref<number> = ref(30000) // 30 seconds
) {
  const { coordinates, error: geoError, loading: geoLoading, getCurrentPosition } = useGeolocation();
  
  const detectionResult = ref<{
    currentHighway: string;
    nextExit: HighwayExit | null;
    distanceToHighway: number;
  } | null>(null);
  
  const loading = ref(false);
  const error = ref<string | null>(null);
  let intervalId: number | null = null;

  const performDetection = async () => {
    if (!coordinates.value) return;

    loading.value = true;
    error.value = null;

    try {
      const result = await highwayExitsApi.detectNextHighwayExit(coordinates.value);
      detectionResult.value = result;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to detect highway exit';
      detectionResult.value = null;
    } finally {
      loading.value = false;
    }
  };

  const refresh = async () => {
    await getCurrentPosition();
    await performDetection();
  };

  const stopDetection = () => {
    if (intervalId) {
      clearInterval(intervalId);
      intervalId = null;
    }
  };

  const startDetection = () => {
    // Clear any existing interval
    stopDetection();
    
    // Start immediate detection
    refresh();
    
    // Set up interval if auto-refresh is enabled
    if (autoRefresh.value) {
      intervalId = window.setInterval(refresh, refreshInterval.value);
    }
  };

  // Watch for coordinate changes (only perform detection if auto-refresh is on)
  watch(coordinates, () => {
    if (autoRefresh.value) {
      performDetection();
    }
  }, { immediate: false });

  // Auto-refresh functionality
  watch([autoRefresh, refreshInterval], () => {
    if (autoRefresh.value) {
      startDetection();
    } else {
      stopDetection();
    }
  }, { immediate: false });

  // Cleanup on unmount
  onUnmounted(() => {
    stopDetection();
  });

  return {
    coordinates,
    currentHighway: computed(() => detectionResult.value?.currentHighway || null),
    nextExit: computed(() => detectionResult.value?.nextExit || null),
    distanceToHighway: computed(() => detectionResult.value?.distanceToHighway || null),
    loading: computed(() => geoLoading.value || loading.value),
    error: computed(() => geoError.value || error.value),
    refresh,
    startDetection,
    stopDetection,
  };
}

// Setup functionality removed as requested

// Utility composables
export function useFormattedDistance(distanceKm: Ref<number | null>) {
  return computed(() => 
    distanceKm.value !== null ? formatDistance(distanceKm.value) : null
  );
}

export function useFormattedExitInfo(exit: Ref<HighwayExit | null>) {
  return computed(() => 
    exit.value ? formatExitInfo(exit.value) : null
  );
}

export function useDirectionName(direction: Ref<string | undefined>) {
  return computed(() => getDirectionName(direction.value));
}
