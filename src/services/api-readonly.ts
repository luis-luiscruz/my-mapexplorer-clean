// API Service for Read-Only Database Connection
// Using different base URLs for development and production
const BASE_URL = window.location.hostname === 'localhost' ? 'http://localhost:3010/api' : '/api';

export interface ConnectionStatus {
  status: 'connected' | 'disconnected' | 'connecting' | 'error';
  message: string;
  timestamp: string;
  error?: string;
  database?: {
    name?: string;
    version?: string;
    comment?: string;
    table?: string;
    tableExists?: boolean;
    recordCount?: number;
    host?: string;
    port?: string;
    responseTime?: number;
  };
  serverTime?: string;
}

export interface ApiResponse<T = any> {
  data?: T;
  count?: number;
  message?: string;
  error?: string;
}

export const api = {
  // Connection status endpoints
  getConnectionStatus: async (): Promise<ConnectionStatus> => {
    try {
      const response = await fetch(`${BASE_URL}/connection-status`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    } catch (error) {
      return {
        status: 'error',
        message: 'Failed to connect to server',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  },

  testConnection: async (): Promise<ConnectionStatus> => {
    try {
      const response = await fetch(`${BASE_URL}/test-connection`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    } catch (error) {
      return {
        status: 'error',
        message: 'Connection test failed',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }  },
  // Electric Vehicle Charger endpoints - NO LIMITS
  getChargersInBounds: async (bounds: {north: number, south: number, east: number, west: number}): Promise<ApiResponse> => {
    try {
      const { north, south, east, west } = bounds;
      const response = await fetch(`${BASE_URL}/chargers/bounds?north=${north}&south=${south}&east=${east}&west=${west}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    } catch (error) {
      return {
        data: [],
        count: 0,
        error: error instanceof Error ? error.message : 'Failed to fetch chargers in bounds'
      };
    }
  },
};
