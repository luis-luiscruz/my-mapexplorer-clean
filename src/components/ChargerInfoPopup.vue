<template>
  <div>
    <transition name="fade">
      <CustomMapPopup
        v-if="charger"
        v-model="isVisible"
        :lat-lng="position"
        :map="map"
        :title="'Posto de Carregamento'"
      >
        <div class="charger-details">
          <div class="grid grid-cols-4 gap-2 mb-3">
            <div class="col-span-3">
              <div class="font-semibold text-sm mb-1">{{ getChargerName }}</div>
              <div class="text-xs text-base-content/70">{{ getChargerLocation }}</div>
            </div>
            <div class="col-span-1 flex justify-end">
              <div class="w-10 h-10 rounded-lg bg-green-500 flex items-center justify-center">
                <span class="text-white text-lg">⚡</span>
              </div>
            </div>
          </div>

          <div class="divider my-2"></div>          <!-- Charger details -->
          <div class="space-y-2">
            <div v-if="charger.OPERADOR" class="flex justify-between items-center">
              <div class="text-xs text-base-content/70">Operador:</div>
              <div class="text-xs font-medium">{{ charger.OPERADOR }}</div>
            </div>
            
            <div v-if="charger.POTENCIA_TOMADA" class="flex justify-between items-center">
              <div class="text-xs text-base-content/70">Potência:</div>
              <div class="text-xs font-medium">{{ charger.POTENCIA_TOMADA }}kW</div>
            </div>
            
            <div v-if="charger.TIPO_TOMADA" class="flex justify-between items-center">
              <div class="text-xs text-base-content/70">Tipo de Conector:</div>
              <div class="text-xs font-medium">{{ charger.TIPO_TOMADA }}</div>
            </div>
            
            <div v-if="charger.Estado" class="flex justify-between items-center">
              <div class="text-xs text-base-content/70">Estado:</div>
              <div class="text-xs font-medium">
                <span :class="getStatusClass">{{ charger.Estado }}</span>
              </div>
            </div>
            
            <div v-if="charger.TIPO_POSTO" class="flex justify-between items-center">
              <div class="text-xs text-base-content/70">Tipo:</div>
              <div class="text-xs font-medium">{{ charger.TIPO_POSTO }}</div>
            </div>
            
            <div v-if="charger.Pontos" class="flex justify-between items-center">
              <div class="text-xs text-base-content/70">Pontos:</div>
              <div class="text-xs font-medium">{{ charger.Pontos }}</div>
            </div>
            
            <div v-if="charger.distance_km" class="flex justify-between items-center">
              <div class="text-xs text-base-content/70">Distância:</div>
              <div class="text-xs font-medium">{{ formatDistance }} km</div>
            </div>
          </div>

          <div class="divider my-2"></div>          <!-- Action buttons -->
          <div class="flex justify-between mt-3">
            <button @click="openMIIO" class="btn btn-sm btn-outline">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
              MIIO
            </button>
            <a :href="googleMapsUrl" target="_blank" class="btn btn-sm btn-primary">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
              Navegar
            </a>
          </div>
        </div>
      </CustomMapPopup>
    </transition>
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
  emits: ['update:modelValue'],  setup(props, { emit }) {
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
      
      return { lat, lng };
    });
      // Computed properties for charger information
    const getChargerName = computed(() => {
      if (!props.charger) return '';
      
      return props.charger.desc_loja || props.charger.Localizacao || props.charger.Posto_ID || 'Posto de Carregamento';
    });
    
    const getChargerLocation = computed(() => {
      if (!props.charger) return '';
      
      const location: string[] = [];
      if (props.charger.MORADA) location.push(props.charger.MORADA);
      if (props.charger.Municipio) location.push(props.charger.Municipio);
      
      return location.join(', ') || 
        props.charger.Localizacao ||
        `${parseFloat(props.charger.Latitude).toFixed(4)}, ${parseFloat(props.charger.Longitude).toFixed(4)}`;
    });
    
    const getStatusClass = computed(() => {
      if (!props.charger || !props.charger.Estado) return '';
      
      const status = props.charger.Estado.toLowerCase();
      if (status.includes('disponível') || status.includes('disponivel')) {
        return 'text-success';
      } else if (status.includes('ocupado')) {
        return 'text-error';
      } else if (status.includes('offline') || status.includes('indisponível') || status.includes('indisponivel')) {
        return 'text-warning';
      }
      
      return '';
    });
    
    const formatDistance = computed(() => {
      if (!props.charger || !props.charger.distance_km) return '';
      
      const distance = typeof props.charger.distance_km === 'number' 
        ? props.charger.distance_km 
        : parseFloat(props.charger.distance_km);
        
      return distance.toFixed(1);
    });    const googleMapsUrl = computed(() => {
      if (!props.charger || !props.charger.Link_Gmap) return null;
      return props.charger.Link_Gmap;
    });
    
    const miioUrl = computed(() => {
      if (!props.charger || !props.charger.Link_MIIO) return null;
      return props.charger.Link_MIIO;
    });    // Methods
    const openMIIO = () => {
      if (!props.charger || !props.charger.Link_MIIO) return;
      
      window.open(props.charger.Link_MIIO, '_blank');
    };return {
      isVisible,
      position,
      getChargerName,
      getChargerLocation,
      getStatusClass,
      formatDistance,
      googleMapsUrl,
      miioUrl,
      openMIIO
    };
  }
});
</script>

<style scoped>
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.3s;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}

.divider {
  height: 1px;
  background-color: hsl(var(--b3));
  width: 100%;
}
</style>
