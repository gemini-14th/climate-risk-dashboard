import axios from 'axios';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' }
});

// Request interceptor — logs all API calls in development
apiClient.interceptors.request.use(config => {
  if (import.meta.env.DEV) {
    console.log(`[API] ${config.method?.toUpperCase()} ${config.url}`);
  }
  return config;
});

// Response interceptor — normalises errors
apiClient.interceptors.response.use(
  response => response,
  error => {
    const message = error.response?.data?.error || error.message || 'API request failed';
    console.error('[API Error]', message);
    return Promise.reject(new Error(message));
  }
);

export const getForecast = async (county = 'Nairobi') => {
  const res = await apiClient.get(`/api/forecast?county=${county}`);
  return res.data;
};

export const getRiskData = async () => {
  const res = await apiClient.get('/api/risk');
  return res.data;
};

export const getAlerts = async () => {
  const res = await apiClient.get('/api/alerts');
  return res.data;
};

export const getHealth = async () => {
  const res = await apiClient.get('/api/health');
  return res.data;
};

export const getCountyDetail = async (countyName) => {
  const slug = countyName.toLowerCase().replace(/\s+/g, '-').replace(/'/g, '');
  const res  = await apiClient.get(`/api/county/${slug}`);
  return res.data;
};
