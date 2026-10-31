/**
 * Nigerian Naira (NGN / ₦) currency formatter
 * Follows standard Nigerian financial formatting: ₦50,000.00 or ₦50,000
 */

export function formatNaira(amount: number | null | undefined, showDecimals: boolean = true): string {
  const num = typeof amount === 'number' && !isNaN(amount) ? amount : 0;
  const formatted = num.toLocaleString('en-NG', {
    minimumFractionDigits: showDecimals ? 2 : 0,
    maximumFractionDigits: showDecimals ? 2 : 0
  });
  return `₦${formatted}`;
}

export function formatNairaCompact(amount: number | null | undefined): string {
  const num = typeof amount === 'number' && !isNaN(amount) ? amount : 0;
  if (num >= 1_000_000_000) {
    return `₦${(num / 1_000_000_000).toFixed(1)}B`;
  }
  if (num >= 1_000_000) {
    return `₦${(num / 1_000_000).toFixed(1)}M`;
  }
  if (num >= 1_000) {
    return `₦${(num / 1_000).toFixed(1)}K`;
  }
  return formatNaira(num, true);
}
