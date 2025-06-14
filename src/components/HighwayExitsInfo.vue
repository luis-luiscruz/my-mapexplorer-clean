<template>
  <div class="highway-exits-info">
    <!-- Highway Exit Detection Card -->    <div class="card bg-base-300 shadow-sm">
      <div class="card-body p-2">
        <div class="collapse collapse-arrow bg-base-300">
          <input type="checkbox" class="peer" v-model="panelOpen" />
          <div class="collapse-title text-sm font-semibold min-h-0 py-2 px-0">
            <div class="flex items-center justify-between w-full">
              <div class="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-1.447-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
                <span>Deteção de Saídas de Autoestrada</span>
                <div v-if="loading" class="loading loading-spinner loading-xs ml-2"></div>
              </div>              <div class="flex items-center gap-1">
                <div 
                  v-if="currentHighway" 
                  class="badge badge-primary badge-xs"
                >
                  {{ currentHighway }}
                </div>
              </div>
            </div>
          </div>
          <div class="collapse-content px-0 pb-0">            <div class="pt-1 space-y-3">              
              <!-- Highway Detection Controls -->
              <div class="grid grid-cols-2 gap-2">
                <div class="form-control">
                  <label class="label py-1">
                    <span class="label-text text-xs">Detecção de Autoestrada</span>
                  </label>
                  <div class="flex items-center space-x-2">
                    <button 
                      @click="startDetection"
                      :disabled="isDetecting || loading"
                      class="btn btn-success btn-xs"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h.01M19 10a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Iniciar
                    </button>
                    <button 
                      @click="stopDetection"
                      :disabled="!isDetecting"
                      class="btn btn-error btn-xs"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 9l6 6m0-6l-6 6" />
                      </svg>
                      Parar
                    </button>
                  </div>
                </div>
                
                <div class="form-control">
                  <label class="label py-1">
                    <span class="label-text text-xs">Estado</span>
                  </label>
                  <div class="flex items-center space-x-2">
                    <div class="flex items-center">
                      <div 
                        :class="{
                          'bg-success': isDetecting && !loading,
                          'bg-warning': loading,
                          'bg-base-300': !isDetecting && !loading
                        }"
                        class="w-2 h-2 rounded-full mr-2"
                      ></div>
                      <span class="text-xs text-base-content/70">
                        {{ getDetectionStatus() }}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Current Location Info -->
              <div v-if="coordinates" class="bg-base-200 rounded p-2">
                <div class="text-xs text-base-content/70 mb-1">📍 Localização Actual:</div>
                <div class="text-xs font-mono">
                  {{ coordinates.lat.toFixed(6) }}, {{ coordinates.lng.toFixed(6) }}
                </div>
              </div>

              <!-- Error Display -->
              <div v-if="error" class="alert alert-error py-2">
                <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span class="text-xs">{{ error }}</span>
              </div>

              <!-- Current Highway Info -->
              <div v-if="currentHighway" class="bg-primary/10 border border-primary/20 rounded p-2">
                <div class="flex items-center justify-between">
                  <div>
                    <div class="text-sm font-semibold text-primary">
                      🛣️ Autoestrada {{ currentHighway }}
                    </div>
                    <div v-if="distanceToHighway !== null" class="text-xs text-base-content/70">
                      Distância: {{ formatDistance(distanceToHighway) }}
                    </div>
                  </div>
                  <div class="badge badge-primary">
                    {{ currentHighway }}
                  </div>
                </div>
              </div>

              <!-- Next Exit Info -->
              <div v-if="nextExit" class="bg-success/10 border border-success/20 rounded p-2">
                <div class="flex items-center justify-between mb-2">
                  <div class="text-sm font-semibold text-success">
                    🚗 Próxima Saída
                  </div>
                  <div class="badge badge-success badge-sm">
                    Saída {{ nextExit.exit_number }}
                  </div>
                </div>
                
                <div class="space-y-1">
                  <div class="text-sm font-medium">{{ nextExit.exit_name }}</div>
                  
                  <div class="flex items-center gap-2 text-xs">
                    <span class="badge badge-outline badge-xs">{{ nextExit.highway }}</span>
                    <span v-if="nextExit.direction" class="badge badge-outline badge-xs">
                      {{ getDirectionName(nextExit.direction) }}
                    </span>
                    <span v-if="nextExit.km_marker" class="badge badge-outline badge-xs">
                      Km {{ nextExit.km_marker }}
                    </span>
                  </div>
                  
                  <div v-if="nextExit.distance_km" class="text-xs text-success font-semibold">
                    📏 {{ formatDistance(nextExit.distance_km) }}
                  </div>
                  
                  <!-- Navigation Link -->
                  <div class="pt-1">
                    <a 
                      :href="`https://maps.google.com/maps?q=${nextExit.latitude},${nextExit.longitude}`"
                      target="_blank"
                      class="btn btn-success btn-xs w-full"
                    >
                      🧭 Navegar para a Saída
                    </a>
                  </div>
                </div>
              </div>

              <!-- No Highway Detected -->
              <div v-else-if="!loading && coordinates && !currentHighway" 
                   class="bg-warning/10 border border-warning/20 rounded p-2 text-center">
                <div class="text-xs text-warning">
                  ⚠️ Nenhuma autoestrada detectada nas proximidades
                </div>
              </div>

              <!-- Loading State -->
              <div v-else-if="loading" 
                   class="bg-base-200 rounded p-2 text-center">
                <div class="flex items-center justify-center gap-2">
                  <span class="loading loading-spinner loading-sm"></span>
                  <span class="text-xs text-base-content/70">A detectar autoestrada...</span>
                </div>
              </div>

              <!-- Nearby Exits Section -->
              <div v-if="showNearbyExits" class="border-t border-base-content/20 pt-2">
                <div class="text-xs font-semibold mb-2 flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  </svg>
                  Saídas Próximas
                  <span v-if="nearbyExits.length > 0" class="badge badge-info badge-xs ml-1">
                    {{ nearbyExits.length }}
                  </span>
                </div>
                
                <div v-if="nearbyExits.length > 0" class="space-y-1 max-h-32 overflow-y-auto">
                  <div 
                    v-for="exit in nearbyExits.slice(0, 5)" 
                    :key="`${exit.highway}-${exit.exit_number}`"
                    class="bg-base-100 border border-base-300 rounded p-1.5 text-xs"
                  >
                    <div class="flex items-center justify-between">
                      <div>
                        <span class="font-medium">{{ exit.exit_name }}</span>
                        <div class="flex items-center gap-1 mt-0.5">
                          <span class="badge badge-outline badge-xs">{{ exit.highway }}</span>
                          <span class="badge badge-outline badge-xs">{{ exit.exit_number }}</span>
                        </div>
                      </div>
                      <div v-if="exit.distance_km" class="text-right">
                        <div class="font-semibold text-info">
                          {{ formatDistance(exit.distance_km) }}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div v-else class="text-xs text-base-content/50 text-center py-2">
                  Nenhuma saída próxima encontrada
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useHighwayExitDetection, useNearbyExits } from '../composables/useHighwayExits';
import { formatDistance, getDirectionName } from '../services/api';

// Props
const props = withDefaults(defineProps<{
  showNearbyExits?: boolean;
  defaultAutoRefresh?: boolean;
  defaultRefreshInterval?: number;
}>(), {
  showNearbyExits: true,
  defaultAutoRefresh: true,
  defaultRefreshInterval: 30000,
});

// Local state
const panelOpen = ref(true);
const autoRefresh = ref(false); // Start with auto-refresh disabled for manual control
const refreshIntervalSeconds = ref(props.defaultRefreshInterval / 1000);
const isDetecting = ref(false); // Track manual detection state

// Computed refresh interval in milliseconds
const refreshInterval = computed(() => refreshIntervalSeconds.value * 1000);

// Main highway detection composable
const {
  coordinates,
  currentHighway,
  nextExit,
  distanceToHighway,
  loading,
  error,
  refresh,
  startDetection: composableStartDetection,
  stopDetection: composableStopDetection,
} = useHighwayExitDetection(autoRefresh, refreshInterval);

// Manual detection control methods
const startDetection = () => {
  isDetecting.value = true;
  autoRefresh.value = true;
  composableStartDetection(); // Use the composable's method
};

const stopDetection = () => {
  isDetecting.value = false;
  autoRefresh.value = false;
  composableStopDetection(); // Use the composable's method
};

const getDetectionStatus = () => {
  if (loading.value) return 'A detectar...';
  if (isDetecting.value) return 'Activo';
  return 'Inactivo';
};

// Nearby exits composable
const radiusKm = ref(10); // 10km radius for nearby exits
const {
  exits: nearbyExits,
  loading: nearbyLoading,
  error: nearbyError,
} = useNearbyExits(coordinates, radiusKm);

// Emits for parent component communication
const emit = defineEmits<{
  'highway-detected': [highway: string];
  'exit-detected': [exit: any];
  'location-changed': [coordinates: { lat: number; lng: number }];
}>();

// Watch for changes and emit events
watch(currentHighway, (newHighway) => {
  if (newHighway) {
    emit('highway-detected', newHighway);
  }
});

watch(nextExit, (newExit) => {
  if (newExit) {
    emit('exit-detected', newExit);
  }
});

watch(coordinates, (newCoords) => {
  if (newCoords) {
    emit('location-changed', newCoords);
  }
});
</script>

<style scoped>
/* Highway exits info component styles */
</style>
