/**
 * cashOutGrouping.js
 * Pure helper functions for grouping and summarising Cash Out (BKK) transactions.
 * No React, no side-effects.
 */

/** Normalise a grouping key so whitespace / case differences don't split groups. */
function normaliseKey(value) {
  if (value === null || value === undefined) return '(Tidak Diketahui)';
  return String(value).trim().toUpperCase();
}

/**
 * Derive the group key string for a single CO item depending on the chosen groupBy.
 * @param {object} item   – A BKK/CO transaction object
 * @param {'company'|'status'|'material'|'month'} groupBy
 * @returns {string}
 */
function deriveKey(item, groupBy) {
  switch (groupBy) {
    case 'status':
      return normaliseKey(item.statusBayar === 'Lunas' ? 'Lunas' : 'Belum Lunas');

    case 'material':
      return normaliseKey(item.material);

    case 'month': {
      // Try to parse from item.timestamp ("2026-11-09 09:34:30") or item.periode
      const src = item.timestamp || item.periode || '';
      const match = src.match(/^(\d{4})-(\d{2})/);
      if (match) {
        const [, year, month] = match;
        const months = [
          'Januari','Februari','Maret','April','Mei','Juni',
          'Juli','Agustus','September','Oktober','November','Desember',
        ];
        const label = `${months[parseInt(month, 10) - 1]} ${year}`;
        return label;
      }
      return '(Bulan Tidak Diketahui)';
    }

    case 'company':
    default:
      return normaliseKey(item.perusahaan);
  }
}

/**
 * Compute subtotal summary for a group.
 * Per spec: DO NOT sum volumes across different units.
 * All items are assumed to be in m³; if any unit differs return null for totalVolume.
 *
 * @param {object[]} items
 * @returns {{ count, totalAmount, totalVolume: number|null, unpaidCount, paidCount }}
 */
function computeSummary(items) {
  let totalAmount = 0;
  let totalVolume = 0;
  let mixedUnits = false;
  let unpaidCount = 0;
  let paidCount = 0;

  for (const item of items) {
    totalAmount += Number(item.amount) || 0;

    // All existing data uses m³; guard anyway
    const unit = (item.unit || 'm3').toLowerCase();
    if (unit !== 'm3' && unit !== 'm³') mixedUnits = true;
    totalVolume += Number(item.volume) || 0;

    if (item.statusBayar === 'Lunas') {
      paidCount++;
    } else {
      unpaidCount++;
    }
  }

  return {
    count: items.length,
    totalAmount,
    totalVolume: mixedUnits ? null : Number(totalVolume.toFixed(2)),
    unpaidCount,
    paidCount,
  };
}

/**
 * Sort comparator for groups.
 * Default: most unpaid first, then highest totalAmount first.
 * @param {'default'|'name'} order
 */
function groupComparator(order) {
  if (order === 'name') {
    return (a, b) => a.label.localeCompare(b.label, 'id');
  }
  // default: unpaid count desc, then totalAmount desc
  return (a, b) => {
    const unpaidDiff = b.summary.unpaidCount - a.summary.unpaidCount;
    if (unpaidDiff !== 0) return unpaidDiff;
    return b.summary.totalAmount - a.summary.totalAmount;
  };
}

/**
 * Group an array of CO items.
 *
 * @param {object[]} items  – filtered CO list (search + status already applied)
 * @param {'company'|'status'|'material'|'month'} groupBy
 * @param {'default'|'name'} sortOrder  – sort order for groups
 * @returns {{ key: string, label: string, items: object[], summary: object }[]}
 */
export function groupCashOut(items, groupBy = 'company', sortOrder = 'default') {
  // 1. Accumulate
  const map = new Map(); // key -> items[]
  for (const item of items) {
    const key = deriveKey(item, groupBy);
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(item);
  }

  // 2. Sort each group's rows: newest timestamp first
  for (const [, rows] of map) {
    rows.sort((a, b) => {
      const ta = a.timestamp || '';
      const tb = b.timestamp || '';
      return tb.localeCompare(ta);
    });
  }

  // 3. Build output array
  const groups = [];
  for (const [key, rows] of map) {
    // Human-readable label (title-case for company/material, leave month/status as-is)
    let label = key;
    if (groupBy === 'company' || groupBy === 'material') {
      // Keep original text from first item so we don't lose mixed-case formatting
      const firstItem = rows[0];
      label = groupBy === 'company'
        ? (firstItem.perusahaan || key)
        : (firstItem.material || key);
    } else if (groupBy === 'status') {
      label = rows[0].statusBayar === 'Lunas' ? 'Lunas' : 'Belum Lunas';
    }

    groups.push({
      key,
      label,
      items: rows,
      summary: computeSummary(rows),
    });
  }

  // 4. Sort groups
  groups.sort(groupComparator(sortOrder));

  return groups;
}

/**
 * Compute checkbox state for a group given the current selected IDs set.
 * @param {string[]} groupItemIds
 * @param {string[]} selectedIds
 * @returns {'none'|'some'|'all'}
 */
export function groupCheckState(groupItemIds, selectedIds) {
  const selectedSet = new Set(selectedIds);
  const selectedCount = groupItemIds.filter((id) => selectedSet.has(id)).length;
  if (selectedCount === 0) return 'none';
  if (selectedCount === groupItemIds.length) return 'all';
  return 'some';
}

export const groupInvoices = groupCashOut;


