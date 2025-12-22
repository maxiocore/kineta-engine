import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * تنسيق السعر بالريال السعودي
 * @param price - السعر الرقمي
 * @param decimals - عدد الأرقام العشرية (افتراضي 2)
 * @returns السعر منسق بالريال السعودي
 */
export function formatPrice(price: number | string, decimals: number = 2): string {
  const numPrice = typeof price === 'string' ? parseFloat(price) : price;
  if (isNaN(numPrice)) return '0.00 ر.س';
  return `${numPrice.toFixed(decimals)} ر.س`;
}

/**
 * تنسيق السعر بدون رمز العملة
 * @param price - السعر الرقمي
 * @param decimals - عدد الأرقام العشرية (افتراضي 2)
 * @returns السعر منسق
 */
export function formatNumber(price: number | string, decimals: number = 2): string {
  const numPrice = typeof price === 'string' ? parseFloat(price) : price;
  if (isNaN(numPrice)) return '0.00';
  return numPrice.toFixed(decimals);
}
