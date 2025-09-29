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

  it('returns "warning" when 80% of shelf life has passed', () => {
    const arrival = new Date();
    arrival.setDate(arrival.getDate() - 8);
    const expiry = new Date();
    expiry.setDate(expiry.getDate() + 2);

    expect(computeExpiryStatus(toISO(expiry), toISO(arrival))).toBe('warning');
  });

  it('returns "ok" when shelf life consumption is below threshold', () => {
    const arrival = new Date();
    arrival.setDate(arrival.getDate() - 2);
    const expiry = new Date();
    expiry.setDate(expiry.getDate() + 8);

    expect(computeExpiryStatus(toISO(expiry), toISO(arrival))).toBe('ok');
  });

  it('falls back to remaining days when arrival is unknown', () => {
    const expirySoon = new Date();
    expirySoon.setDate(expirySoon.getDate() + 2);

    const expiryLater = new Date();
    expiryLater.setDate(expiryLater.getDate() + 10);

    expect(computeExpiryStatus(toISO(expirySoon))).toBe('warning');
    expect(computeExpiryStatus(toISO(expiryLater))).toBe('ok');
  });
});
