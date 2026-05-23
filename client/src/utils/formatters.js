/**
 * Format a number with locale-aware separators.
 * @param {number} num
 * @returns {string}
 */
export function formatNumber(num) {
  return num != null ? num.toLocaleString() : '—';
}

/**
 * Calculate a human-readable "time ago" string from a timestamp.
 * @param {string} timestamp - ISO 8601 timestamp
 * @returns {string} e.g. "2h ago", "Just now"
 */
export function timeAgo(timestamp) {
  const now = new Date();
  const then = new Date(timestamp);
  const diffMs = now - then;
  const diffMinutes = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMinutes < 1) return 'Just now';
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${diffDays}d ago`;
}

/**
 * Format SPI value with sign and fixed decimals.
 * @param {number} spi
 * @returns {string}
 */
export function formatSPI(spi) {
  if (spi == null) return '—';
  return spi.toFixed(1);
}
