/**
 * Utility functions for formatting numbers according to Spanish locale
 * Decimal separator: comma (,)
 * Thousands separator: point (.)
 */

/**
 * Formats a number to Spanish locale with specified decimal places
 * @param value - The number to format
 * @param decimals - Number of decimal places (default: 2)
 * @returns Formatted string with Spanish locale
 */
export function formatSpanishNumber(value: number, decimals: number = 2): string {
  if (isNaN(value) || value === null || value === undefined) {
    return '0';
  }
  
  // Convert to fixed decimal places
  const fixed = value.toFixed(decimals);
  
  // Split into integer and decimal parts
  const [integerPart, decimalPart] = fixed.split('.');
  
  // Add thousands separators to integer part
  const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  
  // Combine with comma as decimal separator
  return decimalPart !== undefined ? `${formattedInteger},${decimalPart}` : formattedInteger;
}

/**
 * Formats a percentage value to Spanish locale
 * @param value - The percentage value (0-100)
 * @param decimals - Number of decimal places (default: 1)
 * @returns Formatted percentage string with Spanish locale
 */
export function formatSpanishPercentage(value: number, decimals: number = 1): string {
  return `${formatSpanishNumber(value, decimals)}%`;
}

/**
 * Formats time in milliseconds to mm:ss format
 * @param milliseconds - Time in milliseconds
 * @returns Formatted time string
 */
export function formatTime(milliseconds: number): string {
  const totalSeconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

/**
 * Formats time in seconds to mm:ss format
 * @param seconds - Time in seconds
 * @returns Formatted time string
 */
export function formatTimeFromSeconds(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}