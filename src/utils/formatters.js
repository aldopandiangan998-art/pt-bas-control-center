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

/**
 * Convert number into Indonesian spoken words (Terbilang)
 * Example: 5611200 -> "Lima Juta Enam Ratus Sebelas Ribu Dua Ratus"
 */
export function terbilang(n) {
  n = Math.floor(Math.abs(Number(n) || 0));
  if (n === 0) return 'Nol';
  const satuan = ['', 'Satu', 'Dua', 'Tiga', 'Empat', 'Lima', 'Enam', 'Tujuh', 'Delapan', 'Sembilan', 'Sepuluh', 'Sebelas'];

  if (n < 12) return satuan[n];
  if (n < 20) return terbilang(n - 10) + ' Belas';
  if (n < 100) return terbilang(Math.floor(n / 10)) + ' Puluh' + (n % 10 !== 0 ? ' ' + terbilang(n % 10) : '');
  if (n < 200) return 'Seratus' + (n - 100 !== 0 ? ' ' + terbilang(n - 100) : '');
  if (n < 1000) return terbilang(Math.floor(n / 100)) + ' Ratus' + (n % 100 !== 0 ? ' ' + terbilang(n % 100) : '');
  if (n < 2000) return 'Seribu' + (n - 1000 !== 0 ? ' ' + terbilang(n - 1000) : '');
  if (n < 1000000) return terbilang(Math.floor(n / 1000)) + ' Ribu' + (n % 1000 !== 0 ? ' ' + terbilang(n % 1000) : '');
  if (n < 1000000000) return terbilang(Math.floor(n / 1000000)) + ' Juta' + (n % 1000000 !== 0 ? ' ' + terbilang(n % 1000000) : '');
  if (n < 1000000000000) return terbilang(Math.floor(n / 1000000000)) + ' Miliar' + (n % 1000000000 !== 0 ? ' ' + terbilang(n % 1000000000) : '');
  return terbilang(Math.floor(n / 1000000000000)) + ' Triliun' + (n % 1000000000000 !== 0 ? ' ' + terbilang(n % 1000000000000) : '');
}

/**
 * Format total currency into Indonesian words with "Rupiah"
 * Example: 5611200 -> "Lima Juta Enam Ratus Sebelas Ribu Dua Ratus Rupiah"
 */
export function terbilangRupiah(amount) {
  const num = Math.round(Number(amount) || 0);
  if (num === 0) return 'Nol Rupiah';
  return `${terbilang(num)} Rupiah`;
}

/**
 * Format date to standard Indonesian DD/MM/YYYY
 * Example: "2026-11-17" -> "17/11/2026"
 */
export function formatDateIndo(dateStr) {
  if (!dateStr) return '-';
  const parts = String(dateStr).slice(0, 10).split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateStr;
}

/**
 * Format timestamp to audit print format: DD/MM/YYYY HH:mm:ss WIB
 * Example: "21/11/2026 09:45:12 WIB"
 */
export function formatDateTimeWib(dateObj = new Date()) {
  const d = dateObj instanceof Date ? dateObj : new Date(dateObj);
  if (isNaN(d.getTime())) return '-';
  
  const pad = (n) => String(n).padStart(2, '0');
  const day = pad(d.getDate());
  const month = pad(d.getMonth() + 1);
  const year = d.getFullYear();
  const hours = pad(d.getHours());
  const minutes = pad(d.getMinutes());
  const seconds = pad(d.getSeconds());

  return `${day}/${month}/${year} ${hours}:${minutes}:${seconds} WIB`;
}


