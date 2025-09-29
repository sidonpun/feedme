import { computeExpiryStatus } from './status.util';

describe('computeExpiryStatus', () => {
  function toISO(date: Date): string {
    const copy = new Date(date);
    copy.setHours(0, 0, 0, 0);
    const year = copy.getFullYear();
    const month = String(copy.getMonth() + 1).padStart(2, '0');
    const day = String(copy.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  it('returns "expired" when expiry date is in the past', () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    expect(computeExpiryStatus(toISO(yesterday))).toBe('expired');
  });

  it('returns "warning" when expiry date is within 14 days', () => {
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);

    expect(computeExpiryStatus(toISO(nextWeek))).toBe('warning');
  });

  it('returns "ok" when expiry date is more than 14 days away', () => {
    const nextMonth = new Date();
    nextMonth.setDate(nextMonth.getDate() + 30);

    expect(computeExpiryStatus(toISO(nextMonth))).toBe('ok');
  });
});
