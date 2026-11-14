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
  Calendar,
  Info,
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
    updateMaterial,
    deleteMaterial,
    toggleSupplierStatus,
    addSupplier,
    updateSupplier,
    deleteSupplier,
    toggleCustomerStatus,
    addCustomer,
    deleteCustomer,
    toggleArmadaStatus,
    addArmada,
    updateArmada,
    deleteArmada,
    toggleBankStatus,
    addBank,
    updateBank,
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
    bank: 'BCA - BANK CENTRAL ASIA',
    noRekening: '',
    rekeningAtasNama: '',
  });

  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [editSupplierModal, setEditSupplierModal] = useState(false);
  const [editSupplierForm, setEditSupplierForm] = useState({
    id: '',
    name: '',
    idProgram: '',
    penerima: '',
    telepon: '',
    pkp: false,
    bank: 'BCA - BANK CENTRAL ASIA',
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

  const [selectedMaterial, setSelectedMaterial] = useState(null);
  const [editMaterialModal, setEditMaterialModal] = useState(false);
  const [editMaterialForm, setEditMaterialForm] = useState({
    id: '',
    name: '',
    beli: '',
    jual: '',
    coa: '',
    coaPiutang: '',
    coaPendapatan: '',
    aktif: true,
  });

  const [armadaForm, setArmadaForm] = useState({
    nopol: '',
    panjangCm: 0,
    lebarCm: 0,
    tinggiCm: 0,
    aktif: true,
    merk: 'Hino',
    vin: '',
    mesin: '',
    tahun: 2022,
  });

  const [selectedArmada, setSelectedArmada] = useState(null);
  const [editArmadaModal, setEditArmadaModal] = useState(false);
  const [editArmadaForm, setEditArmadaForm] = useState({
    id: '',
    nopol: '',
    panjangCm: 650,
    lebarCm: 250,
    tinggiCm: 200,
    aktif: true,
    merk: 'Hino',
    vin: '',
    mesin: '',
    tahun: 2022,
  });

  const [customerForm, setCustomerForm] = useState({
    jenisBadanUsaha: 'PT-Perusahaan Terbatas',
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

  const [selectedBank, setSelectedBank] = useState(null);
  const [editBankModal, setEditBankModal] = useState(false);
  const [editBankForm, setEditBankForm] = useState({
    id: '',
    namaBank: '',
    namaAlias: '',
    kodeSwift: '',
    kodeBank: '',
  });

  const [rekeningForm, setRekeningForm] = useState({
    bank: '',
    jenisRekening: '',
    nomorRekening: '',
    rekeningAtasNama: '',
    namaAlias: '',
  });

  // Delete confirmation modal state
  const [deleteConfirm, setDeleteConfirm] = useState({
    open: false,
    type: '',       // 'supplier' | 'material' | 'armada' | 'customer' | 'bank' | 'rekening'
    id: null,
    label: '',      // nama item untuk ditampilkan di modal
  });

  const handleAskDelete = (type, id, label) => {
    setDeleteConfirm({ open: true, type, id, label });
  };

  const handleConfirmDelete = () => {
    const { type, id } = deleteConfirm;
    if (type === 'supplier') deleteSupplier(id);
    else if (type === 'material') deleteMaterial(id);
    else if (type === 'armada') deleteArmada(id);
    else if (type === 'customer') deleteCustomer(id);
    else if (type === 'bank') deleteBank(id);
    else if (type === 'rekening') deleteBankAccount(id);
    setDeleteConfirm({ open: false, type: '', id: null, label: '' });
  };

  const handleCancelDelete = () => {
    setDeleteConfirm({ open: false, type: '', id: null, label: '' });
  };

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
      bank: 'BCA - BANK CENTRAL ASIA',
      noRekening: '',
      rekeningAtasNama: '',
    });
    setModalOpen(false);
  };

  const handleOpenEditSupplier = (sup) => {
    setSelectedSupplier(sup);
    let matchedBank = sup.bank || 'BCA - BANK CENTRAL ASIA';
    if (matchedBank === 'BCA' || matchedBank.toUpperCase().startsWith('BCA')) {
      matchedBank = 'BCA - BANK CENTRAL ASIA';
    } else if (matchedBank === 'Mandiri' || matchedBank.toUpperCase().startsWith('MANDIRI')) {
      matchedBank = 'MANDIRI - BANK MANDIRI';
    } else if (matchedBank === 'BRI' || matchedBank.toUpperCase().startsWith('BRI')) {
      matchedBank = 'BRI - BANK RAKYAT INDONESIA';
    } else if (matchedBank === 'BNI' || matchedBank.toUpperCase().startsWith('BNI')) {
      matchedBank = 'BNI - BANK NEGARA INDONESIA';
    }

    setEditSupplierForm({
      id: sup.id,
      name: sup.name || '',
      idProgram: sup.idProgram || '',
      penerima: sup.penerima || '',
      telepon: sup.telepon || '',
      pkp: Boolean(sup.pkp),
      bank: matchedBank,
      noRekening: sup.noRekening || '',
      rekeningAtasNama: sup.rekeningAtasNama || '',
    });
    setEditSupplierModal(true);
  };

  const handleUpdateSupplier = (e) => {
    e.preventDefault();
    if (!editSupplierForm.id) return;
    updateSupplier(editSupplierForm.id, {
      name: editSupplierForm.name,
      idProgram: editSupplierForm.idProgram,
      penerima: editSupplierForm.penerima,
      telepon: editSupplierForm.telepon,
      pkp: editSupplierForm.pkp,
      bank: editSupplierForm.bank,
      noRekening: editSupplierForm.noRekening,
      rekeningAtasNama: editSupplierForm.rekeningAtasNama,
    });
    setEditSupplierModal(false);
    setSelectedSupplier(null);
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

  const handleOpenEditMaterial = (mat) => {
    setSelectedMaterial(mat);
    setEditMaterialForm({
      id: mat.id,
      name: mat.name,
      beli: mat.beli !== undefined ? Number(mat.beli).toFixed(1) : '',
      jual: mat.jual !== undefined ? Number(mat.jual).toFixed(1) : '',
      coa: mat.coa || '',
      coaPiutang: mat.coaPiutang || '',
      coaPendapatan: mat.coaPendapatan || '',
      aktif: mat.aktif ?? true,
    });
    setEditMaterialModal(true);
  };

  const handleUpdateMaterial = (e) => {
    e.preventDefault();
    if (!editMaterialForm.id) return;
    updateMaterial(editMaterialForm.id, {
      name: editMaterialForm.name,
      beli: Number(editMaterialForm.beli) || 0,
      jual: Number(editMaterialForm.jual) || 0,
      coa: editMaterialForm.coa,
      coaPiutang: editMaterialForm.coaPiutang,
      coaPendapatan: editMaterialForm.coaPendapatan,
      aktif: editMaterialForm.aktif,
    });
    setEditMaterialModal(false);
    setSelectedMaterial(null);
  };

  const handleSubmitArmada = (e) => {
    e.preventDefault();
    if (!armadaForm.nopol) return;
    addArmada(armadaForm);
    setArmadaForm({
      nopol: '',
      panjangCm: 0,
      lebarCm: 0,
      tinggiCm: 0,
      aktif: true,
      merk: 'Hino',
      vin: '',
      mesin: '',
      tahun: 2022,
    });
    setModalOpen(false);
  };

  const handleOpenEditArmada = (arm) => {
    setSelectedArmada(arm);
    setEditArmadaForm({
      id: arm.id,
      nopol: arm.nopol || '',
      panjangCm: arm.panjangCm !== undefined ? arm.panjangCm : 0,
      lebarCm: arm.lebarCm !== undefined ? arm.lebarCm : 0,
      tinggiCm: arm.tinggiCm !== undefined ? arm.tinggiCm : 0,
      aktif: arm.aktif ?? true,
      merk: arm.merk || 'Hino',
      vin: arm.vin || '',
      mesin: arm.mesin || '',
      tahun: arm.tahun || '',
    });
    setEditArmadaModal(true);
  };

  const handleUpdateArmada = (e) => {
    e.preventDefault();
    if (!editArmadaForm.id) return;
    updateArmada(editArmadaForm.id, {
      nopol: editArmadaForm.nopol.toUpperCase(),
      panjangCm: Number(editArmadaForm.panjangCm) || 0,
      lebarCm: Number(editArmadaForm.lebarCm) || 0,
      tinggiCm: Number(editArmadaForm.tinggiCm) || 0,
      aktif: editArmadaForm.aktif,
      merk: editArmadaForm.merk,
      vin: editArmadaForm.vin,
      mesin: editArmadaForm.mesin,
      tahun: Number(editArmadaForm.tahun) || 2022,
    });
    setEditArmadaModal(false);
    setSelectedArmada(null);
  };

  const handleSubmitCustomer = (e) => {
    e.preventDefault();
    if (!customerForm.name) return;
    const prefix =
      customerForm.kodePrefix ||
      `${customerForm.name.slice(0, 2).toUpperCase()} ${Math.floor(100 + Math.random() * 900)}`;
    const jbuPrefix = customerForm.jenisBadanUsaha.split('-')[0] || customerForm.jenisBadanUsaha;
    addCustomer({
      ...customerForm,
      kodePrefix: prefix,
      alias: customerForm.alias || `${jbuPrefix} ${customerForm.name}`,
    });
    setCustomerForm({
      jenisBadanUsaha: 'PT-Perusahaan Terbatas',
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

  const handleOpenEditBank = (b) => {
    setSelectedBank(b);
    setEditBankForm({
      id: b.id,
      namaBank: b.namaBank || '',
      namaAlias: b.namaBank || '',
      kodeSwift: b.kodeSwift || '',
      kodeBank: b.kodeBank || '',
    });
    setEditBankModal(true);
  };

  const handleUpdateBank = (e) => {
    e.preventDefault();
    if (!editBankForm.id) return;
    updateBank(editBankForm.id, {
      namaBank: editBankForm.namaBank.toUpperCase(),
      namaAlias: editBankForm.namaBank.toUpperCase(),
      kodeSwift: editBankForm.kodeSwift.toUpperCase(),
      kodeBank: editBankForm.kodeBank,
    });
    setEditBankModal(false);
    setSelectedBank(null);
  };

  const handleSubmitRekening = (e) => {
    e.preventDefault();
    if (!rekeningForm.nomorRekening || !rekeningForm.bank) return;
    addBankAccount(rekeningForm);
    setRekeningForm({
      bank: '',
      jenisRekening: '',
      nomorRekening: '',
      rekeningAtasNama: '',
      namaAlias: '',
    });
    setModalOpen(false);
  };

  const masterSubgroups = [
    {
      id: 'operasional',
      label: 'Operasional Lapangan',
      tag: 'Operasional',
      items: [
        { key: 'supplier', label: 'Data Supplier', shortLabel: 'Supplier', count: suppliers.length, icon: HardHat },
        { key: 'material', label: 'Data Material', shortLabel: 'Material', count: materials.length, icon: Mountain },
        { key: 'customer', label: 'Data Customer', shortLabel: 'Customer', count: customers.length, icon: Building2 },
        { key: 'armada', label: 'Data Armada', shortLabel: 'Armada Truk', count: armadaList.length, icon: Truck },
      ],
    },
    {
      id: 'finansial',
      label: 'Finansial & Bank',
      tag: 'Finansial',
      items: [
        { key: 'bank', label: 'Data Bank', shortLabel: 'Bank Mitra', count: banks.length, icon: Landmark },
        { key: 'rekening', label: 'Data Rekening Bank', shortLabel: 'Rekening Bank', count: bankAccounts.length, icon: CreditCard },
        { key: 'mata-uang', label: 'Data Mata Uang', shortLabel: 'Mata Uang Basis', count: 1, icon: Coins },
      ],
    },
    {
      id: 'pengguna',
      label: 'Akses & Pengguna',
      tag: 'Akses',
      items: [
        { key: 'pengguna', label: 'Data Pengguna', shortLabel: 'Pengguna Sistem', count: usersList.length, icon: Users },
      ],
    },
  ];

  // Flattened for easy lookup
  const categories = masterSubgroups.flatMap((g) => g.items);

  // Active item
  const activeItem = categories.find((it) => it.key === currentTab) || categories[0];
  const ActiveIcon = activeItem?.icon || HardHat;

  return (
    <div className="space-y-3.5 pb-20 relative min-h-screen">
      {/* 1. Sleek Compact Control Bar (Horizontal & Space-Saving) */}
      <div className="bg-[#131A24] border border-[#1D2838] rounded-xl p-2.5 sm:px-3 sm:py-2 flex flex-col md:flex-row md:items-center justify-between gap-2.5 shadow-sm">
        {/* Left: Active Entity Badge */}
        <div className="flex items-center gap-2">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#F4511E]/20 text-[#FF7043] border border-[#F4511E]/40 font-bold text-xs shadow-2xs">
            <ActiveIcon className="w-3.5 h-3.5 text-[#F4511E]" />
            <span>{activeItem.label}</span>
            <span className="font-mono text-[10px] bg-black/40 text-neutral-200 px-1.5 py-0.2 rounded ml-0.5 border border-white/10">
              {activeItem.count}
            </span>
          </div>
        </div>

        {/* Right: Compact Search & Add Button on the Same Horizontal Line */}
        <div className="flex items-center gap-2 w-full md:w-auto justify-between md:justify-end">
          <div className="w-full sm:w-56">
            <Input
              icon={Search}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={`Cari ${activeItem.shortLabel}...`}
              className="py-1 text-xs"
            />
          </div>

          {['supplier', 'material', 'armada', 'customer', 'bank', 'rekening'].includes(currentTab) && (
            <Button
              size="sm"
              variant="primary"
              icon={Plus}
              onClick={() => setModalOpen(true)}
              className="whitespace-nowrap shrink-0 font-medium bg-[#F4511E] hover:bg-[#D84315]"
            >
              Tambah {activeItem.shortLabel}
            </Button>
          )}
        </div>
      </div>

      {/* 2. Unified Single-Row Horizontal Tab Ribbon (Melebar ke Samping) */}
      <div className="bg-[#131A24] border border-[#1D2838] rounded-xl p-1.5 shadow-sm">
        <div
          className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-0.5 px-1 min-w-0"
          role="tablist"
        >
          {masterSubgroups.map((group, gIdx) => (
            <div key={group.id} className="flex items-center gap-1 shrink-0">
              {gIdx > 0 && <div className="h-5 w-px bg-[#1D2838] mx-2 shrink-0" />}

              {/* Group Label Chip */}
              <span className="text-[10px] font-mono uppercase text-neutral-400 font-bold px-2 py-1 rounded bg-[#0B0F17] border border-[#1D2838] shrink-0 select-none">
                {group.tag || group.label}
              </span>

              {/* Items in Group */}
              {group.items.map((cat) => {
                const Icon = cat.icon;
                const isActive = currentTab === cat.key;

                return (
                  <button
                    key={cat.key}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    onClick={() => setTab(cat.key)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap flex items-center gap-1.5 transition-all cursor-pointer shrink-0 select-none ${
                      isActive
                        ? 'bg-[#F4511E] text-white font-bold shadow-xs'
                        : 'bg-[#0E1520] text-neutral-300 hover:text-white hover:bg-[#16202C] border border-[#1D2838]'
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-white' : 'text-[#FF7043]'}`} />
                    <span>{cat.shortLabel || cat.label}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                        isActive ? 'bg-black/40 text-white font-bold' : 'bg-black/30 text-neutral-400'
                      }`}
                    >
                      {cat.count}
                    </span>
                  </button>
                );
              })}
            </div>
          ))}
        </div>
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
                      onClick={() => handleOpenEditSupplier(sup)}
                      className="w-7 h-7 rounded-full bg-[#F4511E] text-white flex items-center justify-center hover:opacity-90 transition-opacity cursor-pointer shadow-xs"
                      title="Perbarui Data Supplier"
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
                    onClick={() => handleAskDelete('supplier', sup.id, sup.name)}
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
                      onClick={() => handleOpenEditMaterial(mat)}
                      className="w-7 h-7 rounded-full bg-[#F4511E] text-white flex items-center justify-center hover:opacity-90 transition-opacity cursor-pointer shadow-xs"
                      title="Perbarui Data Material"
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
                    onClick={() => handleAskDelete('material', mat.id, mat.name)}
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
                      onClick={() => handleOpenEditArmada(arm)}
                      className="w-7 h-7 rounded-full bg-[#F4511E] text-white flex items-center justify-center hover:opacity-90 transition-opacity cursor-pointer shadow-xs"
                      title="Perbarui Data Armada"
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
                    onClick={() => handleAskDelete('armada', arm.id, arm.nopol)}
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
                    onClick={() => handleAskDelete('customer', cust.id, cust.name)}
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
                      onClick={() => handleOpenEditBank(bank)}
                      className="w-7 h-7 rounded-full bg-[#F4511E] text-white flex items-center justify-center hover:opacity-90 transition-opacity cursor-pointer shadow-xs"
                      title="Perbarui Data Bank"
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
                    onClick={() => handleAskDelete('bank', bank.id, bank.namaAlias || bank.namaBank)}
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
                    onClick={() => handleAskDelete('rekening', acc.id, acc.nomorRekening)}
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
              onChange={(e) => setSupplierForm({ ...supplierForm, name: e.target.value.toUpperCase() })}
              placeholder="Contoh: PT SOYO APIK, PAK TEGUH"
              className="uppercase"
            />

            <Input
              label="ID Supplier Program Keuangan"
              icon={Hash}
              required
              value={supplierForm.idProgram}
              onChange={(e) => setSupplierForm({ ...supplierForm, idProgram: e.target.value })}
              placeholder="Contoh: SUP-009"
              className="font-mono"
            />

            <Input
              label="Nama Penerima"
              icon={User}
              required
              value={supplierForm.penerima}
              onChange={(e) => setSupplierForm({ ...supplierForm, penerima: e.target.value.toUpperCase() })}
              placeholder="Nama kontak / pemilik rekening"
              className="uppercase"
            />

            <Input
              label="Nomor Telepon Supplier"
              icon={Phone}
              inputMode="numeric"
              pattern="[0-9]*"
              value={supplierForm.telepon}
              onKeyDown={(e) => {
                if (
                  [
                    'Backspace',
                    'Tab',
                    'Enter',
                    'Delete',
                    'Escape',
                    'ArrowLeft',
                    'ArrowRight',
                    'ArrowUp',
                    'ArrowDown',
                    'Home',
                    'End',
                  ].includes(e.key) ||
                  e.ctrlKey ||
                  e.metaKey
                ) {
                  return;
                }
                if (!/^[0-9]$/.test(e.key)) {
                  e.preventDefault();
                }
              }}
              onChange={(e) => setSupplierForm({ ...supplierForm, telepon: e.target.value.replace(/\D/g, '') })}
              placeholder="0812-xxxx-xxxx"
              className="font-mono"
            />

            <div className="flex items-center justify-between bg-[#181B1E] border border-[#2D3339] rounded-md px-3 py-2.5">
              <span className="text-xs font-semibold text-white">PKP</span>
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
              <option value="BCA - BANK CENTRAL ASIA">BCA - BANK CENTRAL ASIA</option>
              <option value="MANDIRI - BANK MANDIRI">MANDIRI - BANK MANDIRI</option>
              <option value="BRI - BANK RAKYAT INDONESIA">BRI - BANK RAKYAT INDONESIA</option>
              <option value="BNI - BANK NEGARA INDONESIA">BNI - BANK NEGARA INDONESIA</option>
            </Select>

            <Input
              label="Nomor Rekening"
              icon={Hash}
              required
              inputMode="numeric"
              pattern="[0-9]*"
              value={supplierForm.noRekening}
              onKeyDown={(e) => {
                if (
                  [
                    'Backspace',
                    'Tab',
                    'Enter',
                    'Delete',
                    'Escape',
                    'ArrowLeft',
                    'ArrowRight',
                    'ArrowUp',
                    'ArrowDown',
                    'Home',
                    'End',
                  ].includes(e.key) ||
                  e.ctrlKey ||
                  e.metaKey
                ) {
                  return;
                }
                if (!/^[0-9]$/.test(e.key)) {
                  e.preventDefault();
                }
              }}
              onChange={(e) => {
                const numericOnly = e.target.value.replace(/\D/g, '');
                setSupplierForm({ ...supplierForm, noRekening: numericOnly });
              }}
              placeholder="Contoh: 8295019281 (Hanya angka)"
              className="font-mono"
            />

            <Input
              label="Rekening Atas Nama"
              icon={User}
              required
              value={supplierForm.rekeningAtasNama}
              onChange={(e) =>
                setSupplierForm({ ...supplierForm, rekeningAtasNama: e.target.value.toUpperCase() })
              }
              className="uppercase"
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
      {/* MODAL: PERBARUI DATA SUPPLIER */}
      {/* ======================================================== */}
      <Modal
        isOpen={editSupplierModal}
        onClose={() => {
          setEditSupplierModal(false);
          setSelectedSupplier(null);
        }}
        title="Perbarui Data Supplier"
        subtitle="Edit parameter data vendor & rekening bank penerima"
      >
        <form onSubmit={handleUpdateSupplier} className="p-4 space-y-3.5">
          <div className="space-y-3">
            <div className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider font-mono">
              Detail Supplier
            </div>

            <Input
              label="Nama Supplier"
              icon={User}
              required
              value={editSupplierForm.name}
              onChange={(e) =>
                setEditSupplierForm({ ...editSupplierForm, name: e.target.value.toUpperCase() })
              }
              className="font-mono font-bold uppercase"
              placeholder="Contoh: UKHY DIAN"
            />

            <Input
              label="ID Supplier Program Keuangan"
              icon={Hash}
              required
              value={editSupplierForm.idProgram}
              onChange={(e) =>
                setEditSupplierForm({ ...editSupplierForm, idProgram: e.target.value })
              }
              placeholder="Contoh: 00"
              className="font-mono"
            />

            <Input
              label="Nama Penerima"
              icon={User}
              required
              value={editSupplierForm.penerima}
              onChange={(e) =>
                setEditSupplierForm({ ...editSupplierForm, penerima: e.target.value.toUpperCase() })
              }
              placeholder="Contoh: PAK UKHY"
              className="uppercase"
            />

            <Input
              label="Nomor Telepon Supplier"
              icon={Phone}
              inputMode="numeric"
              pattern="[0-9]*"
              value={editSupplierForm.telepon}
              onKeyDown={(e) => {
                if (
                  [
                    'Backspace',
                    'Tab',
                    'Enter',
                    'Delete',
                    'Escape',
                    'ArrowLeft',
                    'ArrowRight',
                    'ArrowUp',
                    'ArrowDown',
                    'Home',
                    'End',
                  ].includes(e.key) ||
                  e.ctrlKey ||
                  e.metaKey
                ) {
                  return;
                }
                if (!/^[0-9]$/.test(e.key)) {
                  e.preventDefault();
                }
              }}
              onChange={(e) =>
                setEditSupplierForm({
                  ...editSupplierForm,
                  telepon: e.target.value.replace(/\D/g, ''),
                })
              }
              placeholder="Nomor Telepon Supplier"
              className="font-mono"
            />

            <div className="flex items-center justify-between bg-[#181B1E] border border-[#2D3339] rounded-md px-3 py-2.5">
              <span className="text-xs font-semibold text-white">PKP</span>
              <button
                type="button"
                onClick={() =>
                  setEditSupplierForm({ ...editSupplierForm, pkp: !editSupplierForm.pkp })
                }
                className={`w-9 h-5 flex items-center rounded-full p-0.5 transition-colors cursor-pointer ${
                  editSupplierForm.pkp ? 'bg-[#F4511E]' : 'bg-[#2A2E33]'
                }`}
              >
                <div
                  className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                    editSupplierForm.pkp ? 'translate-x-4' : 'translate-x-0'
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
              required
              value={editSupplierForm.bank}
              onChange={(e) =>
                setEditSupplierForm({ ...editSupplierForm, bank: e.target.value })
              }
            >
              <option value="BCA - BANK CENTRAL ASIA">BCA - BANK CENTRAL ASIA</option>
              <option value="MANDIRI - BANK MANDIRI">MANDIRI - BANK MANDIRI</option>
              <option value="BRI - BANK RAKYAT INDONESIA">BRI - BANK RAKYAT INDONESIA</option>
              <option value="BNI - BANK NEGARA INDONESIA">BNI - BANK NEGARA INDONESIA</option>
              {banks
                .filter(
                  (b) =>
                    !['BCA', 'MANDIRI', 'BRI', 'BNI'].some((code) =>
                      b.namaAlias.toUpperCase().includes(code)
                    )
                )
                .map((b) => (
                  <option key={b.id} value={`${b.namaAlias} - ${b.namaBank.toUpperCase()}`}>
                    {b.namaAlias} - {b.namaBank.toUpperCase()}
                  </option>
                ))}
            </Select>

            <Input
              label="Nomor Rekening"
              icon={Hash}
              required
              inputMode="numeric"
              pattern="[0-9]*"
              value={editSupplierForm.noRekening}
              onKeyDown={(e) => {
                if (
                  [
                    'Backspace',
                    'Tab',
                    'Enter',
                    'Delete',
                    'Escape',
                    'ArrowLeft',
                    'ArrowRight',
                    'ArrowUp',
                    'ArrowDown',
                    'Home',
                    'End',
                  ].includes(e.key) ||
                  e.ctrlKey ||
                  e.metaKey
                ) {
                  return;
                }
                if (!/^[0-9]$/.test(e.key)) {
                  e.preventDefault();
                }
              }}
              onChange={(e) => {
                const numericOnly = e.target.value.replace(/\D/g, '');
                setEditSupplierForm({ ...editSupplierForm, noRekening: numericOnly });
              }}
              placeholder="Contoh: 6150832452"
              className="font-mono font-bold"
            />

            <Input
              label="Rekening Atas Nama"
              icon={User}
              required
              value={editSupplierForm.rekeningAtasNama}
              onChange={(e) =>
                setEditSupplierForm({
                  ...editSupplierForm,
                  rekeningAtasNama: e.target.value.toUpperCase(),
                })
              }
              placeholder="Contoh: UKHY DIAN"
              className="uppercase"
            />
          </div>

          <div className="pt-3 border-t border-[#24282C] flex justify-end gap-2">
            <Button
              variant="ghost"
              onClick={() => {
                setEditSupplierModal(false);
                setSelectedSupplier(null);
              }}
            >
              Batal
            </Button>
            <Button type="submit" variant="primary" icon={Save}>
              Perbarui Supplier
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
            onChange={(e) => setMaterialForm({ ...materialForm, name: e.target.value.toUpperCase() })}
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
      {/* MODAL: PERBARUI DATA MATERIAL */}
      {/* ======================================================== */}
      <Modal
        isOpen={editMaterialModal}
        onClose={() => {
          setEditMaterialModal(false);
          setSelectedMaterial(null);
        }}
        title="Perbarui Data Material"
        subtitle="Edit parameter harga, COA, dan status material"
      >
        <form onSubmit={handleUpdateMaterial} className="p-4 space-y-3.5">
          <Input
            label="Nama Material"
            disabled
            value={editMaterialForm.name}
            onChange={(e) =>
              setEditMaterialForm({ ...editMaterialForm, name: e.target.value.toUpperCase() })
            }
            className="font-mono font-bold uppercase cursor-not-allowed opacity-75"
          />

          <Input
            label="Harga Beli"
            type="number"
            step="0.1"
            required
            rightElement="IDR"
            value={editMaterialForm.beli}
            onChange={(e) =>
              setEditMaterialForm({ ...editMaterialForm, beli: e.target.value })
            }
            className="font-mono font-bold"
          />

          <Input
            label="Harga Jual"
            type="number"
            step="0.1"
            required
            rightElement="IDR"
            value={editMaterialForm.jual}
            onChange={(e) =>
              setEditMaterialForm({ ...editMaterialForm, jual: e.target.value })
            }
            className="font-mono font-bold"
          />

          <Input
            label="COA Material"
            value={editMaterialForm.coa}
            onChange={(e) =>
              setEditMaterialForm({ ...editMaterialForm, coa: e.target.value })
            }
            placeholder="COA Material"
            className="font-mono"
          />

          <Input
            label="COA Piutang Dagang"
            value={editMaterialForm.coaPiutang}
            onChange={(e) =>
              setEditMaterialForm({ ...editMaterialForm, coaPiutang: e.target.value })
            }
            placeholder="COA Piutang Dagang"
            className="font-mono"
          />

          <Input
            label="COA Pendapatan"
            value={editMaterialForm.coaPendapatan}
            onChange={(e) =>
              setEditMaterialForm({ ...editMaterialForm, coaPendapatan: e.target.value })
            }
            placeholder="COA Pendapatan"
            className="font-mono"
          />

          <div>
            <label className="block text-[11px] font-medium text-neutral-300 mb-1">
              Status Material <span className="text-[#F4511E] font-bold">*</span>
            </label>
            <div className="border border-[#1E2B3C] bg-[#0E1520] rounded-md px-4 py-2.5 flex items-center gap-6">
              <label className="flex items-center gap-2 cursor-pointer text-xs">
                <input
                  type="radio"
                  name="statusMaterialEdit"
                  checked={editMaterialForm.aktif === true}
                  onChange={() =>
                    setEditMaterialForm({ ...editMaterialForm, aktif: true })
                  }
                  className="accent-[#F4511E] w-4 h-4 cursor-pointer"
                />
                <span
                  className={
                    editMaterialForm.aktif ? 'text-white font-medium' : 'text-neutral-400'
                  }
                >
                  Aktif
                </span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-xs">
                <input
                  type="radio"
                  name="statusMaterialEdit"
                  checked={editMaterialForm.aktif === false}
                  onChange={() =>
                    setEditMaterialForm({ ...editMaterialForm, aktif: false })
                  }
                  className="accent-[#F4511E] w-4 h-4 cursor-pointer"
                />
                <span
                  className={
                    !editMaterialForm.aktif ? 'text-white font-medium' : 'text-neutral-400'
                  }
                >
                  Tidak Aktif
                </span>
              </label>
            </div>
          </div>

          <div className="pt-3 border-t border-[#24282C] flex justify-end gap-2">
            <Button
              variant="ghost"
              onClick={() => {
                setEditMaterialModal(false);
                setSelectedMaterial(null);
              }}
            >
              Batal
            </Button>
            <Button type="submit" variant="primary" icon={Save}>
              Perbarui Material
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
        title="Tambah Armada"
        subtitle="Pencatatan nomor polisi dan dimensi bak dump truck"
      >
        <form onSubmit={handleSubmitArmada} className="p-4 space-y-3">
          <Input
            label="Nomor Polisi (TNKB)"
            icon={Hash}
            required
            value={armadaForm.nopol}
            onChange={(e) =>
              setArmadaForm({ ...armadaForm, nopol: e.target.value.toUpperCase() })
            }
            placeholder="Contoh: W 9821 UB"
            className="font-mono font-bold uppercase"
          />

          <div>
            <label className="block text-[11px] font-medium text-neutral-300 mb-1">
              Dimensi Kendaraan <span className="text-[#F4511E] font-bold">*</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              <Input
                label="Panjang (P)"
                type="number"
                required
                rightElement="cm"
                value={armadaForm.panjangCm}
                onFocus={(e) => {
                  if (e.target.value === '0') e.target.select();
                }}
                onChange={(e) => {
                  const raw = e.target.value;
                  if (raw === '') {
                    setArmadaForm({ ...armadaForm, panjangCm: '' });
                  } else {
                    const clean = raw.replace(/^0+(?=\d)/, '');
                    setArmadaForm({ ...armadaForm, panjangCm: clean === '' ? 0 : Number(clean) });
                  }
                }}
                onBlur={() => {
                  if (armadaForm.panjangCm === '' || armadaForm.panjangCm === undefined) {
                    setArmadaForm({ ...armadaForm, panjangCm: 0 });
                  }
                }}
                className="font-mono font-bold"
              />
              <Input
                label="Lebar (L)"
                type="number"
                required
                rightElement="cm"
                value={armadaForm.lebarCm}
                onFocus={(e) => {
                  if (e.target.value === '0') e.target.select();
                }}
                onChange={(e) => {
                  const raw = e.target.value;
                  if (raw === '') {
                    setArmadaForm({ ...armadaForm, lebarCm: '' });
                  } else {
                    const clean = raw.replace(/^0+(?=\d)/, '');
                    setArmadaForm({ ...armadaForm, lebarCm: clean === '' ? 0 : Number(clean) });
                  }
                }}
                onBlur={() => {
                  if (armadaForm.lebarCm === '' || armadaForm.lebarCm === undefined) {
                    setArmadaForm({ ...armadaForm, lebarCm: 0 });
                  }
                }}
                className="font-mono font-bold"
              />
              <Input
                label="Tinggi (T)"
                type="number"
                required
                rightElement="cm"
                value={armadaForm.tinggiCm}
                onFocus={(e) => {
                  if (e.target.value === '0') e.target.select();
                }}
                onChange={(e) => {
                  const raw = e.target.value;
                  if (raw === '') {
                    setArmadaForm({ ...armadaForm, tinggiCm: '' });
                  } else {
                    const clean = raw.replace(/^0+(?=\d)/, '');
                    setArmadaForm({ ...armadaForm, tinggiCm: clean === '' ? 0 : Number(clean) });
                  }
                }}
                onBlur={() => {
                  if (armadaForm.tinggiCm === '' || armadaForm.tinggiCm === undefined) {
                    setArmadaForm({ ...armadaForm, tinggiCm: 0 });
                  }
                }}
                className="font-mono font-bold"
              />
            </div>

            <div className="mt-1.5 text-xs text-amber-400 font-mono">
              Kapasitas Kubikasi Otomatis:{' '}
              {(((Number(armadaForm.panjangCm) || 0) * (Number(armadaForm.lebarCm) || 0) * (Number(armadaForm.tinggiCm) || 0)) / 1000000).toFixed(
                2
              )}{' '}
              m³
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-medium text-neutral-300 mb-1">
              Status Kendaraan <span className="text-[#F4511E] font-bold">*</span>
            </label>
            <div className="border border-[#1E2B3C] bg-[#0E1520] rounded-md px-4 py-2.5 flex items-center gap-6">
              <label className="flex items-center gap-2 cursor-pointer text-xs">
                <input
                  type="radio"
                  name="statusKendaraan"
                  checked={armadaForm.aktif === true}
                  onChange={() => setArmadaForm({ ...armadaForm, aktif: true })}
                  className="accent-[#F4511E] w-4 h-4 cursor-pointer"
                />
                <span className={armadaForm.aktif ? 'text-white font-medium' : 'text-neutral-400'}>
                  Aktif
                </span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-xs">
                <input
                  type="radio"
                  name="statusKendaraan"
                  checked={armadaForm.aktif === false}
                  onChange={() => setArmadaForm({ ...armadaForm, aktif: false })}
                  className="accent-[#F4511E] w-4 h-4 cursor-pointer"
                />
                <span className={!armadaForm.aktif ? 'text-white font-medium' : 'text-neutral-400'}>
                  Tidak Aktif
                </span>
              </label>
            </div>
          </div>

          <div className="pt-2 border-t border-[#1E2B3C]/50 space-y-3">
            <p className="text-[11px] font-medium text-neutral-400">Detail Lainnya (opsional)</p>
            <Select
              label="Merk Kendaraan"
              icon={Info}
              value={armadaForm.merk}
              onChange={(e) => setArmadaForm({ ...armadaForm, merk: e.target.value })}
            >
              <option value="FAW">FAW</option>
              <option value="Hino">Hino</option>
              <option value="Isuzu">Isuzu</option>
              <option value="Mitsubishi">Mitsubishi</option>
              <option value="Nissan UD">Nissan UD</option>
              <option value="Scania">Scania</option>
              <option value="Tata">Tata</option>
              <option value="Toyota">Toyota</option>
              <option value="Volvo">Volvo</option>
            </Select>

            <div className="grid grid-cols-2 gap-2">
              <Input
                label="Nomor Rangka / VIN"
                icon={Hash}
                value={armadaForm.vin}
                onChange={(e) => setArmadaForm({ ...armadaForm, vin: e.target.value })}
                className="font-mono"
              />
              <Input
                label="Nomor Mesin"
                icon={Hash}
                value={armadaForm.mesin}
                onChange={(e) => setArmadaForm({ ...armadaForm, mesin: e.target.value })}
                className="font-mono"
              />
            </div>

            <Input
              label="Tahun Pembuatan"
              icon={Calendar}
              type="number"
              value={armadaForm.tahun}
              onChange={(e) => setArmadaForm({ ...armadaForm, tahun: Number(e.target.value) })}
              className="font-mono"
            />
          </div>

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
      {/* MODAL: PERBARUI DATA ARMADA */}
      {/* ======================================================== */}
      <Modal
        isOpen={editArmadaModal}
        onClose={() => {
          setEditArmadaModal(false);
          setSelectedArmada(null);
        }}
        title="Perbarui Data Armada"
        subtitle="Edit parameter dimensi bak, status operasional, dan data kendaraan"
      >
        <form onSubmit={handleUpdateArmada} className="p-4 space-y-3">
          <Input
            label="Nomor Polisi (TNKB)"
            icon={Hash}
            required
            value={editArmadaForm.nopol}
            onChange={(e) =>
              setEditArmadaForm({ ...editArmadaForm, nopol: e.target.value.toUpperCase() })
            }
            placeholder="Contoh: 21606"
            className="font-mono font-bold uppercase"
          />

          <div>
            <label className="block text-[11px] font-medium text-neutral-300 mb-1">
              Dimensi Kendaraan <span className="text-[#F4511E] font-bold">*</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              <Input
                label="Panjang (P)"
                type="number"
                required
                rightElement="cm"
                value={editArmadaForm.panjangCm}
                onChange={(e) =>
                  setEditArmadaForm({ ...editArmadaForm, panjangCm: e.target.value })
                }
                className="font-mono font-bold"
              />
              <Input
                label="Lebar (L)"
                type="number"
                required
                rightElement="cm"
                value={editArmadaForm.lebarCm}
                onChange={(e) =>
                  setEditArmadaForm({ ...editArmadaForm, lebarCm: e.target.value })
                }
                className="font-mono font-bold"
              />
              <Input
                label="Tinggi (T)"
                type="number"
                required
                rightElement="cm"
                value={editArmadaForm.tinggiCm}
                onChange={(e) =>
                  setEditArmadaForm({ ...editArmadaForm, tinggiCm: e.target.value })
                }
                className="font-mono font-bold"
              />
            </div>

            <div className="mt-1.5 text-xs text-amber-400 font-mono">
              Kapasitas Kubikasi Otomatis:{' '}
              {(((Number(editArmadaForm.panjangCm) || 0) * (Number(editArmadaForm.lebarCm) || 0) * (Number(editArmadaForm.tinggiCm) || 0)) / 1000000).toFixed(
                2
              )}{' '}
              m³
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-medium text-neutral-300 mb-1">
              Status Kendaraan <span className="text-[#F4511E] font-bold">*</span>
            </label>
            <div className="border border-[#1E2B3C] bg-[#0E1520] rounded-md px-4 py-2.5 flex items-center gap-6">
              <label className="flex items-center gap-2 cursor-pointer text-xs">
                <input
                  type="radio"
                  name="statusKendaraanEdit"
                  checked={editArmadaForm.aktif === true}
                  onChange={() => setEditArmadaForm({ ...editArmadaForm, aktif: true })}
                  className="accent-[#F4511E] w-4 h-4 cursor-pointer"
                />
                <span className={editArmadaForm.aktif ? 'text-white font-medium' : 'text-neutral-400'}>
                  Aktif
                </span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-xs">
                <input
                  type="radio"
                  name="statusKendaraanEdit"
                  checked={editArmadaForm.aktif === false}
                  onChange={() => setEditArmadaForm({ ...editArmadaForm, aktif: false })}
                  className="accent-[#F4511E] w-4 h-4 cursor-pointer"
                />
                <span className={!editArmadaForm.aktif ? 'text-white font-medium' : 'text-neutral-400'}>
                  Tidak Aktif
                </span>
              </label>
            </div>
          </div>

          <div className="pt-2 border-t border-[#1E2B3C]/50 space-y-3">
            <p className="text-[11px] font-medium text-neutral-400">Detail Lainnya (opsional)</p>
            <Select
              label="Merk Kendaraan"
              icon={Info}
              value={editArmadaForm.merk}
              onChange={(e) => setEditArmadaForm({ ...editArmadaForm, merk: e.target.value })}
            >
              <option value="FAW">FAW</option>
              <option value="Hino">Hino</option>
              <option value="Isuzu">Isuzu</option>
              <option value="Mitsubishi">Mitsubishi</option>
              <option value="Nissan UD">Nissan UD</option>
              <option value="Scania">Scania</option>
              <option value="Tata">Tata</option>
              <option value="Toyota">Toyota</option>
              <option value="Volvo">Volvo</option>
            </Select>

            <Input
              label="Nomor Rangka/NIK/VIN"
              icon={Hash}
              value={editArmadaForm.vin}
              onChange={(e) => setEditArmadaForm({ ...editArmadaForm, vin: e.target.value })}
              placeholder="Nomor Rangka/NIK/VIN"
              className="font-mono"
            />

            <Input
              label="Nomor Mesin"
              icon={Hash}
              value={editArmadaForm.mesin}
              onChange={(e) => setEditArmadaForm({ ...editArmadaForm, mesin: e.target.value })}
              placeholder="Nomor Mesin"
              className="font-mono"
            />

            <Input
              label="Tahun Pembuatan"
              icon={Calendar}
              type="number"
              value={editArmadaForm.tahun}
              onChange={(e) => setEditArmadaForm({ ...editArmadaForm, tahun: e.target.value })}
              placeholder="Tahun Pembuatan"
              className="font-mono"
            />
          </div>

          <div className="pt-3 border-t border-[#24282C] flex justify-end gap-2">
            <Button
              variant="ghost"
              onClick={() => {
                setEditArmadaModal(false);
                setSelectedArmada(null);
              }}
            >
              Batal
            </Button>
            <Button type="submit" variant="primary" icon={Save}>
              Perbarui Armada
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
        title="Tambah Customer"
        subtitle="Pendaftaran customer proyek penerima material tambang"
      >
        <form onSubmit={handleSubmitCustomer} className="p-4 space-y-3">
          <Select
            label="Pilih Jenis Badan Usaha"
            icon={User}
            value={customerForm.jenisBadanUsaha}
            onChange={(e) => {
              const val = e.target.value;
              const pfx = val.split('-')[0] || val;
              setCustomerForm({
                ...customerForm,
                jenisBadanUsaha: val,
                alias: customerForm.name ? `${pfx} ${customerForm.name}` : customerForm.alias,
              });
            }}
          >
            <option value="CV-Persekutuan Komanditer">CV-Persekutuan Komanditer</option>
            <option value="PE-Personal">PE-Personal</option>
            <option value="PT-Perusahaan Terbatas">PT-Perusahaan Terbatas</option>
            <option value="UD-Usaha Dagang">UD-Usaha Dagang</option>
          </Select>

          <Input
            label="Nama Customer"
            required
            value={customerForm.name}
            onChange={(e) => {
              const pfx = customerForm.jenisBadanUsaha.split('-')[0] || customerForm.jenisBadanUsaha;
              setCustomerForm({
                ...customerForm,
                name: e.target.value,
                alias: `${pfx} ${e.target.value}`,
              });
            }}
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
              inputMode="numeric"
              pattern="[0-9]*"
              value={customerForm.npwp}
              onKeyDown={(e) => {
                if (
                  [
                    'Backspace',
                    'Tab',
                    'Enter',
                    'Delete',
                    'Escape',
                    'ArrowLeft',
                    'ArrowRight',
                    'ArrowUp',
                    'ArrowDown',
                    'Home',
                    'End',
                  ].includes(e.key) ||
                  e.ctrlKey ||
                  e.metaKey
                ) {
                  return;
                }
                if (!/^[0-9]$/.test(e.key)) {
                  e.preventDefault();
                }
              }}
              onChange={(e) =>
                setCustomerForm({
                  ...customerForm,
                  npwp: e.target.value.replace(/\D/g, ''),
                })
              }
              className="font-mono"
              placeholder="Hanya angka"
            />
            <Input
              label="Nomor Telepon Customer"
              icon={Phone}
              inputMode="numeric"
              pattern="[0-9]*"
              value={customerForm.telepon}
              onKeyDown={(e) => {
                if (
                  [
                    'Backspace',
                    'Tab',
                    'Enter',
                    'Delete',
                    'Escape',
                    'ArrowLeft',
                    'ArrowRight',
                    'ArrowUp',
                    'ArrowDown',
                    'Home',
                    'End',
                  ].includes(e.key) ||
                  e.ctrlKey ||
                  e.metaKey
                ) {
                  return;
                }
                if (!/^[0-9]$/.test(e.key)) {
                  e.preventDefault();
                }
              }}
              onChange={(e) =>
                setCustomerForm({
                  ...customerForm,
                  telepon: e.target.value.replace(/\D/g, ''),
                })
              }
              className="font-mono"
              placeholder="Contoh: 081234567890 (Hanya angka)"
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
            icon={Landmark}
            required
            value={bankForm.namaBank}
            onChange={(e) => setBankForm({ ...bankForm, namaBank: e.target.value.toUpperCase(), namaAlias: e.target.value.toUpperCase() })}
            placeholder="Contoh: Bank Central Asia"
            className="uppercase font-mono font-bold"
          />

          <Input
            label="Nama Alias Bank"
            icon={Landmark}
            disabled
            value={bankForm.namaAlias}
            className="uppercase font-mono font-bold"
          />

          <div className="grid grid-cols-2 gap-2">
            <Input
              label="Kode SWIFT"
              icon={Hash}
              value={bankForm.kodeSwift}
              onChange={(e) => setBankForm({ ...bankForm, kodeSwift: e.target.value.toUpperCase() })}
              placeholder="Contoh: CENAIDJA"
              className="font-mono uppercase"
            />
            <Input
              label="Kode Bank"
              icon={Hash}
              required
              inputMode="numeric"
              pattern="[0-9]*"
              value={bankForm.kodeBank}
              onKeyDown={(e) => {
                if (
                  [
                    'Backspace',
                    'Tab',
                    'Enter',
                    'Delete',
                    'Escape',
                    'ArrowLeft',
                    'ArrowRight',
                    'ArrowUp',
                    'ArrowDown',
                    'Home',
                    'End',
                  ].includes(e.key) ||
                  e.ctrlKey ||
                  e.metaKey
                ) {
                  return;
                }
                if (!/^[0-9]$/.test(e.key)) {
                  e.preventDefault();
                }
              }}
              onChange={(e) =>
                setBankForm({
                  ...bankForm,
                  kodeBank: e.target.value.replace(/\D/g, ''),
                })
              }
              placeholder="Contoh: 014 (Hanya angka)"
              className="font-mono font-bold"
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
      {/* MODAL: PERBARUI DATA BANK */}
      {/* ======================================================== */}
      <Modal
        isOpen={editBankModal}
        onClose={() => {
          setEditBankModal(false);
          setSelectedBank(null);
        }}
        title="Perbarui Data Bank"
        subtitle="Edit nama bank, nama alias, kode SWIFT, dan kode kliring bank"
      >
        <form onSubmit={handleUpdateBank} className="p-4 space-y-3">
          <Input
            label="Nama Bank"
            icon={Landmark}
            required
            value={editBankForm.namaBank}
            onChange={(e) => setEditBankForm({ ...editBankForm, namaBank: e.target.value.toUpperCase(), namaAlias: e.target.value.toUpperCase() })}
            placeholder="Contoh: BANK CENTRAL ASIA"
            className="uppercase font-mono font-bold"
          />

          <Input
            label="Nama Alias Bank"
            icon={Landmark}
            disabled
            value={editBankForm.namaAlias}
            className="uppercase font-mono font-bold"
          />

          <Input
            label="Kode Swift"
            icon={Hash}
            value={editBankForm.kodeSwift}
            onChange={(e) => setEditBankForm({ ...editBankForm, kodeSwift: e.target.value.toUpperCase() })}
            placeholder="Contoh: CENAIDJA"
            className="font-mono uppercase"
          />

          <Input
            label="Kode Bank"
            icon={Hash}
            required
            inputMode="numeric"
            pattern="[0-9]*"
            value={editBankForm.kodeBank}
            onKeyDown={(e) => {
              if (
                [
                  'Backspace',
                  'Tab',
                  'Enter',
                  'Delete',
                  'Escape',
                  'ArrowLeft',
                  'ArrowRight',
                  'ArrowUp',
                  'ArrowDown',
                  'Home',
                  'End',
                ].includes(e.key) ||
                e.ctrlKey ||
                e.metaKey
              ) {
                return;
              }
              if (!/^[0-9]$/.test(e.key)) {
                e.preventDefault();
              }
            }}
            onChange={(e) =>
              setEditBankForm({
                ...editBankForm,
                kodeBank: e.target.value.replace(/\D/g, ''),
              })
            }
            placeholder="Contoh: 014 (Hanya angka)"
            className="font-mono font-bold"
          />

          <div className="pt-3 border-t border-[#24282C] flex justify-end gap-2">
            <Button
              variant="ghost"
              onClick={() => {
                setEditBankModal(false);
                setSelectedBank(null);
              }}
            >
              Batal
            </Button>
            <Button type="submit" variant="primary" icon={Save}>
              Perbarui Bank
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
        title="Tambah Rekening Bank"
        subtitle="Pendaftaran rekening kas penampung & operasional proyek"
      >
        <form onSubmit={handleSubmitRekening} className="p-4 space-y-3">
          <Select
            label="Pilih Bank"
            required
            value={rekeningForm.bank}
            onChange={(e) => setRekeningForm({ ...rekeningForm, bank: e.target.value })}
          >
            <option value="" disabled>Pilih Bank</option>
            <option value="bca -bank central asia">bca -bank central asia</option>
            <option value="bmrii-bank mandiri">bmrii-bank mandiri</option>
          </Select>

          <Select
            label="Jenis Rekening"
            required
            value={rekeningForm.jenisRekening}
            onChange={(e) =>
              setRekeningForm({ ...rekeningForm, jenisRekening: e.target.value })
            }
          >
            <option value="" disabled>Pilih Jenis Rekening</option>
            <option value="perusahaan">perusahaan</option>
            <option value="supplier">supplier</option>
          </Select>

          <Input
            label="Nomor Rekening"
            required
            inputMode="numeric"
            pattern="[0-9]*"
            value={rekeningForm.nomorRekening}
            onKeyDown={(e) => {
              if (
                [
                  'Backspace',
                  'Tab',
                  'Enter',
                  'Delete',
                  'Escape',
                  'ArrowLeft',
                  'ArrowRight',
                  'ArrowUp',
                  'ArrowDown',
                  'Home',
                  'End',
                ].includes(e.key) ||
                e.ctrlKey ||
                e.metaKey
              ) {
                return;
              }
              if (!/^[0-9]$/.test(e.key)) {
                e.preventDefault();
              }
            }}
            onChange={(e) => {
              const numericOnly = e.target.value.replace(/\D/g, '');
              setRekeningForm({ ...rekeningForm, nomorRekening: numericOnly });
            }}
            placeholder="Contoh: 140001928192 (Hanya angka)"
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

      {/* ======================================================== */}
      {/* MODAL: KONFIRMASI HAPUS */}
      {/* ======================================================== */}
      <Modal
        isOpen={deleteConfirm.open}
        onClose={handleCancelDelete}
        title="Konfirmasi Hapus"
        subtitle="Tindakan ini tidak dapat dibatalkan"
      >
        <div className="p-4 space-y-4">
          <div className="flex items-start gap-3 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30">
            <Trash2 className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-neutral-200">
                Apakah Anda yakin ingin menghapus data{' '}
                <span className="font-bold text-white font-mono">{deleteConfirm.label}</span>?
              </p>
              <p className="text-xs text-rose-400 mt-1">
                Data yang dihapus tidak dapat dikembalikan.
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <Button variant="ghost" onClick={handleCancelDelete}>
              Batal
            </Button>
            <Button
              variant="danger"
              icon={Trash2}
              onClick={handleConfirmDelete}
              className="bg-rose-600 hover:bg-rose-700 text-white border-0"
            >
              Ya, Hapus
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
