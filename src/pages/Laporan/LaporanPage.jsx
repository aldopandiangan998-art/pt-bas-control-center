import { useState } from 'react';
import {
  Clock,
  TrendingUp,
  AlertCircle,
  FileSpreadsheet,
  Printer,
  Calendar,
  CheckCircle2,
} from 'lucide-react';
import { formatCurrency, formatVolume } from '../../utils/formatters';

export default function LaporanPage() {
  const [activeTab, setActiveTab] = useState('rekapan'); // 'rekapan' | 'piutang' | 'hutang'

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-[#2C2C2C]">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Pusat Laporan Keuangan & Operasional
          </h2>
          <p className="text-xs text-neutral-400">
            Laporan prioritas PT BAS: Rekapan belum di-invoice, Piutang customer, dan Hutang supplier
          </p>
        </div>

        <button
          type="button"
          onClick={() => window.print()}
          className="px-4 py-2 rounded-xl bg-[#252525] hover:bg-[#333] text-white text-xs font-semibold flex items-center gap-2 border border-[#3C3C3C] self-start sm:self-auto"
        >
          <Printer className="w-4 h-4" />
          Cetak Rekap
        </button>
      </div>

      {/* 3 Tabs */}
      <div className="flex border-b border-[#2D2D2D] gap-2 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab('rekapan')}
          className={`px-4 py-2.5 text-xs sm:text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 shrink-0 ${
            activeTab === 'rekapan'
              ? 'border-[#F4511E] text-white'
              : 'border-transparent text-neutral-400 hover:text-white'
          }`}
        >
          <Clock className="w-4 h-4 text-amber-400" />
          Rekapan Belum Di-Invoice (12)
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('piutang')}
          className={`px-4 py-2.5 text-xs sm:text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 shrink-0 ${
            activeTab === 'piutang'
              ? 'border-[#F4511E] text-white'
              : 'border-transparent text-neutral-400 hover:text-white'
          }`}
        >
          <TrendingUp className="w-4 h-4 text-rose-400" />
          Piutang Customer (IDR 84.2M)
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('hutang')}
          className={`px-4 py-2.5 text-xs sm:text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 shrink-0 ${
            activeTab === 'hutang'
              ? 'border-[#F4511E] text-white'
              : 'border-transparent text-neutral-400 hover:text-white'
          }`}
        >
          <AlertCircle className="w-4 h-4 text-emerald-400" />
          Hutang BKK Supplier (IDR 38.9M)
        </button>
      </div>

      {/* Tab Content 1: Rekapan Belum Di-Invoice */}
      {activeTab === 'rekapan' && (
        <div className="bg-[#1C1C1C] border border-[#2D2D2D] rounded-2xl p-5 space-y-4">
          <div className="text-xs text-neutral-400">
            Daftar rekapan harian yang sudah dibuat tetapi belum diterbitkan invoice ke customer:
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#242424] text-neutral-400 font-semibold border-b border-[#333]">
                <tr>
                  <th className="p-3">ID Rekap</th>
                  <th className="p-3">Tanggal</th>
                  <th className="p-3">No. PO</th>
                  <th className="p-3">Customer</th>
                  <th className="p-3">Volume</th>
                  <th className="p-3">Estimasi Tagihan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2B2B2B]">
                <tr className="hover:bg-[#222]">
                  <td className="p-3 font-mono text-amber-400">REK-202611-0001</td>
                  <td className="p-3">07 Nov 2026</td>
                  <td className="p-3">PO-LW-2026-089</td>
                  <td className="p-3 font-medium text-white">PT LION WINGS</td>
                  <td className="p-3 font-mono font-bold">{formatVolume(81.09)}</td>
                  <td className="p-3 font-mono text-white">{formatCurrency(9730800)}</td>
                </tr>
                <tr className="hover:bg-[#222]">
                  <td className="p-3 font-mono text-amber-400">REK-202611-0002</td>
                  <td className="p-3">05 Nov 2026</td>
                  <td className="p-3">PO-LW-2026-089</td>
                  <td className="p-3 font-medium text-white">PT LION WINGS</td>
                  <td className="p-3 font-mono font-bold">{formatVolume(80.34)}</td>
                  <td className="p-3 font-mono text-white">{formatCurrency(9640800)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab Content 2: Piutang */}
      {activeTab === 'piutang' && (
        <div className="bg-[#1C1C1C] border border-[#2D2D2D] rounded-2xl p-5 space-y-4">
          <div className="text-xs text-neutral-400">
            Faktur invoice yang sudah terbit dan menanti pelunasan dari customer:
          </div>
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
            Total Piutang Belum Terbayar: <strong className="font-mono text-sm">{formatCurrency(84250000)}</strong>
          </div>
        </div>
      )}

      {/* Tab Content 3: Hutang */}
      {activeTab === 'hutang' && (
        <div className="bg-[#1C1C1C] border border-[#2D2D2D] rounded-2xl p-5 space-y-4">
          <div className="text-xs text-neutral-400">
            BKK supplier yang belum dibayarkan oleh PT BAS:
          </div>
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs">
            Total Kewajiban Kas Keluar (Hutang): <strong className="font-mono text-sm">{formatCurrency(38920000)}</strong>
          </div>
        </div>
      )}
    </div>
  );
}
