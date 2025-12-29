import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * تنسيق الأرقام بالأرقام الغربية (1, 2, 3) مع فواصل الآلاف
 * @param value - الرقم
 * @returns الرقم منسق بالأرقام الغربية
 */
export function formatLocaleNumber(value: number | string): string {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) return '0';
  return num.toLocaleString('en-US');
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
  return `${numPrice.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })} ر.س`;
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
  return numPrice.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}
