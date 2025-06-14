import { ref, computed } from 'vue';
import { api, type ConnectionStatus } from '../services/api-readonly';

// Global reactive state for connection status
const connectionStatus = ref<ConnectionStatus>({
  status: 'disconnected',
  message: 'Not connected',
  timestamp: new Date().toISOString()
});

const isChecking = ref(false);

export function useConnectionStatus() {
  // Computed properties for UI
  const statusIndicator = computed(() => {
    switch (connectionStatus.value.status) {
      case 'connected':
        return {
          color: 'bg-green-500',
          text: 'BD Online',
          animate: false
        };
      case 'connecting':
        return {
          color: 'bg-yellow-500',
          text: 'Conectando...',
          animate: true
        };
      case 'error':
        return {
          color: 'bg-red-500',
          text: 'BD Offline',
          animate: true
        };
      default:
        return {
          color: 'bg-gray-400',
          text: 'BD Desconhecida',
          animate: false
        };
    }
  });

  const statusTooltip = computed(() => {
    const time = new Date(connectionStatus.value.timestamp).toLocaleTimeString('pt-PT');
    let tooltip = `${connectionStatus.value.message}\nÚltima verificação: ${time}`;
    
    if (connectionStatus.value.database?.recordCount !== undefined) {
      tooltip += `\nRegistos: ${new Intl.NumberFormat('pt-PT').format(connectionStatus.value.database.recordCount)}`;
    }
    
    if (connectionStatus.value.database?.responseTime) {
      tooltip += `\nTempo resposta: ${connectionStatus.value.database.responseTime}ms`;
    }
    
    if (connectionStatus.value.error) {
      tooltip += `\nErro: ${connectionStatus.value.error}`;
    }
    
    return tooltip;
  });

  // Methods
  const checkConnectionStatus = async () => {
    if (isChecking.value) return;
    
    try {
      const newStatus = await api.getConnectionStatus();
      connectionStatus.value = newStatus;
    } catch (error) {
      connectionStatus.value = {
        status: 'error',
        message: 'Falha na verificação',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      };
    }
  };

  const testConnection = async () => {
    if (isChecking.value) return;
    
    isChecking.value = true;
    connectionStatus.value = {
      ...connectionStatus.value,
      status: 'connecting',
      message: 'A testar conexão...',
      timestamp: new Date().toISOString()
    };
    
    try {
      const newStatus = await api.testConnection();
      connectionStatus.value = newStatus;
    } catch (error) {
      connectionStatus.value = {
        status: 'error',
        message: 'Teste de conexão falhou',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      };
    } finally {
      isChecking.value = false;
    }
  };

  // Auto-check connection status periodically
  const startPeriodicCheck = () => {
    // Initial check
    checkConnectionStatus();
    
    // Check every 30 seconds
    return setInterval(checkConnectionStatus, 30000);
  };

  return {
    connectionStatus: connectionStatus,
    isChecking,
    statusIndicator,
    statusTooltip,
    checkConnectionStatus,
    testConnection,
    startPeriodicCheck
  };
}
