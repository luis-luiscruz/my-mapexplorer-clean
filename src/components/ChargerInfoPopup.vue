<template>
  <div>
    <CustomMapPopup
      v-if="charger"
      v-model="isVisible"
      :lat-lng="position"
      :map="map"
      :title="charger.desc_loja || 'Posto de Carregamento'"
    >
      <div>
        <!-- Header compacto -->
        <div class="station-header">
          <div class="station-title-section">
            <div class="charging-icon-modern">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M14.69 2.21L4.33 11.49c-.64.58-.28 1.65.58 1.73L13 14l-1.17 7.07c-.17.98 1.02 1.59 1.7.87l10.36-9.28c.64-.58.28-1.65-.58-1.73L15 10l1.17-7.07c.17-.98-1.02-1.59-1.7-.87-.01.01-.01.01-.02.01z"/>
              </svg>
            </div>
            <div class="title-content">
              <h3 class="station-name">{{ charger.desc_loja || 'Posto EV' }}</h3>
              <div class="station-id-badge" v-if="charger.Posto_ID">
                #{{ charger.Posto_ID }}
              </div>
            </div>
          </div>
        </div>

        <!-- Morada em destaque -->
        <div v-if="charger.MORADA" class="address-section">
          <div class="address-icon">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
            </svg>
          </div>
          <span class="address-text">{{ charger.MORADA }}</span>
        </div>

        <!-- Grid horizontal de informações (sem morada) -->
        <div class="info-grid-horizontal">
          <div v-if="charger.POTENCIA_TOMADA" class="info-item">
            <div class="info-icon power">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path d="M14.69 2.21L4.33 11.49c-.64.58-.28 1.65.58 1.73L13 14l-1.17 7.07c-.17.98 1.02 1.59 1.7.87l10.36-9.28c.64-.58.28-1.65-.58-1.73L15 10l1.17-7.07c.17-.98-1.02-1.59-1.7-.87-.01.01-.01.01-.02.01z"/>
              </svg>
            </div>
            <span class="info-value">{{ charger.POTENCIA_TOMADA }}kW</span>
          </div>
          
          <div v-if="charger.OPERADOR" class="info-item">
            <div class="info-icon operator">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 7V3H2v18h20V7H12zM6 19H4v-2h2v2zm0-4H4v-2h2v2zm0-4H4V9h2v2zm0-4H4V5h2v2zm4 12H8v-2h2v2zm0-4H8v-2h2v2zm0-4H8V9h2v2zm0-4H8V5h2v2zm10 12h-8v-2h2v-2h-2v-2h2v-2h-2V9h8v10z"/>
              </svg>
            </div>
            <span class="info-value">{{ charger.OPERADOR }}</span>
          </div>
        </div>        <!-- Botões apenas Google Maps e MIIO -->
        <div class="action-section-simple">
          <button v-if="charger.Link_Gmap" @click="openGmaps" class="action-btn maps">
            <div class="btn-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
              </svg>
            </div>
            <span>Google Maps</span>
          </button>
          
          <button v-if="charger.Link_MIIO" @click="openMIIO" class="action-btn miio">
            <div class="btn-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
              </svg>
            </div>
            <span>MIIO</span>
          </button>
          
          <!-- Fallback: mostrar sempre pelo menos um botão se não houver links -->
          <div v-if="!charger.Link_Gmap && !charger.Link_MIIO" class="no-links-message">
            <span class="text-gray-400 text-sm">Links não disponíveis</span>
          </div>
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
/* Design compacto e largo com melhorias visuais aplicado ao container principal */
.custom-map-popup > div {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background: linear-gradient(145deg, #1f2937 0%, #111827 100%);
  border: 1px solid #374151;
  border-radius: 20px;
  padding: 24px;
  color: #f9fafb;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(20px);
  position: relative;
  overflow: hidden;
}

.custom-map-popup > div::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent);
}

/* Header compacto */
.station-header {
  display: flex;
  justify-content: flex-start;
  align-items: center;
  margin-bottom: 16px;
  position: relative;
  z-index: 1;
}

.station-title-section {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
}

.charging-icon-modern {
  background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
  border-radius: 12px;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 6px 20px rgba(245, 158, 11, 0.3);
  color: #1f2937;
  flex-shrink: 0;
}

.title-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.station-name {
  margin: 0;
  font-size: 18px;
  font-weight: 700;
  line-height: 1.2;
  color: #f9fafb;
  word-break: break-word;
}

.station-id-badge {
  background: rgba(255,255,255,0.1);
  padding: 2px 8px;
  border-radius: 8px;
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.5px;
  text-transform: uppercase;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255,255,255,0.1);
  color: rgba(249, 250, 251, 0.8);
  width: fit-content;
}

/* Seção de morada em destaque */
.address-section {
  display: flex;
  align-items: center;
  gap: 12px;
  background: rgba(239, 68, 68, 0.1);
  padding: 12px 16px;
  border-radius: 12px;
  border: 1px solid rgba(239, 68, 68, 0.2);
  backdrop-filter: blur(10px);
  margin-bottom: 16px;
  position: relative;
  z-index: 1;
}

.address-icon {
  width: 32px;
  height: 32px;
  border-radius: 10px;
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.address-text {
  font-size: 14px;
  font-weight: 600;
  color: #f9fafb;
  line-height: 1.3;
  word-break: break-word;
  flex: 1;
}

/* Grid horizontal compacto (sem morada) */
.info-grid-horizontal {
  display: flex;
  gap: 16px;
  margin-bottom: 16px;
  position: relative;
  z-index: 1;
  flex-wrap: wrap;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba(255,255,255,0.05);
  padding: 8px 12px;
  border-radius: 12px;
  border: 1px solid rgba(255,255,255,0.1);
  backdrop-filter: blur(10px);
  transition: all 0.3s ease;
  flex: 1;
  min-width: 120px;
}

.info-item:hover {
  background: rgba(255,255,255,0.08);
  transform: translateY(-1px);
}

.info-icon {
  width: 28px;
  height: 28px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.info-icon.location {
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
  color: white;
}

.info-icon.power {
  background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
  color: white;
}

.info-icon.operator {
  background: linear-gradient(135deg, #06b6d4 0%, #0891b2 100%);
  color: white;
}

.info-value {
  font-size: 13px;
  font-weight: 600;
  line-height: 1.2;
  color: #f9fafb;
  word-break: break-word;
  flex: 1;
}

/* Seção de ações simples */
.action-section-simple {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  position: relative;
  z-index: 1;
  margin-top: 16px;
  padding: 0 4px;
}

.no-links-message {
  grid-column: 1 / -1;
  text-align: center;
  padding: 12px;
  border: 1px dashed #374151;
  border-radius: 8px;
  background: rgba(55, 65, 81, 0.3);
}

.action-btn.maps {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  border: 1px solid #10b981;
  border-radius: 16px;
  padding: 14px 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  font-weight: 600;
  font-size: 14px;
  color: white;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  backdrop-filter: blur(10px);
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
  position: relative;
  overflow: hidden;
}

.action-btn.maps::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  transition: left 0.5s;
}

.action-btn.maps:hover::before {
  left: 100%;
}

.action-btn.miio {
  background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
  border: 1px solid #8b5cf6;
  border-radius: 16px;
  padding: 14px 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  font-weight: 600;
  font-size: 14px;
  color: white;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  backdrop-filter: blur(10px);
  box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);
  position: relative;
  overflow: hidden;
}

.action-btn.miio::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  transition: left 0.5s;
}

.action-btn.miio:hover::before {
  left: 100%;
}

.action-btn.maps:hover {
  transform: translateY(-3px);
  box-shadow: 0 12px 24px rgba(16, 185, 129, 0.4);
  border-color: #34d399;
}

.action-btn.miio:hover {
  transform: translateY(-3px);
  box-shadow: 0 12px 24px rgba(139, 92, 246, 0.4);
  border-color: #a78bfa;
}

.action-btn:active {
  transform: translateY(0);
}

.btn-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

/* Modal Styles - mantidos mas melhorados */
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
  border-radius: 20px;
  max-width: 90vw;
  max-height: 90vh;
  width: 800px;
  overflow: hidden;
  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.5);
  border: 1px solid rgba(255,255,255,0.1);
  color: #f9fafb;
}

.modal-header {
  padding: 24px;
  border-bottom: 1px solid rgba(255,255,255,0.1);
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
  background: rgba(255,255,255,0.1);
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #9ca3af;
  padding: 8px;
  border-radius: 12px;
  transition: all 0.2s ease;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-close-btn:hover {
  background: rgba(255,255,255,0.2);
  color: #f9fafb;
}

.modal-body {
  padding: 24px;
  overflow-y: auto;
  max-height: calc(90vh - 160px);
}

.modal-footer {
  padding: 20px 24px;
  border-top: 1px solid rgba(255,255,255,0.1);
  display: flex;
  justify-content: flex-end;
  background: #111827;
}

.summary-section {
  margin-bottom: 24px;
  padding: 20px;
  background: #111827;
  border-radius: 16px;
  border: 1px solid rgba(255,255,255,0.1);
}

.summary-item {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.summary-label {
  font-weight: 600;
  color: #9ca3af;
  min-width: 140px;
}

.summary-value {
  font-weight: 500;
  padding: 6px 12px;
  border-radius: 8px;
  background: rgba(255,255,255,0.1);
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
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid rgba(255,255,255,0.1);
}

.elemento-header {
  background: #111827;
  padding: 12px 16px;
  font-weight: 600;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: #9ca3af;
  border-bottom: 1px solid rgba(255,255,255,0.1);
}

.elemento-data {
  background: #0f172a;
  padding: 20px;
  margin: 0;
  font-family: 'Fira Code', 'Courier New', monospace;
  font-size: 12px;
  line-height: 1.6;
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
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid rgba(255,255,255,0.1);
  margin-bottom: 16px;
}

.raw-data {
  background: #0f172a;
  padding: 20px;
  margin: 0;
  font-family: 'Fira Code', 'Courier New', monospace;
  font-size: 12px;
  line-height: 1.6;
  overflow-x: auto;
  color: #e2e8f0;
  border: none;
  max-height: 300px;
  overflow-y: auto;
}

.copy-btn {
  background: linear-gradient(135deg, #059669 0%, #047857 100%);
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 12px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-top: 12px;
}

.copy-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(5, 150, 105, 0.4);
}

.modal-btn {
  padding: 12px 24px;
  border: none;
  border-radius: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.modal-btn.primary {
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  color: white;
}

.modal-btn.primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(59, 130, 246, 0.4);
}

.no-elementos {
  padding: 40px;
  text-align: center;
  color: #9ca3af;
  font-style: italic;
}
</style>
