// All money in the UI uses $.
const formatter = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

export function formatUSD(value) {
  return formatter.format(Number(value) || 0);
}
