import { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Mountain,
  Users,
  HardHat,
  Building2,
  Truck,
  CreditCard,
  Coins,
  Plus,
  Trash2,
  ChevronRight,
  Search,
  User,
  Hash,
  Phone,
  Landmark,
  Save,
  ArrowLeft,
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { Button, Badge, Card, Input, Select, Modal } from '../../components/ui';

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

  // Form States
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

  const [armadaForm, setArmadaForm] = useState({
    nopol: '',
    panjangCm: 650,
    lebarCm: 250,
    tinggiCm: 200,
    aktif: true,
    merk: 'Hino Ranger FL',
    vin: '',
    mesin: '',
    tahun: 2022,
  });

  const [customerForm, setCustomerForm] = useState({
    jenisBadanUsaha: 'PT',
    name: '',
    alias: '',
    alamat: '',
    npwp: '',
    telepon: '',
    kodePrefix: '',
  });

  const [bankForm, setBankForm] = useState({
    namaBank: '',
    namaAlias: '',
    kodeSwift: '',
    kodeBank: '',
  });

  const [rekeningForm, setRekeningForm] = useState({
    bank: 'BCA',
    jenisRekening: 'Giro Bisnis',
    nomorRekening: '',
    rekeningAtasNama: 'PT Berkah Alam Semesta',
    namaAlias: '',
  });

  // Handlers
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
      merk: 'Hino Ranger FL',
      vin: '',
      mesin: '',
      tahun: 2022,
    });
    setModalOpen(false);
  };

  const handleSubmitCustomer = (e) => {
    e.preventDefault();
    if (!customerForm.name) return;
    const prefix =
      customerForm.kodePrefix ||
      `${customerForm.name.slice(0, 2).toUpperCase()} ${Math.floor(100 + Math.random() * 900)}`;
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#24282C] pb-3">
        <div className="flex items-center gap-2.5">
          <Button
            size="sm"
            variant="ghost"
            icon={ArrowLeft}
            onClick={() => navigate('/')}
            title="Kembali ke Dashboard"
          />
          <div>
            <h1 className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center gap-2">
              <span>Katalog Data Master PT BAS</span>
              <Badge size="xs" variant="primary">ERP Core</Badge>
            </h1>
            <p className="text-[11px] text-neutral-400">
              Pengaturan master supplier, material, customer, armada dump truck, dan rekening bank resmi
            </p>
          </div>
        </div>

        {/* Global Search within Master Data */}
        <div className="w-full sm:w-64">
          <Input
            icon={Search}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari entitas master..."
          />
        </div>
      </div>

      {/* Category Horizontal Selector Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none" role="tablist">
        {categories.map((cat) => {
          const Icon = cat.icon;
          const isActive = currentTab === cat.key;
          return (
            <button
              key={cat.key}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => setTab(cat.key)}
              className={`px-3 py-2 rounded-md text-xs font-medium whitespace-nowrap flex items-center gap-2 transition-all cursor-pointer ${
                isActive
                  ? 'bg-[#F4511E] text-white font-semibold shadow-xs'
                  : 'bg-[#131517] text-neutral-400 hover:text-neutral-200 hover:bg-[#181B1E] border border-[#24282C]'
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {suppliers
            .filter(
              (s) =>
                s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                s.penerima.toLowerCase().includes(searchQuery.toLowerCase()) ||
                s.noRekening.includes(searchQuery)
            )
            .map((sup) => (
              <Card
                key={sup.id}
                hover
                className="p-3.5 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => toggleSupplierStatus(sup.id)}
                        className={`w-9 h-5 flex items-center rounded-full p-0.5 transition-colors cursor-pointer ${
                          sup.aktif ? 'bg-[#F4511E]' : 'bg-[#2A2E33]'
                        }`}
                      >
                        <div
                          className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                            sup.aktif ? 'translate-x-4' : 'translate-x-0'
                          }`}
                        />
                      </button>
                      <span className="text-[11px] text-neutral-400 font-mono">
                        {sup.aktif ? 'Aktif' : 'Non-aktif'}
                      </span>
                    </div>

                    <button
                      type="button"
                      className="w-7 h-7 rounded-full bg-[#F4511E] text-white flex items-center justify-center hover:opacity-90 transition-opacity cursor-pointer shadow-xs"
                      title="Detail Supplier"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>

                  <h3 className="text-sm font-bold text-white tracking-wide uppercase line-clamp-1">
                    {sup.name}
                  </h3>

                  <p className="text-xs text-neutral-300 font-mono mt-0.5">
                    {sup.bank} - {sup.noRekening}
                  </p>

                  <p className="text-xs text-neutral-400 uppercase tracking-tight mt-0.5 line-clamp-1">
                    {sup.penerima}
                  </p>

                  {sup.pkp && (
                    <div className="mt-2">
                      <Badge size="xs" variant="success" dot>
                        PKP Terdaftar
                      </Badge>
                    </div>
                  )}
                </div>

                <div className="mt-3 pt-2 border-t border-[#22262A] flex justify-center">
                  <Button
                    size="xs"
                    variant="ghost"
                    icon={Trash2}
                    onClick={() => deleteSupplier(sup.id)}
                    className="text-[#F4511E] hover:bg-[#F4511E]/10 border border-[#F4511E]/30"
                    title="Hapus Supplier"
                  />
                </div>
              </Card>
            ))}
        </div>
      )}

      {/* ======================================================== */}
      {/* 2. DATA MATERIAL (FAITHFUL TO SCREENSHOT e79f026e) */}
      {/* ======================================================== */}
      {currentTab === 'material' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {materials
            .filter((m) => m.name.toLowerCase().includes(searchQuery.toLowerCase()))
            .map((mat) => (
              <Card
                key={mat.id}
                hover
                className="p-3.5 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => toggleMaterialStatus(mat.id)}
                        className={`w-9 h-5 flex items-center rounded-full p-0.5 transition-colors cursor-pointer ${
                          mat.aktif ? 'bg-[#F4511E]' : 'bg-[#2A2E33]'
                        }`}
                      >
                        <div
                          className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                            mat.aktif ? 'translate-x-4' : 'translate-x-0'
                          }`}
                        />
                      </button>
                      <span className="text-[11px] text-neutral-400 font-mono">
                        {mat.aktif ? 'Aktif' : 'Non-aktif'}
                      </span>
                    </div>

                    <button
                      type="button"
                      className="w-7 h-7 rounded-full bg-[#F4511E] text-white flex items-center justify-center hover:opacity-90 transition-opacity cursor-pointer shadow-xs"
                      title="Detail Material"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>

                  <h3 className="text-sm font-bold text-white tracking-wide uppercase">
                    {mat.name}
                  </h3>

                  <div className="mt-1 space-y-0.5 text-xs font-mono">
                    <div className="text-neutral-300">
                      Beli: <span className="text-white font-medium">{mat.beli.toFixed(1)}</span>
                    </div>
                    <div className="text-neutral-300">
                      Jual: <span className="text-amber-400 font-medium">{mat.jual.toFixed(1)}</span>
                    </div>
                  </div>

                  <div className="mt-2 flex items-center gap-1.5 flex-wrap">
                    <Badge size="xs" variant="neutral">
                      PPH {mat.pphRate}% ({mat.category})
                    </Badge>
                    <Badge size="xs" variant="timber">
                      {mat.satuan}
                    </Badge>
                  </div>
                </div>

                <div className="mt-3 pt-2 border-t border-[#22262A] flex justify-center">
                  <Button
                    size="xs"
                    variant="ghost"
                    icon={Trash2}
                    onClick={() => deleteMaterial(mat.id)}
                    className="text-[#F4511E] hover:bg-[#F4511E]/10 border border-[#F4511E]/30"
                    title="Hapus Material"
                  />
                </div>
              </Card>
            ))}
        </div>
      )}

      {/* ======================================================== */}
      {/* 3. DATA ARMADA (FAITHFUL TO SCREENSHOT bf8de022) */}
      {/* ======================================================== */}
      {currentTab === 'armada' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {armadaList
            .filter(
              (a) =>
                a.nopol.toLowerCase().includes(searchQuery.toLowerCase()) ||
                a.merk.toLowerCase().includes(searchQuery.toLowerCase())
            )
            .map((arm) => (
              <Card
                key={arm.id}
                hover
                className="p-3.5 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => toggleArmadaStatus(arm.id)}
                        className={`w-9 h-5 flex items-center rounded-full p-0.5 transition-colors cursor-pointer ${
                          arm.aktif ? 'bg-[#F4511E]' : 'bg-[#2A2E33]'
                        }`}
                      >
                        <div
                          className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                            arm.aktif ? 'translate-x-4' : 'translate-x-0'
                          }`}
                        />
                      </button>
                      <span className="text-[11px] text-neutral-400 font-mono">
                        {arm.aktif ? 'Aktif' : 'Non-aktif'}
                      </span>
                    </div>

                    <button
                      type="button"
                      className="w-7 h-7 rounded-full bg-[#F4511E] text-white flex items-center justify-center hover:opacity-90 transition-opacity cursor-pointer shadow-xs"
                      title="Detail Armada"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>

                  <h3 className="text-base font-bold text-white tracking-wider font-mono">
                    {arm.nopol}
                  </h3>

                  <div className="mt-1 space-y-0.5 text-xs text-neutral-300 font-mono">
                    <div>
                      P: {arm.panjangCm} cm &bull; L: {arm.lebarCm} cm &bull; T: {arm.tinggiCm} cm
                    </div>
                    <div className="text-amber-400 font-semibold">
                      Kapasitas Bak: {arm.kapasitas} m³
                    </div>
                  </div>

                  <div className="mt-2 text-[10px] text-neutral-400 flex items-center gap-2">
                    <span className="px-1.5 py-0.5 rounded bg-black/40 border border-[#2E3339]">
                      {arm.merk}
                    </span>
                    <span>Tahun {arm.tahun}</span>
                  </div>
                </div>

                <div className="mt-3 pt-2 border-t border-[#22262A] flex justify-center">
                  <Button
                    size="xs"
                    variant="ghost"
                    icon={Trash2}
                    onClick={() => deleteArmada(arm.id)}
                    className="text-[#F4511E] hover:bg-[#F4511E]/10 border border-[#F4511E]/30"
                    title="Hapus Armada"
                  />
                </div>
              </Card>
            ))}
        </div>
      )}

      {/* ======================================================== */}
      {/* 4. DATA CUSTOMER (FAITHFUL TO SCREENSHOT cbe2d441) */}
      {/* ======================================================== */}
      {currentTab === 'customer' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {customers
            .filter(
              (c) =>
                c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                c.kodePrefix.toLowerCase().includes(searchQuery.toLowerCase())
            )
            .map((cust) => (
              <Card
                key={cust.id}
                hover
                className="p-3.5 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => toggleCustomerStatus(cust.id)}
                        className={`w-9 h-5 flex items-center rounded-full p-0.5 transition-colors cursor-pointer ${
                          cust.aktif ? 'bg-[#F4511E]' : 'bg-[#2A2E33]'
                        }`}
                      >
                        <div
                          className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                            cust.aktif ? 'translate-x-4' : 'translate-x-0'
                          }`}
                        />
                      </button>
                      <span className="text-[11px] text-neutral-400 font-mono">
                        {cust.aktif ? 'Aktif' : 'Non-aktif'}
                      </span>
                    </div>

                    <button
                      type="button"
                      className="w-7 h-7 rounded-full bg-[#F4511E] text-white flex items-center justify-center hover:opacity-90 transition-opacity cursor-pointer shadow-xs"
                      title="Detail Customer"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="text-[10px] font-mono text-[#F4511E] font-bold">
                    {cust.kodePrefix}
                  </div>
                  <h3 className="text-sm font-bold text-white tracking-wide uppercase line-clamp-1">
                    {cust.name}
                  </h3>

                  <p className="text-xs text-neutral-400 mt-1 line-clamp-2">
                    {cust.alamat}
                  </p>

                  <div className="mt-2 text-[10px] font-mono text-neutral-400 space-y-0.5">
                    <div>NPWP: {cust.npwp}</div>
                    <div>Telp: {cust.telepon}</div>
                  </div>
                </div>

                <div className="mt-3 pt-2 border-t border-[#22262A] flex justify-center">
                  <Button
                    size="xs"
                    variant="ghost"
                    icon={Trash2}
                    onClick={() => deleteCustomer(cust.id)}
                    className="text-[#F4511E] hover:bg-[#F4511E]/10 border border-[#F4511E]/30"
                    title="Hapus Customer"
                  />
                </div>
              </Card>
            ))}
        </div>
      )}

      {/* ======================================================== */}
      {/* 5. DATA BANK (FAITHFUL TO SCREENSHOT 6584ca21) */}
      {/* ======================================================== */}
      {currentTab === 'bank' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {banks
            .filter(
              (b) =>
                b.namaBank.toLowerCase().includes(searchQuery.toLowerCase()) ||
                b.namaAlias.toLowerCase().includes(searchQuery.toLowerCase())
            )
            .map((bank) => (
              <Card
                key={bank.id}
                hover
                className="p-3.5 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => toggleBankStatus(bank.id)}
                        className={`w-9 h-5 flex items-center rounded-full p-0.5 transition-colors cursor-pointer ${
                          bank.aktif ? 'bg-[#F4511E]' : 'bg-[#2A2E33]'
                        }`}
                      >
                        <div
                          className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                            bank.aktif ? 'translate-x-4' : 'translate-x-0'
                          }`}
                        />
                      </button>
                      <span className="text-[11px] text-neutral-400 font-mono">
                        {bank.aktif ? 'Aktif' : 'Non-aktif'}
                      </span>
                    </div>

                    <button
                      type="button"
                      className="w-7 h-7 rounded-full bg-[#F4511E] text-white flex items-center justify-center hover:opacity-90 transition-opacity cursor-pointer shadow-xs"
                      title="Detail Bank"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>

                  <h3 className="text-base font-bold text-white tracking-wider font-mono">
                    {bank.namaAlias}
                  </h3>
                  <p className="text-xs text-neutral-300 mt-0.5">{bank.namaBank}</p>

                  <div className="mt-2 text-xs font-mono text-neutral-400 space-y-0.5">
                    <div>Kode Bank: {bank.kodeBank}</div>
                    <div>SWIFT: {bank.kodeSwift}</div>
                  </div>
                </div>

                <div className="mt-3 pt-2 border-t border-[#22262A] flex justify-center">
                  <Button
                    size="xs"
                    variant="ghost"
                    icon={Trash2}
                    onClick={() => deleteBank(bank.id)}
                    className="text-[#F4511E] hover:bg-[#F4511E]/10 border border-[#F4511E]/30"
                    title="Hapus Bank"
                  />
                </div>
              </Card>
            ))}
        </div>
      )}

      {/* ======================================================== */}
      {/* 6. DATA REKENING BANK (FAITHFUL TO SCREENSHOT 5b565e7a) */}
      {/* ======================================================== */}
      {currentTab === 'rekening' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {bankAccounts
            .filter(
              (acc) =>
                acc.nomorRekening.includes(searchQuery) ||
                acc.namaAlias.toLowerCase().includes(searchQuery.toLowerCase())
            )
            .map((acc) => (
              <Card
                key={acc.id}
                hover
                className="p-3.5 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => toggleBankAccountStatus(acc.id)}
                        className={`w-9 h-5 flex items-center rounded-full p-0.5 transition-colors cursor-pointer ${
                          acc.aktif ? 'bg-[#F4511E]' : 'bg-[#2A2E33]'
                        }`}
                      >
                        <div
                          className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                            acc.aktif ? 'translate-x-4' : 'translate-x-0'
                          }`}
                        />
                      </button>
                      <span className="text-[11px] text-neutral-400 font-mono">
                        {acc.aktif ? 'Aktif' : 'Non-aktif'}
                      </span>
                    </div>

                    <button
                      type="button"
                      className="w-7 h-7 rounded-full bg-[#F4511E] text-white flex items-center justify-center hover:opacity-90 transition-opacity cursor-pointer shadow-xs"
                      title="Detail Rekening"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="text-[10px] font-mono text-neutral-400">
                    {acc.bank} &bull; {acc.jenisRekening}
                  </div>
                  <h3 className="text-base font-bold text-white tracking-wider font-mono mt-0.5">
                    {acc.nomorRekening}
                  </h3>
                  <p className="text-xs text-neutral-300 mt-0.5">a/n {acc.rekeningAtasNama}</p>
                  <p className="text-[11px] text-amber-300 font-mono mt-1">{acc.namaAlias}</p>
                </div>

                <div className="mt-3 pt-2 border-t border-[#22262A] flex justify-center">
                  <Button
                    size="xs"
                    variant="ghost"
                    icon={Trash2}
                    onClick={() => deleteBankAccount(acc.id)}
                    className="text-[#F4511E] hover:bg-[#F4511E]/10 border border-[#F4511E]/30"
                    title="Hapus Rekening"
                  />
                </div>
              </Card>
            ))}
        </div>
      )}

      {/* ======================================================== */}
      {/* 7. DATA PENGGUNA (USERS) */}
      {/* ======================================================== */}
      {currentTab === 'pengguna' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {usersList.map((user) => (
            <Card key={user.id} hover className="p-3.5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="w-7 h-7 rounded-full bg-[#F4511E]/20 text-[#F4511E] font-bold text-xs flex items-center justify-center font-mono">
                    {user.name.split(' ').map((n) => n[0]).join('')}
                  </span>
                  <Badge size="xs" variant="neutral">
                    {user.role}
                  </Badge>
                </div>

                <h3 className="text-sm font-bold text-white">{user.name}</h3>
                <p className="text-xs text-neutral-400 font-mono mt-0.5">{user.email}</p>
                <p className="text-xs text-neutral-400 font-mono mt-0.5">{user.phone}</p>
              </div>

              <div className="mt-3 pt-2 border-t border-[#22262A] flex items-center justify-between text-[11px] text-neutral-400">
                <Badge size="xs" variant="success" dot>Aktif</Badge>
                <span className="font-mono text-[10px]">Gresik Hub</span>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* ======================================================== */}
      {/* 8. DATA MATA UANG */}
      {/* ======================================================== */}
      {currentTab === 'mata-uang' && (
        <Card className="p-5 max-w-lg space-y-4">
          <h2 className="text-sm font-bold text-white tracking-wide uppercase flex items-center gap-2">
            <Coins className="w-4 h-4 text-[#F4511E]" />
            <span>Mata Uang Basis Sistem PT BAS</span>
          </h2>
          <div className="p-3.5 bg-[#181B1E] border border-[#2D3339] rounded-md space-y-2">
            <div className="text-xs text-neutral-400">Mata Uang Fungsional:</div>
            <div className="text-lg font-bold text-white font-mono">IDR - Indonesian Rupiah (Rp)</div>
            <div className="text-xs text-neutral-400 pt-2 border-t border-[#24282C]">
              Pemisah Ribuan: Titik (.) &bull; Pemisah Desimal: Koma (,) &bull; Presisi Desimal: 2 Digit
            </div>
          </div>
        </Card>
      )}

      {/* Floating Action Button (FAB) */}
      {['supplier', 'material', 'armada', 'customer', 'bank', 'rekening'].includes(currentTab) && (
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="fixed bottom-6 right-6 z-30 w-14 h-14 rounded-full bg-[#F4511E] hover:bg-[#D84315] active:scale-95 text-white flex items-center justify-center shadow-2xl transition-all border border-white/20 cursor-pointer"
          title={`Tambah ${categories.find((c) => c.key === currentTab)?.label}`}
        >
          <Plus className="w-7 h-7 stroke-[2.5]" />
        </button>
      )}

      {/* ======================================================== */}
      {/* MODAL: TAMBAH SUPPLIER */}
      {/* ======================================================== */}
      <Modal
        isOpen={modalOpen && currentTab === 'supplier'}
        onClose={() => setModalOpen(false)}
        title="Tambah Supplier Baru"
        subtitle="Daftarkan vendor tambang material & rekening bank penerima"
      >
        <form onSubmit={handleSubmitSupplier} className="p-4 space-y-3.5">
          <div className="space-y-3">
            <div className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider font-mono">
              Detail Supplier
            </div>

            <Input
              label="Nama Supplier"
              icon={User}
              required
              value={supplierForm.name}
              onChange={(e) => setSupplierForm({ ...supplierForm, name: e.target.value })}
              placeholder="Contoh: PT SOYO APIK, PAK TEGUH"
            />

            <Input
              label="ID Supplier Program Keuangan"
              icon={Hash}
              required
              value={supplierForm.idProgram}
              onChange={(e) => setSupplierForm({ ...supplierForm, idProgram: e.target.value })}
              placeholder="Contoh: SUP-009"
            />

            <Input
              label="Nama Penerima"
              icon={User}
              required
              value={supplierForm.penerima}
              onChange={(e) => setSupplierForm({ ...supplierForm, penerima: e.target.value })}
              placeholder="Nama kontak / pemilik rekening"
            />

            <Input
              label="Nomor Telepon Supplier"
              icon={Phone}
              value={supplierForm.telepon}
              onChange={(e) => setSupplierForm({ ...supplierForm, telepon: e.target.value })}
              placeholder="0812-xxxx-xxxx"
            />

            <div className="flex items-center justify-between bg-[#181B1E] border border-[#2D3339] rounded-md px-3 py-2">
              <span className="text-xs font-semibold text-white">Status PKP</span>
              <button
                type="button"
                onClick={() => setSupplierForm({ ...supplierForm, pkp: !supplierForm.pkp })}
                className={`w-9 h-5 flex items-center rounded-full p-0.5 transition-colors cursor-pointer ${
                  supplierForm.pkp ? 'bg-[#F4511E]' : 'bg-[#2A2E33]'
                }`}
              >
                <div
                  className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                    supplierForm.pkp ? 'translate-x-4' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>

          <div className="space-y-3 pt-3 border-t border-[#24282C]">
            <div className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider font-mono">
              Detail Rekening Pembayaran
            </div>

            <Select
              label="Pilih Bank"
              icon={Landmark}
              value={supplierForm.bank}
              onChange={(e) => setSupplierForm({ ...supplierForm, bank: e.target.value })}
            >
              <option value="BCA">BCA (Bank Central Asia)</option>
              <option value="Mandiri">Bank Mandiri</option>
              <option value="BRI">Bank Rakyat Indonesia (BRI)</option>
              <option value="BNI">Bank Negara Indonesia (BNI)</option>
            </Select>

            <Input
              label="Nomor Rekening"
              icon={Hash}
              required
              value={supplierForm.noRekening}
              onChange={(e) => setSupplierForm({ ...supplierForm, noRekening: e.target.value })}
              className="font-mono"
            />

            <Input
              label="Rekening Atas Nama"
              icon={User}
              required
              value={supplierForm.rekeningAtasNama}
              onChange={(e) =>
                setSupplierForm({ ...supplierForm, rekeningAtasNama: e.target.value })
              }
            />
          </div>

          <div className="pt-3 border-t border-[#24282C] flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setModalOpen(false)}>
              Batal
            </Button>
            <Button type="submit" variant="primary" icon={Save}>
              Simpan Supplier
            </Button>
          </div>
        </form>
      </Modal>

      {/* ======================================================== */}
      {/* MODAL: TAMBAH MATERIAL */}
      {/* ======================================================== */}
      <Modal
        isOpen={modalOpen && currentTab === 'material'}
        onClose={() => setModalOpen(false)}
        title="Tambah Material Baru"
        subtitle="Konfigurasi material tambang, tarif beli/jual, dan akun COA"
      >
        <form onSubmit={handleSubmitMaterial} className="p-4 space-y-3">
          <Input
            label="Nama Material"
            required
            value={materialForm.name}
            onChange={(e) => setMaterialForm({ ...materialForm, name: e.target.value })}
            placeholder="Contoh: SIRTU AYAK, LIMESTONE"
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Harga Beli (Supplier)"
              type="number"
              required
              value={materialForm.beli}
              onChange={(e) => setMaterialForm({ ...materialForm, beli: e.target.value })}
              className="font-mono"
            />
            <Input
              label="Harga Jual (Customer)"
              type="number"
              required
              value={materialForm.jual}
              onChange={(e) => setMaterialForm({ ...materialForm, jual: e.target.value })}
              className="font-mono"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Kategori Material"
              value={materialForm.category}
              onChange={(e) => setMaterialForm({ ...materialForm, category: e.target.value })}
            >
              <option value="Curah">Curah (Tarif PPH 2.0%)</option>
              <option value="Padat">Padat (Tarif PPH 2.65%)</option>
              <option value="Jasa">Jasa Angkut</option>
            </Select>

            <Select
              label="Satuan"
              value={materialForm.satuan}
              onChange={(e) => setMaterialForm({ ...materialForm, satuan: e.target.value })}
            >
              <option value="m3">m³ (Kubik)</option>
              <option value="ton">Ton</option>
              <option value="rit">Rit</option>
              <option value="m2">m²</option>
            </Select>
          </div>

          <Input
            label="COA"
            value={materialForm.coa}
            onChange={(e) => setMaterialForm({ ...materialForm, coa: e.target.value })}
            className="font-mono"
          />

          <Input
            label="COA Piutang Dagang"
            value={materialForm.coaPiutang}
            onChange={(e) => setMaterialForm({ ...materialForm, coaPiutang: e.target.value })}
            className="font-mono"
          />

          <Input
            label="COA Pendapatan"
            value={materialForm.coaPendapatan}
            onChange={(e) => setMaterialForm({ ...materialForm, coaPendapatan: e.target.value })}
            className="font-mono"
          />

          <div className="pt-3 border-t border-[#24282C] flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setModalOpen(false)}>
              Batal
            </Button>
            <Button type="submit" variant="primary" icon={Save}>
              Simpan Material
            </Button>
          </div>
        </form>
      </Modal>

      {/* ======================================================== */}
      {/* MODAL: TAMBAH ARMADA */}
      {/* ======================================================== */}
      <Modal
        isOpen={modalOpen && currentTab === 'armada'}
        onClose={() => setModalOpen(false)}
        title="Tambah Armada Truk"
        subtitle="Pencatatan nomor polisi dan dimensi bak dump truck"
      >
        <form onSubmit={handleSubmitArmada} className="p-4 space-y-3">
          <Input
            label="Nomor Polisi (TNKB)"
            required
            value={armadaForm.nopol}
            onChange={(e) =>
              setArmadaForm({ ...armadaForm, nopol: e.target.value.toUpperCase() })
            }
            placeholder="Contoh: W 9821 UB"
            className="font-mono font-bold"
          />

          <div>
            <label className="block text-[11px] font-medium text-neutral-300 mb-1">
              Dimensi Bak Kendaraan (cm) <span className="text-[#F4511E] font-bold">*</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              <Input
                label="Panjang (P)"
                type="number"
                required
                value={armadaForm.panjangCm}
                onChange={(e) =>
                  setArmadaForm({ ...armadaForm, panjangCm: Number(e.target.value) })
                }
                className="font-mono"
              />
              <Input
                label="Lebar (L)"
                type="number"
                required
                value={armadaForm.lebarCm}
                onChange={(e) =>
                  setArmadaForm({ ...armadaForm, lebarCm: Number(e.target.value) })
                }
                className="font-mono"
              />
              <Input
                label="Tinggi (T)"
                type="number"
                required
                value={armadaForm.tinggiCm}
                onChange={(e) =>
                  setArmadaForm({ ...armadaForm, tinggiCm: Number(e.target.value) })
                }
                className="font-mono"
              />
            </div>

            <div className="mt-1.5 text-xs text-amber-400 font-mono">
              Kapasitas Kubikasi Otomatis:{' '}
              {((armadaForm.panjangCm * armadaForm.lebarCm * armadaForm.tinggiCm) / 1000000).toFixed(
                2
              )}{' '}
              m³
            </div>
          </div>

          <Input
            label="Merk / Model Kendaraan"
            value={armadaForm.merk}
            onChange={(e) => setArmadaForm({ ...armadaForm, merk: e.target.value })}
            placeholder="Contoh: Hino Dutro 130 HD"
          />

          <div className="grid grid-cols-2 gap-2">
            <Input
              label="Nomor Rangka / VIN"
              value={armadaForm.vin}
              onChange={(e) => setArmadaForm({ ...armadaForm, vin: e.target.value })}
              className="font-mono"
            />
            <Input
              label="Nomor Mesin"
              value={armadaForm.mesin}
              onChange={(e) => setArmadaForm({ ...armadaForm, mesin: e.target.value })}
              className="font-mono"
            />
          </div>

          <Input
            label="Tahun Pembuatan"
            type="number"
            value={armadaForm.tahun}
            onChange={(e) => setArmadaForm({ ...armadaForm, tahun: Number(e.target.value) })}
            className="font-mono"
          />

          <div className="pt-3 border-t border-[#24282C] flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setModalOpen(false)}>
              Batal
            </Button>
            <Button type="submit" variant="primary" icon={Save}>
              Simpan Armada
            </Button>
          </div>
        </form>
      </Modal>

      {/* ======================================================== */}
      {/* MODAL: TAMBAH CUSTOMER */}
      {/* ======================================================== */}
      <Modal
        isOpen={modalOpen && currentTab === 'customer'}
        onClose={() => setModalOpen(false)}
        title="Tambah Customer Baru"
        subtitle="Pendaftaran customer proyek penerima material tambang"
      >
        <form onSubmit={handleSubmitCustomer} className="p-4 space-y-3">
          <Select
            label="Pilih Jenis Badan Usaha"
            value={customerForm.jenisBadanUsaha}
            onChange={(e) =>
              setCustomerForm({ ...customerForm, jenisBadanUsaha: e.target.value })
            }
          >
            <option value="PT">PT (Perseroan Terbatas)</option>
            <option value="CV">CV (Commanditaire Vennootschap)</option>
            <option value="UD">UD (Usaha Dagang)</option>
            <option value="Perorangan">Perorangan / Pribadi</option>
          </Select>

          <Input
            label="Nama Customer"
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
          />

          <Input
            label="Nama Alias Customer (auto)"
            value={customerForm.alias}
            onChange={(e) => setCustomerForm({ ...customerForm, alias: e.target.value })}
            className="font-mono"
          />

          <Input
            label="Alamat Lengkap / Proyek"
            value={customerForm.alamat}
            onChange={(e) => setCustomerForm({ ...customerForm, alamat: e.target.value })}
            placeholder="Lokasi bongkar / gudang proyek"
          />

          <div className="grid grid-cols-2 gap-2">
            <Input
              label="Nomor NPWP"
              value={customerForm.npwp}
              onChange={(e) => setCustomerForm({ ...customerForm, npwp: e.target.value })}
              className="font-mono"
            />
            <Input
              label="Nomor Telepon"
              value={customerForm.telepon}
              onChange={(e) => setCustomerForm({ ...customerForm, telepon: e.target.value })}
              className="font-mono"
            />
          </div>

          <div className="pt-3 border-t border-[#24282C] flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setModalOpen(false)}>
              Batal
            </Button>
            <Button type="submit" variant="primary" icon={Save}>
              Simpan Customer
            </Button>
          </div>
        </form>
      </Modal>

      {/* ======================================================== */}
      {/* MODAL: TAMBAH BANK */}
      {/* ======================================================== */}
      <Modal
        isOpen={modalOpen && currentTab === 'bank'}
        onClose={() => setModalOpen(false)}
        title="Tambah Bank Mitra"
        subtitle="Pendaftaran kode kliring & SWIFT bank transaksi"
      >
        <form onSubmit={handleSubmitBank} className="p-4 space-y-3">
          <Input
            label="Nama Bank"
            required
            value={bankForm.namaBank}
            onChange={(e) => setBankForm({ ...bankForm, namaBank: e.target.value })}
            placeholder="Contoh: Bank Central Asia"
          />

          <Input
            label="Nama Alias Bank"
            required
            value={bankForm.namaAlias}
            onChange={(e) => setBankForm({ ...bankForm, namaAlias: e.target.value })}
            placeholder="Contoh: BCA - 014"
          />

          <div className="grid grid-cols-2 gap-2">
            <Input
              label="Kode SWIFT"
              value={bankForm.kodeSwift}
              onChange={(e) => setBankForm({ ...bankForm, kodeSwift: e.target.value })}
              className="font-mono"
            />
            <Input
              label="Kode Bank"
              required
              value={bankForm.kodeBank}
              onChange={(e) => setBankForm({ ...bankForm, kodeBank: e.target.value })}
              className="font-mono"
            />
          </div>

          <div className="pt-3 border-t border-[#24282C] flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setModalOpen(false)}>
              Batal
            </Button>
            <Button type="submit" variant="primary" icon={Save}>
              Simpan Bank
            </Button>
          </div>
        </form>
      </Modal>

      {/* ======================================================== */}
      {/* MODAL: TAMBAH REKENING BANK */}
      {/* ======================================================== */}
      <Modal
        isOpen={modalOpen && currentTab === 'rekening'}
        onClose={() => setModalOpen(false)}
        title="Tambah Rekening PT BAS"
        subtitle="Pendaftaran rekening kas penampung & operasional proyek"
      >
        <form onSubmit={handleSubmitRekening} className="p-4 space-y-3">
          <Select
            label="Pilih Bank"
            value={rekeningForm.bank}
            onChange={(e) => setRekeningForm({ ...rekeningForm, bank: e.target.value })}
          >
            {banks.map((b) => (
              <option key={b.id} value={b.namaAlias}>
                {b.namaAlias} - {b.namaBank}
              </option>
            ))}
          </Select>

          <Select
            label="Jenis Rekening"
            value={rekeningForm.jenisRekening}
            onChange={(e) =>
              setRekeningForm({ ...rekeningForm, jenisRekening: e.target.value })
            }
          >
            <option value="Giro Bisnis">Giro Bisnis (Operasional)</option>
            <option value="Giro Utama">Giro Utama (Penerimaan)</option>
            <option value="Tabungan Escrow">Tabungan Escrow (Vendor)</option>
            <option value="Deposito">Deposito Cadangan</option>
          </Select>

          <Input
            label="Nomor Rekening"
            required
            value={rekeningForm.nomorRekening}
            onChange={(e) =>
              setRekeningForm({ ...rekeningForm, nomorRekening: e.target.value })
            }
            className="font-mono font-bold"
          />

          <Input
            label="Rekening Atas Nama"
            required
            value={rekeningForm.rekeningAtasNama}
            onChange={(e) =>
              setRekeningForm({ ...rekeningForm, rekeningAtasNama: e.target.value })
            }
          />

          <Input
            label="Nama Alias Rekening"
            value={rekeningForm.namaAlias}
            onChange={(e) => setRekeningForm({ ...rekeningForm, namaAlias: e.target.value })}
            placeholder="Contoh: BCA Operasional Gresik"
          />

          <div className="pt-3 border-t border-[#24282C] flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setModalOpen(false)}>
              Batal
            </Button>
            <Button type="submit" variant="primary" icon={Save}>
              Simpan Rekening
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
