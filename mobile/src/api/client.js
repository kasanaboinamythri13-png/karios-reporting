// src/api/client.js
// Axios instance — points to the shared Karios backend

import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ⚠️ Change this to your deployed backend URL or local IP for device testing
// For emulator: use http://10.0.2.2:4000/api
// For physical device on same WiFi: use http://<YOUR_PC_IP>:4000/api
const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://10.0.2.2:4000/api';

const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// Attach Firebase ID token to every request
apiClient.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('karios_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 globally (token expired)
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await AsyncStorage.removeItem('karios_token');
      await AsyncStorage.removeItem('karios_user');
    }
    return Promise.reject(error);
  }
);

export default apiClient;
