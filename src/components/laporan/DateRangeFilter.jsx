import { Calendar, AlertCircle } from 'lucide-react';
import DateField from '../form/DateField';
import { useApp } from '../../context/AppContext';

/**
 * Reusable Date Range Filter Component for Reports (PPN, PPh 23, Supplier)
 * Features:
 * - Start & End date inputs using project DateField
 * - Restricts end date min to start date
 * - End date < start date validation with user-friendly warning
 */
export default function DateRangeFilter({
  startDate = '',
  endDate = '',
  onStartDateChange,
  onEndDateChange,
  disabled = false,
  error = '',
  className = '',
}) {
  const { isDark } = useApp();

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
          value={startDate}
          onChange={handleStartChange}
          disabled={disabled}
          max={endDate || undefined}
        />
        <DateField
          label="Tanggal Akhir"
          value={endDate}
          onChange={handleEndChange}
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
