import { useState, useMemo, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  ArrowLeft,
  User,
  Ticket,
  Box,
  Monitor,
  Calendar,
  Clock,
  FileText,
  Truck,
  Plus,
  Minus,
  Save,
  Camera,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { useToast } from '../../context/ToastContext';
import { calculateKubikasi, formatVolume } from '../../utils/formatters';
import TruckVisualizer from '../../components/common/TruckVisualizer';
import { Button, Badge, Card, Input, Select } from '../../components/ui';

export default function SuratJalanPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { preOrders, createSuratJalan, materials, armadaList, customers } = useData();
  const { addToast } = useToast();

  const preOrderState = location.state || {};

  // Check if navigation came specifically from an order action ("Create GI Waybill" / "Buat Surat Jalan GI")
  const isFromCreateGi = Boolean(
    preOrderState.fromCreateGi ||
    preOrderState.fromPreOrder ||
    preOrderState.preOrderId ||
    (preOrderState.customer && preOrderState.nomorRo)
  );

  // List of only APPROVED POs
  const approvedPos = useMemo(() => {
    return (preOrders || []).filter((po) => po.status === 'APPROVED');
  }, [preOrders]);

  // Check if navigation came from an unapproved PO
  const navPo = useMemo(() => {
    if (!preOrderState.preOrderId && !preOrderState.nomorPo) return null;
    return (preOrders || []).find(
      (po) => po.id === preOrderState.preOrderId || (po.nomorPo && po.nomorPo === preOrderState.nomorPo)
    );
  }, [preOrders, preOrderState]);

  const isNavPoUnapproved = Boolean(navPo && navPo.status !== 'APPROVED');

  // Resolved values when coming from "Create GI Waybill"
  const matchedPo = useMemo(() => {
    if (!isFromCreateGi) return null;
    return (
      approvedPos.find(
        (po) =>
          po.id === preOrderState.preOrderId ||
          po.nomorRO === preOrderState.nomorRO ||
          po.nomorPo === preOrderState.nomorPo
      ) || null
    );
  }, [approvedPos, preOrderState, isFromCreateGi]);

  const targetCustomer = isFromCreateGi ? (preOrderState.customer || matchedPo?.customer || '') : '';
  const targetPoNumber = isFromCreateGi ? (preOrderState.nomorPo || matchedPo?.nomorPo || matchedPo?.id || '') : '';
  const targetRoNumber = isFromCreateGi
    ? (preOrderState.nomorRO || preOrderState.nomorRo || matchedPo?.nomorRO || (matchedPo ? `RO-${matchedPo.id}` : ''))
    : '';
  const targetPreOrderId = isFromCreateGi ? (preOrderState.preOrderId || matchedPo?.id || '') : '';

  let targetMaterialId = '';
  if (isFromCreateGi) {
    targetMaterialId = preOrderState.materialId || matchedPo?.materialId || '';
    if (!targetMaterialId && (preOrderState.materialName || matchedPo?.materialName)) {
      const matName = preOrderState.materialName || matchedPo?.materialName;
      const match = materials.find((m) => m.name.toLowerCase() === matName.toLowerCase());
      if (match) targetMaterialId = match.id;
    }
    if (!targetMaterialId && materials.length > 0) {
      targetMaterialId = materials[0].id;
    }
  }

  // Form state: ALL FIELDS ARE BLANK BY DEFAULT unless user navigated via "Create GI Waybill"
  const [formData, setFormData] = useState(() => {
    if (isFromCreateGi) {
      const defaultArmada = armadaList[0] || {};
      const now = new Date();
      const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      const sjNum = `296${Math.floor(70 + Math.random() * 29)}`;
      const notaNum = `NT-${Math.floor(88900 + Math.random() * 99)}`;

      return {
        nomorSj: sjNum,
        customer: targetCustomer,
        poNumber: targetPoNumber,
        nomorRo: targetRoNumber,
        preOrderId: targetPreOrderId,
        materialId: targetMaterialId,
        jenis: preOrderState.jenis || matchedPo?.jenisRO || matchedPo?.jenis || 'Jasa Angkut + Material',
        tanggal: now.toISOString().split('T')[0],
        waktu: timeStr,
        nomorNota: notaNum,
        nomorPolisi: defaultArmada.nopol || 'W 9821 UB',
        isPpn: preOrderState.isPpn ?? (matchedPo?.jenisWajibPajak === 'PKP'),
        fotoSuratJalan: null,
        fotoPreview: null,
        panjangCm: defaultArmada.panjangCm || 650,
        lebarCm: defaultArmada.lebarCm || 250,
        tinggiCm: defaultArmada.tinggiCm || 200,
        koreksiTinggiCm: 0,
      };
    }

    // DIRECT NAVIGATION: ALL FIELDS ARE SET TO BLANK BY DEFAULT
    return {
      nomorSj: '',
      customer: '',
      poNumber: '',
      nomorRo: '',
      preOrderId: '',
      materialId: '',
      jenis: '',
      tanggal: '',
      waktu: '',
      nomorNota: '',
      nomorPolisi: '',
      isPpn: false,
      fotoSuratJalan: null,
      fotoPreview: null,
      panjangCm: '',
      lebarCm: '',
      tinggiCm: '',
      koreksiTinggiCm: 0,
    };
  });

  // Approved POs for the currently selected customer
  const customerApprovedPos = useMemo(() => {
    if (!formData.customer) return [];
    return approvedPos.filter((po) => po.customer === formData.customer);
  }, [approvedPos, formData.customer]);

  // Sync state if location.state changes
  useEffect(() => {
    if (location.state?.fromCreateGi || location.state?.fromPreOrder || location.state?.customer) {
      const selectedCust = location.state.customer || '';
      const targetPo = location.state.nomorPo || location.state.preOrderId || '';
      let targetMat = location.state.materialId;
      if (!targetMat && location.state.materialName) {
        const match = materials.find(
          (m) => m.name.toLowerCase() === location.state.materialName.toLowerCase()
        );
        if (match) targetMat = match.id;
      }

      const defaultArmada = armadaList[0] || {};
      const now = new Date();
      const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      const sjNum = `296${Math.floor(70 + Math.random() * 29)}`;
      const notaNum = `NT-${Math.floor(88900 + Math.random() * 99)}`;

      setFormData((prev) => ({
        ...prev,
        nomorSj: prev.nomorSj || sjNum,
        customer: selectedCust,
        poNumber: targetPo || prev.poNumber,
        nomorRo: location.state.nomorRo || location.state.nomorRO || prev.nomorRo,
        preOrderId: location.state.preOrderId || prev.preOrderId,
        materialId: targetMat || prev.materialId,
        jenis: location.state.jenis || prev.jenis || 'Jasa Angkut + Material',
        tanggal: prev.tanggal || now.toISOString().split('T')[0],
        waktu: prev.waktu || timeStr,
        nomorNota: prev.nomorNota || notaNum,
        nomorPolisi: prev.nomorPolisi || defaultArmada.nopol || 'W 9821 UB',
        panjangCm: prev.panjangCm || defaultArmada.panjangCm || 650,
        lebarCm: prev.lebarCm || defaultArmada.lebarCm || 250,
        tinggiCm: prev.tinggiCm || defaultArmada.tinggiCm || 200,
        isPpn: location.state.isPpn ?? prev.isPpn,
      }));
    }
  }, [location.state, materials, armadaList]);

  // Customer dropdown change handler
  const handleCustomerChange = (newCustomer) => {
    if (!newCustomer) {
      setFormData((prev) => ({
        ...prev,
        customer: '',
        poNumber: '',
        nomorRo: '',
        preOrderId: '',
        materialId: '',
        isPpn: false,
      }));
      return;
    }

    const custPos = approvedPos.filter((po) => po.customer === newCustomer);
    const firstPo = custPos[0];
    let newMatId = formData.materialId;
    if (firstPo?.materialId) {
      newMatId = firstPo.materialId;
    } else if (firstPo?.materialName) {
      const match = materials.find(
        (m) => m.name.toLowerCase() === firstPo.materialName.toLowerCase()
      );
      if (match) newMatId = match.id;
    }

    const resolvedRo = firstPo?.nomorRO || firstPo?.nomorRo || (firstPo ? `RO-${firstPo.id}` : formData.nomorRo);

    setFormData((prev) => ({
      ...prev,
      customer: newCustomer,
      poNumber: firstPo?.nomorPo || firstPo?.id || '',
      nomorRo: resolvedRo,
      preOrderId: firstPo?.id || '',
      materialId: newMatId || prev.materialId,
      isPpn: firstPo?.jenisWajibPajak === 'PKP' ? true : prev.isPpn,
      tanggal: prev.tanggal || new Date().toISOString().split('T')[0],
      waktu: prev.waktu || `${String(new Date().getHours()).padStart(2, '0')}:${String(new Date().getMinutes()).padStart(2, '0')}`,
      nomorSj: prev.nomorSj || `296${Math.floor(70 + Math.random() * 29)}`,
      nomorNota: prev.nomorNota || `NT-${Math.floor(88900 + Math.random() * 99)}`,
      jenis: prev.jenis || firstPo?.jenisRO || firstPo?.jenis || 'Jasa Angkut + Material',
    }));
  };

  // PO selection handler
  const handlePoChange = (selVal) => {
    if (!selVal) {
      setFormData((prev) => ({
        ...prev,
        poNumber: '',
        nomorRo: '',
        preOrderId: '',
      }));
      return;
    }

    const selectedPo = approvedPos.find((po) => (po.nomorPo && po.nomorPo === selVal) || po.id === selVal);
    let newMatId = formData.materialId;
    if (selectedPo?.materialId) {
      newMatId = selectedPo.materialId;
    } else if (selectedPo?.materialName) {
      const match = materials.find(
        (m) => m.name.toLowerCase() === selectedPo.materialName.toLowerCase()
      );
      if (match) newMatId = match.id;
    }
    const resolvedRo = selectedPo?.nomorRO || selectedPo?.nomorRo || (selectedPo ? `RO-${selectedPo.id}` : formData.nomorRo);

    setFormData((prev) => ({
      ...prev,
      poNumber: selVal,
      nomorRo: resolvedRo,
      preOrderId: selectedPo?.id || '',
      materialId: newMatId || prev.materialId,
      isPpn: selectedPo?.jenisWajibPajak === 'PKP' ? true : prev.isPpn,
      jenis: prev.jenis || selectedPo?.jenisRO || selectedPo?.jenis || 'Jasa Angkut + Material',
    }));
  };

  // Armada dropdown change handler
  const handleArmadaChange = (val) => {
    if (!val) {
      setFormData((prev) => ({
        ...prev,
        nomorPolisi: '',
        panjangCm: '',
        lebarCm: '',
        tinggiCm: '',
        koreksiTinggiCm: 0,
      }));
      return;
    }

    const arm = armadaList.find((a) => a.nopol === val);
    if (arm) {
      setFormData((prev) => ({
        ...prev,
        nomorPolisi: val,
        panjangCm: arm.panjangCm,
        lebarCm: arm.lebarCm,
        tinggiCm: arm.tinggiCm,
        koreksiTinggiCm: 0,
      }));
    } else {
      setFormData((prev) => ({ ...prev, nomorPolisi: val }));
    }
  };

  const kubikasi = useMemo(() => {
    return calculateKubikasi(
      formData.panjangCm,
      formData.lebarCm,
      formData.tinggiCm,
      formData.koreksiTinggiCm
    );
  }, [formData.panjangCm, formData.lebarCm, formData.tinggiCm, formData.koreksiTinggiCm]);

  const handleKoreksiChange = (delta) => {
    setFormData((prev) => ({
      ...prev,
      koreksiTinggiCm: (Number(prev.koreksiTinggiCm) || 0) + delta,
    }));
  };

  const handleApplyPreset = (p, l, t) => {
    setFormData((prev) => ({
      ...prev,
      panjangCm: p,
      lebarCm: l,
      tinggiCm: t,
      koreksiTinggiCm: 0,
    }));
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData((prev) => ({
        ...prev,
        fotoSuratJalan: file.name,
        fotoPreview: URL.createObjectURL(file),
      }));
    }
  };

  const handleResetFormToBlank = () => {
    setFormData({
      nomorSj: '',
      customer: '',
      poNumber: '',
      nomorRo: '',
      preOrderId: '',
      materialId: '',
      jenis: '',
      tanggal: '',
      waktu: '',
      nomorNota: '',
      nomorPolisi: '',
      isPpn: false,
      fotoSuratJalan: null,
      fotoPreview: null,
      panjangCm: '',
      lebarCm: '',
      tinggiCm: '',
      koreksiTinggiCm: 0,
    });
    addToast('Formulir dikosongkan.', 'info');
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!formData.customer) {
      addToast('Harap pilih Customer terlebih dahulu.', 'warning');
      return;
    }

    if (!formData.poNumber) {
      addToast('Harap pilih Nomor PO yang valid dan telah disetujui (APPROVED).', 'error');
      return;
    }

    const currentPo = approvedPos.find(
      (po) => (po.nomorPo && po.nomorPo === formData.poNumber) || po.id === formData.poNumber
    );

    if (!currentPo || currentPo.status !== 'APPROVED') {
      addToast('Surat Jalan tidak dapat dibuat! Pre Order belum disetujui oleh Super Admin.', 'error');
      return;
    }

    if (!formData.nomorSj) {
      addToast('Nomor Surat Jalan wajib diisi.', 'warning');
      return;
    }

    if (!formData.materialId) {
      addToast('Harap pilih Jenis Material.', 'warning');
      return;
    }

    if (!formData.tanggal) {
      addToast('Harap isi Tanggal Good Issue.', 'warning');
      return;
    }

    if (!formData.nomorPolisi) {
      addToast('Harap pilih Nomor Polisi Armada.', 'warning');
      return;
    }

    const p = Number(formData.panjangCm) || 0;
    const l = Number(formData.lebarCm) || 0;
    const t = Number(formData.tinggiCm) || 0;
    if (p <= 0 || l <= 0 || t <= 0) {
      addToast('Dimensi bak truk (Panjang, Lebar, Tinggi) wajib diisi dengan benar.', 'warning');
      return;
    }

    const selectedMat = materials.find((m) => m.id === formData.materialId);
    const finalRoNumber = currentPo?.nomorRO || currentPo?.nomorRo || formData.nomorRo || `RO-${currentPo?.id}`;

    createSuratJalan({
      ...formData,
      nopol: formData.nomorPolisi,
      nomorRo: finalRoNumber,
      nomorRO: finalRoNumber,
      preOrderId: currentPo?.id,
      material: selectedMat?.name || 'SIRTU',
      volumeAkhir: kubikasi.volumeAkhir,
      driver: 'Supir Armada Terjadwal',
    });

    addToast(`Surat Jalan ${formData.nomorSj} berhasil diterbitkan dan masuk ke Jurnal!`, 'success');
    navigate('/rekapan');
  };

  return (
    <div className="w-full space-y-6 pb-20 select-none">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#24282C]">
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
              <span>Buat Good Issue (Surat Jalan)</span>
              <Badge size="xs" variant="primary">Pencatatan Ritase</Badge>
            </h1>
            <p className="text-xs text-neutral-400">
              Kalkulator kubikasi bak dump truck otomatis P &times; L &times; (T + K) / 1.000.000
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          {/* Reset to Blank Form Button */}
          <Button
            size="xs"
            variant="outline"
            icon={RotateCcw}
            onClick={handleResetFormToBlank}
            title="Kosongkan Semua Field"
          >
            Kosongkan Form
          </Button>

          {/* PPN Toggle Switch matching screenshot */}
          <div className="flex items-center gap-2 bg-[#131517] border border-[#24282C] px-3 py-1.5 rounded-md">
            <span className="text-[11px] text-neutral-300 font-mono font-medium">Format PPN:</span>
            <button
              type="button"
              onClick={() => setFormData({ ...formData, isPpn: !formData.isPpn })}
              className={`w-9 h-5 flex items-center rounded-full p-0.5 transition-colors cursor-pointer ${
                formData.isPpn ? 'bg-[#F4511E]' : 'bg-[#2A2E33]'
              }`}
            >
              <div
                className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                  formData.isPpn ? 'translate-x-4' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Banner Informasi Asal Pre Order / Auto-Populated vs Blank Notification */}
      {isNavPoUnapproved && (
        <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/40 text-rose-300 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 font-mono shadow-sm">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>
              Pre Order <strong>{navPo?.customer || formData.customer}</strong> ({navPo?.nomorRO || navPo?.id || 'DRAFT'}) masih berstatus <strong>MENUNGGU APPROVAL</strong> Super Admin. Surat Jalan tidak dapat diterbitkan!
            </span>
          </div>
          <Button
            size="xs"
            variant="ghost"
            onClick={() => navigate('/pre-orders')}
            className="text-rose-200 hover:text-white border border-rose-500/40 shrink-0"
          >
            Lihat Pre Order
          </Button>
        </div>
      )}

      {isFromCreateGi && !isNavPoUnapproved && (
        <div className="p-3 rounded-xl bg-orange-500/10 border border-[#F4511E]/40 text-[#F4511E] text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 font-mono shadow-sm">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#F4511E] shrink-0" />
            <span>
              Data terisi otomatis dari Pre Order: <strong>{formData.customer}</strong> &bull; [{formData.nomorRo || 'RO'}] &bull; No. PO: <strong>{formData.poNumber || 'DRAFT'}</strong>
            </span>
          </div>
          <span className="text-[11px] text-neutral-400 font-sans hidden sm:inline">
            Semua field terisi otomatis &bull; Siap diterbitkan
          </span>
        </div>
      )}

      {!isFromCreateGi && (
        <div className="p-3 rounded-xl bg-[#14171A] border border-[#262A2E] text-neutral-400 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 font-mono shadow-sm">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-[#F4511E] shrink-0" />
            <span>
              Formulir Surat Jalan Default Kosong. Silakan pilih Customer &amp; PO yang telah disetujui, atau buat langsung melalui tombol <strong>"Buat Surat Jalan GI"</strong> di halaman Pre Order.
            </span>
          </div>
          <Button
            size="xs"
            variant="ghost"
            onClick={() => navigate('/pre-orders')}
            className="text-[#F4511E] hover:text-white border border-[#F4511E]/30 shrink-0 cursor-pointer"
          >
            Buka Pre Order &rarr;
          </Button>
        </div>
      )}

      {/* Main 2-Column Responsive Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Form Column (7 cols) - Replicating Screenshot 1 */}
        <Card className="lg:col-span-7 p-4 sm:p-5">
          <form onSubmit={handleSubmit} className="space-y-3.5">
            {/* Field 1: Pilih Customer */}
            <Select
              label="Pilih Customer"
              icon={User}
              required
              value={formData.customer}
              onChange={(e) => handleCustomerChange(e.target.value)}
            >
              <option value="">-- Pilih Customer --</option>
              {customers.map((c) => (
                <option key={c.id || c.name} value={c.name}>
                  {c.kodePrefix ? `${c.kodePrefix} - ` : ''}{c.name}
                </option>
              ))}
              {!customers.some((c) => c.name === formData.customer) && formData.customer && (
                <option value={formData.customer}>{formData.customer}</option>
              )}
            </Select>

            {/* Field 2: Nomor PO Customer (Hanya PO Berstatus APPROVED) */}
            <div className="space-y-1">
              <Select
                label="Nomor PO Customer (Wajib Berstatus APPROVED)"
                icon={Ticket}
                required
                value={formData.poNumber}
                onChange={(e) => handlePoChange(e.target.value)}
              >
                {!formData.customer ? (
                  <option value="">-- Pilih Customer Terlebih Dahulu --</option>
                ) : customerApprovedPos.length === 0 ? (
                  <option value="" disabled>
                    -- Belum ada Pre Order disetujui (APPROVED) untuk customer ini --
                  </option>
                ) : (
                  <>
                    <option value="">-- Pilih Nomor PO --</option>
                    {customerApprovedPos.map((po) => (
                      <option key={po.id} value={po.nomorPo || po.id}>
                        [{po.nomorRO || `RO-${po.id}`}] {po.nomorPo ? `(PO: ${po.nomorPo})` : '(Draft Terverifikasi)'} - {po.customer} ({po.materialName})
                      </option>
                    ))}
                  </>
                )}
              </Select>
              {formData.customer && customerApprovedPos.length === 0 && (
                <p className="text-[11px] text-amber-400 font-mono flex items-center gap-1.5 pt-0.5">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>Customer ini belum memiliki Pre Order yang disetujui Super Admin.</span>
                </p>
              )}
            </div>

            {/* Field 3: Nomor Surat Jalan & Nomor RO */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="Nomor Surat Jalan"
                icon={Ticket}
                required
                placeholder="Contoh: 29699"
                value={formData.isPpn && formData.nomorSj ? `PPN${formData.nomorSj}` : formData.nomorSj}
                onChange={(e) =>
                  setFormData({ ...formData, nomorSj: e.target.value.replace('PPN', '') })
                }
                className="font-mono font-bold"
              />

              <Input
                label="Nomor RO"
                icon={Ticket}
                required
                placeholder="Contoh: RO-2026-2745"
                value={formData.nomorRo}
                onChange={(e) => setFormData({ ...formData, nomorRo: e.target.value })}
                className="font-mono"
              />
            </div>

            {/* Row 4: Material & Jenis */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Select
                label="Material"
                icon={Box}
                required
                value={formData.materialId}
                onChange={(e) => setFormData({ ...formData, materialId: e.target.value })}
              >
                <option value="">-- Pilih Material --</option>
                {materials.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.satuan}) - PPH {m.pphRate}%
                  </option>
                ))}
              </Select>

              <Select
                label="Jenis Layanan"
                icon={Monitor}
                required
                value={formData.jenis}
                onChange={(e) => setFormData({ ...formData, jenis: e.target.value })}
              >
                <option value="">-- Pilih Jenis Layanan --</option>
                <option value="Jasa Angkut + Material">Jasa Angkut + Material</option>
                <option value="Material Curah Saja">Material Curah Saja</option>
                <option value="Jasa Angkut Saja">Jasa Angkut Saja</option>
              </Select>
            </div>

            {/* Row 5: Tanggal & Waktu */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="Tanggal Good Issue"
                icon={Calendar}
                type="date"
                required
                value={formData.tanggal}
                onChange={(e) => setFormData({ ...formData, tanggal: e.target.value })}
              />

              <Input
                label="Waktu Muat"
                icon={Clock}
                type="time"
                value={formData.waktu}
                onChange={(e) => setFormData({ ...formData, waktu: e.target.value })}
              />
            </div>

            {/* Row 6: Nomor Nota & Nomor Polisi */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="Nomor Nota Pengambilan"
                icon={FileText}
                placeholder="Contoh: NT-88921"
                value={formData.nomorNota}
                onChange={(e) => setFormData({ ...formData, nomorNota: e.target.value })}
                className="font-mono"
              />

              <Select
                label="Nomor Polisi Armada"
                icon={Truck}
                value={formData.nomorPolisi}
                onChange={(e) => handleArmadaChange(e.target.value)}
                className="font-mono font-bold"
              >
                <option value="">-- Pilih Armada / Nopol --</option>
                {armadaList.map((a) => (
                  <option key={a.id} value={a.nopol}>
                    {a.nopol} ({a.merk} - {a.kapasitas} m³)
                  </option>
                ))}
              </Select>
            </div>

            {/* TRUCK DIMENSIONS SECTION (Screenshot 1) */}
            <div className="pt-3 border-t border-[#24282C] space-y-3">
              {/* Koreksi Tinggi Stepper */}
              <div className="flex items-center justify-between p-2.5 rounded-md bg-[#181B1E] border border-[#2B3036]">
                <div className="text-xs text-neutral-300 font-medium flex items-center">
                  <span>Koreksi Tinggi (K):</span>
                  <input
                    type="number"
                    placeholder="0"
                    value={formData.koreksiTinggiCm === 0 ? '' : formData.koreksiTinggiCm}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        koreksiTinggiCm: e.target.value === '' ? 0 : Number(e.target.value),
                      }))
                    }
                    style={{
                      width: `${Math.max(1, String(formData.koreksiTinggiCm === 0 ? 0 : formData.koreksiTinggiCm).length)}ch`,
                    }}
                    className="ml-1.5 p-0 bg-transparent border-none text-white placeholder:text-white font-mono font-bold text-xs text-center focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                  <span className="text-white font-mono font-bold ml-1">cm</span>
                </div>

                <div className="flex items-center gap-1">
                  <Button
                    size="xs"
                    variant="secondary"
                    icon={Minus}
                    onClick={() => handleKoreksiChange(-5)}
                    title="Kurangi 5 cm"
                  />
                  <Button
                    size="xs"
                    variant="secondary"
                    icon={Plus}
                    onClick={() => handleKoreksiChange(5)}
                    title="Tambah 5 cm"
                  />
                </div>
              </div>

              {/* Tinggi Hasil Koreksi (TK) Header from Screenshot 1 */}
              <div className="text-xs font-semibold text-neutral-300 flex items-center justify-between">
                <span>Tinggi Hasil Koreksi (TK):</span>
                <span className="text-[#F4511E] font-mono font-bold text-sm">
                  {kubikasi.tinggiHasilKoreksi} cm
                </span>
              </div>

              {/* 3 Dimension Inputs: P, L, T */}
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-[#181B1E] border border-[#2B3036] rounded-md p-2 text-center">
                  <span className="block text-[10px] text-neutral-400 mb-0.5">Panjang (P) *</span>
                  <div className="flex items-center justify-center gap-1 font-mono font-bold text-neutral-100 text-sm">
                    <input
                      type="number"
                      placeholder="0"
                      value={formData.panjangCm === '' ? '' : formData.panjangCm}
                      onFocus={(e) => {
                        if (e.target.value === '0') e.target.select();
                      }}
                      onChange={(e) => {
                        const raw = e.target.value;
                        const clean = raw === '' ? '' : raw.replace(/^0+(?=\d)/, '');
                        setFormData({ ...formData, panjangCm: clean });
                      }}
                      className="w-16 bg-transparent text-center focus:outline-none border-b border-[#3E454D] focus:border-[#F4511E]"
                    />
                    <span className="text-[10px] text-neutral-500 font-normal">cm</span>
                  </div>
                </div>

                <div className="bg-[#181B1E] border border-[#2B3036] rounded-md p-2 text-center">
                  <span className="block text-[10px] text-neutral-400 mb-0.5">Lebar (L) *</span>
                  <div className="flex items-center justify-center gap-1 font-mono font-bold text-neutral-100 text-sm">
                    <input
                      type="number"
                      placeholder="0"
                      value={formData.lebarCm === '' ? '' : formData.lebarCm}
                      onFocus={(e) => {
                        if (e.target.value === '0') e.target.select();
                      }}
                      onChange={(e) => {
                        const raw = e.target.value;
                        const clean = raw === '' ? '' : raw.replace(/^0+(?=\d)/, '');
                        setFormData({ ...formData, lebarCm: clean });
                      }}
                      className="w-16 bg-transparent text-center focus:outline-none border-b border-[#3E454D] focus:border-[#F4511E]"
                    />
                    <span className="text-[10px] text-neutral-500 font-normal">cm</span>
                  </div>
                </div>

                <div className="bg-[#181B1E] border border-[#2B3036] rounded-md p-2 text-center">
                  <span className="block text-[10px] text-neutral-400 mb-0.5">Tinggi (T) *</span>
                  <div className="flex items-center justify-center gap-1 font-mono font-bold text-neutral-100 text-sm">
                    <input
                      type="number"
                      placeholder="0"
                      value={formData.tinggiCm === '' ? '' : formData.tinggiCm}
                      onFocus={(e) => {
                        if (e.target.value === '0') e.target.select();
                      }}
                      onChange={(e) => {
                        const raw = e.target.value;
                        const clean = raw === '' ? '' : raw.replace(/^0+(?=\d)/, '');
                        setFormData({ ...formData, tinggiCm: clean });
                      }}
                      className="w-16 bg-transparent text-center focus:outline-none border-b border-[#3E454D] focus:border-[#F4511E]"
                    />
                    <span className="text-[10px] text-neutral-500 font-normal">cm</span>
                  </div>
                </div>
              </div>

              {/* Results: Kubikasi Default & Akhir */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <div className="bg-[#181B1E] border border-[#2B3036] rounded-md p-2.5">
                  <span className="block text-[10px] text-neutral-400 mb-0.5">Kubikasi Default</span>
                  <div className="text-base font-bold font-mono text-neutral-300">
                    {kubikasi.volumeDefault} <span className="text-[10px] text-neutral-500 font-normal">m³</span>
                  </div>
                </div>

                <div className="bg-[#1C1511] border border-[#F4511E]/40 rounded-md p-2.5">
                  <span className="block text-[10px] text-orange-400 mb-0.5 font-medium">Kubikasi Akhir</span>
                  <div className="text-base font-bold font-mono text-[#F4511E]">
                    {kubikasi.volumeAkhir} <span className="text-[10px] text-orange-400 font-normal">m³</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Upload Foto Surat Jalan */}
            <div className="pt-2">
              <label className="block text-[11px] font-medium text-neutral-400 mb-1 flex items-center gap-1">
                <Camera className="w-3.5 h-3.5 text-neutral-500" />
                Foto Bukti Fisik Surat Jalan
              </label>
              <div className="border border-dashed border-[#333940] hover:border-[#F4511E] rounded-md p-3 text-center cursor-pointer transition-colors bg-[#101214]">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  id="foto-sj-input"
                  onChange={handlePhotoUpload}
                />
                <label htmlFor="foto-sj-input" className="cursor-pointer block text-xs">
                  {formData.fotoPreview ? (
                    <div className="flex items-center justify-center gap-3">
                      <img
                        src={formData.fotoPreview}
                        alt="Bukti SJ"
                        className="w-12 h-12 object-cover rounded border border-[#333]"
                      />
                      <div className="text-left font-mono text-xs">
                        <span className="text-emerald-400 font-bold block">✓ {formData.fotoSuratJalan}</span>
                        <span className="text-[10px] text-neutral-400">Klik untuk mengganti berkas</span>
                      </div>
                    </div>
                  ) : (
                    <span className="text-neutral-400 hover:text-white">
                      Ambil Foto / Unggah Bukti Fisik Surat Jalan
                    </span>
                  )}
                </label>
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="md"
              icon={Save}
              disabled={!formData.poNumber || customerApprovedPos.length === 0 || isNavPoUnapproved}
              className={`w-full mt-2 cursor-pointer ${
                !formData.poNumber || customerApprovedPos.length === 0 || isNavPoUnapproved
                  ? 'opacity-50 cursor-not-allowed border border-[#2B3037]'
                  : ''
              }`}
              title={
                !formData.poNumber || customerApprovedPos.length === 0 || isNavPoUnapproved
                  ? 'Pre Order harus disetujui Super Admin (APPROVED) sebelum Surat Jalan dapat disimpan'
                  : 'Simpan Surat Jalan (Good Issue)'
              }
            >
              Simpan Surat Jalan (Good Issue)
            </Button>
          </form>
        </Card>

        {/* Right Column (5 cols) - Technical Blueprint & Dispatch Summary */}
        <div className="lg:col-span-5 space-y-3">
          <TruckVisualizer
            panjangCm={Number(formData.panjangCm) || 0}
            lebarCm={Number(formData.lebarCm) || 0}
            tinggiCm={Number(formData.tinggiCm) || 0}
            koreksiCm={formData.koreksiTinggiCm}
            onApplyPreset={handleApplyPreset}
          />

          <Card className="p-4 space-y-3">
            <h2 className="text-xs font-bold text-neutral-300 uppercase tracking-wider font-mono">
              Verifikasi Kiriman Harian
            </h2>

            <div className="space-y-1.5 text-xs font-mono">
              <div className="flex justify-between py-1 border-b border-[#202326]">
                <span className="text-neutral-500">Nopol Armada:</span>
                <span className="font-bold text-neutral-200">{formData.nomorPolisi || '-'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#202326]">
                <span className="text-neutral-500">Customer:</span>
                <span className="text-neutral-200">{formData.customer || '-'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#202326]">
                <span className="text-neutral-500">No. PO:</span>
                <span className="text-neutral-300">{formData.poNumber || '-'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#202326]">
                <span className="text-neutral-500">Material:</span>
                <span className="text-amber-400 font-semibold">
                  {materials.find((m) => m.id === formData.materialId)?.name || '-'}
                </span>
              </div>
              <div className="flex justify-between py-2 border-t border-[#262A2F] items-baseline font-mono">
                <span className="font-semibold text-neutral-300">Volume Riil Diterima:</span>
                <span className="text-lg font-bold text-[#F4511E]">
                  {formatVolume(kubikasi.volumeAkhir)}
                </span>
              </div>
            </div>

            <Button
              type="button"
              variant="primary"
              size="md"
              icon={Save}
              onClick={handleSubmit}
              disabled={!formData.poNumber || customerApprovedPos.length === 0 || isNavPoUnapproved}
              className={`w-full cursor-pointer ${
                !formData.poNumber || customerApprovedPos.length === 0 || isNavPoUnapproved
                  ? 'opacity-50 cursor-not-allowed border border-[#2B3037]'
                  : ''
              }`}
            >
              Simpan Good Issue
            </Button>
          </Card>
        </div>
      </div>
    </div>
  );
}
