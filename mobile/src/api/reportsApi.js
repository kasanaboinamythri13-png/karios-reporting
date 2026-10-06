// src/api/reportsApi.js
import apiClient from './client';
import { getISTDateString } from '../utils/formatters';

export async function getFormSchema() {
  const { data } = await apiClient.get('/reports/form-schema');
  return data;
}

export async function getTodayReport() {
  const { data } = await apiClient.get('/reports/today');
  return data;
}

export async function submitReport(payload) {
  const { data } = await apiClient.post('/reports', payload);
  return data;
}

export async function updateReport(id, payload) {
  const { data } = await apiClient.patch(`/reports/${id}`, payload);
  return data;
}

export async function getReport(id) {
  const { data } = await apiClient.get(`/reports/${id}`);
  return data;
}

export async function listReports(filters = {}) {
  const { data } = await apiClient.get('/reports', { params: filters });
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.reports)) return data.reports;
  if (Array.isArray(data?.data)) return data.data;
  return [];
}

export async function reviewReport(id, { status, comment }) {
  const { data } = await apiClient.post(`/reports/${id}/review`, { status, comment });
  return data;
}
