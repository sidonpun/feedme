type DateInput = string | Date | null | undefined;

const MS_IN_DAY = 86_400_000;
const WARNING_THRESHOLD = 0.8;

export function computeExpiryStatus(
  expiryInput: DateInput,
  arrivalInput?: DateInput,
  referenceInput: DateInput = new Date()
): 'ok' | 'warning' | 'expired' {
  const expiry = normalizeDate(expiryInput);
  if (!expiry) {
    return 'ok';
  }

  const reference = normalizeDate(referenceInput) ?? startOfDay(new Date());
  if (expiry <= reference) {
    return 'expired';
  }

  const arrival = normalizeDate(arrivalInput);
  if (!arrival || arrival >= expiry) {
    const daysRemaining = differenceInDays(expiry, reference);
    return daysRemaining <= 2 ? 'warning' : 'ok';
  }

  const totalDays = Math.max(0, differenceInDays(expiry, arrival));
  if (totalDays === 0) {
    return 'expired';
  }

  const elapsed = Math.min(totalDays, Math.max(0, differenceInDays(reference, arrival)));
  const progress = elapsed / totalDays;

  return progress >= WARNING_THRESHOLD ? 'warning' : 'ok';
}

function normalizeDate(value: DateInput): Date | null {
  if (!value) {
    return null;
  }

  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : startOfDay(date);
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function differenceInDays(later: Date, earlier: Date): number {
  return Math.round((later.getTime() - earlier.getTime()) / MS_IN_DAY);
}
