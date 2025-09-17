export type SortDirection = 'asc' | 'desc';

type ComparableKind = 'number' | 'string';

interface ComparableValue {
  kind: ComparableKind;
  numeric: number;
  text: string;
  isEmpty: boolean;
}

const collator = new Intl.Collator('ru', { numeric: true, sensitivity: 'base' });

export function toggleDirection(direction: SortDirection): SortDirection {
  return direction === 'asc' ? 'desc' : 'asc';
}

export function sortBySelector<T>(items: T[], selector: (item: T) => unknown, direction: SortDirection): T[] {
  const factor = direction === 'asc' ? 1 : -1;

  return [...items].sort((left, right) => {
    const comparison = compareValues(selector(left), selector(right));
    return comparison * factor;
  });
}

function compareValues(left: unknown, right: unknown): number {
  const comparableLeft = toComparable(left);
  const comparableRight = toComparable(right);

  if (comparableLeft.isEmpty && comparableRight.isEmpty) {
    return 0;
  }

  if (comparableLeft.isEmpty) {
    return 1;
  }

  if (comparableRight.isEmpty) {
    return -1;
  }

  if (comparableLeft.kind === 'number' && comparableRight.kind === 'number') {
    if (comparableLeft.numeric === comparableRight.numeric) {
      return 0;
    }

    return comparableLeft.numeric < comparableRight.numeric ? -1 : 1;
  }

  return collator.compare(comparableLeft.text, comparableRight.text);
}

function toComparable(value: unknown): ComparableValue {
  if (value === null || value === undefined) {
    return { kind: 'string', numeric: 0, text: '', isEmpty: true };
  }

  if (value instanceof Date) {
    return {
      kind: 'number',
      numeric: value.getTime(),
      text: value.toISOString(),
      isEmpty: false,
    };
  }

  if (typeof value === 'number') {
    return { kind: 'number', numeric: value, text: value.toString(), isEmpty: false };
  }

  if (typeof value === 'boolean') {
    const numeric = value ? 1 : 0;
    return { kind: 'number', numeric, text: numeric.toString(), isEmpty: false };
  }

  const stringValue = value.toString().trim();

  if (stringValue.length === 0) {
    return { kind: 'string', numeric: 0, text: '', isEmpty: true };
  }

  const numericCandidate = tryParseNumber(stringValue);

  if (numericCandidate !== null) {
    return { kind: 'number', numeric: numericCandidate, text: stringValue, isEmpty: false };
  }

  const timestamp = Date.parse(stringValue);

  if (!Number.isNaN(timestamp)) {
    return { kind: 'number', numeric: timestamp, text: stringValue, isEmpty: false };
  }

  return { kind: 'string', numeric: 0, text: stringValue.toLowerCase(), isEmpty: false };
}

function tryParseNumber(value: string): number | null {
  const compact = value.replace(/\s+/g, '');
  const normalized = compact.replace(',', '.');

  if (!/^[-+]?\d*(?:\.\d+)?$/.test(normalized)) {
    return null;
  }

  const parsed = Number(normalized);
  return Number.isNaN(parsed) ? null : parsed;
}
