// Daily form fields per department. Keep them short and daily-friendly.
// Shared rule: every form has "blockers" (shown on the CEO overview).
// Types: text | textarea | number | currency ($)
// Owner: Member 1 — confirm the final list with the team / client.

export const FORM_FIELDS = {
  DEVELOPER: [
    { key: 'tasksCompleted', label: 'Tasks completed', type: 'textarea', required: true },
    { key: 'tasksInProgress', label: 'Tasks in progress', type: 'textarea' },
    { key: 'bugsFixed', label: 'Bugs fixed', type: 'number' },
    { key: 'deployments', label: 'Deployments', type: 'number' },
    { key: 'blockers', label: 'Blockers', type: 'textarea' },
    { key: 'planTomorrow', label: 'Plan for tomorrow', type: 'textarea' },
  ],
  SALES: [
    { key: 'newLeads', label: 'New leads', type: 'number', required: true },
    { key: 'followUps', label: 'Follow-ups', type: 'number' },
    { key: 'dealsClosed', label: 'Deals closed', type: 'number' },
    { key: 'revenueClosed', label: 'Revenue closed', type: 'currency' },
    { key: 'pipelineValue', label: 'Pipeline value', type: 'currency' },
    { key: 'blockers', label: 'Blockers', type: 'textarea' },
    { key: 'planTomorrow', label: 'Plan for tomorrow', type: 'textarea' },
  ],
  MARKETING: [
    { key: 'activeCampaigns', label: 'Active campaigns', type: 'number', required: true },
    { key: 'spend', label: 'Spend', type: 'currency' },
    { key: 'impressions', label: 'Impressions', type: 'number' },
    { key: 'clicks', label: 'Clicks', type: 'number' },
    { key: 'leadsGenerated', label: 'Leads generated', type: 'number' },
    { key: 'blockers', label: 'Blockers', type: 'textarea' },
    { key: 'planTomorrow', label: 'Plan for tomorrow', type: 'textarea' },
  ],
  FINANCE: [
    { key: 'collections', label: 'Collections', type: 'currency', required: true },
    { key: 'paymentsMade', label: 'Payments made', type: 'currency' },
    { key: 'expenses', label: 'Expenses', type: 'currency' },
    { key: 'pendingInvoices', label: 'Pending invoices', type: 'number' },
    { key: 'cashPosition', label: 'Cash position', type: 'currency' },
    { key: 'blockers', label: 'Blockers', type: 'textarea' },
    { key: 'notes', label: 'Notes', type: 'textarea' },
  ],
};
