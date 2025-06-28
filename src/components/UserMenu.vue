<template>
  <div class="dropdown dropdown-end">
    <div tabindex="0" role="button" class="btn btn-ghost btn-circle avatar">
      <div class="avatar placeholder">
        <div class="bg-neutral-focus text-neutral-content rounded-full w-10">
          <span class="text-sm">{{ userInitials }}</span>
        </div>
      </div>
    </div>
    
    <ul tabindex="0" class="mt-3 z-[1] p-2 shadow menu menu-sm dropdown-content bg-base-100 rounded-box w-80">
      <!-- User Info -->
      <li class="menu-title">
        <span class="text-base font-medium">{{ currentUser?.username }}</span>
        <span class="text-xs text-base-content/60">{{ currentUser?.email }}</span>
      </li>
      
      <div class="divider my-1"></div>
        <!-- User Preferences -->
      <li class="menu-title">
        <span>Preferências</span>
      </li>
      
        <div class="divider my-1"></div>
      
      <!-- Menu Items -->
      <li><a><i class="ri-settings-line"></i> Configurações</a></li>
      <li><a @click="runHomeMonitoring"><i class="ri-home-2-line"></i> Home Monitoring</a></li>
      <li><a><i class="ri-help-line"></i> Ajuda</a></li>
      
      <div class="divider my-1"></div>
      
      <!-- Logout -->
      <li>
        <a @click="handleLogout" class="text-error">
          <i class="ri-logout-line"></i>
          Sair
        </a>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useAuth } from '../composables/useAuth'

const { currentUser, logout } = useAuth()

// Computed properties
const userInitials = computed(() => {
  if (!currentUser.value) return '??'
  const names = currentUser.value.username.split(' ')
  if (names.length >= 2) {
    return `${names[0][0]}${names[1][0]}`.toUpperCase()
  }
  return currentUser.value.username.substring(0, 2).toUpperCase()
})

const handleLogout = () => {
  logout()
}

// Emit event to parent component (MapExplorer) to handle home monitoring
const emit = defineEmits(['start-home-monitoring'])

const runHomeMonitoring = async () => {
  emit('start-home-monitoring')
}
</script>

<style scoped>
.dropdown-content {
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
}
</style>
