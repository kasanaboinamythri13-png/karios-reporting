// src/api/dashboardApi.js
import apiClient from './client';

export async function getExecutiveOverview(date) {
  const { data } = await apiClient.get('/dashboard/overview', {
    params: date ? { date } : {},
  });
  return data;
}
