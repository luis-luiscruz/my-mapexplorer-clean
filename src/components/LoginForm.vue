<template>
  <div class="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
    <div class="w-full max-w-md">
      <div class="bg-white rounded-2xl shadow-xl p-8">
        <!-- Logo/Header -->
        <div class="text-center mb-8">
          <h1 class="text-3xl font-bold text-gray-800 mb-2">MapExplorer</h1>
          <p class="text-gray-600">Entre na sua conta ou crie uma nova</p>
        </div>

        <!-- Tabs -->
        <div class="tabs tabs-boxed mb-6">
          <a 
            class="tab flex-1" 
            :class="{ 'tab-active': !isRegisterMode }"
            @click="isRegisterMode = false"
          >
            Login
          </a>
          <a 
            class="tab flex-1" 
            :class="{ 'tab-active': isRegisterMode }"
            @click="isRegisterMode = true"
          >
            Registrar
          </a>
        </div>

        <!-- Login Form -->
        <form @submit.prevent="isRegisterMode ? handleRegister() : handleLogin()" v-if="!isRegisterMode">
          <div class="space-y-4">
            <div class="form-control">
              <label class="label">
                <span class="label-text font-medium">Usuário</span>
              </label>
              <input 
                type="text" 
                v-model="loginForm.username"
                placeholder="Digite seu usuário" 
                class="input input-bordered w-full"
                required
              />
            </div>
            
            <div class="form-control">
              <label class="label">
                <span class="label-text font-medium">Senha</span>
              </label>
              <input 
                type="password" 
                v-model="loginForm.password"
                placeholder="Digite sua senha" 
                class="input input-bordered w-full"
                required
              />
            </div>

            <button 
              type="submit" 
              class="btn btn-primary w-full mt-6"
              :class="{ 'loading': isLoading }"
              :disabled="isLoading"
            >
              {{ isLoading ? 'Entrando...' : 'Entrar' }}
            </button>
          </div>
        </form>

        <!-- Register Form -->
        <form @submit.prevent="handleRegister()" v-else>
          <div class="space-y-4">
            <div class="form-control">
              <label class="label">
                <span class="label-text font-medium">Usuário</span>
              </label>
              <input 
                type="text" 
                v-model="registerForm.username"
                placeholder="Escolha um usuário" 
                class="input input-bordered w-full"
                required
              />
            </div>
            
            <div class="form-control">
              <label class="label">
                <span class="label-text font-medium">Email</span>
              </label>
              <input 
                type="email" 
                v-model="registerForm.email"
                placeholder="Digite seu email" 
                class="input input-bordered w-full"
                required
              />
            </div>
            
            <div class="form-control">
              <label class="label">
                <span class="label-text font-medium">Senha</span>
              </label>
              <input 
                type="password" 
                v-model="registerForm.password"
                placeholder="Crie uma senha" 
                class="input input-bordered w-full"
                required
              />
            </div>

            <button 
              type="submit" 
              class="btn btn-primary w-full mt-6"
              :class="{ 'loading': isLoading }"
              :disabled="isLoading"
            >
              {{ isLoading ? 'Criando conta...' : 'Criar Conta' }}
            </button>
          </div>
        </form>

        <!-- Error Message -->
        <div v-if="errorMessage" class="alert alert-error mt-4">
          <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{{ errorMessage }}</span>
        </div>

        <!-- Demo Access -->
        <div class="divider mt-6">ou</div>
        <button 
          @click="handleDemoLogin()" 
          class="btn btn-outline w-full"
          :disabled="isLoading"
        >
          Acesso Demo
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useAuth } from '../composables/useAuth'

const { login, register } = useAuth()

const isRegisterMode = ref(false)
const isLoading = ref(false)
const errorMessage = ref('')

const loginForm = ref({
  username: '',
  password: ''
})

const registerForm = ref({
  username: '',
  email: '',
  password: ''
})

const handleLogin = async () => {
  isLoading.value = true
  errorMessage.value = ''
  
  try {
    const success = await login(loginForm.value.username, loginForm.value.password)
    if (!success) {
      errorMessage.value = 'Usuário ou senha incorretos'
    }
  } catch (error) {
    errorMessage.value = 'Erro ao fazer login. Tente novamente.'
  } finally {
    isLoading.value = false
  }
}

const handleRegister = async () => {
  isLoading.value = true
  errorMessage.value = ''
  
  try {
    const success = await register(
      registerForm.value.username, 
      registerForm.value.email, 
      registerForm.value.password
    )
    if (!success) {
      errorMessage.value = 'Erro ao criar conta. Verifique os dados e tente novamente.'
    }
  } catch (error) {
    errorMessage.value = 'Erro ao criar conta. Tente novamente.'
  } finally {
    isLoading.value = false
  }
}

const handleDemoLogin = async () => {
  isLoading.value = true
  errorMessage.value = ''
  
  try {
    await login('demo', 'demo123')
  } catch (error) {
    errorMessage.value = 'Erro ao acessar modo demo.'
  } finally {
    isLoading.value = false
  }
}
</script>
