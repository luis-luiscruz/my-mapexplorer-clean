<template>
  <div class="connection-indicator" @click="testConnection">
    <!-- Main Connection Indicator -->
    <div class="tooltip tooltip-left" :data-tip="tooltipText">
      <div 
        class="flex items-center gap-2 bg-base-100 shadow-lg rounded-lg px-3 py-2 cursor-pointer transition-all duration-300 hover:shadow-xl border"
        :class="containerClasses"
      >
        <!-- Status Icon -->
        <div 
          class="w-3 h-3 rounded-full transition-all duration-300"
          :class="statusClasses"
        >
          <div 
            v-if="status.status === 'connecting'" 
            class="w-full h-full rounded-full animate-pulse"
          ></div>
        </div>
        
        <!-- Database Icon -->
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" :class="iconClasses" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
        </svg>
        
        <!-- Status Text -->
        <span class="text-xs font-medium" :class="textClasses">
          {{ statusText }}
        </span>
        
        <!-- Loading Spinner -->
        <div v-if="isChecking" class="loading loading-spinner loading-xs"></div>
      </div>
    </div>

    <!-- Extended Info Panel (shown on hover) -->
    <transition name="slide-down">
      <div 
        v-if="showExtendedInfo" 
        class="absolute top-14 right-0 bg-base-100 shadow-xl rounded-lg p-4 border w-80 z-50"
      >
        <div class="flex items-center justify-between mb-3">
          <h3 class="font-semibold text-sm flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
            </svg>
            Estado da Base de Dados
          </h3>
          <button @click="showExtendedInfo = false" class="btn btn-ghost btn-xs btn-circle">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div class="space-y-3">
          <!-- Connection Status -->
          <div class="flex items-center justify-between p-2 bg-base-200 rounded">
            <span class="text-xs text-base-content/70">Estado:</span>
            <div class="flex items-center gap-2">
              <div class="w-2 h-2 rounded-full" :class="statusClasses"></div>
              <span class="text-xs font-medium" :class="textClasses">{{ status.message }}</span>
            </div>
          </div>
          
          <!-- Last Check Time -->
          <div class="flex items-center justify-between p-2 bg-base-200 rounded">
            <span class="text-xs text-base-content/70">Última verificação:</span>
            <span class="text-xs">{{ formatTimestamp(status.timestamp) }}</span>
          </div>
            <!-- Database Info -->
          <div class="flex items-center justify-between p-2 bg-base-200 rounded">
            <span class="text-xs text-base-content/70">Servidor:</span>
            <span class="text-xs">{{ serverInfo }}</span>
          </div>
          
          <div v-if="status.database?.name" class="flex items-center justify-between p-2 bg-base-200 rounded">
            <span class="text-xs text-base-content/70">Base de Dados:</span>
            <span class="text-xs">{{ status.database.name }}</span>
          </div>
          
          <div v-if="status.database?.table" class="flex items-center justify-between p-2 bg-base-200 rounded">
            <span class="text-xs text-base-content/70">Tabela:</span>
            <div class="flex items-center gap-2">
              <span class="text-xs">{{ status.database.table }}</span>
              <div v-if="status.database.tableExists !== undefined" 
                   class="w-2 h-2 rounded-full" 
                   :class="status.database.tableExists ? 'bg-green-500' : 'bg-red-500'"></div>
            </div>
          </div>
          
          <div v-if="status.database?.recordCount !== undefined" class="flex items-center justify-between p-2 bg-base-200 rounded">
            <span class="text-xs text-base-content/70">Registos:</span>
            <span class="text-xs">{{ formatNumber(status.database.recordCount) }}</span>
          </div>
          
          <div v-if="status.database?.version" class="flex items-center justify-between p-2 bg-base-200 rounded">
            <span class="text-xs text-base-content/70">Versão MySQL:</span>
            <span class="text-xs">{{ status.database.version.split('-')[0] }}</span>
          </div>
          
          <div v-if="status.database?.responseTime" class="flex items-center justify-between p-2 bg-base-200 rounded">
            <span class="text-xs text-base-content/70">Tempo de resposta:</span>
            <span class="text-xs" :class="getResponseTimeClass(status.database.responseTime)">
              {{ status.database.responseTime }}ms
            </span>
          </div>
          
          <!-- Error Info -->
          <div v-if="status.error" class="p-2 bg-error/10 border border-error/20 rounded">
            <div class="text-xs text-error font-medium mb-1">Erro:</div>
            <div class="text-xs text-error/80">{{ status.error }}</div>
          </div>
          
          <!-- Actions -->
          <div class="flex gap-2 pt-2">
            <button 
              @click="testConnection" 
              class="btn btn-primary btn-xs flex-1"
              :disabled="isChecking"
            >
              <svg v-if="!isChecking" xmlns="http://www.w3.org/2000/svg" class="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span v-if="!isChecking">Testar</span>
              <span v-else class="loading loading-spinner loading-xs"></span>
            </button>
            <button @click="checkConnectionStatus" class="btn btn-outline btn-xs">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useConnectionStatus } from '../composables/useConnectionStatus';

// Use shared connection status
const {
  connectionStatus: status,
  isChecking,
  statusIndicator,
  statusTooltip,
  testConnection,
  checkConnectionStatus
} = useConnectionStatus();

const showExtendedInfo = ref(false);
let intervalId: number | null = null;

// Computed properties
const statusClasses = computed(() => {
  switch (status.value.status) {
    case 'connected':
      return 'bg-green-500 ring-2 ring-green-300 ring-opacity-50';
    case 'connecting':
      return 'bg-yellow-500 ring-2 ring-yellow-300 ring-opacity-50';
    case 'error':
      return 'bg-red-500 ring-2 ring-red-300 ring-opacity-50 animate-pulse';
    default:
      return 'bg-gray-400 ring-2 ring-gray-300 ring-opacity-50';
  }
});

const containerClasses = computed(() => {
  switch (status.value.status) {
    case 'connected':
      return 'border-green-200 hover:border-green-300';
    case 'connecting':
      return 'border-yellow-200 hover:border-yellow-300';
    case 'error':
      return 'border-red-200 hover:border-red-300';
    default:
      return 'border-gray-200 hover:border-gray-300';
  }
});

const iconClasses = computed(() => {
  switch (status.value.status) {
    case 'connected':
      return 'text-green-600';
    case 'connecting':
      return 'text-yellow-600';
    case 'error':
      return 'text-red-600';
    default:
      return 'text-gray-600';
  }
});

const textClasses = computed(() => {
  switch (status.value.status) {
    case 'connected':
      return 'text-green-700';
    case 'connecting':
      return 'text-yellow-700';
    case 'error':
      return 'text-red-700';
    default:
      return 'text-gray-700';
  }
});

const statusText = computed(() => {
  switch (status.value.status) {
    case 'connected':
      return 'Conectado';
    case 'connecting':
      return 'Conectando...';
    case 'error':
      return 'Erro';
    default:
      return 'Desconectado';
  }
});

const serverInfo = computed(() => {
  if (status.value.database?.host && status.value.database?.port) {
    return `${status.value.database.host}:${status.value.database.port}`;
  }
  return 'localhost:3001';
});

const tooltipText = computed(() => {
  const time = new Date(status.value.timestamp).toLocaleTimeString();
  const baseText = `${status.value.message} (${time})`;
  
  if (status.value.error) {
    return `${baseText}\nError: ${status.value.error}\nClick to retry`;
  }
  
  return `${baseText}\nClick to test connection or view details`;
});

// Methods
const formatTimestamp = (timestamp: string): string => {
  const date = new Date(timestamp);
  return date.toLocaleString('pt-PT');
};

const formatNumber = (num: number): string => {
  return new Intl.NumberFormat('pt-PT').format(num);
};

const getResponseTimeClass = (responseTime: number): string => {
  if (responseTime < 100) return 'text-green-600';
  if (responseTime < 500) return 'text-yellow-600';
  return 'text-red-600';
};

// Enhanced test connection with UI feedback
const enhancedTestConnection = async () => {
  await testConnection();
  
  // Show extended info panel after successful test
  if (status.value.status === 'connected') {
    showExtendedInfo.value = true;
    setTimeout(() => {
      showExtendedInfo.value = false;
    }, 5000); // Auto-hide after 5 seconds
  }
};

// Lifecycle hooks
onMounted(() => {
  // Initial check
  checkConnectionStatus();
  
  // Set up periodic status checks every 30 seconds
  intervalId = window.setInterval(checkConnectionStatus, 30000);
});

onUnmounted(() => {
  if (intervalId) {
    clearInterval(intervalId);
  }
});

// Expose for debugging
defineExpose({
  status,
  testConnection,
  checkConnectionStatus
});
</script>

<style scoped>
.connection-indicator {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 1000;
}

.tooltip:before {
  white-space: pre-line;
  max-width: 250px;
}

/* Transition animations */
.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.3s ease-out;
}

.slide-down-enter-from {
  opacity: 0;
  transform: translateY(-10px) scale(0.95);
}

.slide-down-leave-to {
  opacity: 0;
  transform: translateY(-10px) scale(0.95);
}

.slide-down-enter-to,
.slide-down-leave-from {
  opacity: 1;
  transform: translateY(0) scale(1);
}

/* Hover effects */
.connection-indicator:hover .bg-base-100 {
  transform: translateY(-1px);
}

/* Status indicator pulse animation for errors */
@keyframes error-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.animate-pulse {
  animation: error-pulse 1s infinite;
}
</style>
