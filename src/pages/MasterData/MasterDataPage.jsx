import { useState, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Mountain,
  Users,
  HardHat,
  Building2,
  Truck,
  CreditCard,
  Coins,
  Shield,
  Plus,
  Trash2,
  ChevronRight,
  Search,
  Check,
  X,
  Phone,
  User,
  Hash,
  Landmark,
  Save,
  ArrowLeft,
  FileText,
  Sliders,
} from 'lucide-react';
import { useData } from '../../context/DataContext';

export default function MasterDataPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const currentTab = searchParams.get('tab') || 'supplier';

  const {
    materials,
    suppliers,
    customers,
    armadaList,
    banks,
    bankAccounts,
    usersList,
    toggleMaterialStatus,
    addMaterial,
    deleteMaterial,
    toggleSupplierStatus,
    addSupplier,
    deleteSupplier,
    toggleCustomerStatus,
    addCustomer,
    deleteCustomer,
    toggleArmadaStatus,
    addArmada,
    deleteArmada,
    toggleBankStatus,
    addBank,
    deleteBank,
    toggleBankAccountStatus,
    addBankAccount,
    deleteBankAccount,
  } = useData();

  const [searchQuery, setSearchQuery] = useState('');
  const [modalOpen, setModalOpen] = useState(false);

  const setTab = (tabKey) => {
    setSearchParams({ tab: tabKey });
    setSearchQuery('');
  };

  // ==========================================
  // FORM STATES FOR TAMBAH MODALS
  // ==========================================

  // 1. Tambah Supplier Form State (Screenshot 183014e7)
  const [supplierForm, setSupplierForm] = useState({
    name: '',
    idProgram: '',
    penerima: '',
    telepon: '',
    pkp: true,
    bank: 'BCA',
    noRekening: '',
    rekeningAtasNama: '',
  });

  // 2. Tambah Material Form State (Screenshot 13e294d0)
  const [materialForm, setMaterialForm] = useState({
    name: '',
    beli: '',
    jual: '',
    coa: '110-90',
    coaPiutang: '112-10',
    coaPendapatan: '410-10',
    category: 'Curah',
    satuan: 'm3',
  });

  // 3. Tambah Armada Form State (Screenshot d26f8f80)
  const [armadaForm, setArmadaForm] = useState({
    nopol: '',
    panjangCm: 650,
    lebarCm: 250,
    tinggiCm: 200,
    aktif: true,
    merk: 'Hino Ranger',
    vin: '',
    mesin: '',
    tahun: 2022,
  });

  // 4. Tambah Customer Form State (Screenshot e339cc44)
  const [customerForm, setCustomerForm] = useState({
    jenisBadanUsaha: 'PT',
    name: '',
    alias: '',
    alamat: '',
    npwp: '',
    telepon: '',
    kodePrefix: '',
  });

  // 5. Tambah Bank Form State (Screenshot ef502847)
  const [bankForm, setBankForm] = useState({
    namaBank: '',
    namaAlias: '',
    kodeSwift: '',
    kodeBank: '',
  });

  // 6. Tambah Rekening Bank Form State (Screenshot 5b565e7a)
  const [rekeningForm, setRekeningForm] = useState({
    bank: 'BCA',
    jenisRekening: 'Giro Bisnis',
    nomorRekening: '',
    rekeningAtasNama: 'PT Berkah Alam Semesta',
    namaAlias: '',
  });

  // Form Submissions
  const handleSubmitSupplier = (e) => {
    e.preventDefault();
    if (!supplierForm.name || !supplierForm.idProgram || !supplierForm.penerima) return;
    addSupplier(supplierForm);
    setSupplierForm({
      name: '',
      idProgram: '',
      penerima: '',
      telepon: '',
      pkp: true,
      bank: 'BCA',
      noRekening: '',
      rekeningAtasNama: '',
    });
    setModalOpen(false);
  };

  const handleSubmitMaterial = (e) => {
    e.preventDefault();
    if (!materialForm.name || !materialForm.beli || !materialForm.jual) return;
    addMaterial({
      name: materialForm.name.toUpperCase(),
      beli: Number(materialForm.beli),
      jual: Number(materialForm.jual),
      coa: materialForm.coa,
      coaPiutang: materialForm.coaPiutang,
      coaPendapatan: materialForm.coaPendapatan,
      category: materialForm.category,
      satuan: materialForm.satuan,
    });
    setMaterialForm({
      name: '',
      beli: '',
      jual: '',
      coa: '110-90',
      coaPiutang: '112-10',
      coaPendapatan: '410-10',
      category: 'Curah',
      satuan: 'm3',
    });
    setModalOpen(false);
  };

  const handleSubmitArmada = (e) => {
    e.preventDefault();
    if (!armadaForm.nopol) return;
    addArmada(armadaForm);
    setArmadaForm({
      nopol: '',
      panjangCm: 650,
      lebarCm: 250,
      tinggiCm: 200,
      aktif: true,
      merk: 'Hino Ranger',
      vin: '',
      mesin: '',
      tahun: 2022,
    });
    setModalOpen(false);
  };

  const handleSubmitCustomer = (e) => {
    e.preventDefault();
    if (!customerForm.name) return;
    const prefix = customerForm.kodePrefix || `${customerForm.name.slice(0, 2).toUpperCase()} ${Math.floor(100 + Math.random() * 900)}`;
    addCustomer({
      ...customerForm,
      kodePrefix: prefix,
      alias: customerForm.alias || `${customerForm.jenisBadanUsaha} ${customerForm.name}`,
    });
    setCustomerForm({
      jenisBadanUsaha: 'PT',
      name: '',
      alias: '',
      alamat: '',
      npwp: '',
      telepon: '',
      kodePrefix: '',
    });
    setModalOpen(false);
  };

  const handleSubmitBank = (e) => {
    e.preventDefault();
    if (!bankForm.namaBank) return;
    addBank(bankForm);
    setBankForm({ namaBank: '', namaAlias: '', kodeSwift: '', kodeBank: '' });
    setModalOpen(false);
  };

  const handleSubmitRekening = (e) => {
    e.preventDefault();
    if (!rekeningForm.nomorRekening) return;
    addBankAccount(rekeningForm);
    setRekeningForm({
      bank: 'BCA',
      jenisRekening: 'Giro Bisnis',
      nomorRekening: '',
      rekeningAtasNama: 'PT Berkah Alam Semesta',
      namaAlias: '',
    });
    setModalOpen(false);
  };

  // Master categories list strictly matching Screenshot 3
  const categories = [
    { key: 'supplier', label: 'Data Supplier', count: suppliers.length, icon: HardHat },
    { key: 'material', label: 'Data Material', count: materials.length, icon: Mountain },
    { key: 'customer', label: 'Data Customer', count: customers.length, icon: Building2 },
    { key: 'armada', label: 'Data Armada', count: armadaList.length, icon: Truck },
    { key: 'bank', label: 'Data Bank', count: banks.length, icon: Landmark },
    { key: 'rekening', label: 'Data Rekening Bank', count: bankAccounts.length, icon: CreditCard },
    { key: 'pengguna', label: 'Data Pengguna', count: usersList.length, icon: Users },
    { key: 'mata-uang', label: 'Data Mata Uang', count: 1, icon: Coins },
  ];

  return (
    <div className="space-y-5 pb-20 relative min-h-screen">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#242424] pb-3">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <span>Data Master PT BAS</span>
          </h1>
          <p className="text-xs text-neutral-400">
            Katalog master entitas operasional material, armada, vendor supplier, customer & rekening bank
          </p>
        </div>

        {/* Global Search within Master Data */}
        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-neutral-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari dalam master..."
            className="w-full pl-9 pr-3 py-1.5 bg-[#1C1C1C] border border-[#2D2D2D] rounded-md text-xs text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-[#F4511E]"
          />
        </div>
      </div>

      {/* Category Horizontal Selector Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {categories.map((cat) => {
          const Icon = cat.icon;
          const isActive = currentTab === cat.key;
          return (
            <button
              key={cat.key}
              type="button"
              onClick={() => setTab(cat.key)}
              className={`px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap flex items-center gap-2 transition-all ${
                isActive
                  ? 'bg-[#F4511E] text-white font-semibold shadow-sm'
                  : 'bg-[#181818] text-neutral-400 hover:text-neutral-200 hover:bg-[#202020] border border-[#262626]'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{cat.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                  isActive ? 'bg-black/30 text-white' : 'bg-black/40 text-neutral-400'
                }`}
              >
                {cat.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* ======================================================== */}
      {/* 1. DATA SUPPLIER (FAITHFUL TO SCREENSHOT 38e7625c) */}
      {/* ======================================================== */}
      {currentTab === 'supplier' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {suppliers
              .filter(
                (s) =>
                  s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  s.penerima.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  s.noRekening.includes(searchQuery)
              )
              .map((sup) => (
                <div
                  key={sup.id}
                  className="bg-[#242424] border border-[#333333] rounded-lg p-3.5 flex flex-col justify-between hover:border-[#444] transition-all relative group"
                >
                  <div>
                    {/* Top row: Toggle Switch + Chevron */}
                    <div className="flex items-center justify-between mb-2">
                      {/* Active Toggle Switch */}
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => toggleSupplierStatus(sup.id)}
                          className={`w-10 h-5 flex items-center rounded-full p-0.5 transition-colors ${
                            sup.aktif ? 'bg-[#F4511E]' : 'bg-neutral-600'
                          }`}
                        >
                          <div
                            className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                              sup.aktif ? 'translate-x-5' : 'translate-x-0'
                            }`}
                          />
                        </button>
                        <span className="text-[11px] text-neutral-400 font-mono">
                          {sup.aktif ? 'Aktif' : 'Non-aktif'}
                        </span>
                      </div>

                      {/* Orange Chevron Button */}
                      <button
                        type="button"
                        className="w-7 h-7 rounded-full bg-[#F4511E] text-white flex items-center justify-center hover:opacity-90 transition-opacity"
                        title="Detail Supplier"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Supplier Name */}
                    <h3 className="text-sm font-bold text-white tracking-wide uppercase line-clamp-1">
                      {sup.name}
                    </h3>

                    {/* Bank Info */}
                    <p className="text-xs text-neutral-300 font-mono mt-0.5">
                      {sup.bank} - {sup.noRekening}
                    </p>

                    {/* Beneficiary Name */}
                    <p className="text-xs text-neutral-400 uppercase tracking-tight mt-0.5 line-clamp-1">
                      {sup.penerima}
                    </p>

                    {sup.pkp && (
                      <span className="inline-block mt-2 text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-emerald-950/60 text-emerald-400 border border-emerald-800/40">
                        PKP Terdaftar
                      </span>
                    )}
                  </div>

                  {/* Bottom Action Bar: Trash Icon */}
                  <div className="mt-3 pt-2 border-t border-[#303030] flex justify-center">
                    <button
                      type="button"
                      onClick={() => deleteSupplier(sup.id)}
                      className="p-1.5 text-[#F4511E] hover:bg-[#F4511E]/10 rounded border border-[#F4511E]/40 hover:border-[#F4511E] transition-colors"
                      title="Hapus Supplier"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 2. DATA MATERIAL (FAITHFUL TO SCREENSHOT e79f026e) */}
      {/* ======================================================== */}
      {currentTab === 'material' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {materials
              .filter((m) => m.name.toLowerCase().includes(searchQuery.toLowerCase()))
              .map((mat) => (
                <div
                  key={mat.id}
                  className="bg-[#242424] border border-[#333333] rounded-lg p-3.5 flex flex-col justify-between hover:border-[#444] transition-all"
                >
                  <div>
                    {/* Top row: Toggle Switch + Chevron */}
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => toggleMaterialStatus(mat.id)}
                          className={`w-10 h-5 flex items-center rounded-full p-0.5 transition-colors ${
                            mat.aktif ? 'bg-[#F4511E]' : 'bg-neutral-600'
                          }`}
                        >
                          <div
                            className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                              mat.aktif ? 'translate-x-5' : 'translate-x-0'
                            }`}
                          />
                        </button>
                        <span className="text-[11px] text-neutral-400 font-mono">
                          {mat.aktif ? 'Aktif' : 'Non-aktif'}
                        </span>
                      </div>

                      <button
                        type="button"
                        className="w-7 h-7 rounded-full bg-[#F4511E] text-white flex items-center justify-center hover:opacity-90 transition-opacity"
                        title="Detail Material"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Material Title */}
                    <h3 className="text-sm font-bold text-white tracking-wide uppercase">
                      {mat.name}
                    </h3>

                    {/* Prices */}
                    <div className="mt-1 space-y-0.5 text-xs font-mono">
                      <div className="text-neutral-300">
                        Beli: <span className="text-white font-medium">{mat.beli.toFixed(1)}</span>
                      </div>
                      <div className="text-neutral-300">
                        Jual: <span className="text-amber-400 font-medium">{mat.jual.toFixed(1)}</span>
                      </div>
                    </div>

                    <div className="mt-2 flex items-center gap-1.5">
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-black/40 text-neutral-400 border border-[#333]">
                        PPH {mat.pphRate}% ({mat.category})
                      </span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-black/40 text-neutral-400 border border-[#333]">
                        {mat.satuan}
                      </span>
                    </div>
                  </div>

                  {/* Trash Icon */}
                  <div className="mt-3 pt-2 border-t border-[#303030] flex justify-center">
                    <button
                      type="button"
                      onClick={() => deleteMaterial(mat.id)}
                      className="p-1.5 text-[#F4511E] hover:bg-[#F4511E]/10 rounded border border-[#F4511E]/40 hover:border-[#F4511E] transition-colors"
                      title="Hapus Material"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 3. DATA ARMADA (FAITHFUL TO SCREENSHOT bf8de022) */}
      {/* ======================================================== */}
      {currentTab === 'armada' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {armadaList
              .filter(
                (a) =>
                  a.nopol.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  a.merk.toLowerCase().includes(searchQuery.toLowerCase())
              )
              .map((arm) => (
                <div
                  key={arm.id}
                  className="bg-[#242424] border border-[#333333] rounded-lg p-3.5 flex flex-col justify-between hover:border-[#444] transition-all"
                >
                  <div>
                    {/* Top row */}
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => toggleArmadaStatus(arm.id)}
                          className={`w-10 h-5 flex items-center rounded-full p-0.5 transition-colors ${
                            arm.aktif ? 'bg-[#F4511E]' : 'bg-neutral-600'
                          }`}
                        >
                          <div
                            className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                              arm.aktif ? 'translate-x-5' : 'translate-x-0'
                            }`}
                          />
                        </button>
                        <span className="text-[11px] text-neutral-400 font-mono">
                          {arm.aktif ? 'Aktif' : 'Non-aktif'}
                        </span>
                      </div>

                      <button
                        type="button"
                        className="w-7 h-7 rounded-full bg-[#F4511E] text-white flex items-center justify-center hover:opacity-90 transition-opacity"
                        title="Detail Armada"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Nopol (TNKB) */}
                    <h3 className="text-base font-bold text-white tracking-wider font-mono">
                      {arm.nopol}
                    </h3>

                    {/* Dimensions & Capacity */}
                    <div className="mt-1 space-y-0.5 text-xs text-neutral-300 font-mono">
                      <div>
                        P: {arm.panjangCm} cm &nbsp;|&nbsp; L: {arm.lebarCm} cm &nbsp;|&nbsp; T:{' '}
                        {arm.tinggiCm} cm
                      </div>
                      <div className="text-amber-400 font-semibold">
                        Kapasitas: {arm.kapasitas} m³
                      </div>
                    </div>

                    <div className="mt-2 text-[10px] text-neutral-400 flex items-center gap-2">
                      <span className="px-1.5 py-0.5 rounded bg-black/40 border border-[#333]">
                        {arm.merk}
                      </span>
                      <span>Th. {arm.tahun}</span>
                    </div>
                  </div>

                  {/* Trash Icon */}
                  <div className="mt-3 pt-2 border-t border-[#303030] flex justify-center">
                    <button
                      type="button"
                      onClick={() => deleteArmada(arm.id)}
                      className="p-1.5 text-[#F4511E] hover:bg-[#F4511E]/10 rounded border border-[#F4511E]/40 hover:border-[#F4511E] transition-colors"
                      title="Hapus Armada"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 4. DATA CUSTOMER (FAITHFUL TO SCREENSHOT cbe2d441) */}
      {/* ======================================================== */}
      {currentTab === 'customer' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {customers
              .filter(
                (c) =>
                  c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  c.kodePrefix.toLowerCase().includes(searchQuery.toLowerCase())
              )
              .map((cust) => (
                <div
                  key={cust.id}
                  className="bg-[#242424] border border-[#333333] rounded-lg p-3.5 flex flex-col justify-between hover:border-[#444] transition-all"
                >
                  <div>
                    {/* Top row */}
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => toggleCustomerStatus(cust.id)}
                          className={`w-10 h-5 flex items-center rounded-full p-0.5 transition-colors ${
                            cust.aktif ? 'bg-[#F4511E]' : 'bg-neutral-600'
                          }`}
                        >
                          <div
                            className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                              cust.aktif ? 'translate-x-5' : 'translate-x-0'
                            }`}
                          />
                        </button>
                        <span className="text-[11px] text-neutral-400 font-mono">
                          {cust.aktif ? 'Aktif' : 'Non-aktif'}
                        </span>
                      </div>

                      <button
                        type="button"
                        className="w-7 h-7 rounded-full bg-[#F4511E] text-white flex items-center justify-center hover:opacity-90 transition-opacity"
                        title="Detail Customer"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Customer Code & Name */}
                    <div className="text-[10px] font-mono text-[#F4511E] font-bold">
                      {cust.kodePrefix}
                    </div>
                    <h3 className="text-sm font-bold text-white tracking-wide uppercase line-clamp-1">
                      {cust.name}
                    </h3>

                    {/* Details */}
                    <p className="text-xs text-neutral-400 mt-1 line-clamp-2">
                      {cust.alamat}
                    </p>

                    <div className="mt-2 text-[10px] font-mono text-neutral-400 space-y-0.5">
                      <div>NPWP: {cust.npwp}</div>
                      <div>Telp: {cust.telepon}</div>
                    </div>
                  </div>

                  {/* Trash Icon */}
                  <div className="mt-3 pt-2 border-t border-[#303030] flex justify-center">
                    <button
                      type="button"
                      onClick={() => deleteCustomer(cust.id)}
                      className="p-1.5 text-[#F4511E] hover:bg-[#F4511E]/10 rounded border border-[#F4511E]/40 hover:border-[#F4511E] transition-colors"
                      title="Hapus Customer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 5. DATA BANK (FAITHFUL TO SCREENSHOT 6584ca21) */}
      {/* ======================================================== */}
      {currentTab === 'bank' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {banks
              .filter(
                (b) =>
                  b.namaBank.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  b.namaAlias.toLowerCase().includes(searchQuery.toLowerCase())
              )
              .map((bank) => (
                <div
                  key={bank.id}
                  className="bg-[#242424] border border-[#333333] rounded-lg p-3.5 flex flex-col justify-between hover:border-[#444] transition-all"
                >
                  <div>
                    {/* Top row */}
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => toggleBankStatus(bank.id)}
                          className={`w-10 h-5 flex items-center rounded-full p-0.5 transition-colors ${
                            bank.aktif ? 'bg-[#F4511E]' : 'bg-neutral-600'
                          }`}
                        >
                          <div
                            className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                              bank.aktif ? 'translate-x-5' : 'translate-x-0'
                            }`}
                          />
                        </button>
                        <span className="text-[11px] text-neutral-400 font-mono">
                          {bank.aktif ? 'Aktif' : 'Non-aktif'}
                        </span>
                      </div>

                      <button
                        type="button"
                        className="w-7 h-7 rounded-full bg-[#F4511E] text-white flex items-center justify-center hover:opacity-90 transition-opacity"
                        title="Detail Bank"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Bank Alias & Full Name */}
                    <h3 className="text-base font-bold text-white tracking-wider font-mono">
                      {bank.namaAlias}
                    </h3>
                    <p className="text-xs text-neutral-300 mt-0.5">{bank.namaBank}</p>

                    <div className="mt-2 text-xs font-mono text-neutral-400 space-y-0.5">
                      <div>Kode Bank: {bank.kodeBank}</div>
                      <div>SWIFT: {bank.kodeSwift}</div>
                    </div>
                  </div>

                  {/* Trash Icon */}
                  <div className="mt-3 pt-2 border-t border-[#303030] flex justify-center">
                    <button
                      type="button"
                      onClick={() => deleteBank(bank.id)}
                      className="p-1.5 text-[#F4511E] hover:bg-[#F4511E]/10 rounded border border-[#F4511E]/40 hover:border-[#F4511E] transition-colors"
                      title="Hapus Bank"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 6. DATA REKENING BANK (FAITHFUL TO SCREENSHOT 5b565e7a) */}
      {/* ======================================================== */}
      {currentTab === 'rekening' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {bankAccounts
              .filter(
                (acc) =>
                  acc.nomorRekening.includes(searchQuery) ||
                  acc.namaAlias.toLowerCase().includes(searchQuery.toLowerCase())
              )
              .map((acc) => (
                <div
                  key={acc.id}
                  className="bg-[#242424] border border-[#333333] rounded-lg p-3.5 flex flex-col justify-between hover:border-[#444] transition-all"
                >
                  <div>
                    {/* Top row */}
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => toggleBankAccountStatus(acc.id)}
                          className={`w-10 h-5 flex items-center rounded-full p-0.5 transition-colors ${
                            acc.aktif ? 'bg-[#F4511E]' : 'bg-neutral-600'
                          }`}
                        >
                          <div
                            className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                              acc.aktif ? 'translate-x-5' : 'translate-x-0'
                            }`}
                          />
                        </button>
                        <span className="text-[11px] text-neutral-400 font-mono">
                          {acc.aktif ? 'Aktif' : 'Non-aktif'}
                        </span>
                      </div>

                      <button
                        type="button"
                        className="w-7 h-7 rounded-full bg-[#F4511E] text-white flex items-center justify-center hover:opacity-90 transition-opacity"
                        title="Detail Rekening"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="text-[10px] font-mono text-neutral-400">
                      {acc.bank} • {acc.jenisRekening}
                    </div>
                    <h3 className="text-base font-bold text-white tracking-wider font-mono mt-0.5">
                      {acc.nomorRekening}
                    </h3>
                    <p className="text-xs text-neutral-300 mt-0.5">a/n {acc.rekeningAtasNama}</p>
                    <p className="text-[11px] text-amber-300 font-mono mt-1">{acc.namaAlias}</p>
                  </div>

                  {/* Trash Icon */}
                  <div className="mt-3 pt-2 border-t border-[#303030] flex justify-center">
                    <button
                      type="button"
                      onClick={() => deleteBankAccount(acc.id)}
                      className="p-1.5 text-[#F4511E] hover:bg-[#F4511E]/10 rounded border border-[#F4511E]/40 hover:border-[#F4511E] transition-colors"
                      title="Hapus Rekening"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 7. DATA PENGGUNA (USERS) */}
      {/* ======================================================== */}
      {currentTab === 'pengguna' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {usersList.map((user) => (
              <div
                key={user.id}
                className="bg-[#242424] border border-[#333333] rounded-lg p-3.5 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="w-7 h-7 rounded-full bg-[#F4511E]/20 text-[#F4511E] font-bold text-xs flex items-center justify-center">
                      {user.name.split(' ').map((n) => n[0]).join('')}
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-black/40 text-neutral-300 border border-[#333]">
                      {user.role}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-white">{user.name}</h3>
                  <p className="text-xs text-neutral-400 font-mono mt-0.5">{user.email}</p>
                  <p className="text-xs text-neutral-400 font-mono mt-0.5">{user.phone}</p>
                </div>

                <div className="mt-3 pt-2 border-t border-[#303030] flex items-center justify-between text-[11px] text-neutral-400">
                  <span>Status: <strong className="text-emerald-400">Aktif</strong></span>
                  <span className="font-mono text-[10px]">Pusat/Gresik</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 8. DATA MATA UANG (CURRENCY) */}
      {/* ======================================================== */}
      {currentTab === 'mata-uang' && (
        <div className="bg-[#1C1C1C] border border-[#2A2A2A] rounded-lg p-5 max-w-lg space-y-4">
          <h3 className="text-sm font-bold text-white tracking-wide uppercase flex items-center gap-2">
            <Coins className="w-4 h-4 text-[#F4511E]" />
            <span>Mata Uang Basis Sistem</span>
          </h3>
          <div className="p-3 bg-[#242424] border border-[#333] rounded-md space-y-1">
            <div className="text-xs text-neutral-400">Mata Uang Utama:</div>
            <div className="text-base font-bold text-white font-mono">IDR - Indonesian Rupiah (Rp)</div>
            <div className="text-xs text-neutral-400 pt-2 border-t border-[#303030]">
              Format Desimal: 2 Digit &bull; Pemisah Ribuan: Titik (.) &bull; Pemisah Desimal: Koma (,)
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* FLOATING ACTION BUTTON (ORANGE FAB "+") */}
      {/* Matching Screenshot 38e7625c, e79f026e, etc. */}
      {/* ======================================================== */}
      {['supplier', 'material', 'armada', 'customer', 'bank', 'rekening'].includes(currentTab) && (
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="fixed bottom-6 right-6 z-30 w-14 h-14 rounded-full bg-[#F4511E] hover:bg-[#e04515] active:scale-95 text-white flex items-center justify-center shadow-2xl transition-all border border-white/20"
          title={`Tambah ${categories.find((c) => c.key === currentTab)?.label}`}
        >
          <Plus className="w-7 h-7 stroke-[2.5]" />
        </button>
      )}

      {/* ======================================================== */}
      {/* MODAL: TAMBAH SUPPLIER (SCREENSHOT 183014e7) */}
      {/* ======================================================== */}
      {modalOpen && currentTab === 'supplier' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-[#181818] border border-[#2D2D2D] rounded-xl w-full max-w-lg overflow-hidden shadow-2xl my-auto">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-[#1F1F1F] border-b border-[#2C2C2C]">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="p-1 rounded text-neutral-400 hover:text-white"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <h3 className="text-sm font-bold text-white">Tambah Supplier</h3>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="text-neutral-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form matching Screenshot 183014e7 */}
            <form onSubmit={handleSubmitSupplier} className="p-4 space-y-4">
              <div className="space-y-3">
                <div className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                  Detail Supplier
                </div>

                {/* Nama Supplier * */}
                <div className="relative">
                  <User className="w-4 h-4 text-neutral-500 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    value={supplierForm.name}
                    onChange={(e) => setSupplierForm({ ...supplierForm, name: e.target.value })}
                    placeholder="Nama Supplier *"
                    className="w-full bg-[#242424] border border-[#333] rounded-md pl-9 pr-3 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-[#F4511E]"
                  />
                </div>

                {/* ID Supplier Program Keuangan * */}
                <div className="relative">
                  <Hash className="w-4 h-4 text-neutral-500 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    value={supplierForm.idProgram}
                    onChange={(e) => setSupplierForm({ ...supplierForm, idProgram: e.target.value })}
                    placeholder="ID Supplier Program Keuangan *"
                    className="w-full bg-[#242424] border border-[#333] rounded-md pl-9 pr-3 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-[#F4511E]"
                  />
                </div>

                {/* Nama Penerima * */}
                <div className="relative">
                  <User className="w-4 h-4 text-neutral-500 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    value={supplierForm.penerima}
                    onChange={(e) => setSupplierForm({ ...supplierForm, penerima: e.target.value })}
                    placeholder="Nama Penerima *"
                    className="w-full bg-[#242424] border border-[#333] rounded-md pl-9 pr-3 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-[#F4511E]"
                  />
                </div>

                {/* Nomor Telepon Supplier */}
                <div className="relative">
                  <Phone className="w-4 h-4 text-neutral-500 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={supplierForm.telepon}
                    onChange={(e) => setSupplierForm({ ...supplierForm, telepon: e.target.value })}
                    placeholder="Nomor Telepon Supplier"
                    className="w-full bg-[#242424] border border-[#333] rounded-md pl-9 pr-3 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-[#F4511E]"
                  />
                </div>

                {/* PKP Toggle */}
                <div className="flex items-center justify-between bg-[#242424] border border-[#333] rounded-md px-3 py-2.5">
                  <span className="text-xs font-semibold text-white">PKP</span>
                  <button
                    type="button"
                    onClick={() => setSupplierForm({ ...supplierForm, pkp: !supplierForm.pkp })}
                    className={`w-10 h-5 flex items-center rounded-full p-0.5 transition-colors ${
                      supplierForm.pkp ? 'bg-[#F4511E]' : 'bg-neutral-600'
                    }`}
                  >
                    <div
                      className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                        supplierForm.pkp ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* Detail Rekening Pembayaran */}
              <div className="space-y-3 pt-2 border-t border-[#2A2A2A]">
                <div className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                  Detail Rekening Pembayaran
                </div>

                {/* Pilih Bank */}
                <div className="relative">
                  <Landmark className="w-4 h-4 text-neutral-500 absolute left-3 top-3" />
                  <select
                    value={supplierForm.bank}
                    onChange={(e) => setSupplierForm({ ...supplierForm, bank: e.target.value })}
                    className="w-full bg-[#242424] border border-[#333] rounded-md pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-[#F4511E]"
                  >
                    <option value="BCA">BCA (Bank Central Asia)</option>
                    <option value="Mandiri">Bank Mandiri</option>
                    <option value="BRI">Bank Rakyat Indonesia (BRI)</option>
                    <option value="BNI">Bank Negara Indonesia (BNI)</option>
                  </select>
                </div>

                {/* Nomor Rekening * */}
                <div className="relative">
                  <Hash className="w-4 h-4 text-neutral-500 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    value={supplierForm.noRekening}
                    onChange={(e) => setSupplierForm({ ...supplierForm, noRekening: e.target.value })}
                    placeholder="Nomor Rekening *"
                    className="w-full bg-[#242424] border border-[#333] rounded-md pl-9 pr-3 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-[#F4511E]"
                  />
                </div>

                {/* Rekening Atas Nama * */}
                <div className="relative">
                  <User className="w-4 h-4 text-neutral-500 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    value={supplierForm.rekeningAtasNama}
                    onChange={(e) =>
                      setSupplierForm({ ...supplierForm, rekeningAtasNama: e.target.value })
                    }
                    placeholder="Rekening Atas Nama *"
                    className="w-full bg-[#242424] border border-[#333] rounded-md pl-9 pr-3 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-[#F4511E]"
                  />
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="pt-3 border-t border-[#2A2A2A] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-3 py-1.5 rounded bg-transparent hover:bg-neutral-800 text-neutral-400 text-xs font-medium"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded bg-[#F4511E] hover:bg-[#e04515] text-white text-xs font-bold flex items-center gap-1.5 shadow-md"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Simpan Supplier</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: TAMBAH MATERIAL (SCREENSHOT 13e294d0) */}
      {/* ======================================================== */}
      {modalOpen && currentTab === 'material' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-[#181818] border border-[#2D2D2D] rounded-xl w-full max-w-lg overflow-hidden shadow-2xl my-auto">
            <div className="flex items-center justify-between px-4 py-3 bg-[#1F1F1F] border-b border-[#2C2C2C]">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="p-1 rounded text-neutral-400 hover:text-white"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <h3 className="text-sm font-bold text-white">Tambah Material</h3>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="text-neutral-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitMaterial} className="p-4 space-y-3">
              <div>
                <label className="block text-[11px] text-neutral-400 mb-1">Nama Material *</label>
                <input
                  type="text"
                  required
                  value={materialForm.name}
                  onChange={(e) => setMaterialForm({ ...materialForm, name: e.target.value })}
                  placeholder="Contoh: SIRTU AYAK, BASE COURSE"
                  className="w-full bg-[#242424] border border-[#333] rounded-md px-3 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-[#F4511E]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-neutral-400 mb-1">Harga Beli *</label>
                  <input
                    type="number"
                    required
                    value={materialForm.beli}
                    onChange={(e) => setMaterialForm({ ...materialForm, beli: e.target.value })}
                    placeholder="Harga Beli (Rp)"
                    className="w-full bg-[#242424] border border-[#333] rounded-md px-3 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-[#F4511E] font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-neutral-400 mb-1">Harga Jual *</label>
                  <input
                    type="number"
                    required
                    value={materialForm.jual}
                    onChange={(e) => setMaterialForm({ ...materialForm, jual: e.target.value })}
                    placeholder="Harga Jual (Rp)"
                    className="w-full bg-[#242424] border border-[#333] rounded-md px-3 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-[#F4511E] font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-neutral-400 mb-1">Kategori Material</label>
                  <select
                    value={materialForm.category}
                    onChange={(e) => setMaterialForm({ ...materialForm, category: e.target.value })}
                    className="w-full bg-[#242424] border border-[#333] rounded-md px-3 py-2 text-xs text-white focus:outline-none focus:border-[#F4511E]"
                  >
                    <option value="Curah">Curah (Tarif PPH 2.0%)</option>
                    <option value="Padat">Padat (Tarif PPH 2.65%)</option>
                    <option value="Jasa">Jasa Angkut</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] text-neutral-400 mb-1">Satuan</label>
                  <select
                    value={materialForm.satuan}
                    onChange={(e) => setMaterialForm({ ...materialForm, satuan: e.target.value })}
                    className="w-full bg-[#242424] border border-[#333] rounded-md px-3 py-2 text-xs text-white focus:outline-none focus:border-[#F4511E]"
                  >
                    <option value="m3">m³ (Kubik)</option>
                    <option value="ton">Ton</option>
                    <option value="rit">Rit</option>
                    <option value="m2">m²</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] text-neutral-400 mb-1">COA</label>
                <input
                  type="text"
                  value={materialForm.coa}
                  onChange={(e) => setMaterialForm({ ...materialForm, coa: e.target.value })}
                  placeholder="Contoh: 110-85"
                  className="w-full bg-[#242424] border border-[#333] rounded-md px-3 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-[#F4511E] font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] text-neutral-400 mb-1">COA Piutang Dagang</label>
                <input
                  type="text"
                  value={materialForm.coaPiutang}
                  onChange={(e) => setMaterialForm({ ...materialForm, coaPiutang: e.target.value })}
                  placeholder="Contoh: 112-09"
                  className="w-full bg-[#242424] border border-[#333] rounded-md px-3 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-[#F4511E] font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] text-neutral-400 mb-1">COA Pendapatan</label>
                <input
                  type="text"
                  value={materialForm.coaPendapatan}
                  onChange={(e) =>
                    setMaterialForm({ ...materialForm, coaPendapatan: e.target.value })
                  }
                  placeholder="Contoh: 410-09"
                  className="w-full bg-[#242424] border border-[#333] rounded-md px-3 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-[#F4511E] font-mono"
                />
              </div>

              <div className="pt-3 border-t border-[#2A2A2A] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-3 py-1.5 rounded bg-transparent hover:bg-neutral-800 text-neutral-400 text-xs font-medium"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded bg-[#F4511E] hover:bg-[#e04515] text-white text-xs font-bold flex items-center gap-1.5 shadow-md"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Simpan Material</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: TAMBAH ARMADA (SCREENSHOT d26f8f80) */}
      {/* ======================================================== */}
      {modalOpen && currentTab === 'armada' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-[#181818] border border-[#2D2D2D] rounded-xl w-full max-w-lg overflow-hidden shadow-2xl my-auto">
            <div className="flex items-center justify-between px-4 py-3 bg-[#1F1F1F] border-b border-[#2C2C2C]">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="p-1 rounded text-neutral-400 hover:text-white"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <h3 className="text-sm font-bold text-white">Tambah Armada</h3>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="text-neutral-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitArmada} className="p-4 space-y-3">
              <div>
                <label className="block text-[11px] text-neutral-400 mb-1">
                  Nomor Polisi (TNKB) *
                </label>
                <input
                  type="text"
                  required
                  value={armadaForm.nopol}
                  onChange={(e) =>
                    setArmadaForm({ ...armadaForm, nopol: e.target.value.toUpperCase() })
                  }
                  placeholder="Contoh: W 9821 UB"
                  className="w-full bg-[#242424] border border-[#333] rounded-md px-3 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-[#F4511E] font-mono font-bold"
                />
              </div>

              {/* Dimensi */}
              <div>
                <label className="block text-[11px] text-neutral-400 mb-1">
                  Dimensi Bak Kendaraan (cm) *
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <span className="text-[10px] text-neutral-500">Panjang (P)</span>
                    <input
                      type="number"
                      required
                      value={armadaForm.panjangCm}
                      onChange={(e) =>
                        setArmadaForm({ ...armadaForm, panjangCm: Number(e.target.value) })
                      }
                      className="w-full bg-[#242424] border border-[#333] rounded-md px-2 py-1.5 text-xs text-white font-mono"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-neutral-500">Lebar (L)</span>
                    <input
                      type="number"
                      required
                      value={armadaForm.lebarCm}
                      onChange={(e) =>
                        setArmadaForm({ ...armadaForm, lebarCm: Number(e.target.value) })
                      }
                      className="w-full bg-[#242424] border border-[#333] rounded-md px-2 py-1.5 text-xs text-white font-mono"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-neutral-500">Tinggi (T)</span>
                    <input
                      type="number"
                      required
                      value={armadaForm.tinggiCm}
                      onChange={(e) =>
                        setArmadaForm({ ...armadaForm, tinggiCm: Number(e.target.value) })
                      }
                      className="w-full bg-[#242424] border border-[#333] rounded-md px-2 py-1.5 text-xs text-white font-mono"
                    />
                  </div>
                </div>

                <div className="mt-1.5 text-xs text-amber-400 font-mono">
                  Kubikasi Otomatis:{' '}
                  {(
                    (armadaForm.panjangCm * armadaForm.lebarCm * armadaForm.tinggiCm) /
                    1000000
                  ).toFixed(2)}{' '}
                  m³
                </div>
              </div>

              {/* Status Radio */}
              <div>
                <label className="block text-[11px] text-neutral-400 mb-1">Status Kendaraan</label>
                <div className="flex items-center gap-4 bg-[#242424] p-2 rounded border border-[#333]">
                  <label className="flex items-center gap-2 text-xs text-neutral-200 cursor-pointer">
                    <input
                      type="radio"
                      checked={armadaForm.aktif === true}
                      onChange={() => setArmadaForm({ ...armadaForm, aktif: true })}
                      className="accent-[#F4511E]"
                    />
                    <span>Aktif</span>
                  </label>
                  <label className="flex items-center gap-2 text-xs text-neutral-200 cursor-pointer">
                    <input
                      type="radio"
                      checked={armadaForm.aktif === false}
                      onChange={() => setArmadaForm({ ...armadaForm, aktif: false })}
                      className="accent-[#F4511E]"
                    />
                    <span>Tidak Aktif</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-[11px] text-neutral-400 mb-1">Merk Kendaraan</label>
                <input
                  type="text"
                  value={armadaForm.merk}
                  onChange={(e) => setArmadaForm({ ...armadaForm, merk: e.target.value })}
                  placeholder="Contoh: Hino Dutro 130 HD"
                  className="w-full bg-[#242424] border border-[#333] rounded-md px-3 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-[#F4511E]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] text-neutral-400 mb-1">Nomor Rangka / VIN</label>
                  <input
                    type="text"
                    value={armadaForm.vin}
                    onChange={(e) => setArmadaForm({ ...armadaForm, vin: e.target.value })}
                    placeholder="VIN Kendaraan"
                    className="w-full bg-[#242424] border border-[#333] rounded-md px-3 py-2 text-xs text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-neutral-400 mb-1">Nomor Mesin</label>
                  <input
                    type="text"
                    value={armadaForm.mesin}
                    onChange={(e) => setArmadaForm({ ...armadaForm, mesin: e.target.value })}
                    placeholder="Nomor Mesin"
                    className="w-full bg-[#242424] border border-[#333] rounded-md px-3 py-2 text-xs text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] text-neutral-400 mb-1">Tahun Pembuatan</label>
                <input
                  type="number"
                  value={armadaForm.tahun}
                  onChange={(e) =>
                    setArmadaForm({ ...armadaForm, tahun: Number(e.target.value) })
                  }
                  className="w-full bg-[#242424] border border-[#333] rounded-md px-3 py-2 text-xs text-white font-mono"
                />
              </div>

              <div className="pt-3 border-t border-[#2A2A2A] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-3 py-1.5 rounded bg-transparent hover:bg-neutral-800 text-neutral-400 text-xs font-medium"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded bg-[#F4511E] hover:bg-[#e04515] text-white text-xs font-bold flex items-center gap-1.5 shadow-md"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Simpan Armada</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: TAMBAH CUSTOMER (SCREENSHOT e339cc44) */}
      {/* ======================================================== */}
      {modalOpen && currentTab === 'customer' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-[#181818] border border-[#2D2D2D] rounded-xl w-full max-w-lg overflow-hidden shadow-2xl my-auto">
            <div className="flex items-center justify-between px-4 py-3 bg-[#1F1F1F] border-b border-[#2C2C2C]">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="p-1 rounded text-neutral-400 hover:text-white"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <h3 className="text-sm font-bold text-white">Tambah Customer</h3>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="text-neutral-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitCustomer} className="p-4 space-y-3">
              <div>
                <label className="block text-[11px] text-neutral-400 mb-1">
                  Pilih Jenis Badan Usaha *
                </label>
                <select
                  value={customerForm.jenisBadanUsaha}
                  onChange={(e) =>
                    setCustomerForm({ ...customerForm, jenisBadanUsaha: e.target.value })
                  }
                  className="w-full bg-[#242424] border border-[#333] rounded-md px-3 py-2 text-xs text-white focus:outline-none focus:border-[#F4511E]"
                >
                  <option value="PT">PT (Perseroan Terbatas)</option>
                  <option value="CV">CV (Commanditaire Vennootschap)</option>
                  <option value="UD">UD (Usaha Dagang)</option>
                  <option value="Perorangan">Perorangan / Pribadi</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] text-neutral-400 mb-1">Nama Customer *</label>
                <input
                  type="text"
                  required
                  value={customerForm.name}
                  onChange={(e) =>
                    setCustomerForm({
                      ...customerForm,
                      name: e.target.value,
                      alias: `${customerForm.jenisBadanUsaha} ${e.target.value}`,
                    })
                  }
                  placeholder="Contoh: LION WINGS, SEMEN INDONESIA"
                  className="w-full bg-[#242424] border border-[#333] rounded-md px-3 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-[#F4511E]"
                />
              </div>

              <div>
                <label className="block text-[11px] text-neutral-400 mb-1">
                  Nama Alias Customer (auto)
                </label>
                <input
                  type="text"
                  value={customerForm.alias}
                  onChange={(e) => setCustomerForm({ ...customerForm, alias: e.target.value })}
                  placeholder="Otomatis dari badan usaha + nama"
                  className="w-full bg-[#242424] border border-[#333] rounded-md px-3 py-2 text-xs text-neutral-300 font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] text-neutral-400 mb-1">Alamat Lengkap</label>
                <textarea
                  rows={2}
                  value={customerForm.alamat}
                  onChange={(e) => setCustomerForm({ ...customerForm, alamat: e.target.value })}
                  placeholder="Alamat kantor / gudang / lokasi bongkar"
                  className="w-full bg-[#242424] border border-[#333] rounded-md px-3 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-[#F4511E]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] text-neutral-400 mb-1">Nomor NPWP</label>
                  <input
                    type="text"
                    value={customerForm.npwp}
                    onChange={(e) => setCustomerForm({ ...customerForm, npwp: e.target.value })}
                    placeholder="01.234.567.8-612.000"
                    className="w-full bg-[#242424] border border-[#333] rounded-md px-3 py-2 text-xs text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-neutral-400 mb-1">Nomor Telepon</label>
                  <input
                    type="text"
                    value={customerForm.telepon}
                    onChange={(e) => setCustomerForm({ ...customerForm, telepon: e.target.value })}
                    placeholder="031-xxxxxxx"
                    className="w-full bg-[#242424] border border-[#333] rounded-md px-3 py-2 text-xs text-white font-mono"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-[#2A2A2A] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-3 py-1.5 rounded bg-transparent hover:bg-neutral-800 text-neutral-400 text-xs font-medium"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded bg-[#F4511E] hover:bg-[#e04515] text-white text-xs font-bold flex items-center gap-1.5 shadow-md"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Simpan Customer</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: TAMBAH BANK (SCREENSHOT ef502847) */}
      {/* ======================================================== */}
      {modalOpen && currentTab === 'bank' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-[#181818] border border-[#2D2D2D] rounded-xl w-full max-w-lg overflow-hidden shadow-2xl my-auto">
            <div className="flex items-center justify-between px-4 py-3 bg-[#1F1F1F] border-b border-[#2C2C2C]">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="p-1 rounded text-neutral-400 hover:text-white"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <h3 className="text-sm font-bold text-white">Tambah Bank</h3>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="text-neutral-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitBank} className="p-4 space-y-3">
              <div>
                <label className="block text-[11px] text-neutral-400 mb-1">Nama Bank *</label>
                <input
                  type="text"
                  required
                  value={bankForm.namaBank}
                  onChange={(e) => setBankForm({ ...bankForm, namaBank: e.target.value })}
                  placeholder="Contoh: Bank Central Asia"
                  className="w-full bg-[#242424] border border-[#333] rounded-md px-3 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-[#F4511E]"
                />
              </div>

              <div>
                <label className="block text-[11px] text-neutral-400 mb-1">Nama Alias Bank *</label>
                <input
                  type="text"
                  required
                  value={bankForm.namaAlias}
                  onChange={(e) => setBankForm({ ...bankForm, namaAlias: e.target.value })}
                  placeholder="Contoh: BCA - 014"
                  className="w-full bg-[#242424] border border-[#333] rounded-md px-3 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-[#F4511E]"
                />
              </div>

              <div>
                <label className="block text-[11px] text-neutral-400 mb-1">Kode SWIFT</label>
                <input
                  type="text"
                  value={bankForm.kodeSwift}
                  onChange={(e) => setBankForm({ ...bankForm, kodeSwift: e.target.value })}
                  placeholder="Contoh: CENAIDJA"
                  className="w-full bg-[#242424] border border-[#333] rounded-md px-3 py-2 text-xs text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] text-neutral-400 mb-1">Kode Bank *</label>
                <input
                  type="text"
                  required
                  value={bankForm.kodeBank}
                  onChange={(e) => setBankForm({ ...bankForm, kodeBank: e.target.value })}
                  placeholder="Contoh: 014"
                  className="w-full bg-[#242424] border border-[#333] rounded-md px-3 py-2 text-xs text-white font-mono"
                />
              </div>

              <div className="pt-3 border-t border-[#2A2A2A] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-3 py-1.5 rounded bg-transparent hover:bg-neutral-800 text-neutral-400 text-xs font-medium"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded bg-[#F4511E] hover:bg-[#e04515] text-white text-xs font-bold flex items-center gap-1.5 shadow-md"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Simpan Bank</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: TAMBAH REKENING BANK (SCREENSHOT 5b565e7a) */}
      {/* ======================================================== */}
      {modalOpen && currentTab === 'rekening' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-[#181818] border border-[#2D2D2D] rounded-xl w-full max-w-lg overflow-hidden shadow-2xl my-auto">
            <div className="flex items-center justify-between px-4 py-3 bg-[#1F1F1F] border-b border-[#2C2C2C]">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="p-1 rounded text-neutral-400 hover:text-white"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <h3 className="text-sm font-bold text-white">Tambah Rekening Bank</h3>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="text-neutral-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitRekening} className="p-4 space-y-3">
              <div>
                <label className="block text-[11px] text-neutral-400 mb-1">Pilih Bank *</label>
                <select
                  value={rekeningForm.bank}
                  onChange={(e) => setRekeningForm({ ...rekeningForm, bank: e.target.value })}
                  className="w-full bg-[#242424] border border-[#333] rounded-md px-3 py-2 text-xs text-white focus:outline-none focus:border-[#F4511E]"
                >
                  {banks.map((b) => (
                    <option key={b.id} value={b.namaAlias}>
                      {b.namaAlias} - {b.namaBank}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] text-neutral-400 mb-1">Jenis Rekening *</label>
                <select
                  value={rekeningForm.jenisRekening}
                  onChange={(e) =>
                    setRekeningForm({ ...rekeningForm, jenisRekening: e.target.value })
                  }
                  className="w-full bg-[#242424] border border-[#333] rounded-md px-3 py-2 text-xs text-white focus:outline-none focus:border-[#F4511E]"
                >
                  <option value="Giro Bisnis">Giro Bisnis (Operasional)</option>
                  <option value="Giro Utama">Giro Utama (Penerimaan)</option>
                  <option value="Tabungan Escrow">Tabungan Escrow (Vendor)</option>
                  <option value="Deposito">Deposito Cadangan</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] text-neutral-400 mb-1">Nomor Rekening *</label>
                <input
                  type="text"
                  required
                  value={rekeningForm.nomorRekening}
                  onChange={(e) =>
                    setRekeningForm({ ...rekeningForm, nomorRekening: e.target.value })
                  }
                  placeholder="Contoh: 0188920199"
                  className="w-full bg-[#242424] border border-[#333] rounded-md px-3 py-2 text-xs text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] text-neutral-400 mb-1">
                  Rekening Atas Nama *
                </label>
                <input
                  type="text"
                  required
                  value={rekeningForm.rekeningAtasNama}
                  onChange={(e) =>
                    setRekeningForm({ ...rekeningForm, rekeningAtasNama: e.target.value })
                  }
                  placeholder="Contoh: PT Berkah Alam Semesta"
                  className="w-full bg-[#242424] border border-[#333] rounded-md px-3 py-2 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-[11px] text-neutral-400 mb-1">
                  Nama Alias Rekening
                </label>
                <input
                  type="text"
                  value={rekeningForm.namaAlias}
                  onChange={(e) =>
                    setRekeningForm({ ...rekeningForm, namaAlias: e.target.value })
                  }
                  placeholder="Contoh: BCA Operasional Gresik"
                  className="w-full bg-[#242424] border border-[#333] rounded-md px-3 py-2 text-xs text-white"
                />
              </div>

              <div className="pt-3 border-t border-[#2A2A2A] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-3 py-1.5 rounded bg-transparent hover:bg-neutral-800 text-neutral-400 text-xs font-medium"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded bg-[#F4511E] hover:bg-[#e04515] text-white text-xs font-bold flex items-center gap-1.5 shadow-md"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Simpan Rekening</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
