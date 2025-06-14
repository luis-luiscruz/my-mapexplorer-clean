import { ref, computed } from 'vue'

export interface User {
  id: string
  username: string
  email: string
  preferences: {
    showLocations: boolean
    theme: string
  }
}

const currentUser = ref<User | null>(null)
const isAuthenticated = computed(() => currentUser.value !== null)

export const useAuth = () => {
  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      // Simulação de login - em produção, faria uma chamada à API
      if (username && password) {
        const user: User = {
          id: '1',
          username,
          email: `${username}@example.com`,
          preferences: {
            showLocations: false, // Por padrão, não carrega locais
            theme: 'light'
          }
        }
        currentUser.value = user
        
        // Salvar no localStorage para persistência
        localStorage.setItem('user', JSON.stringify(user))
        return true
      }
      return false
    } catch (error) {
      console.error('Login error:', error)
      return false
    }
  }

  const register = async (username: string, email: string, password: string): Promise<boolean> => {
    try {
      // Simulação de registro - em produção, faria uma chamada à API
      if (username && email && password) {
        const user: User = {
          id: Date.now().toString(),
          username,
          email,
          preferences: {
            showLocations: false,
            theme: 'light'
          }
        }
        currentUser.value = user
        
        // Salvar no localStorage para persistência
        localStorage.setItem('user', JSON.stringify(user))
        return true
      }
      return false
    } catch (error) {
      console.error('Register error:', error)
      return false
    }
  }

  const logout = () => {
    currentUser.value = null
    localStorage.removeItem('user')
  }
  const updateUserPreferences = (preferences: Partial<User['preferences']>) => {
    if (currentUser.value) {
      console.log('🔄 AUTH: Updating user preferences:', preferences)
      console.log('🔄 AUTH: Current preferences before update:', currentUser.value.preferences)
      
      currentUser.value.preferences = { ...currentUser.value.preferences, ...preferences }
      localStorage.setItem('user', JSON.stringify(currentUser.value))
      
      console.log('🔄 AUTH: Updated preferences:', currentUser.value.preferences)
      
      // Force reactivity by creating a new object
      const updatedUser = { ...currentUser.value }
      currentUser.value = updatedUser
    }
  }

  const loadUserFromStorage = () => {
    const storedUser = localStorage.getItem('user')
    if (storedUser) {
      try {
        currentUser.value = JSON.parse(storedUser)
      } catch (error) {
        console.error('Error loading user from storage:', error)
        localStorage.removeItem('user')
      }
    }
  }

  return {
    currentUser: computed(() => currentUser.value),
    isAuthenticated,
    login,
    register,
    logout,
    updateUserPreferences,
    loadUserFromStorage
  }
}
