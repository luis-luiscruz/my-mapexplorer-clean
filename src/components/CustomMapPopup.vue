<template>  <div
    v-if="visible"
    class="custom-map-popup"
    :class="{ 'popup-below': isPositionedBelow }"    :style="{
      left: `${position.x}px`,
      top: `${position.y}px`
    }"
    @mousedown="onDragStart"
    @touchstart="onTouchStart"
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
    },    title: {
      type: String,
      default: 'Informações'
    },
    forceTopPosition: {
      type: Boolean,
      default: false
    }
  },
  emits: ['update:modelValue'],
  setup(props, { emit }) {    const visible = ref(props.modelValue);
    const position = ref({ x: 0, y: 0 });
    const isPositionedBelow = ref(false);    // Watch for visibility changes
    watch(() => props.modelValue, (newValue) => {
      visible.value = newValue;
      if (newValue) {
        updatePosition();
      }
    });
      // Watch for forceTopPosition changes
    watch(() => props.forceTopPosition, (newValue) => {
      console.log('forceTopPosition changed to:', newValue);
      if (visible.value) {
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
      let safeY;
      
      console.log('updatePosition called, forceTopPosition:', props.forceTopPosition);
        if (props.forceTopPosition) {
        // Position popup just below the navbar when forceTopPosition is true
        safeY = navbarHeight + minGapFromNavbar; // Position right below navbar
        safeX = Math.max(20, Math.min(point.x, bounds.width - 700)); // Center horizontally but keep within bounds for wider popup
        console.log('Positioning at top, safeY:', safeY);
      } else {
        // Normal positioning relative to marker
        safeY = Math.max(point.y - 160, navbarHeight + minGapFromNavbar); // 120px from top minimum
        console.log('Normal positioning, safeY:', safeY);
      }
      
      position.value = { x: safeX, y: safeY };
    };
    
    // Close popup
    const close = () => {
      visible.value = false;
      emit('update:modelValue', false);
    };
      // --- Draggable logic with touch support ---
    let dragOffset = { x: 0, y: 0 };
    let isDragging = false;
    let dragStartTime = 0;
    let dragStartPosition = { x: 0, y: 0 };

    const onDragStart = (e: MouseEvent) => {
      // Check if the click target is a button or interactive element
      const target = e.target as HTMLElement;
      if (target.tagName === 'BUTTON' || target.closest('button') || 
          target.tagName === 'A' || target.closest('a') ||
          target.tagName === 'INPUT' || target.closest('input')) {
        return; // Don't start dragging if clicking on interactive elements
      }

      dragStartTime = Date.now();
      dragStartPosition = { x: e.clientX, y: e.clientY };
      
      isDragging = true;
      dragOffset = {
        x: e.clientX - position.value.x,
        y: e.clientY - position.value.y
      };
      document.addEventListener('mousemove', onDrag);
      document.addEventListener('mouseup', onDragEnd);
    };

    const onTouchStart = (e: TouchEvent) => {
      // Check if the touch target is a button or interactive element
      const target = e.target as HTMLElement;
      if (target.tagName === 'BUTTON' || target.closest('button') || 
          target.tagName === 'A' || target.closest('a') ||
          target.tagName === 'INPUT' || target.closest('input')) {
        return; // Don't start dragging if touching interactive elements
      }

      e.preventDefault(); // Prevent default touch behavior
      
      const touch = e.touches[0];
      dragStartTime = Date.now();
      dragStartPosition = { x: touch.clientX, y: touch.clientY };
      
      isDragging = true;
      dragOffset = {
        x: touch.clientX - position.value.x,
        y: touch.clientY - position.value.y
      };
      document.addEventListener('touchmove', onTouchMove, { passive: false });
      document.addEventListener('touchend', onTouchEnd);
    };

    const onDrag = (e: MouseEvent) => {
      if (!isDragging) return;
      e.preventDefault();
      position.value = {
        x: e.clientX - dragOffset.x,
        y: e.clientY - dragOffset.y
      };
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!isDragging) return;
      e.preventDefault();
      const touch = e.touches[0];
      position.value = {
        x: touch.clientX - dragOffset.x,
        y: touch.clientY - dragOffset.y
      };
    };

    const onDragEnd = () => {
      if (!isDragging) return;
      
      // Check if this was a quick tap (not a drag)
      const dragDuration = Date.now() - dragStartTime;
      const currentPosition = { x: position.value.x, y: position.value.y };
      const dragDistance = Math.sqrt(
        Math.pow(dragStartPosition.x - currentPosition.x, 2) +
        Math.pow(dragStartPosition.y - currentPosition.y, 2)
      );
      
      // If it was a quick tap with minimal movement, don't consider it a drag
      if (dragDuration < 200 && dragDistance < 10) {
        isDragging = false;
      }
      
      document.removeEventListener('mousemove', onDrag);
      document.removeEventListener('mouseup', onDragEnd);
      isDragging = false;
    };

    const onTouchEnd = () => {
      if (!isDragging) return;
      
      // Check if this was a quick tap (not a drag)
      const dragDuration = Date.now() - dragStartTime;
      const currentPosition = { x: position.value.x, y: position.value.y };
      const dragDistance = Math.sqrt(
        Math.pow(dragStartPosition.x - currentPosition.x, 2) +
        Math.pow(dragStartPosition.y - currentPosition.y, 2)
      );
      
      // If it was a quick tap with minimal movement, don't consider it a drag
      if (dragDuration < 200 && dragDistance < 10) {
        isDragging = false;
      }
      
      document.removeEventListener('touchmove', onTouchMove);
      document.removeEventListener('touchend', onTouchEnd);
      isDragging = false;
    };
    
    return {
      visible,
      position,
      isPositionedBelow,
      close,
      onDragStart,
      onTouchStart
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
  max-width: 700px;
  width: 680px;
  margin-top: 0px;
  background: #1f2937; /* cor base-200 do DaisyUI */
  border: 1px solid #374151; /* cor base-300 do DaisyUI */
  overflow: visible;
  padding: 6px;
  border-radius: 8px;
  /* Improve touch interaction */
  touch-action: pan-x pan-y;
  -webkit-touch-callout: none;
  -webkit-user-select: none;
  -khtml-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  user-select: none;
}

/* Ensure buttons and interactive elements are always clickable */
.custom-map-popup button,
.custom-map-popup a,
.custom-map-popup input,
.custom-map-popup [role="button"] {
  pointer-events: auto !important;
  touch-action: manipulation;
  -webkit-tap-highlight-color: rgba(0, 0, 0, 0.1);
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
  /* Ensure close button is always clickable */
  pointer-events: auto !important;
  touch-action: manipulation;
}

.custom-map-popup .close-btn:hover {
  background: rgba(220, 38, 38, 1);
  border-color: white;
  transform: scale(1.15);
  box-shadow: 0 6px 16px rgba(220, 38, 38, 0.4);
}

.custom-map-popup .close-btn:active {
  transform: scale(0.95);
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

/* Mobile-specific improvements */
@media (max-width: 768px) {
  .custom-map-popup {
    width: calc(100vw - 40px);
    max-width: 400px;
    transform: translate(-50%, 0%);
  }
  
  .custom-map-popup .close-btn {
    width: 36px;
    height: 36px;
    top: 6px;
    right: 6px;
  }
}
</style>
