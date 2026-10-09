/**
 * Formats a numeric amount in Nigerian Naira (e.g. ₦12,500).
 * Mirrors the website helper in src/lib/formatters.ts so both platforms
 * render identical totals.
 */
export function formatNaira(amount: number): string {
  const value = Math.max(0, Math.round(amount));
  try {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      maximumFractionDigits: 0,
    })
      .format(value)
      .replace('NGN', '\u20A6')
      .replace(/\u00a0/g, ' ')
      .trim();
  } catch {
    // Hermes without full Intl support: deterministic manual formatting.
    return `\u20A6${value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
  }
}

/** Standard number formatting with commas. */
export function formatNumber(value: number): string {
  return Math.round(value)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}
