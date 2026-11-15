/**
 * Bangladeshi mobile numbers. Accepts +8801XXXXXXXXX, 8801XXXXXXXXX,
 * 01XXXXXXXXX or 1XXXXXXXXX (spaces and dashes ignored) and returns the
 * canonical +8801XXXXXXXXX form, or null when the input is not a valid number.
 */
export function normalizeBdPhone(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  let digits = raw.replace(/[^\d]/g, '');
  if (digits.startsWith('880')) digits = digits.slice(3);
  else if (digits.startsWith('0')) digits = digits.slice(1);
  return /^1[3-9]\d{8}$/.test(digits) ? `+880${digits}` : null;
}

/** Every stored spelling of one canonical number (older rows are not all canonical). */
export function bdPhoneVariants(canonical: string): string[] {
  const national = canonical.replace(/^\+880/, '');
  return [`+880${national}`, `880${national}`, `0${national}`, national];
}
