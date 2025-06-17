<template>
  <div>
    <CustomMapPopup
      v-if="charger"
      v-model="isVisible"
      :lat-lng="position"
      :map="map"
      :title="charger.desc_loja || 'Posto de Carregamento'"
    >
      <div class="ev-station-card">
        <!-- Header com título e ID -->
        <div class="station-header">
          <div class="station-title">
            <div class="charging-icon">⚡</div>
            <h3>{{ charger.desc_loja || 'Posto EV' }}</h3>
          </div>
          <div class="station-id" v-if="charger.Posto_ID">
            #{{ charger.Posto_ID }}
          </div>
        </div>

        <!-- Informações básicas -->
        <div class="station-info">
          <div v-if="charger.MORADA" class="info-item">
            <span class="info-label">📍 Localização:</span>
            <span class="info-value">{{ charger.MORADA }}</span>
          </div>
          
          <div v-if="charger.POTENCIA_TOMADA" class="info-item">
            <span class="info-label">⚡ Potência:</span>
            <span class="info-value">{{ charger.POTENCIA_TOMADA }}kW</span>
          </div>
          
          <div v-if="charger.OPERADOR" class="info-item">
            <span class="info-label">🏢 Operador:</span>
            <span class="info-value">{{ charger.OPERADOR }}</span>
          </div>
        </div>        <!-- Botões de ação -->
        <div class="action-buttons">
          <button @click="testAlert" class="action-btn test-btn">
            🧪 Teste Alert
          </button>
          
          <button @click="loadDetails" class="action-btn details-btn" :disabled="isLoading">
            <span v-if="isLoading">⏳ Carregando...</span>
            <span v-else>🏷️ Ver Elementos Classificados</span>
          </button>
          
          <button v-if="charger.Link_MIIO" @click="openMIIO" class="action-btn miio-btn">
            <span>🔋 MIIO</span>
          </button>
          
          <button v-if="charger.Link_Gmap" @click="openGmaps" class="action-btn maps-btn">
            <span>🗺️ Google Maps</span>
          </button>
        </div>
      </div>
    </CustomMapPopup>

    <!-- Modal para Elementos Classificados -->
    <div v-if="showModal" class="modal-overlay" @click="closeModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>🏷️ Elementos Classificados - Posto #{{ charger?.Posto_ID }}</h3>
          <button @click="closeModal" class="modal-close-btn">✕</button>
        </div>
        
        <div class="modal-body">
          <!-- Summary Section -->
          <div v-if="ccsData" class="summary-section">
            <div class="summary-item">
              <span class="summary-label">Status:</span>
              <span class="summary-value" :class="getStatusClass(ccsData.status)">
                {{ ccsData.status }}
              </span>
            </div>
            
            <div v-if="ccsData.execution_time" class="summary-item">
              <span class="summary-label">Tempo de execução:</span>
              <span class="summary-value">{{ ccsData.execution_time }}s</span>
            </div>
          </div>

          <!-- Elementos Classificados Section -->
          <div v-if="ccsData?.elementos_classificados" class="elementos-section">
            <h4>🏷️ Elementos Classificados:</h4>
            <div v-if="Array.isArray(ccsData.elementos_classificados) && ccsData.elementos_classificados.length > 0">
              <div v-for="(elemento, index) in ccsData.elementos_classificados" :key="index" class="elemento-item">
                <div class="elemento-header">Elemento {{ index + 1 }}</div>
                <pre class="elemento-data">{{ JSON.stringify(elemento, null, 2) }}</pre>
              </div>
            </div>
            <div v-else-if="ccsData.elementos_classificados && typeof ccsData.elementos_classificados === 'object'">
              <div class="elemento-item">
                <div class="elemento-header">Elementos Classificados</div>
                <pre class="elemento-data">{{ JSON.stringify(ccsData.elementos_classificados, null, 2) }}</pre>
              </div>
            </div>
            <div v-else class="no-elementos">
              <p>Nenhum elemento classificado encontrado.</p>
            </div>
            
            <button @click="copyElementosToClipboard" class="copy-btn">
              📋 Copiar Elementos Classificados
            </button>
          </div>

          <!-- Fallback: Raw JSON Section -->
          <div v-else class="raw-data-section">
            <h4>📄 Dados Brutos (JSON):</h4>
            <div class="raw-data-container">
              <pre class="raw-data">{{ formatRawData(ccsData) }}</pre>
            </div>
            <button @click="copyToClipboard" class="copy-btn">
              📋 Copiar JSON
            </button>
          </div>
        </div>
        
        <div class="modal-footer">
          <button @click="closeModal" class="modal-btn primary">Fechar</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed, watch } from 'vue';
import CustomMapPopup from './CustomMapPopup.vue';

export default defineComponent({
  name: 'ChargerInfoPopup',
  components: {
    CustomMapPopup
  },
  props: {
    modelValue: {
      type: Boolean,
      default: false
    },
    charger: {
      type: Object,
      default: null
    },
    map: {
      type: Object,
      required: true
    }
  },
  emits: ['update:modelValue'],
  
  setup(props, { emit }) {
    const isVisible = ref(props.modelValue);
    const showModal = ref(false);
    const isLoading = ref(false);
    const ccsData = ref<any>(null);
    
    watch(() => props.modelValue, (newValue) => {
      isVisible.value = newValue;
    });
    
    watch(() => isVisible.value, (newValue) => {
      emit('update:modelValue', newValue);
    });
    
    const position = computed(() => {
      if (!props.charger) return { lat: 0, lng: 0 };
      
      const lat = parseFloat(props.charger.Latitude);
      const lng = parseFloat(props.charger.Longitude);
      
      return { lat, lng };
    });

    const loadDetails = async () => {
      if (!props.charger?.Posto_ID) {
        console.error('No charger ID available');
        return;
      }
      
      console.log('Loading elementos classificados for charger ID:', props.charger.Posto_ID);
      isLoading.value = true;
      
      try {
        const response = await fetch(`http://localhost:3015/api/charger-details/${props.charger.Posto_ID}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          }
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Elementos classificados received:', data);
        
        ccsData.value = data;
        showModal.value = true;
        
      } catch (error) {
        console.error('Error loading elementos classificados:', error);
        alert('Error loading elementos classificados. Check console for details.');
      } finally {
        isLoading.value = false;
      }
    };

    const closeModal = () => {
      showModal.value = false;
      ccsData.value = null;
    };

    const getStatusClass = (status: string) => {
      if (!status) return '';
      
      const statusLower = status.toLowerCase();
      if (statusLower.includes('success') || statusLower.includes('encontrado')) {
        return 'status-success';
      } else if (statusLower.includes('error') || statusLower.includes('erro')) {
        return 'status-error';
      } else if (statusLower.includes('timeout') || statusLower.includes('tempo')) {
        return 'status-warning';
      }
      return 'status-info';
    };

    const formatRawData = (data: any) => {
      if (!data) return '';
      return JSON.stringify(data, null, 2);
    };

    const copyElementosToClipboard = async () => {
      if (!ccsData.value?.elementos_classificados) return;
      
      try {
        const text = JSON.stringify(ccsData.value.elementos_classificados, null, 2);
        await navigator.clipboard.writeText(text);
        alert('Elementos classificados copiados para a área de transferência!');
      } catch (error) {
        console.error('Erro ao copiar elementos classificados:', error);
        const textarea = document.createElement('textarea');
        textarea.value = JSON.stringify(ccsData.value.elementos_classificados, null, 2);
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        alert('Elementos classificados copiados para a área de transferência!');
      }
    };

    const copyToClipboard = async () => {
      if (!ccsData.value) return;
      
      try {
        const text = JSON.stringify(ccsData.value, null, 2);
        await navigator.clipboard.writeText(text);
        alert('JSON copiado para a área de transferência!');
      } catch (error) {
        console.error('Erro ao copiar JSON:', error);
        const textarea = document.createElement('textarea');
        textarea.value = JSON.stringify(ccsData.value, null, 2);
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        alert('JSON copiado para a área de transferência!');
      }
    };
    
    // Computed property for Google Maps link
    const googleMapsUrl = computed(() => {
      if (!props.charger || !props.charger.Link_Gmap) return null;
      return props.charger.Link_Gmap;
    });
      // Method to open MIIO link
    const openMIIO = () => {
      if (!props.charger || !props.charger.Link_MIIO) return;
      
      window.open(props.charger.Link_MIIO, '_blank');
    };
    
    // Method to open Google Maps
    const openGmaps = () => {
      if (!props.charger || !props.charger.Link_Gmap) return;
      
      window.open(props.charger.Link_Gmap, '_blank');
    };
    
    return {
      isVisible,
      showModal,
      isLoading,
      ccsData,
      position,
      loadDetails,
      closeModal,
      getStatusClass,
      formatRawData,
      copyElementosToClipboard,
      copyToClipboard,
      googleMapsUrl,
      openMIIO,
      openGmaps
    };
  }
});
</script>

<style scoped>
/* Design com fundo DaisyUI original */
.ev-station-card {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background: #1f2937; /* base-200 do DaisyUI */
  border-radius: 20px;
  padding: 20px;
  color: #f9fafb; /* base-content do DaisyUI */
  min-width: 320px;
  box-shadow: 0 20px 40px rgba(0,0,0,0.3);
  position: relative;
  overflow: hidden;
  border: 1px solid #374151; /* base-300 do DaisyUI */
}

.ev-station-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: 
    radial-gradient(circle at 20% 80%, rgba(59, 130, 246, 0.05) 0%, transparent 50%),
    radial-gradient(circle at 80% 20%, rgba(236, 72, 153, 0.05) 0%, transparent 50%);
  pointer-events: none;
}

/* Header da estação */
.station-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  position: relative;
  z-index: 1;
}

.station-title {
  display: flex;
  align-items: center;
  gap: 10px;
}

.charging-icon {
  background: #f59e0b; /* warning do DaisyUI */
  border-radius: 50%;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  box-shadow: 0 4px 12px rgba(245, 158, 11, 0.4);
  color: #1f2937; /* warning-content do DaisyUI */
}

.station-title h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  text-shadow: 0 2px 4px rgba(55, 65, 81, 0.5);
  color: #f9fafb; /* base-content */
}

.station-id {
  background: #374151; /* base-300 */
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
  backdrop-filter: blur(10px);
  border: 1px solid #4b5563; /* base-400 */
  color: #f9fafb; /* base-content */
}

/* Grid de informações */
.station-info {
  display: grid;
  gap: 12px;
  margin-bottom: 20px;
  position: relative;
  z-index: 1;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.info-label {
  font-size: 12px;
  opacity: 0.8;
  font-weight: 500;
  color: rgba(249, 250, 251, 0.8);
}

.info-value {
  font-size: 14px;
  font-weight: 600;
  line-height: 1.2;
  color: #f9fafb;
}

/* Botões de ação modernos */
.action-buttons {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  position: relative;
  z-index: 1;
}

.action-btn {
  background: rgba(255,255,255,0.9);
  color: #333;
  border: none;
  border-radius: 12px;
  padding: 12px 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-weight: 600;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);
  position: relative;
  overflow: hidden;
}

.action-btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent);
  transition: left 0.5s;
}

.action-btn:hover::before {
  left: 100%;
}

.action-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(0,0,0,0.2);
}

.action-btn:active {
  transform: translateY(0);
}

.btn-icon {
  font-size: 16px;
}

.animated-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}

.animated-icon svg {
  animation: iconFloat 2s ease-in-out infinite;
}

.action-btn:hover .animated-icon svg {
  animation: iconPulse 0.6s ease-in-out infinite;
}

@keyframes iconFloat {
  0%, 100% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-2px);
  }
}

@keyframes iconPulse {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.1);
  }
}

.miio-btn {
  background: #6366f1; /* indigo suave */
  color: #ffffff;
}

.maps-btn {
  background: #06b6d4; /* cyan suave */
  color: #ffffff;
}

.miio-btn:hover {
  background: rgba(99, 102, 241, 0.85);
}

.maps-btn:hover {
  background: rgba(6, 182, 212, 0.85);
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(8px);
}

.modal-content {
  background: #1f2937;
  border-radius: 16px;
  max-width: 90vw;
  max-height: 90vh;
  width: 800px;
  overflow: hidden;
  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.5);
  border: 1px solid #374151;
  color: #f9fafb;
}

.modal-header {
  padding: 20px 24px;
  border-bottom: 1px solid #374151;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #111827;
}

.modal-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #f9fafb;
}

.modal-close-btn {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #9ca3af;
  padding: 4px;
  border-radius: 8px;
  transition: all 0.2s ease;
}

.modal-close-btn:hover {
  background: #374151;
  color: #f9fafb;
}

.modal-body {
  padding: 24px;
  overflow-y: auto;
  max-height: calc(90vh - 160px);
}

.modal-footer {
  padding: 16px 24px;
  border-top: 1px solid #374151;
  display: flex;
  justify-content: flex-end;
  background: #111827;
}

.summary-section {
  margin-bottom: 24px;
  padding: 16px;
  background: #111827;
  border-radius: 12px;
  border: 1px solid #374151;
}

.summary-item {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
}

.summary-label {
  font-weight: 600;
  color: #9ca3af;
  min-width: 140px;
}

.summary-value {
  font-weight: 500;
  padding: 4px 8px;
  border-radius: 6px;
  background: #374151;
}

.status-success {
  background: #065f46 !important;
  color: #10b981;
}

.status-error {
  background: #7f1d1d !important;
  color: #ef4444;
}

.status-warning {
  background: #78350f !important;
  color: #f59e0b;
}

.status-info {
  background: #1e3a8a !important;
  color: #3b82f6;
}

.elementos-section {
  margin-bottom: 24px;
}

.elementos-section h4 {
  margin: 0 0 16px 0;
  font-size: 16px;
  font-weight: 600;
  color: #f9fafb;
}

.elemento-item {
  margin-bottom: 16px;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid #374151;
}

.elemento-header {
  background: #111827;
  padding: 8px 12px;
  font-weight: 600;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: #9ca3af;
  border-bottom: 1px solid #374151;
}

.elemento-data {
  background: #0f172a;
  padding: 16px;
  margin: 0;
  font-family: 'Courier New', monospace;
  font-size: 12px;
  line-height: 1.5;
  overflow-x: auto;
  color: #e2e8f0;
  border: none;
}

.raw-data-section h4 {
  margin: 0 0 16px 0;
  font-size: 16px;
  font-weight: 600;
  color: #f9fafb;
}

.raw-data-container {
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid #374151;
  margin-bottom: 16px;
}

.raw-data {
  background: #0f172a;
  padding: 16px;
  margin: 0;
  font-family: 'Courier New', monospace;
  font-size: 12px;
  line-height: 1.5;
  overflow-x: auto;
  color: #e2e8f0;
  border: none;
  max-height: 300px;
  overflow-y: auto;
}

.copy-btn {
  background: #059669;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  margin-top: 12px;
}

.copy-btn:hover {
  background: #047857;
  transform: translateY(-1px);
}

.modal-btn {
  padding: 10px 20px;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.modal-btn.primary {
  background: #3b82f6;
  color: white;
}

.modal-btn.primary:hover {
  background: #2563eb;
}

.no-elementos {
  padding: 32px;
  text-align: center;
  color: #9ca3af;
  font-style: italic;
}

/* Detalhes do botão com loading */
.details-btn {
  background: #7c3aed;
  color: white;
}

.details-btn:hover:not(:disabled) {
  background: #6d28d9;
}

.details-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none !important;
}
</style>
