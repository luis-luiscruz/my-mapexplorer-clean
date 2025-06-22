<template>
  <div id="app">
    <!-- Show login form if not authenticated -->
    <LoginForm v-if="!isAuthenticated" />
      <!-- Show main app if authenticated -->
    <MapExplorer v-else :show-locations="showLocations" @showLocationsChanged="handleShowLocationsChanged" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useAuth } from './composables/useAuth'
import LoginForm from './components/LoginForm.vue'
import MapExplorer from './components/MapExplorer.vue'

const { isAuthenticated, currentUser, loadUserFromStorage, updateUserPreferences } = useAuth()

// Track if locations should be shown (from user preferences)
const showLocations = ref(false)

// Load user from localStorage on app start
onMounted(() => {
  loadUserFromStorage()
})

// Watch for user changes to update showLocations
watch(() => currentUser.value?.preferences.showLocations, (newValue) => {
  if (newValue !== undefined && newValue !== showLocations.value) {
    showLocations.value = newValue
    console.log('🔄 TOGGLE: App updated showLocations from user preferences:', newValue)
  }
}, { immediate: true })

// Handle showLocations changes from MapExplorer
const handleShowLocationsChanged = (value: boolean) => {
  console.log('🔄 TOGGLE: App handleShowLocationsChanged called with value:', value);
  if (showLocations.value !== value) {
    showLocations.value = value
    // Update user preferences immediately
    updateUserPreferences({ showLocations: value })
    console.log('🔄 TOGGLE: App showLocations updated to:', showLocations.value);
  }
}
</script>

<style>
/* Global styles */
html, body, #app {
  height: 100vh;
  margin: 0;
  padding: 0;
}

/* Ensure proper theme inheritance */
html[data-theme="dark"] {
  color-scheme: dark;
}

html[data-theme="light"] {
  color-scheme: light;
}
</style>