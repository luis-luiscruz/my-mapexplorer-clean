<template>  <div
    v-if="visible"
    class="custom-map-popup"
    :class="{ 'popup-below': isPositionedBelow }"
    :style="{
      left: `${position.x}px`,
      top: `${position.y - (isPositionedBelow ? -20 : 20)}px`
    }"
  ><div class="custom-map-popup-content rounded-lg shadow-lg">
      <div class="px-0 py-0 relative">
        <button @click="close" class="close-btn">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <slot></slot>
      </div>
    </div>
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
        // Detect navbar/topbar height dynamically
      const navbar = document.querySelector('nav, .navbar, .top-bar, header') as HTMLElement;
      const navbarHeight = navbar ? navbar.offsetHeight : 64; // Default to 64px if not found
      
      // Popup height estimate (for better positioning)
      const popupHeight = 200; // Approximate popup height
        // Calculate safe horizontal position
      let safeX = Math.min(Math.max(point.x, 180), bounds.width - 180);
        // Calculate safe vertical position with navbar awareness
      let safeY = point.y;
      let positionedBelow = false;
      
      // Check if popup would go above the navbar
      if (safeY - popupHeight < navbarHeight + 10) {
        // Position popup below the marker instead of above
        safeY = Math.max(point.y + 40, navbarHeight + popupHeight + 20);
        positionedBelow = true;
        
        // If still not enough space below, try to pan the map
        if (safeY + 50 > bounds.height) {
          // Pan map up to make room for popup
          const targetLat = props.latLng.lat - 0.01; // Move map down slightly
          props.map.panTo([targetLat, props.latLng.lng], { animate: true, duration: 0.3 });
          safeY = navbarHeight + popupHeight + 20;
        }
      }
      
      isPositionedBelow.value = positionedBelow;
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
  position: absolute;  z-index: 10000;
  transform: translate(-50%, -100%);
  pointer-events: auto;
  max-width: 420px;
  width: 384px;
  margin-top: -15px;
}

.custom-map-popup-content {
  position: relative;
  background: #1f2937; /* cor base-200 do DaisyUI */
  border: 1px solid #374151; /* cor base-300 do DaisyUI */
}

.close-btn {
  position: absolute;
  top: 0px;
  right: 0px;
  width: 28px;
  height: 28px;
  background: rgba(0,0,0,0.5);
  color: white;
  border: none;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 10001;
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);
}

.close-btn:hover {
  background: rgba(0,0,0,0.7);
  transform: scale(1.1);
}

.custom-map-popup-arrow {
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
