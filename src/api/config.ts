// IntelliPath API Configuration
export const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_INTELLIPATH_API_URL || 'http://localhost:8000',
  API_VERSION: 'v1',
  TIMEOUT: 30000,
};

export const getApiUrl = (endpoint: string) => {
  return `${API_CONFIG.BASE_URL}/api/${API_CONFIG.API_VERSION}${endpoint}`;
};
