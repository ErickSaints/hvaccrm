import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getCached, setCache } from './cache';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'https://hvaccrm.production.up.railway.app/api';

const api = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use(async (config) => {
  try {
    const token = await AsyncStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch {}
  return config;
});

api.interceptors.response.use(
  (response) => {
    if (response.config.method === 'get' || response.config.method === 'GET') {
      const key = response.config.url + JSON.stringify(response.config.params || {});
      setCache(key, response.data);
    }
    return response;
  },
  async (error) => {
    if (error.response?.status === 401) {
      await AsyncStorage.removeItem('token');
    }
    if (!error.response && error.config?.method === 'get') {
      const key = error.config.url + JSON.stringify(error.config.params || {});
      const cached = await getCached(key);
      if (cached) return Promise.resolve({ data: cached, cached: true });
    }
    return Promise.reject(error);
  }
);

export default api;
export { API_URL };
