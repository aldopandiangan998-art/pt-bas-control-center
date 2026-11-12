// Helper formatting and math utilities for PT BAS Control Center

/**
 * Format number to Indonesian Rupiah (IDR)
 * Example: 9730800 -> "IDR 9,730,800.00"
 */
export function formatCurrency(amount, includeDecimals = true) {
  if (amount === null || amount === undefined || isNaN(amount)) return 'IDR 0';
  const num = Number(amount);
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: includeDecimals ? 2 : 0,
    maximumFractionDigits: includeDecimals ? 2 : 0,
  }).format(num).replace('Rp', 'IDR');
}

/**
 * Format volume in m3, ton, or rit
 * Example: 81.09 -> "81.09 m³"
 */
export function formatVolume(volume, unit = 'm3') {
  if (volume === null || volume === undefined || isNaN(volume)) return `0 ${unit}`;
  const num = Number(volume);
  const formatted = num % 1 === 0 ? num.toString() : num.toFixed(2);
  const displayUnit = unit === 'm3' ? 'm³' : unit;
  return `${formatted} ${displayUnit}`;
}

/**
 * Format ISO date string to Indonesian formatted date
 * Example: "2026-11-09" -> "09 Nov 2026"
 */
export function formatDate(dateStr) {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

/**
 * Calculate Truck Volume (Kubikasi) from Dimensions and Correction
 * P, L, T in cm. Koreksi Tinggi (K) in cm.
 * Tinggi Koreksi (TK) = T + K (or T - K based on decrement)
 * Volume (m3) = (P * L * TK) / 1,000,000
 */
export function calculateKubikasi(panjangCm, lebarCm, tinggiCm, koreksiCm = 0) {
  const p = Number(panjangCm) || 0;
  const l = Number(lebarCm) || 0;
  const t = Number(tinggiCm) || 0;
  const k = Number(koreksiCm) || 0;

  const tinggiHasilKoreksi = Math.max(0, t + k);
  const volumeDefault = (p * l * t) / 1000000;
  const volumeAkhir = (p * l * tinggiHasilKoreksi) / 1000000;

  return {
    tinggiHasilKoreksi,
    volumeDefault: Number(volumeDefault.toFixed(2)),
    volumeAkhir: Number(volumeAkhir.toFixed(2)),
  };
}

