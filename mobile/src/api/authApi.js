// src/api/authApi.js
import apiClient from './client';

export async function fetchMe() {
  const { data } = await apiClient.get('/me');
  return data;
}
