/**
 * Forte brand palette — extracted from the website's Tailwind theme
 * (src/index.css / component classes) so the app matches the storefront.
 */
export const Brand = {
  bg: '#F5F1E8',
  ink: '#1B1B1A',
  muted: '#6E6D68',
  orange: '#FF5B35',
  lime: '#D9FF6B',
  blue: '#2454E6',
  white: '#FFFFFF',
  danger: '#DC2626',
  success: '#16A34A',
  border: 'rgba(27, 27, 26, 0.15)',
  borderStrong: 'rgba(27, 27, 26, 0.3)',
  cardMuted: 'rgba(245, 241, 232, 0.6)',
} as const;

export const categoryLabels: Record<string, string> = {
  power_bank: 'Power Banks',
  usb_fan: 'Fans',
  fan: 'Fans',
  solar_charger: 'Solar',
  lamp: 'Lamps',
  inverter_bulb: 'Bulbs',
  cable: 'Cables',
};

/** Human label for a category, matching the website catalogue wording. */
export function categoryLabel(category: string): string {
  return categoryLabels[category] ?? category.replace(/_/g, ' ');
}
