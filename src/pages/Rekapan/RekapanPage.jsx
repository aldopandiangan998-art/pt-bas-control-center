import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  User,
  Calendar,
  Filter,
  RotateCcw,
  CheckCircle2,
  ChevronUp,
  ChevronDown,
  BookOpen,
  FileSpreadsheet,
  AlertTriangle,
} from 'lucide-react';
import { formatCurrency, formatVolume } from '../../utils/formatters';

export default function RekapanPage() {
  const navigate = useNavigate();

  // Form state replicating Screenshot 7: "Buat Jurnal GI"
  const [filterData, setFilterData] = useState({
    pelanggan: 'PT LION WINGS',
    mulai: '2026-11-01',
    akhir: '2026-11-07',
    isPpn: false, // Per implementation plan: Rekapan dipisah PPN & Non-PPN
  });

  const [filterCollapsed, setFilterCollapsed] = useState(false);
  const [isApplied, setIsApplied] = useState(false);

  // Sample rekapan rows generated per PO & Date
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
      nominalBeli: 7703550, // Dasar BKK (Harga Beli)
      nominalJual: 9730800, // Dasar Invoice (Harga Jual)
      statusBkk: 'Belum Dibuat',
      statusInvoice: 'Belum Ditagih',
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
      statusBkk: 'Belum Dibuat',
      statusInvoice: 'Belum Ditagih',
    },
  ];

  const handleApplyFilter = (e) => {
    e.preventDefault();
    setIsApplied(true);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Header Bar matching Screenshot 7 */}
      <div className="flex items-center justify-between pb-3 border-b border-[#2C2C2C]">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="p-2 rounded-lg bg-[#242424] hover:bg-[#333] text-white transition-colors"
            title="Kembali ke Dashboard"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Buat Jurnal GI (Rekapan)
            </h2>
            <p className="text-xs text-neutral-400">
              Rekap kiriman harian per PO, tanggal, dan pemisahan PPN/Non-PPN
            </p>
          </div>
        </div>

        {/* Action icons from top right of Screenshot 7 */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="p-2 rounded-lg bg-[#242424] hover:bg-[#333] text-neutral-300 hover:text-white"
            title="Reset Filter"
            onClick={() => setIsApplied(false)}
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Filter Box reproducing Screenshot 7 */}
      <form onSubmit={handleApplyFilter} className="bg-[#1C1C1C] border border-[#2D2D2D] rounded-2xl p-4 sm:p-6 shadow-xl space-y-4">
        {/* Field 1: Pilih Pelanggan */}
        <div>
          <label className="block text-xs font-medium text-neutral-400 mb-1.5 flex items-center gap-1.5">
            <User className="w-4 h-4 text-neutral-400" />
            Pilih Pelanggan
          </label>
          <select
            value={filterData.pelanggan}
            onChange={(e) => setFilterData({ ...filterData, pelanggan: e.target.value })}
            className="w-full bg-[#272727] border border-[#3C3C3C] text-white rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-[#F4511E]"
          >
            <option value="PT LION WINGS">PT LION WINGS</option>
            <option value="PT SEMEN INDONESIA">PT SEMEN INDONESIA</option>
            <option value="PT PETROKIMIA GRESIK">PT PETROKIMIA GRESIK</option>
          </select>
        </div>

        {/* Row 2: Mulai & Akhir */}
        {!filterCollapsed && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-neutral-400 mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-neutral-400" />
                Mulai
              </label>
              <input
                type="date"
                value={filterData.mulai}
                onChange={(e) => setFilterData({ ...filterData, mulai: e.target.value })}
                className="w-full bg-[#272727] border border-[#3C3C3C] text-white rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-[#F4511E]"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-400 mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-neutral-400" />
                Akhir
              </label>
              <input
                type="date"
                value={filterData.akhir}
                onChange={(e) => setFilterData({ ...filterData, akhir: e.target.value })}
                className="w-full bg-[#272727] border border-[#3C3C3C] text-white rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-[#F4511E]"
              />
            </div>
          </div>
        )}

        {/* Orange Action Button: TERAPKAN */}
        <button
          type="submit"
          className="w-full py-3 rounded-xl bg-[#F4511E] hover:bg-[#E64A19] text-white font-bold text-sm tracking-wider uppercase shadow-lg shadow-orange-950/40 transition-colors"
        >
          TERAPKAN
        </button>

        {/* Toggle Collapse: Tampilkan lebih sedikit ^ */}
        <div className="text-center pt-1">
          <button
            type="button"
            onClick={() => setFilterCollapsed(!filterCollapsed)}
            className="text-xs text-neutral-400 hover:text-white inline-flex items-center gap-1 transition-colors"
          >
            {filterCollapsed ? 'Tampilkan Lebih Banyak' : 'Tampilkan Lebih Sedikit'}
            {filterCollapsed ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
          </button>
        </div>
      </form>

      {/* Rekapan Result List */}
      <section className="space-y-3">
        <div className="flex items-center justify-between text-xs text-neutral-400 px-1">
          <span>Daftar Rekapan Siap Proses:</span>
          <span>Menampilkan {rekapanData.length} rekapan</span>
        </div>

        {rekapanData.map((rek) => (
          <div
            key={rek.id}
            className="bg-[#1C1C1C] border border-[#2D2D2D] hover:border-[#3E3E3E] rounded-xl p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all"
          >
            <div className="space-y-1.5">
              <div className="flex items-center gap-2.5">
                <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-[#2A2A2A] text-amber-400 border border-[#3A3A3A]">
                  {rek.id}
                </span>
                <span className="text-xs text-neutral-400">{rek.tanggal}</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-500/15 text-blue-400 border border-blue-500/30">
                  Non-PPN
                </span>
              </div>

              <div className="text-sm font-bold text-white flex items-center gap-2">
                <span>{rek.customer}</span>
                <span className="text-neutral-500">•</span>
                <span className="text-neutral-300 font-normal">{rek.material}</span>
              </div>

              <div className="text-xs text-neutral-400">
                Surat Jalan: <strong className="text-white">{rek.totalSj} kiriman</strong> • Total: <strong className="text-white">{formatVolume(rek.totalVolume)}</strong>
              </div>
            </div>

            <div className="flex flex-wrap md:flex-col items-start md:items-end gap-1.5 border-t md:border-t-0 pt-2 md:pt-0 border-[#2A2A2A]">
              <div className="text-xs text-neutral-400">
                Dasar Invoice: <strong className="text-white font-mono">{formatCurrency(rek.nominalJual)}</strong>
              </div>
              <div className="text-xs text-neutral-400">
                Dasar BKK: <strong className="text-amber-400 font-mono">{formatCurrency(rek.nominalBeli)}</strong>
              </div>
              <div className="flex items-center gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => navigate('/bkk')}
                  className="px-2.5 py-1 rounded-lg bg-[#272727] hover:bg-[#F4511E] text-[11px] font-medium text-white transition-colors"
                >
                  Proses BKK
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/invoices')}
                  className="px-2.5 py-1 rounded-lg bg-[#272727] hover:bg-cyan-600 text-[11px] font-medium text-white transition-colors"
                >
                  Buat Invoice
                </button>
              </div>
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}

