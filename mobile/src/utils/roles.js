// mobile/src/utils/roles.js

export const isCeo = (user) => user?.role === 'CEO';

export const DEPARTMENT_LABELS = {
  DEVELOPMENT: 'Development',
  SALES: 'Sales',
  MARKETING: 'Marketing',
  FINANCE: 'Finance',
  EXECUTIVE: 'Executive',
};

export const departmentLabel = (department) => DEPARTMENT_LABELS[department] || department || '—';

export const STATUS_CONFIG = {
  APPROVED: {
    label: 'Approved',
    color: '#059669',
    bg: '#d1fae5',
    border: '#a7f3d0',
    icon: 'checkmark-circle',
  },
  REJECTED: {
    label: 'Rejected',
    color: '#dc2626',
    bg: '#fee2e2',
    border: '#fecaca',
    icon: 'close-circle',
  },
  SUBMITTED: {
    label: 'Pending Review',
    color: '#d97706',
    bg: '#fef3c7',
    border: '#fde68a',
    icon: 'time',
  },
  NOT_SUBMITTED: {
    label: 'Not Submitted',
    color: '#6b7280',
    bg: '#f3f4f6',
    border: '#e5e7eb',
    icon: 'alert-circle',
  },
  MISSING: {
    label: 'Missing',
    color: '#6b7280',
    bg: '#f3f4f6',
    border: '#e5e7eb',
    icon: 'alert-circle',
  },
};
