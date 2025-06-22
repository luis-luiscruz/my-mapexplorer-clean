<template>
  <div class="charger-details space-y-4 animate-pulse">
    <!-- Hero section skeleton -->
    <div class="flex items-start gap-4">
      <div class="flex-1">
        <div class="h-5 bg-base-300/50 rounded-lg w-3/4 mb-2 shimmer"></div>
        <div class="h-4 bg-base-300/30 rounded w-1/2 shimmer"></div>
      </div>
      <div class="flex flex-col items-end gap-2">
        <div class="h-6 w-16 bg-base-300/50 rounded-full shimmer"></div>
        <div class="text-right">
          <div class="h-6 w-12 bg-base-300/50 rounded mb-1 shimmer"></div>
          <div class="h-3 w-10 bg-base-300/30 rounded shimmer"></div>
        </div>
      </div>
    </div>

    <!-- Info grid skeleton -->
    <div class="grid grid-cols-2 gap-3">
      <div v-for="i in 4" :key="i" class="bg-base-200/30 rounded-lg p-3 space-y-1">
        <div class="h-3 bg-base-300/40 rounded w-2/3 shimmer"></div>
        <div class="h-4 bg-base-300/50 rounded w-1/2 shimmer"></div>
      </div>
    </div>

    <!-- Buttons skeleton -->
    <div class="flex gap-2 pt-2">
      <div class="h-8 bg-base-300/50 rounded flex-1 shimmer"></div>
      <div class="h-8 bg-base-300/50 rounded flex-1 shimmer"></div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'ChargerInfoSkeleton'
});
</script>

<style scoped>
.animate-pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.7;
  }
}
</style>
