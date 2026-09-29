// The backend uses DEVELOPER_HEAD / SALES_HEAD / MARKETING_HEAD / FINANCE_HEAD (and HEAD) for heads.
export const isCeo = (user) => user?.role === 'CEO';
export const isHead = (user) => Boolean(user?.role) && (user.role === 'HEAD' || user.role.endsWith('_HEAD'));

// roles: e.g. ['HEAD'], ['CEO'], ['HEAD', 'CEO']
export function hasRole(user, roles) {
  return roles.some((role) => (role === 'HEAD' ? isHead(user) : user?.role === role));
}

const DEPARTMENT_LABELS = {
  DEVELOPMENT: 'Development',
  SALES: 'Sales',
  MARKETING: 'Marketing',
  FINANCE: 'Finance',
  EXECUTIVE: 'Executive',
};

export const departmentLabel = (department) => DEPARTMENT_LABELS[department] || department || '—';
