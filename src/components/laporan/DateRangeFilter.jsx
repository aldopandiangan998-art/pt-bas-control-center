import { useEffect } from 'react';
import { Calendar, AlertCircle } from 'lucide-react';
import DateField from '../form/DateField';
import { useApp } from '../../context/AppContext';

/**
 * Reusable Date Range Filter Component for Reports (PPN, PPh 23, Supplier)
 * Features:
 * - Start & End date inputs using project DateField
 * - Restricts end date min to start date
 * - End date < start date validation with user-friendly warning
 * - Auto-populates start date & end date to current month if empty on first open
 */
export default function DateRangeFilter({
  startDate = '',
  endDate = '',
  onStartDateChange,
  onEndDateChange,
  disabled = false,
  error = '',
  className = '',
  onOpenCalendar,
}) {
  const { isDark } = useApp();

  const ensureDateRangePopulated = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    if (!startDate && onStartDateChange) {
      onStartDateChange(`${year}-${month}-01`);
    }
    if (!endDate && onEndDateChange) {
      const lastDay = new Date(year, now.getMonth() + 1, 0).getDate();
      onEndDateChange(`${year}-${month}-${String(lastDay).padStart(2, '0')}`);
    }
    onOpenCalendar?.();
  };

  // Auto-populate start and end dates with current month on mount if not yet provided
  useEffect(() => {
    ensureDateRangePopulated();
  }, [startDate, endDate, onStartDateChange, onEndDateChange]);

  const isInvalidRange = Boolean(startDate && endDate && endDate < startDate);

  const handleStartChange = (val) => {
    onStartDateChange?.(val);
    // If end date exists and is earlier than new start date, auto-bump end date
    if (endDate && val && val > endDate) {
      onEndDateChange?.(val);
    }
  };

  const handleEndChange = (val) => {
    onEndDateChange?.(val);
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <DateField
          label="Tanggal Mulai"
          name="startDate"
          data-testid="start-date"
          aria-label="Tanggal Mulai"
          value={startDate}
          onChange={handleStartChange}
          onFocus={ensureDateRangePopulated}
          disabled={disabled}
          max={endDate || undefined}
        />
        <DateField
          label="Tanggal Akhir"
          name="endDate"
          data-testid="end-date"
          aria-label="Tanggal Akhir"
          value={endDate}
          onChange={handleEndChange}
          onFocus={ensureDateRangePopulated}
          disabled={disabled}
          min={startDate || undefined}
          error={isInvalidRange ? 'Tanggal akhir tidak boleh sebelum tanggal mulai' : ''}
        />
      </div>

      {(isInvalidRange || error) && (
        <div className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border font-mono ${
          isDark
            ? 'bg-rose-500/10 border-rose-500/30 text-rose-400'
            : 'bg-rose-50 border-rose-200 text-rose-600'
        }`}>
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{error || 'Tanggal akhir tidak boleh lebih awal dari tanggal mulai.'}</span>
        </div>
      )}
    </div>
  );
}
