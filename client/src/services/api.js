import axios from 'axios';

// Environment-based API configuration
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? process.env.REACT_APP_API_URL || '/api'
  : process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const API_TIMEOUT = parseInt(process.env.REACT_APP_API_TIMEOUT) || 10000;

console.log(`🔗 API Base URL: ${API_BASE_URL}`);
console.log(`⏱️ API Timeout: ${API_TIMEOUT}ms`);

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for debugging
api.interceptors.request.use(
  (config) => {
    console.log(`🔄 API Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('❌ API Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    console.log(`✅ API Response: ${response.status} ${response.config.url}`);
    return response;
  },
  (error) => {
    console.error('❌ API Response Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

// Device API functions
export const deviceAPI = {
  // Get all devices
  getDevices: () => api.get('/devices'),
  
  // Get device latest data
  getDeviceLatest: (deviceId) => api.get(`/devices/${deviceId}/latest`),
  
  // Get device sensor logs
  getDeviceLogs: (deviceId, params = {}) => api.get(`/devices/${deviceId}/logs`, { params }),
  
  // Send manual command
  sendCommand: (deviceId, command) => api.post(`/devices/${deviceId}/command`, command),
  
  // Get device commands
  getCommands: (deviceId, params = {}) => api.get(`/devices/${deviceId}/commands`, { params }),
};

// System API functions
export const systemAPI = {
  // Health check
  healthCheck: () => api.get('/health'),
};

export default api;