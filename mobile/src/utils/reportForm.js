// src/utils/reportForm.js
// Department-specific form field schemas and validation helpers
// Aligned exactly with backend/src/modules/reports/formFields.js & reports.validation.js

export const MAX_TEXT = 2000;
export const MAX_MONEY = 999_999_999_999.99;

export const FORM_FIELDS = {
  DEVELOPMENT: [
    { key: 'tasksCompleted', label: 'Tasks Completed', type: 'textarea', required: true, placeholder: 'What did the development team complete today?' },
    { key: 'tasksInProgress', label: 'Tasks in Progress', type: 'textarea', placeholder: 'What is currently in development / testing?' },
    { key: 'bugsFixed', label: 'Bugs Fixed', type: 'number', placeholder: 'e.g. 5' },
    { key: 'deployments', label: 'Deployments', type: 'number', placeholder: 'e.g. 2' },
    { key: 'blockers', label: 'Blockers / Impediments', type: 'textarea', column: 'blockers', placeholder: 'Any cross-team dependencies or blockers?' },
    { key: 'planTomorrow', label: 'Plan for Tomorrow', type: 'textarea', required: true, placeholder: 'Top priorities for tomorrow...' },
  ],
  SALES: [
    { key: 'newLeads', label: 'New Leads', type: 'number', required: true, column: 'leads', placeholder: 'e.g. 15' },
    { key: 'followUps', label: 'Follow-ups', type: 'number', placeholder: 'e.g. 24' },
    { key: 'dealsClosed', label: 'Deals Closed', type: 'number', placeholder: 'e.g. 3' },
    { key: 'revenueClosed', label: 'Revenue Closed ($)', type: 'currency', required: true, column: 'revenue_closed', placeholder: 'e.g. 150000 (or 0)' },
    { key: 'pipelineValue', label: 'Pipeline Value ($)', type: 'currency', placeholder: 'e.g. 500000' },
    { key: 'blockers', label: 'Blockers / Impediments', type: 'textarea', column: 'blockers', placeholder: 'Any sales bottlenecks or blockers?' },
    { key: 'planTomorrow', label: 'Plan for Tomorrow', type: 'textarea', required: true, placeholder: 'Top sales priorities for tomorrow...' },
  ],
  MARKETING: [
    { key: 'activeCampaigns', label: 'Active Campaigns', type: 'number', required: true, placeholder: 'e.g. 5' },
    { key: 'spend', label: 'Marketing Spend ($)', type: 'currency', required: true, column: 'marketing_spend', placeholder: 'e.g. 25000 (or 0)' },
    { key: 'impressions', label: 'Impressions', type: 'number', placeholder: 'e.g. 50000' },
    { key: 'clicks', label: 'Clicks', type: 'number', placeholder: 'e.g. 1200' },
    { key: 'leadsGenerated', label: 'Leads Generated', type: 'number', column: 'leads', placeholder: 'e.g. 40' },
    { key: 'blockers', label: 'Blockers / Impediments', type: 'textarea', column: 'blockers', placeholder: 'Any ad or budget blockers?' },
    { key: 'planTomorrow', label: 'Plan for Tomorrow', type: 'textarea', required: true, placeholder: 'Top marketing priorities for tomorrow...' },
  ],
  FINANCE: [
    { key: 'collections', label: 'Collections ($)', type: 'currency', required: true, column: 'collections', placeholder: 'e.g. 350000' },
    { key: 'paymentsMade', label: 'Payments Made ($)', type: 'currency', placeholder: 'e.g. 120000' },
    { key: 'expenses', label: 'Expenses ($)', type: 'currency', required: true, placeholder: 'e.g. 45000 (or 0)' },
    { key: 'pendingInvoices', label: 'Pending Invoices', type: 'number', placeholder: 'e.g. 8' },
    { key: 'cashPosition', label: 'Cash Position ($)', type: 'currency', required: true, placeholder: 'e.g. 1250000' },
    { key: 'blockers', label: 'Blockers / Impediments', type: 'textarea', column: 'blockers', placeholder: 'Any audit, tax, or collection blockers?' },
    { key: 'notes', label: 'Notes', type: 'textarea', placeholder: 'Additional financial remarks or notes...' },
  ],
};

export function getDepartmentFields(department) {
  return FORM_FIELDS[department] || FORM_FIELDS.DEVELOPMENT;
}

// Convert report data object into form string values
export function toFormValues(fields, data = {}) {
  const values = {};
  for (const field of fields) {
    const val = data?.[field.key];
    values[field.key] = val != null ? String(val) : '';
  }
  return values;
}

// Validate inputs and build JSON payload matching the backend schema
export function buildReportData(fields, values = {}) {
  const data = {};
  const errors = {};

  for (const field of fields) {
    const raw = (values[field.key] ?? '').trim();

    if (raw === '') {
      if (field.required) {
        errors[field.key] = `${field.label} is required`;
      }
      continue; // Omit optional empty field from payload
    }

    if (field.type === 'number' || field.type === 'currency') {
      const num = Number(raw);
      if (!Number.isFinite(num)) {
        errors[field.key] = `${field.label} must be a number`;
      } else if (num < 0) {
        errors[field.key] = `${field.label} cannot be negative`;
      } else if (field.type === 'number' && !Number.isInteger(num)) {
        errors[field.key] = `${field.label} must be a whole number`;
      } else if (field.type === 'currency' && num > MAX_MONEY) {
        errors[field.key] = `${field.label} is too large`;
      } else if (field.type === 'currency' && Math.abs(Math.round(num * 100) - num * 100) > 1e-6) {
        errors[field.key] = `${field.label} can have at most 2 decimal places`;
      } else {
        data[field.key] = num;
      }
    } else if (raw.length > MAX_TEXT) {
      errors[field.key] = `${field.label} is too long (max ${MAX_TEXT} characters)`;
    } else {
      data[field.key] = raw;
    }
  }

  return { data, errors };
}
