/**
 * Formats a numeric amount in Nigerian Naira (e.g. ₦12,500)
 */
export function formatNaira(amount: number): string {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    maximumFractionDigits: 0,
  }).format(amount).replace('NGN', '₦').trim();
}

/**
 * Standard number formatting with commas
 */
export function formatNumber(val: number): string {
  return new Intl.NumberFormat('en-NG').format(val);
}
