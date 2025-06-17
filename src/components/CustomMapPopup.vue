<template>  <div
    v-if="visible"
    class="custom-map-popup"
    :class="{ 'popup-below': isPositionedBelow }"    :style="{
      left: `${position.x}px`,
      top: `${position.y}px`
    }"
  >      <button @click="close" class="close-btn">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
      <slot></slot>
    <div class="custom-map-popup-arrow"></div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, watch, onMounted, onUnmounted } from 'vue';

export default defineComponent({
  name: 'CustomMapPopup',
  props: {
    modelValue: {
      type: Boolean,
      default: false
    },
    latLng: {
      type: Object,
      required: true,
      validator: (value: any) => {
        return value && typeof value.lat === 'number' && typeof value.lng === 'number';
      }
    },    map: {
      type: Object,
      required: true
    },
    title: {
      type: String,
      default: 'Informações'
    }
  },
  emits: ['update:modelValue'],
  setup(props, { emit }) {    const visible = ref(props.modelValue);
    const position = ref({ x: 0, y: 0 });
    const isPositionedBelow = ref(false);// Watch for visibility changes
    watch(() => props.modelValue, (newValue) => {
      visible.value = newValue;
      if (newValue) {
        updatePosition();
      }
    });
    
    // Watch for map movement and update position
    const mapMoveHandler = () => {
      if (visible.value) {
        updatePosition();
      }
    };
    
    onMounted(() => {
      // Add event listener for map move/zoom
      if (props.map) {
        props.map.on('move', mapMoveHandler);
        props.map.on('zoom', mapMoveHandler);
      }
    });
    
    onUnmounted(() => {
      // Remove event listeners
      if (props.map) {
        props.map.off('move', mapMoveHandler);
        props.map.off('zoom', mapMoveHandler);
      }
    });    // Update popup position based on latLng with edge protection
    const updatePosition = () => {
      if (!props.map || !props.latLng) return;
      
      // Convert geographic coordinates to pixel coordinates
      const point = props.map.latLngToContainerPoint([props.latLng.lat, props.latLng.lng]);
      
      // Get map container dimensions
      const container = props.map.getContainer();
      const bounds = container.getBoundingClientRect();
        // Fixed navbar height and minimum gap
      const navbarHeight = 64;
      const minGapFromNavbar = 30; // Increased gap
      const popupHeight = 150;      let safeX = point.x;
      let safeY = Math.max(point.y - 160, 120); // 120px from top minimum
      
      position.value = { x: safeX, y: safeY };
    };
    
    // Close popup
    const close = () => {
      visible.value = false;
      emit('update:modelValue', false);
    };
      return {
      visible,
      position,
      isPositionedBelow,
      close
    };
  }
});
</script>

<style scoped>
.custom-map-popup {
  position: absolute;  
  z-index: 10000;
  transform: translate(-50%, 0%);
  pointer-events: auto;
  max-width: 500px;
  width: 480px;
  margin-top: 0px;
  background: #1f2937; /* cor base-200 do DaisyUI */
  border: 1px solid #374151; /* cor base-300 do DaisyUI */
  overflow: visible;
  padding: 6px;
  border-radius: 8px;
}

.custom-map-popup .close-btn {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 32px;
  height: 32px;
  background: rgba(220, 38, 38, 0.9);
  color: white;
  border: 2px solid rgba(255, 255, 255, 0.8);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 99999;
  transition: all 0.2s ease;
  backdrop-filter: blur(10px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.5);
  font-weight: bold;
}

.custom-map-popup .close-btn:hover {
  background: rgba(220, 38, 38, 1);
  border-color: white;
  transform: scale(1.15);
  box-shadow: 0 6px 16px rgba(220, 38, 38, 0.4);
}

.custom-map-popup .custom-map-popup-arrow {
  width: 0;
  height: 0;
  border-left: 12px solid transparent;
  border-right: 12px solid transparent;
  border-top: 12px solid #1f2937; /* mesma cor do fundo */
  position: absolute;
  left: 50%;
  bottom: -12px;
  transform: translateX(-50%);
  z-index: 999;
  filter: drop-shadow(0 2px 4px rgba(0,0,0,0.2));
}

/* Estilos para quando o popup está posicionado abaixo do marker */
.custom-map-popup.popup-below {
  transform: translate(-50%, 0%);
  margin-top: 15px;
}

.custom-map-popup.popup-below .custom-map-popup-arrow {
  border-top: none;
  border-bottom: 12px solid #1f2937; /* seta apontando para cima */
  top: -12px;
  bottom: auto;
}
</style>
