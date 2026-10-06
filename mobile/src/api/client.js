// src/api/client.js
// Axios instance — points to the shared Karios backend

import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth } from '../services/firebase';

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
  let token = (await AsyncStorage.getItem('karios_token')) || (await AsyncStorage.getItem('@karios_auth_token'));

  // If token not yet written to AsyncStorage, grab directly from active Firebase session
  if (!token && auth?.currentUser) {
    try {
      token = await auth.currentUser.getIdToken();
      if (token) {
        await AsyncStorage.setItem('karios_token', token);
        await AsyncStorage.setItem('@karios_auth_token', token);
      }
    } catch (e) {
      console.warn('Failed to retrieve token from auth.currentUser:', e);
    }
  }

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 globally with token refresh instead of silent wipe
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry && auth?.currentUser) {
      originalRequest._retry = true;
      try {
        const freshToken = await auth.currentUser.getIdToken(true);
        if (freshToken) {
          await AsyncStorage.setItem('karios_token', freshToken);
          await AsyncStorage.setItem('@karios_auth_token', freshToken);
          originalRequest.headers.Authorization = `Bearer ${freshToken}`;
          return apiClient(originalRequest);
        }
      } catch (refreshErr) {
        console.warn('Failed to refresh Firebase token on 401:', refreshErr);
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
