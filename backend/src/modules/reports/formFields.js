// Daily form fields per department. Keep them short and daily-friendly.
// Shared rule: every form has "blockers" (shown on the CEO overview).
// Types: text | textarea | number (whole number) | currency ($, up to 2 decimals)
//
// "column": the reports-table column this value is also copied into, so the
// CEO dashboard can total it without opening every report's JSON.
// Owner: Member 1 — confirm the final list with the team / client.

export const FORM_FIELDS = {
  DEVELOPMENT: [
    { key: 'tasksCompleted', label: 'Tasks completed', type: 'textarea', required: true },
    { key: 'tasksInProgress', label: 'Tasks in progress', type: 'textarea' },
    { key: 'bugsFixed', label: 'Bugs fixed', type: 'number' },
    { key: 'deployments', label: 'Deployments', type: 'number' },
    { key: 'blockers', label: 'Blockers', type: 'textarea', column: 'blockers' },
    { key: 'planTomorrow', label: 'Plan for tomorrow', type: 'textarea' },
  ],
  SALES: [
    { key: 'newLeads', label: 'New leads', type: 'number', required: true, column: 'leads' },
    { key: 'followUps', label: 'Follow-ups', type: 'number' },
    { key: 'dealsClosed', label: 'Deals closed', type: 'number' },
    { key: 'revenueClosed', label: 'Revenue closed', type: 'currency', column: 'revenue_closed' },
    { key: 'pipelineValue', label: 'Pipeline value', type: 'currency' },
    { key: 'blockers', label: 'Blockers', type: 'textarea', column: 'blockers' },
    { key: 'planTomorrow', label: 'Plan for tomorrow', type: 'textarea' },
  ],
  MARKETING: [
    { key: 'activeCampaigns', label: 'Active campaigns', type: 'number', required: true },
    { key: 'spend', label: 'Spend', type: 'currency', column: 'marketing_spend' },
    { key: 'impressions', label: 'Impressions', type: 'number' },
    { key: 'clicks', label: 'Clicks', type: 'number' },
    { key: 'leadsGenerated', label: 'Leads generated', type: 'number', column: 'leads' },
    { key: 'blockers', label: 'Blockers', type: 'textarea', column: 'blockers' },
    { key: 'planTomorrow', label: 'Plan for tomorrow', type: 'textarea' },
  ],
  FINANCE: [
    { key: 'collections', label: 'Collections', type: 'currency', required: true, column: 'collections' },
    { key: 'paymentsMade', label: 'Payments made', type: 'currency' },
    { key: 'expenses', label: 'Expenses', type: 'currency' },
    { key: 'pendingInvoices', label: 'Pending invoices', type: 'number' },
    { key: 'cashPosition', label: 'Cash position', type: 'currency' },
    { key: 'blockers', label: 'Blockers', type: 'textarea', column: 'blockers' },
    { key: 'notes', label: 'Notes', type: 'textarea' },
  ],
};

export function getFormFields(department) {
  return FORM_FIELDS[department] || null;
}
