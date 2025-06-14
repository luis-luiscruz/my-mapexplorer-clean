<template>
  <div
    v-if="visible"
    class="custom-map-popup"
    :style="{
      left: `${position.x}px`,
      top: `${position.y - 10}px`
    }"
  >
    <div class="custom-map-popup-content bg-base-100 text-base-content rounded-lg shadow-lg">
      <div class="flex justify-between items-center p-3 border-b border-base-300">
        <div class="font-semibold text-sm">{{ title }}</div>
        <button @click="close" class="btn btn-ghost btn-xs btn-circle">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <div class="p-3">
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
  setup(props, { emit }) {
    const visible = ref(props.modelValue);
    const position = ref({ x: 0, y: 0 });    // Watch for visibility changes
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
    });    // Update popup position based on latLng
    const updatePosition = () => {
      if (!props.map || !props.latLng) return;
      
      // Convert geographic coordinates to pixel coordinates
      const point = props.map.latLngToContainerPoint([props.latLng.lat, props.latLng.lng]);
      position.value = { x: point.x, y: point.y };
    };
    
    // Close popup
    const close = () => {
      visible.value = false;
      emit('update:modelValue', false);
    };
    
    return {
      visible,
      position,
      close
    };
  }
});
</script>

<style scoped>
.custom-map-popup {
  position: absolute;
  z-index: 1000;
  transform: translate(-50%, -100%);
  pointer-events: auto;
  max-width: 300px;
  width: 280px;
  margin-top: -15px;
  animation: popup-fade-in 0.2s ease-out;
}

.custom-map-popup-content {
  position: relative;
  border-radius: 0.5rem;
  overflow: hidden;
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.2), 0 10px 10px -5px rgba(0, 0, 0, 0.1);
  border: 1px solid hsl(var(--b3));
}

.custom-map-popup-arrow {
  width: 15px;
  height: 15px;
  background: hsl(var(--b1));
  border-right: 1px solid hsl(var(--b3));
  border-bottom: 1px solid hsl(var(--b3));
  position: absolute;
  left: 50%;
  bottom: -8px;
  transform: translateX(-50%) rotate(45deg);
  z-index: 999;
}

@keyframes popup-fade-in {
  from {
    opacity: 0;
    transform: translate(-50%, -90%);
  }
  to {
    opacity: 1;
    transform: translate(-50%, -100%);
  }
}
</style>
