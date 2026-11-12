import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  User,
  Calendar,
  RotateCcw,
  ChevronUp,
  ChevronDown,
} from 'lucide-react';
import { formatCurrency, formatVolume } from '../../utils/formatters';

export default function RekapanPage() {
  const navigate = useNavigate();

  // Form state replicating Screenshot 7: "Buat Jurnal GI"
  const [filterData, setFilterData] = useState({
    pelanggan: 'PT LION WINGS',
    mulai: '2026-11-01',
    akhir: '2026-11-07',
    isPpn: false,
  });

  const [filterCollapsed, setFilterCollapsed] = useState(false);

  const rekapanData = [
    {
      id: 'REK-202611-0001',
      tanggal: '2026-11-07',
      poNumber: 'PO-LW-2026-089',
      customer: 'PT LION WINGS',
      material: 'Sirtu Curah',
      isPpn: false,
      totalSj: 6,
      totalVolume: 81.09,
      nominalBeli: 7703550,
      nominalJual: 9730800,
    },
    {
      id: 'REK-202611-0002',
      tanggal: '2026-11-05',
      poNumber: 'PO-LW-2026-089',
      customer: 'PT LION WINGS',
      material: 'Sirtu Curah',
      isPpn: false,
      totalSj: 6,
      totalVolume: 80.34,
      nominalBeli: 7632300,
      nominalJual: 9640800,
    },
  ];

  return (
    <div className="space-y-4 max-w-5xl mx-auto">
      {/* Top Header Bar matching Screenshot 7 */}
      <div className="flex items-center justify-between pb-2.5 border-b border-[#242424]">
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="p-1.5 rounded bg-[#1C1C1C] hover:bg-[#282828] text-neutral-300 transition-colors"
            title="Kembali ke Dashboard"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
              Buat Jurnal GI (Rekapan)
            </h2>
            <p className="text-[11px] text-neutral-400">
              Rekap kiriman harian per PO, per tanggal, dan per jenis PPN/Non-PPN
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            className="p-1.5 rounded bg-[#1C1C1C] hover:bg-[#282828] text-neutral-400 hover:text-white"
            title="Reset Filter"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Filter Box reproducing Screenshot 7 */}
      <div className="bg-[#141414] border border-[#242424] rounded-lg p-3.5 sm:p-4 space-y-3">
        {/* Field 1: Pilih Pelanggan */}
        <div>
          <label className="block text-[11px] font-medium text-neutral-400 mb-1 flex items-center gap-1">
            <User className="w-3.5 h-3.5 text-neutral-500" />
            Pilih Pelanggan
          </label>
          <select
            value={filterData.pelanggan}
            onChange={(e) => setFilterData({ ...filterData, pelanggan: e.target.value })}
            className="w-full bg-[#1C1C1C] border border-[#2C2C2C] text-neutral-200 rounded px-3 py-2 text-xs focus:outline-none focus:border-[#F4511E]"
          >
            <option value="PT LION WINGS">PT LION WINGS</option>
            <option value="PT SEMEN INDONESIA">PT SEMEN INDONESIA</option>
          </select>
        </div>

        {/* Row 2: Mulai & Akhir */}
        {!filterCollapsed && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-medium text-neutral-400 mb-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-neutral-500" />
                Mulai
              </label>
              <input
                type="date"
                value={filterData.mulai}
                onChange={(e) => setFilterData({ ...filterData, mulai: e.target.value })}
                className="w-full bg-[#1C1C1C] border border-[#2C2C2C] text-neutral-200 rounded px-3 py-2 text-xs focus:outline-none focus:border-[#F4511E]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-neutral-400 mb-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-neutral-500" />
                Akhir
              </label>
              <input
                type="date"
                value={filterData.akhir}
                onChange={(e) => setFilterData({ ...filterData, akhir: e.target.value })}
                className="w-full bg-[#1C1C1C] border border-[#2C2C2C] text-neutral-200 rounded px-3 py-2 text-xs focus:outline-none focus:border-[#F4511E]"
              />
            </div>
          </div>
        )}

        {/* Orange Action Button: TERAPKAN */}
        <button
          type="button"
          className="w-full py-2.5 rounded bg-[#F4511E] hover:bg-[#D84315] text-white font-bold text-xs tracking-wider uppercase shadow transition-colors"
        >
          TERAPKAN
        </button>

        {/* Toggle Collapse: Tampilkan lebih sedikit ^ */}
        <div className="text-center pt-0.5">
          <button
            type="button"
            onClick={() => setFilterCollapsed(!filterCollapsed)}
            className="text-[11px] text-neutral-400 hover:text-white inline-flex items-center gap-1"
          >
            {filterCollapsed ? 'Tampilkan Lebih Banyak' : 'Tampilkan Lebih Sedikit'}
            {filterCollapsed ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />}
          </button>
        </div>
      </div>

      {/* Rekapan Result List */}
      <div className="space-y-2">
        <div className="text-[11px] text-neutral-500 font-mono px-1">
          Rekapan Siap Tagih / BKK:
        </div>

        {rekapanData.map((rek) => (
          <div
            key={rek.id}
            className="bg-[#141414] border border-[#242424] rounded-lg p-3 sm:p-4 flex flex-col md:flex-row md:items-center justify-between gap-3"
          >
            <div className="space-y-1">
              <div className="flex items-center gap-2 font-mono text-[11px]">
                <span className="font-bold text-neutral-200 bg-[#1C1C1C] px-2 py-0.5 rounded border border-[#2E2E2E]">
                  {rek.id}
                </span>
                <span className="text-neutral-500">{rek.tanggal}</span>
                <span className="text-neutral-400">Non-PPN</span>
              </div>

              <div className="text-xs font-bold text-white">
                {rek.customer} <span className="text-neutral-500 font-normal">•</span> <span className="text-neutral-300 font-normal">{rek.material}</span>
              </div>

              <div className="text-[11px] text-neutral-400 font-mono">
                {rek.totalSj} Surat Jalan • Total: <strong className="text-white">{formatVolume(rek.totalVolume)}</strong>
              </div>
            </div>

            <div className="flex flex-wrap md:flex-col items-start md:items-end gap-1 font-mono text-xs border-t md:border-t-0 pt-2 md:pt-0 border-[#1E1E1E]">
              <div>
                <span className="text-neutral-500 mr-2">Dasar Invoice:</span>
                <strong className="text-white">{formatCurrency(rek.nominalJual)}</strong>
              </div>
              <div>
                <span className="text-neutral-500 mr-2">Dasar BKK:</span>
                <strong className="text-neutral-300">{formatCurrency(rek.nominalBeli)}</strong>
              </div>

              <div className="flex items-center gap-1.5 mt-1">
                <button
                  type="button"
                  onClick={() => navigate('/bkk')}
                  className="px-2.5 py-1 rounded bg-[#1C1C1C] hover:bg-[#F4511E] text-neutral-200 hover:text-white text-[11px] transition-colors"
                >
                  Ke BKK
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/invoices')}
                  className="px-2.5 py-1 rounded bg-[#1C1C1C] hover:bg-neutral-700 text-neutral-200 hover:text-white text-[11px] transition-colors"
                >
                  Ke Invoice
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
