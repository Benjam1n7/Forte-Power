import type { ImageSourcePropType } from 'react-native';

/**
 * The website stores `products.image_url` values as web-origin-relative paths
 * (e.g. `/src/assets/images/product_power_bank_….jpg`) that only resolve when
 * served by the Vite dev/production server.
 *
 * The mobile app bundles byte-identical copies of those exact repository image
 * files and maps the stored paths to them. Absolute http(s) URLs (if ever used
 * in the database) are passed through as remote sources.
 */
const BUNDLED_IMAGES: Record<string, ImageSourcePropType> = {
  '/src/assets/images/hero_power_resilience_kit_1790950962112.jpg': require('../../assets/images/products/hero_power_resilience_kit_1790950962112.jpg'),
  '/src/assets/images/product_power_bank_1790950977000.jpg': require('../../assets/images/products/product_power_bank_1790950977000.jpg'),
  '/src/assets/images/product_solar_charger_1790950999126.jpg': require('../../assets/images/products/product_solar_charger_1790950999126.jpg'),
  '/src/assets/images/product_dc_fan_1790951011811.jpg': require('../../assets/images/products/product_dc_fan_1790951011811.jpg'),
  '/src/assets/images/product_task_lamp_1790951023412.jpg': require('../../assets/images/products/product_task_lamp_1790951023412.jpg'),
};

export const PLACEHOLDER_PRODUCT_IMAGE = require('../../assets/images/products/product_power_bank_1790950977000.jpg');

/**
 * Resolves a product `image_url` from the database into something renderable
 * by React Native. Returns undefined when no match exists so callers can fall
 * back to a placeholder without fabricating an image URL.
 */
export function resolveProductImage(
  imageUrl?: string | null
): ImageSourcePropType | undefined {
  if (!imageUrl) return undefined;
  if (/^https?:\/\//i.test(imageUrl)) return { uri: imageUrl };
  const normalized = imageUrl.startsWith('/') ? imageUrl : `/${imageUrl}`;
  return BUNDLED_IMAGES[normalized] ?? BUNDLED_IMAGES[imageUrl];
}
