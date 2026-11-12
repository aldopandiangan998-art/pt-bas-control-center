import { useState } from 'react';
import {
  Mountain,
  Users,
  HardHat,
  Building2,
  Truck,
  CreditCard,
  Coins,
  Shield,
} from 'lucide-react';
import { DEFAULT_MATERIALS } from '../../utils/constants';

export default function MasterDataPage() {
  const [activeTab, setActiveTab] = useState('material');

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16">
      <div className="pb-3 border-b border-[#2C2C2C]">
        <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
          Data Master PT BAS
        </h2>
        <p className="text-xs text-neutral-400">
          Pengaturan tarif PPH material, armada dump truck, customer, supplier, dan rekening kas
        </p>
      </div>

      {/* Master Data category pills */}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setActiveTab('material')}
          className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-colors ${
            activeTab === 'material'
              ? 'bg-[#F4511E] text-white shadow-md'
              : 'bg-[#222] text-neutral-400 hover:text-white'
          }`}
        >
          <Mountain className="w-4 h-4" />
          Data Material & Tarif PPH (8)
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('customer')}
          className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-colors ${
            activeTab === 'customer'
              ? 'bg-[#F4511E] text-white shadow-md'
              : 'bg-[#222] text-neutral-400 hover:text-white'
          }`}
        >
          <Building2 className="w-4 h-4" />
          Data Customer
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('supplier')}
          className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-colors ${
            activeTab === 'supplier'
              ? 'bg-[#F4511E] text-white shadow-md'
              : 'bg-[#222] text-neutral-400 hover:text-white'
          }`}
        >
          <HardHat className="w-4 h-4" />
          Data Supplier
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('armada')}
          className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-colors ${
            activeTab === 'armada'
              ? 'bg-[#F4511E] text-white shadow-md'
              : 'bg-[#222] text-neutral-400 hover:text-white'
          }`}
        >
          <Truck className="w-4 h-4" />
          Data Armada Truk
        </button>
      </div>

      {/* Tab: Material & Tarif PPH */}
      {activeTab === 'material' && (
        <div className="bg-[#1C1C1C] border border-[#2D2D2D] rounded-2xl p-5 space-y-4">
          <div className="text-xs text-neutral-400 flex items-center justify-between">
            <span>Daftar 8 Material Resmi PT BAS dan Tarif Pajak PPH:</span>
            <span className="text-amber-400 font-semibold">Implementation Plan Aturan 29</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#242424] text-neutral-400 font-semibold border-b border-[#333]">
                <tr>
                  <th className="p-3">Nama Material</th>
                  <th className="p-3">Kategori</th>
                  <th className="p-3">Tarif PPH</th>
                  <th className="p-3">Satuan Default</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2B2B2B]">
                {DEFAULT_MATERIALS.map((m) => (
                  <tr key={m.id} className="hover:bg-[#222]">
                    <td className="p-3 font-medium text-white">{m.name}</td>
                    <td className="p-3 text-neutral-300">{m.category}</td>
                    <td className="p-3 font-mono font-bold text-[#F4511E]">{m.pphRate}%</td>
                    <td className="p-3 text-neutral-400">{m.defaultUnit}</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                        Aktif
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: Customer */}
      {activeTab === 'customer' && (
        <div className="bg-[#1C1C1C] border border-[#2D2D2D] rounded-2xl p-5 text-xs text-neutral-400">
          <p className="text-white font-medium mb-1">Daftar Customer Aktif:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>PT LION WINGS (Gresik)</li>
            <li>PT SEMEN INDONESIA (Gresik)</li>
            <li>PT PETROKIMIA GRESIK</li>
            <li>PROYEK JALAN TOL GRESIK</li>
          </ul>
        </div>
      )}
    </div>
  );
}

