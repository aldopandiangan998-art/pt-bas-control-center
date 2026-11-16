import { Trash2 } from 'lucide-react';
import NumberField from './NumberField';
import SelectField from './SelectField';
import { useApp } from '../../context/AppContext';

/**
 * ItemRow – single row in "Daftar Item" section.
 * Fields: Nama (dropdown), Kuantitas, Harga Jual, Harga Beli.
 * On mobile, all fields are in a horizontally scrollable row.
 * On desktop (md+), all in one flex row.
 */
export default function ItemRow({ item, index, materials = [], onChange, onDelete }) {
  const { isDark } = useApp();
  const materialOptions = materials.map((m) => ({
    value: m.id,
    label: m.name || m.nama || m.id,
  }));

  const handleField = (field, val) => onChange?.({ ...item, [field]: val });

  return (
    <div className="flex items-stretch gap-0 group relative overflow-x-auto scroll-smooth snap-x">
      {/* Delete button */}
      <button
        type="button"
        onClick={() => onDelete?.(index)}
        aria-label={`Hapus item ${index + 1}`}
        className={`shrink-0 snap-start w-10 flex items-center justify-center transition-colors self-stretch ${
          isDark
            ? 'text-neutral-600 hover:text-rose-400'
            : 'text-slate-400 hover:text-rose-600 hover:bg-rose-50'
        }`}
      >
        <Trash2 className="w-4 h-4" />
      </button>

      {/* Scrollable field row */}
      <div className="flex gap-2 min-w-0 flex-1 md:flex-row">
        {/* Nama Material */}
        <div className="snap-start shrink-0 w-48 md:w-auto md:flex-1">
          <SelectField
            label="Nama Item"
            value={item.materialId}
            onChange={(v) => handleField('materialId', v)}
            options={materialOptions}
            searchable={materialOptions.length > 4}
          />
        </div>

        {/* Kuantitas / Volume */}
        <div className="snap-start shrink-0 w-32 md:w-auto md:flex-none md:w-28">
          <NumberField
            label="Kuantitas"
            value={item.totalOrder}
            onChange={(v) => handleField('totalOrder', v)}
            required
            min={0}
          />
        </div>

        {/* Harga Jual */}
        <div className="snap-start shrink-0 w-40 md:w-auto md:flex-none md:w-36">
          <NumberField
            label="Harga Jual"
            value={item.hargaJual}
            onChange={(v) => handleField('hargaJual', v)}
            required
            min={0}
          />
        </div>

        {/* Harga Beli */}
        <div className="snap-start shrink-0 w-40 md:w-auto md:flex-none md:w-36">
          <NumberField
            label="Harga Beli"
            value={item.hargaBeli}
            onChange={(v) => handleField('hargaBeli', v)}
            required
            min={0}
          />
        </div>
      </div>
    </div>
  );
}
