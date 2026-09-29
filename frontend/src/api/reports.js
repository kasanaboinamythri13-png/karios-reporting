import { api, toQuery } from './client.js';

// GET /reports/form-schema → { department, fields }
export const getFormSchema = () => api('/reports/form-schema');

// GET /reports/today → { date, report | null, canEdit }
export const getTodayReport = () => api('/reports/today');

// GET /reports?page&limit&status&from&to → { data, pagination }
export const listReports = (params) => api(`/reports${toQuery(params)}`);

// GET /reports/:id → { report }
export const getReport = (id) => api(`/reports/${encodeURIComponent(id)}`);

// POST /reports  Body: { data, attachmentIds }
export const submitReport = (body) => api('/reports', { method: 'POST', body });

// PATCH /reports/:id  Body: { data (complete form), attachmentIds (complete list) }
export const updateReport = (id, body) => api(`/reports/${encodeURIComponent(id)}`, { method: 'PATCH', body });
