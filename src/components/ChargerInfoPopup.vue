<template>
  <div>
    <CustomMapPopup
      v-if="charger"
      v-model="isVisible"
      :lat-lng="position"
      :map="map"
      :title="charger.desc_loja || 'Posto de Carregamento'"
    >      <div class="ev-station-card">
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

        <!-- Informações principais em grid -->
        <div class="station-info-grid">
          <!-- Localização -->
          <div class="info-card location" v-if="charger.MORADA">
            <div class="info-icon">📍</div>
            <div class="info-content">
              <span class="info-label">Localização</span>
              <span class="info-value">{{ charger.MORADA }}</span>
            </div>
          </div>

          <!-- Potência e Operador lado a lado -->
          <div class="power-operator-row">
            <!-- Potência -->
            <div class="info-card power" v-if="charger.POTENCIA_TOMADA">
              <div class="info-icon">⚡</div>
              <div class="info-content">
                <span class="info-label">Potência</span>
                <span class="info-value">{{ charger.POTENCIA_TOMADA }}kW</span>
              </div>
            </div>

            <!-- Operador -->
            <div class="info-card operator" v-if="charger.OPERADOR">
              <div class="info-icon">🏢</div>
              <div class="info-content">
                <span class="info-label">Operador</span>
                <span class="info-value">{{ charger.OPERADOR }}</span>
              </div>
            </div>
          </div>
        </div>        <!-- Botões de ação redesenhados -->
        <div class="action-buttons">          <button @click="openMIIO" class="action-btn miio-btn">
            <div class="btn-icon animated-icon">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <span>MIIO</span>
          </button>
          <button @click="openGmaps" class="action-btn maps-btn">
            <div class="btn-icon animated-icon">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <span>Gmaps</span>
          </button>
        </div>
      </div>
    </CustomMapPopup>
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
      
      return { lat, lng };    });
    
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
      position,
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
.station-info-grid {
  display: grid;
  gap: 12px;
  margin-bottom: 20px;
  position: relative;
  z-index: 1;
}

/* Row para potência e operador lado a lado */
.power-operator-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.info-card {
  background: #374151; /* base-300 */
  border-radius: 12px;
  padding: 12px;
  display: flex;
  align-items: center;
  gap: 12px;
  backdrop-filter: blur(10px);
  border: 1px solid #4b5563; /* base-400 */
  transition: all 0.3s ease;
}

.info-card:hover {
  background: #4b5563; /* base-400 */
  transform: translateY(-2px);
}

.info-icon {
  font-size: 20px;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #4b5563; /* base-400 */
  border-radius: 8px;
}

.info-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.info-label {
  font-size: 11px;
  opacity: 0.8;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  font-weight: 500;
  color: rgba(249, 250, 251, 0.7); /* base-content com opacidade */
}

.info-value {
  font-size: 14px;
  font-weight: 600;
  line-height: 1.2;
  color: #f9fafb; /* base-content */
}

/* Cartões específicos */
.location .info-icon {
  background: linear-gradient(45deg, #FF6B6B, #FF8E8E);
}

.power .info-icon {
  background: linear-gradient(45deg, #4ECDC4, #44A08D);
}

.operator .info-icon {
  background: linear-gradient(45deg, #A8E6CF, #7FCDCD);
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
</style>
