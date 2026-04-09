/**
 * Formatting utilities for VinFast AI Assistant
 */

/**
 * Format VND price: 548000000 → "548.000.000 ₫"
 */
export function formatVND(amount) {
  if (amount == null) return '—';
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format compact price: 548000000 → "548 triệu"
 */
export function formatCompactVND(amount) {
  if (amount == null) return '—';
  if (amount >= 1_000_000_000) {
    const b = amount / 1_000_000_000;
    return `${b % 1 === 0 ? b : b.toFixed(1)} tỷ`;
  }
  if (amount >= 1_000_000) {
    const m = amount / 1_000_000;
    return `${m % 1 === 0 ? m : m.toFixed(0)} triệu`;
  }
  return formatVND(amount);
}

/**
 * Format phone: 0901234567 → "090 123 4567"
 */
export function formatPhone(phone) {
  if (!phone) return '';
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 10) {
    return `${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6)}`;
  }
  return phone;
}

/**
 * Format percentage: 0.3 → "30%"
 */
export function formatPercent(ratio) {
  if (ratio == null) return '—';
  return `${(ratio * 100).toFixed(0)}%`;
}
