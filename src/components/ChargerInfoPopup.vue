<template>
  <div>    <CustomMapPopup
      v-if="charger"
      v-model="isVisible"
      :lat-lng="position"
      :map="map"
      :title="charger.desc_loja || 'Posto de Carregamento'"
      :force-top-position="showScriptResults && !isLoadingScript"
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
        </div>

        <!-- Botões apenas Google Maps e MIIO -->
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
          
          <!-- Script Analysis Button -->
          <button @click="runScriptAnalysis" class="action-btn script" :disabled="isLoadingScript">
            <div class="btn-icon">
              <svg v-if="!isLoadingScript" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M9.4 16.6L4.8 12l4.6-4.6L8 6l-6 6 6 6 1.4-1.4zm5.2 0L19.2 12l-4.6-4.6L16 6l6 6-6 6-1.4-1.4z"/>
              </svg>
              <div v-else class="loading-spinner"></div>
            </div>
            <span>{{ isLoadingScript ? 'Analisando...' : 'Analisar' }}</span>
          </button>
          
          <!-- Fallback: mostrar sempre pelo menos um botão se não houver links -->
          <div v-if="!charger.Link_Gmap && !charger.Link_MIIO" class="no-links-message">
            <span class="text-gray-400 text-sm">Links não disponíveis</span>
          </div>
        </div>        <!-- Script Analysis Results Section - Directly in Popup -->
        <div v-if="showScriptResults" class="script-analysis-section">
          
          <div v-if="isLoadingScript" class="loading-section">
            <div class="loading-indicator">
              <div class="loading-spinner"></div>
              <div class="loading-text">
                <h4>🔍 Executando análise...</h4>
                <p>Aguarde enquanto processamos os dados do posto</p>
              </div>
            </div>
          </div>
          
          <div v-else-if="scriptResults?.error" class="error-section">
            <div class="error-message">
              ❌ {{ scriptResults.message }}
            </div>
          </div>
          
          <div v-else-if="scriptResults">
            
            <!-- Display elementos_classificados in a clean format -->
            <div v-if="scriptResults.elementos_classificados">
              <div class="elemento-card">
                <div class="elemento-row">
                  <span class="label">Conector:</span>
                  <span class="value">{{ scriptResults.elementos_classificados.conector }}</span>
                </div>
                <div class="elemento-row">
                  <span class="label">Potência:</span>
                  <span class="value">{{ scriptResults.elementos_classificados.potencia }}</span>
                </div>
                <div class="elemento-row">
                  <span class="label">Status:</span>
                  <span class="value status" :class="getStatusClass(scriptResults.elementos_classificados.status)">
                    {{ scriptResults.elementos_classificados.status }}
                  </span>
                </div>
                <div v-if="scriptResults.elementos_classificados.precos && scriptResults.elementos_classificados.precos.length > 0" class="elemento-row">
                  <span class="label">Preços:</span>
                  <div class="precos-list">
                    <span v-for="preco in scriptResults.elementos_classificados.precos" :key="preco" class="preco-tag">
                      {{ preco }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            
            <!-- Fallback: show raw JSON if no elementos_classificados -->
            <div v-else class="raw-json-section">
              <h5>📄 Dados Retornados</h5>
              <pre class="json-display">{{ JSON.stringify(scriptResults, null, 2) }}</pre>
            </div>
          </div>
        </div>
      </div>
    </CustomMapPopup>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed, watch, nextTick } from 'vue';
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
    const isLoadingScript = ref(false);
    const scriptResults = ref<any>(null);
    const showScriptResults = ref(false);
    
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

    const getStatusClass = (status: string) => {
      if (!status) return '';
      
      const statusLower = status.toLowerCase();
      if (statusLower.includes('success') || statusLower.includes('encontrado') || statusLower.includes('disponível')) {
        return 'status-success';
      } else if (statusLower.includes('error') || statusLower.includes('erro')) {
        return 'status-error';
      } else if (statusLower.includes('timeout') || statusLower.includes('tempo')) {
        return 'status-warning';
      }
      return 'status-info';
    };
    
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

    // Method to run script analysis
    const runScriptAnalysis = async () => {
      if (!props.charger) return;
      
      // Show results section immediately with loading state
      isLoadingScript.value = true;
      scriptResults.value = null;
      showScriptResults.value = true;
      
      try {
        // Call real script endpoint
        const response = await fetch('/api/run-script', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            script: 'extrair_paineis_tarifario.py',
            charger_id: props.charger.Posto_ID,
            latitude: props.charger.Latitude,
            longitude: props.charger.Longitude,
            address: props.charger.MORADA
          })
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Clean and parse the output to extract just the JSON
        let cleanedData = data;
        if (data.output && typeof data.output === 'string') {
          // Remove [API] prefixes and clean the text
          const cleanedOutput = data.output
            .replace(/\[API\]\s*/g, '')  // Remove [API] prefixes
            .replace(/�/g, '€')          // Fix encoding issues
            .trim();
          
          try {
            // Try to parse as JSON
            cleanedData = JSON.parse(cleanedOutput);
          } catch {
            // If parsing fails, try to extract just the elementos_classificados part
            const match = cleanedOutput.match(/"elementos_classificados":\s*\{[^}]+\}/);
            if (match) {
              try {
                cleanedData = JSON.parse(`{${match[0]}}`);
              } catch {
                cleanedData = { raw_output: cleanedOutput };
              }
            } else {
              cleanedData = { raw_output: cleanedOutput };
            }
          }
        }
        
        // Handle the actual data structure returned by the Python script
        // The script returns: { blocos_ccs: [{ elementos_classificados: {...} }] }
        // We need to extract the first elementos_classificados for display
        if (cleanedData.blocos_ccs && Array.isArray(cleanedData.blocos_ccs) && cleanedData.blocos_ccs.length > 0) {
          const firstBloco = cleanedData.blocos_ccs[0];
          if (firstBloco.elementos_classificados) {
            // Create a cleaned structure for the display
            scriptResults.value = {
              ...cleanedData,
              elementos_classificados: firstBloco.elementos_classificados,
              total_blocos: cleanedData.total_blocos_ccs || cleanedData.blocos_ccs.length,
              posto_id: cleanedData.posto_id
            };
          } else {
            scriptResults.value = cleanedData;
          }
        } else {
          scriptResults.value = cleanedData;
        }
        
      } catch (error) {
        console.error('Script execution failed:', error);
        scriptResults.value = {
          error: true,
          message: 'Falha na execução: ' + (error as Error).message
        };      } finally {
        isLoadingScript.value = false;
        // Ensure popup repositions after loading is complete
        nextTick(() => {
          // The forceTopPosition prop should trigger a position update in CustomMapPopup
          console.log('Script analysis complete, forceTopPosition:', showScriptResults.value && !isLoadingScript.value);
        });
      }
    };

    return {
      isVisible,
      isLoadingScript,
      scriptResults,
      showScriptResults,
      position,
      getStatusClass,
      openMIIO,
      openGmaps,
      runScriptAnalysis
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

/* Address section */
.address-section {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 12px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  margin-bottom: 16px;
}

.address-icon {
  background: rgba(139, 92, 246, 0.2);
  border-radius: 8px;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #a78bfa;
  flex-shrink: 0;
  margin-top: 2px;
}

.address-text {
  font-size: 14px;
  line-height: 1.4;
  color: #e5e7eb;
  flex: 1;
}

/* Info grid horizontal */
.info-grid-horizontal {
  display: flex;
  gap: 16px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba(255, 255, 255, 0.05);
  padding: 8px 12px;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  flex: 1;
  min-width: 120px;
}

.info-icon {
  border-radius: 8px;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.info-icon.power {
  background: rgba(16, 185, 129, 0.2);
  color: #10b981;
}

.info-icon.operator {
  background: rgba(59, 130, 246, 0.2);
  color: #3b82f6;
}

.info-value {
  font-size: 13px;
  font-weight: 600;
  color: #f9fafb;
  flex: 1;
}

/* Action buttons */
.action-section-simple {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.05);
  color: #f9fafb;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);
  position: relative;
  overflow: hidden;
  flex: 1;
  min-width: 120px;
  text-decoration: none;
}

.action-btn.maps {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  border-color: #10b981;
}

.action-btn.miio {
  background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
  border-color: #8b5cf6;
}

.action-btn.script {
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  border-color: #f59e0b;
}

.action-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.action-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.btn-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.no-links-message {
  text-align: center;
  color: #9ca3af;
  font-style: italic;
  padding: 20px;
}

/* Script Analysis Section */
.script-analysis-section {
  margin-top: 20px;
}

.loading-section {
  text-align: center;
  padding: 20px;
}

.loading-indicator {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.loading-spinner {
  width: 20px;
  height: 20px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top: 2px solid #3b82f6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.loading-text h4 {
  margin: 0 0 8px 0;
  color: #f9fafb;
  font-size: 16px;
}

.loading-text p {
  margin: 0;
  color: #9ca3af;
  font-size: 14px;
}

.error-section {
  padding: 16px;
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: 12px;
}

.error-message {
  color: #fca5a5;
  font-weight: 600;
  text-align: center;
}

.elemento-card {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  padding: 12px;
}

.elemento-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.elemento-row:last-child {
  margin-bottom: 0;
}

.elemento-row .label {
  color: #9ca3af;
  font-size: 13px;
  font-weight: 600;
}

.elemento-row .value {
  color: #f9fafb;
  font-size: 13px;
  font-weight: 600;
}

.elemento-row .value.status {
  padding: 2px 8px;
  border-radius: 6px;
  font-size: 12px;
}

.status-success {
  background: rgba(16, 185, 129, 0.2);
  color: #10b981;
}

.status-error {
  background: rgba(239, 68, 68, 0.2);
  color: #f87171;
}

.status-warning {
  background: rgba(245, 158, 11, 0.2);
  color: #fbbf24;
}

.status-info {
  background: rgba(59, 130, 246, 0.2);
  color: #60a5fa;
}

.precos-list {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-top: 4px;
}

.preco-tag {
  background: rgba(139, 92, 246, 0.2);
  color: #a78bfa;
  padding: 2px 6px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 600;
}

.raw-json-section h5 {
  margin: 0 0 12px 0;
  color: #f9fafb;
  font-size: 14px;
}

.json-display {
  background: #0f172a;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  padding: 12px;
  font-family: 'Fira Code', 'SF Mono', Monaco, Consolas, monospace;
  font-size: 11px;
  line-height: 1.4;
  color: #e5e7eb;
  white-space: pre-wrap;
  overflow-x: auto;
  max-height: 200px;
  overflow-y: auto;
}
</style>
