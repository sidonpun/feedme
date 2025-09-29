
export function computeExpiryStatus(expiryISO: string, warnDays = 14): 'ok' | 'warning' | 'expired' {
  const today = new Date();
  today.setHours(0, 0, 0, 0);


  const expiry = new Date(expiryISO);
  expiry.setHours(0, 0, 0, 0);

  if (Number.isNaN(expiry.getTime())) {
    return 'ok';
  }

  if (expiry < today) {
    return 'expired';
  }

  const diffDays = Math.ceil((expiry.getTime() - today.getTime()) / 86400000);
  return diffDays <= warnDays ? 'warning' : 'ok';
}
