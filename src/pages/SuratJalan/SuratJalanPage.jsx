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
  Lock,
  ChevronUp,
  ChevronDown,
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { useToast } from '../../context/ToastContext';
import { useApp } from '../../context/AppContext';
import { calculateKubikasi, formatVolume } from '../../utils/formatters';
import TruckVisualizer, { getTruckClassification } from '../../components/common/TruckVisualizer';
import { Button, Badge, Card, Input, Select } from '../../components/ui';

export default function SuratJalanPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isDark, language } = useApp();
  const { preOrders, createSuratJalan, materials, armadaList, customers, generateNomorRO, generatePoNumber } = useData();
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

  // Helper for normalizing service type to standard values
  const normalizeServiceType = (val) => {
    if (!val) return '';
    const s = String(val).toUpperCase().trim();
    if ((s.includes('JASA ANGKUT') && s.includes('MATERIAL')) || s.includes('+')) {
      return 'Jasa Angkut + Material';
    }
    if (s.includes('MATERIAL') || s === 'CURAH' || s.includes('CURAH SAJA') || s === 'MATERIAL SAJA') {
      return 'Material Curah Saja';
    }
    if (s.includes('JASA ANGKUT') || s === 'JASA' || s === 'JASA ANGKUT SAJA') {
      return 'Jasa Angkut Saja';
    }
    return val;
  };

  // Helper for matching customer name robustly across variations (e.g. PT LION WINGS vs LION WINGS, PT)
  const normalizeCustomer = (val) => {
    if (!val) return '';
    return String(val)
      .toUpperCase()
      .replace(/\b(PT\.?|CV\.?|UD\.?|TBK\.?|PERSERO)\b/gi, '')
      .replace(/[^A-Z0-9]/g, '')
      .trim();
  };

  const isCustomerMatch = (custA, custB) => {
    if (!custA || !custB) return false;
    if (custA === custB) return true;
    if (custA.trim().toLowerCase() === custB.trim().toLowerCase()) return true;

    const normA = normalizeCustomer(custA);
    const normB = normalizeCustomer(custB);
    if (normA && normB && normA === normB) return true;

    const masterA = customers.find(
      (c) =>
        c.name === custA ||
        normalizeCustomer(c.name) === normA ||
        (c.alias && normalizeCustomer(c.alias) === normA)
    );
    const masterB = customers.find(
      (c) =>
        c.name === custB ||
        normalizeCustomer(c.name) === normB ||
        (c.alias && normalizeCustomer(c.alias) === normB)
    );

    if (masterA && masterB && masterA.id === masterB.id) return true;
    if (masterA && (masterA.name === custB || normalizeCustomer(masterA.name) === normB || (masterA.alias && normalizeCustomer(masterA.alias) === normB))) return true;
    if (masterB && (masterB.name === custA || normalizeCustomer(masterB.name) === normA || (masterB.alias && normalizeCustomer(masterB.alias) === normA))) return true;

    if (normA.length >= 4 && normB.length >= 4) {
      if (normA.includes(normB) || normB.includes(normA)) return true;
    }

    return false;
  };

  // Customer dropdown list containing master customers plus any customer having an approved RO
  const customerOptions = useMemo(() => {
    const list = [...customers];
    (approvedPos || []).forEach((po) => {
      if (!po.customer) return;
      const exists = list.some((c) => isCustomerMatch(c.name, po.customer));
      if (!exists) {
        list.push({
          id: `cust-po-${po.id}`,
          name: po.customer,
          kodePrefix: po.customer.slice(0, 2).toUpperCase(),
          alias: po.customer,
        });
      }
    });
    return list;
  }, [customers, approvedPos]);

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
  const targetPoNumber = isFromCreateGi ? (preOrderState.nomorPo || matchedPo?.nomorPo || matchedPo?.nomorPoCustomer || '') : '';
  const targetRoNumber = isFromCreateGi
    ? (preOrderState.nomorRO || preOrderState.nomorRo || matchedPo?.nomorRO || (matchedPo ? (generateNomorRO ? generateNomorRO(matchedPo.customer, preOrders, matchedPo.tanggal, customers) : '') : ''))
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

      return {
        customer: targetCustomer,
        poNumber: targetPoNumber,
        nomorRo: targetRoNumber,
        preOrderId: targetPreOrderId,
        materialId: targetMaterialId,
        jenis: normalizeServiceType(preOrderState.jenis || matchedPo?.jenisRO || matchedPo?.jenis || 'Jasa Angkut + Material'),
        tanggal: now.toISOString().split('T')[0],
        waktu: timeStr,
        nomorNota: preOrderState.nomorNota || '',
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

  // Approved POs for the currently selected customer, sorted with newest first
  const customerApprovedPos = useMemo(() => {
    if (!formData.customer) return [];
    return approvedPos
      .filter((po) => isCustomerMatch(po.customer, formData.customer))
      .sort((a, b) => {
        const dateA = a.tanggal || a.approvedAt || '';
        const dateB = b.tanggal || b.approvedAt || '';
        return dateB.localeCompare(dateA) || String(b.id).localeCompare(String(a.id));
      });
  }, [approvedPos, formData.customer, customers]);

  // Sync state if location.state changes
  useEffect(() => {
    if (location.state?.fromCreateGi || location.state?.fromPreOrder || location.state?.customer) {
      const selectedCust = location.state.customer || '';
      const targetPo = location.state.nomorPo || location.state.nomorPoCustomer || '';
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

      setFormData((prev) => ({
        ...prev,
        customer: selectedCust,
        poNumber: targetPo || prev.poNumber,
        nomorRo: location.state.nomorRo || location.state.nomorRO || prev.nomorRo,
        preOrderId: location.state.preOrderId || prev.preOrderId,
        materialId: targetMat || prev.materialId,
        jenis: normalizeServiceType(location.state.jenis || prev.jenis || 'Jasa Angkut + Material'),
        tanggal: prev.tanggal || now.toISOString().split('T')[0],
        waktu: prev.waktu || timeStr,
        nomorNota: prev.nomorNota || location.state.nomorNota || '',
        nomorPolisi: prev.nomorPolisi || defaultArmada.nopol || 'W 9821 UB',
        panjangCm: prev.panjangCm || defaultArmada.panjangCm || 650,
        lebarCm: prev.lebarCm || defaultArmada.lebarCm || 250,
        tinggiCm: prev.tinggiCm || defaultArmada.tinggiCm || 200,
        isPpn: location.state.isPpn ?? prev.isPpn,
      }));
    }
  }, [location.state, materials, armadaList]);

  // Reactive auto-detection when customer is set but preOrderId is still blank
  useEffect(() => {
    if (formData.customer && !formData.preOrderId && customerApprovedPos.length > 0) {
      const topPo = customerApprovedPos[0];
      const detectedPoVal = topPo.nomorPo || topPo.nomorPoCustomer || '';
      const detectedRo = topPo.nomorRO || topPo.nomorRo || (generateNomorRO ? generateNomorRO(topPo.customer, preOrders, topPo.tanggal, customers) : '');

      let newMatId = topPo.materialId;
      if (!newMatId && topPo.materialName) {
        const match = materials.find(
          (m) => m.name.toLowerCase() === topPo.materialName.toLowerCase()
        );
        if (match) newMatId = match.id;
      }

      setFormData((prev) => ({
        ...prev,
        poNumber: prev.poNumber || detectedPoVal,
        nomorRo: prev.nomorRo || detectedRo,
        preOrderId: prev.preOrderId || topPo.id,
        materialId: prev.materialId || newMatId,
        isPpn: topPo.jenisWajibPajak === 'PKP',
        jenis: normalizeServiceType(topPo.jenisRO || topPo.jenis || prev.jenis || 'Jasa Angkut + Material'),
      }));
    }
  }, [formData.customer, formData.preOrderId, customerApprovedPos, materials]);

  // Customer dropdown change handler: detects PO Number automatically!
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

    const matchingPos = approvedPos
      .filter((po) => isCustomerMatch(po.customer, newCustomer))
      .sort((a, b) => {
        const dateA = a.tanggal || a.approvedAt || '';
        const dateB = b.tanggal || b.approvedAt || '';
        return dateB.localeCompare(dateA) || String(b.id).localeCompare(String(a.id));
      });

    const targetPo = matchingPos[0];
    const defaultArmada = armadaList[0] || {};
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const todayStr = now.toISOString().split('T')[0];

    if (targetPo) {
      const detectedPoVal = targetPo.nomorPo || targetPo.nomorPoCustomer || '';
      const detectedRo = targetPo.nomorRO || targetPo.nomorRo || (generateNomorRO ? generateNomorRO(targetPo.customer, preOrders, targetPo.tanggal, customers) : '');

      let newMatId = targetPo.materialId;
      if (!newMatId && targetPo.materialName) {
        const match = materials.find(
          (m) => m.name.toLowerCase() === targetPo.materialName.toLowerCase()
        );
        if (match) newMatId = match.id;
      }
      if (!newMatId && materials.length > 0) {
        newMatId = materials[0].id;
      }

      setFormData((prev) => ({
        ...prev,
        customer: newCustomer,
        poNumber: detectedPoVal,
        nomorRo: detectedRo,
        preOrderId: targetPo.id || '',
        materialId: newMatId || prev.materialId,
        isPpn: targetPo.jenisWajibPajak === 'PKP',
        tanggal: prev.tanggal || todayStr,
        waktu: prev.waktu || timeStr,
        nomorNota: prev.nomorNota || '',
        jenis: normalizeServiceType(targetPo.jenisRO || targetPo.jenis || prev.jenis || 'Jasa Angkut + Material'),
        nomorPolisi: prev.nomorPolisi || defaultArmada.nopol || 'W 9821 UB',
        panjangCm: prev.panjangCm || defaultArmada.panjangCm || 650,
        lebarCm: prev.lebarCm || defaultArmada.lebarCm || 250,
        tinggiCm: prev.tinggiCm || defaultArmada.tinggiCm || 200,
        koreksiTinggiCm: prev.koreksiTinggiCm || 0,
      }));

      if (detectedPoVal) {
        addToast(
          `Pre Order (${detectedRo}) terdeteksi dengan PO "${detectedPoVal}" untuk ${newCustomer}.`,
          'success'
        );
      } else {
        addToast(
          `Pre Order (${detectedRo}) terdeteksi untuk ${newCustomer}. Nomor PO bersifat opsional.`,
          'info'
        );
      }
    } else {
      setFormData((prev) => ({
        ...prev,
        customer: newCustomer,
        poNumber: '',
        nomorRo: '',
        preOrderId: '',
      }));
      addToast(
        `Customer "${newCustomer}" belum memiliki RO yang disetujui (APPROVED) oleh Super Admin.`,
        'warning'
      );
    }
  };

  // Pre Order / RO selection handler
  const handlePreOrderChange = (selId) => {
    if (!selId) {
      setFormData((prev) => ({
        ...prev,
        preOrderId: '',
        poNumber: '',
        nomorRo: '',
      }));
      return;
    }

    const selectedPo = approvedPos.find(
      (po) =>
        String(po.id) === String(selId) ||
        po.nomorRO === selId ||
        po.nomorPo === selId
    );

    if (!selectedPo) return;

    let newMatId = selectedPo.materialId;
    if (!newMatId && selectedPo.materialName) {
      const match = materials.find(
        (m) => m.name.toLowerCase() === selectedPo.materialName.toLowerCase()
      );
      if (match) newMatId = match.id;
    }
    if (!newMatId && materials.length > 0) {
      newMatId = materials[0].id;
    }
    const resolvedRo = selectedPo.nomorRO || selectedPo.nomorRo || (generateNomorRO ? generateNomorRO(formData.customer || selectedPo.customer, preOrders, selectedPo.tanggal, customers) : '');

    setFormData((prev) => ({
      ...prev,
      preOrderId: selectedPo.id || '',
      poNumber: selectedPo.nomorPo || selectedPo.nomorPoCustomer || '',
      nomorRo: resolvedRo,
      materialId: newMatId || prev.materialId,
      isPpn: selectedPo.jenisWajibPajak === 'PKP',
      jenis: normalizeServiceType(selectedPo.jenisRO || selectedPo.jenis || prev.jenis || 'Jasa Angkut + Material'),
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

  // Default truck classification strictly derived from default dimensions (p, l, t); adjusting koreksiCm does not alter this
  const selectedArmadaClassification = useMemo(() => {
    return getTruckClassification(formData.panjangCm, formData.lebarCm, formData.tinggiCm);
  }, [formData.panjangCm, formData.lebarCm, formData.tinggiCm]);

  const handleKoreksiChange = (delta) => {
    setFormData((prev) => {
      const current = Number(prev.koreksiTinggiCm) || 0;
      return {
        ...prev,
        koreksiTinggiCm: current + delta,
      };
    });
  };

  const handleKoreksiInputChange = (e) => {
    const val = e.target.value;
    if (val === '' || val === '-' || val === '+') {
      setFormData((prev) => ({ ...prev, koreksiTinggiCm: val }));
      return;
    }
    if (/^[+-]?\d*$/.test(val)) {
      setFormData((prev) => ({ ...prev, koreksiTinggiCm: val }));
    }
  };

  const handleKoreksiInputBlur = () => {
    setFormData((prev) => {
      const raw = prev.koreksiTinggiCm;
      if (raw === '' || raw === '-' || raw === '+') {
        return { ...prev, koreksiTinggiCm: 0 };
      }
      const num = Number(raw);
      return { ...prev, koreksiTinggiCm: isNaN(num) ? 0 : num };
    });
  };

  const handleApplyPreset = (p, l, t) => {
    // If a vehicle plate is selected, default classification cannot be changed manually
    if (formData.nomorPolisi) return;

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

    if (!formData.preOrderId && !formData.nomorRo) {
      addToast('Harap pilih Referensi Pre Order / RO yang valid dan telah disetujui (APPROVED).', 'warning');
      return;
    }

    const currentPo = approvedPos.find(
      (po) =>
        (formData.preOrderId && String(po.id) === String(formData.preOrderId)) ||
        (formData.nomorRo && (po.nomorRO === formData.nomorRo || po.nomorRo === formData.nomorRo)) ||
        (formData.poNumber && (po.nomorPo === formData.poNumber || po.nomorPoCustomer === formData.poNumber))
    );

    if (!currentPo || currentPo.status !== 'APPROVED') {
      addToast('Surat Jalan tidak dapat dibuat! Pre Order belum disetujui oleh Super Admin.', 'error');
      return;
    }

    let activeMaterialId = formData.materialId;
    if (!activeMaterialId && currentPo) {
      activeMaterialId = currentPo.materialId;
      if (!activeMaterialId && currentPo.materialName) {
        const match = materials.find(
          (m) => m.name.toLowerCase() === currentPo.materialName.toLowerCase()
        );
        if (match) activeMaterialId = match.id;
      }
      if (!activeMaterialId && materials.length > 0) {
        activeMaterialId = materials[0].id;
      }
    }

    if (!activeMaterialId) {
      addToast('Harap pilih Pre Order / RO dengan data Material yang valid.', 'warning');
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

    const selectedMat = materials.find((m) => m.id === activeMaterialId);
    const finalRoNumber = currentPo?.nomorRO || currentPo?.nomorRo || formData.nomorRo || (generateNomorRO ? generateNomorRO(formData.customer, preOrders, formData.tanggal, customers) : '');
    const resolvedPo = currentPo?.nomorPo || currentPo?.nomorPoCustomer || formData.poNumber || null;
    const finalPoNumber = resolvedPo && resolvedPo !== 'MENUNGGU SURAT JALAN PERTAMA' && String(resolvedPo).trim() !== ''
      ? String(resolvedPo).trim().slice(0, 50)
      : null;
    const finalJenis = normalizeServiceType(currentPo?.jenisRO || currentPo?.jenis || formData.jenis || 'Jasa Angkut + Material');

    createSuratJalan({
      ...formData,
      materialId: activeMaterialId,
      jenis: finalJenis,
      poNumber: finalPoNumber,
      nopol: formData.nomorPolisi,
      nomorRo: finalRoNumber,
      nomorRO: finalRoNumber,
      preOrderId: currentPo?.id,
      material: selectedMat?.name || 'SIRTU',
      volumeDefault: kubikasi.volumeDefault,
      volumeAkhir: kubikasi.volumeAkhir,
      klasifikasiDefault: selectedArmadaClassification?.name || null,
      driver: 'Supir Armada Terjadwal',
    });

    addToast('Surat Jalan (Good Issue) berhasil diterbitkan dan masuk ke Jurnal!', 'success');
    navigate('/rekapan');
  };

  return (
    <div className="w-full space-y-6 pb-6 select-none">
      {/* Top Header */}
      <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b transition-colors ${isDark ? 'border-[#24282C]' : 'border-slate-200'
        }`}>
        <div className="flex items-center gap-2.5">
          <Button
            size="sm"
            variant="ghost"
            icon={ArrowLeft}
            onClick={() => navigate('/')}
            title="Kembali ke Dashboard"
          />
          <div>
            <h1 className={`text-base sm:text-lg font-bold tracking-tight flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'
              }`}>
              <span>Buat Good Issue (Surat Jalan)</span>
              <Badge size="xs" variant="primary">Pencatatan Ritase</Badge>
            </h1>
            <p className={`text-xs ${isDark ? 'text-neutral-400' : 'text-slate-500'}`}>
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
          <div className={`flex items-center gap-2 border px-3 py-1.5 rounded-md transition-colors ${isDark ? 'bg-[#131517] border-[#24282C]' : 'bg-white border-slate-300 shadow-2xs'
            }`}>
            <span className={`text-[11px] font-mono font-medium ${isDark ? 'text-neutral-300' : 'text-slate-700'
              }`}>Format PPN:</span>
            <button
              type="button"
              onClick={() => setFormData({ ...formData, isPpn: !formData.isPpn })}
              className={`w-9 h-5 flex items-center rounded-full p-0.5 transition-colors cursor-pointer ${formData.isPpn ? 'bg-[#F4511E]' : isDark ? 'bg-[#2A2E33]' : 'bg-slate-300'
                }`}
            >
              <div
                className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${formData.isPpn ? 'translate-x-4' : 'translate-x-0'
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
              {language === 'en' ? (
                <>Pre Order <strong>{navPo?.customer || formData.customer}</strong> ({navPo?.nomorRO || navPo?.id || 'DRAFT'}) is still in <strong>PENDING APPROVAL</strong> status from Super Admin. Delivery Order cannot be issued!</>
              ) : (
                <>Pre Order <strong>{navPo?.customer || formData.customer}</strong> ({navPo?.nomorRO || navPo?.id || 'DRAFT'}) masih berstatus <strong>MENUNGGU PERSETUJUAN</strong> Super Admin. Surat Jalan tidak dapat diterbitkan!</>
              )}
            </span>
          </div>
          <Button
            size="xs"
            variant="ghost"
            onClick={() => navigate('/pre-orders')}
            className="text-rose-200 hover:text-white border border-rose-500/40 shrink-0"
          >
            {language === 'en' ? 'View Pre Order' : 'Lihat Pre Order'}
          </Button>
        </div>
      )}

      {isFromCreateGi && !isNavPoUnapproved && (
        <div className="p-3 rounded-xl bg-orange-500/10 border border-[#F4511E]/40 text-[#F4511E] text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 font-mono shadow-sm">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#F4511E] shrink-0" />
            <span>
              Data terisi otomatis dari Pre Order: <strong>{formData.customer}</strong> &bull; [{formData.nomorRo || 'RO'}] &bull; No. PO: <strong>{formData.poNumber || 'Tanpa PO (Opsional)'}</strong>
            </span>
          </div>
          <span className="text-[11px] text-neutral-400 font-sans hidden sm:inline">
            Semua field terisi otomatis &bull; Siap diterbitkan
          </span>
        </div>
      )}

      {!isFromCreateGi && (
        <div className={`p-3 rounded-xl border text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 font-mono shadow-sm transition-colors ${isDark ? 'bg-[#14171A] border-[#262A2E] text-neutral-400' : 'bg-slate-50 border-slate-200 text-slate-600'
          }`}>
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

      {/* Main 2-Column Responsive Layout (Bounded Grid for Clean Sticky Behavior) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Form Column (7 cols) - Replicating Screenshot 1 */}
        <div className="lg:col-span-7">
          <Card className="p-4 sm:p-5">
            <form onSubmit={handleSubmit} className="space-y-3.5">
              {/* Field 1: Pilih Customer */}
              <Select
                label="Pilih Customer"
                icon={User}
                required
                searchPlaceholder="Cari nama atau kode customer..."
                value={formData.customer}
                onChange={(e) => handleCustomerChange(e.target.value)}
              >
                <option value="">-- Pilih Customer --</option>
                {customerOptions.map((c) => (
                  <option key={c.id || c.name} value={c.name}>
                    {c.kodePrefix ? `${c.kodePrefix} - ` : ''}{c.name}
                  </option>
                ))}
                {!customerOptions.some((c) => c.name === formData.customer) && formData.customer && (
                  <option value={formData.customer}>{formData.customer}</option>
                )}
              </Select>

              {/* Field 2: Referensi Pre Order / RO (Wajib Berstatus APPROVED) */}
              <div className="space-y-1">
                <Select
                  label="Referensi Pre Order / RO (Wajib Berstatus APPROVED)"
                  icon={Ticket}
                  required
                  searchPlaceholder="Cari nomor RO, PO, atau material..."
                  value={formData.preOrderId}
                  onChange={(e) => handlePreOrderChange(e.target.value)}
                >
                  {!formData.customer ? (
                    <option value="">-- Pilih Customer Terlebih Dahulu --</option>
                  ) : customerApprovedPos.length === 0 ? (
                    <option value="" disabled>
                      -- Belum ada Pre Order disetujui (APPROVED) untuk customer ini --
                    </option>
                  ) : (
                    <>
                      <option value="">-- Pilih Referensi RO / Pre Order --</option>
                      {customerApprovedPos.map((po) => {
                        const roLabel = po.nomorRO || po.nomorRo || (generateNomorRO ? generateNomorRO(po.customer, preOrders, po.tanggal, customers) : `RO-${po.id}`);
                        const poDisplay = po.nomorPo || po.nomorPoCustomer;
                        return (
                          <option key={po.id} value={po.id}>
                            [{roLabel}] {poDisplay ? `• PO: ${poDisplay}` : '• Tanpa PO (Opsional)'} - {po.customer} ({po.materialName || 'Material'})
                          </option>
                        );
                      })}
                    </>
                  )}
                </Select>
                {formData.customer && customerApprovedPos.length > 0 && formData.preOrderId && (
                  <p className="text-[11px] text-emerald-400 font-mono flex items-center gap-1.5 pt-0.5">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-emerald-400" />
                    <span>Pre Order terverifikasi &bull; Berstatus APPROVED oleh Super Admin.</span>
                  </p>
                )}
                {formData.customer && customerApprovedPos.length === 0 && (
                  <p className="text-[11px] text-amber-400 font-mono flex items-center gap-1.5 pt-0.5">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>Customer ini belum memiliki Pre Order yang disetujui Super Admin.</span>
                  </p>
                )}
              </div>

              {/* Field 3: Nomor PO Customer (Disabled, Mengikuti Received Order) */}
              <div>
                <Input
                  label="Nomor PO Customer (Otomatis dari Received Order)"
                  icon={Ticket}
                  disabled
                  readOnly
                  placeholder={
                    formData.customer
                      ? (formData.poNumber ? '' : 'Tanpa PO Customer (Kosong Sesuai Received Order)')
                      : 'Pilih Customer & Pre Order terlebih dahulu'
                  }
                  value={formData.poNumber || ''}
                  helperText={
                    formData.poNumber
                      ? `Nomor PO terkunci otomatis sesuai Received Order: ${formData.poNumber}`
                      : formData.customer
                        ? 'Tidak ada Nomor PO pada Received Order (dikosongkan).'
                        : 'Pilih Customer & Pre Order terlebih dahulu untuk memuat Nomor PO.'
                  }
                  className="font-mono font-bold text-neutral-300 cursor-not-allowed select-all"
                />
              </div>

              {/* Field 4: Nomor RO (Disabled, Terkunci Sesuai Pre Order Terpilih) */}
              <div>
                <Input
                  label="Nomor RO (Terkunci Sesuai Pre Order Terpilih)"
                  icon={Ticket}
                  disabled
                  readOnly
                  placeholder={
                    formData.customer
                      ? "Pilih Pre Order / RO di atas untuk menampilkan Nomor RO"
                      : "Pilih Customer & Pre Order terlebih dahulu"
                  }
                  value={formData.nomorRo}
                  helperText={
                    formData.nomorRo
                      ? "Nomor RO terkunci dari Pre Order berstatus APPROVED yang dipilih."
                      : formData.customer
                        ? "Pilih Pre Order di atas untuk memuat Nomor RO"
                        : "Pilih Customer & Pre Order terlebih dahulu untuk memuat Nomor RO"
                  }
                  className="font-mono font-bold text-[#F4511E] cursor-not-allowed select-all"
                />
              </div>

              {/* Row 4: Material & Jenis */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Input
                    label="Material"
                    icon={Box}
                    disabled
                    readOnly
                    placeholder={
                      formData.customer
                        ? "Pilih Pre Order / RO di atas untuk memuat Material"
                        : "Pilih Customer & Pre Order terlebih dahulu"
                    }
                    value={
                      materials.find((m) => String(m.id) === String(formData.materialId))
                        ? `${materials.find((m) => String(m.id) === String(formData.materialId)).name} (${materials.find((m) => String(m.id) === String(formData.materialId)).satuan || 'm³'})`
                        : (formData.materialId ? String(formData.materialId) : '')
                    }
                    helperText={
                      formData.materialId
                        ? "Material dikunci otomatis sesuai Received Order (RO) yang dipilih."
                        : formData.customer
                          ? "Pilih Pre Order di atas untuk memuat Material"
                          : "Pilih Customer & Pre Order terlebih dahulu untuk memuat Material"
                    }
                    className="font-medium text-neutral-300 cursor-not-allowed select-all"
                  />
                  <p className="text-[11px] text-neutral-400 font-mono flex items-center gap-1.5 pt-0.5">
                    <Lock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span>
                      {materials.find((m) => String(m.id) === String(formData.materialId))
                        ? `Terkunci: ${materials.find((m) => String(m.id) === String(formData.materialId))?.name} (sesuai RO)`
                        : 'Otomatis terkunci sesuai kontrak Receive Order (RO)'}
                    </span>
                  </p>
                </div>

                <div className="space-y-1">
                  <Select
                    label="Jenis Layanan"
                    icon={Lock}
                    required
                    disabled={true}
                    value={formData.jenis}
                    onChange={(e) => setFormData({ ...formData, jenis: e.target.value })}
                    title="Jenis Layanan dikunci otomatis sesuai kontrak Receive Order (RO)"
                    className="cursor-not-allowed opacity-80"
                  >
                    {!formData.jenis ? (
                      <option value="">-- Terkunci Sesuai RO Terpilih --</option>
                    ) : (
                      <>
                        <option value="Jasa Angkut + Material">Jasa Angkut + Material</option>
                        <option value="Material Curah Saja">Material Curah Saja</option>
                        <option value="Jasa Angkut Saja">Jasa Angkut Saja</option>
                        {!['Jasa Angkut + Material', 'Material Curah Saja', 'Jasa Angkut Saja'].includes(formData.jenis) && (
                          <option value={formData.jenis}>{formData.jenis}</option>
                        )}
                      </>
                    )}
                  </Select>
                  <p className="text-[11px] text-neutral-400 font-mono flex items-center gap-1.5 pt-0.5">
                    <Lock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span>
                      {formData.jenis
                        ? `Terkunci: ${formData.jenis} (sesuai RO)`
                        : 'Otomatis terkunci sesuai kontrak Receive Order (RO)'}
                    </span>
                  </p>
                </div>
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
                  label="Nomor Nota Pengambilan (Opsional)"
                  icon={FileText}
                  placeholder="Opsional (contoh: NT-88921)"
                  helperText="Kosongkan jika tidak ada nota pengambilan dari lokasi muat"
                  value={formData.nomorNota}
                  onChange={(e) => setFormData({ ...formData, nomorNota: e.target.value })}
                  className="font-mono"
                />

                <Select
                  label="Nomor Polisi Armada"
                  icon={Truck}
                  searchPlaceholder="Cari nopol atau tipe armada..."
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
                {/* Koreksi Tinggi: Manual Entry, Underline & Up/Down Arrows */}
                <div className={`flex items-center justify-between p-2.5 sm:p-3 rounded-xl border transition-colors ${
                  isDark ? 'bg-[#181B1E] border-[#2B3036]' : 'bg-slate-50 border-slate-200'
                }`}>
                  <div className="flex items-center gap-3">
                    <span className={`text-xs font-semibold ${isDark ? 'text-neutral-300' : 'text-slate-700'}`}>
                      Koreksi Tinggi:
                    </span>
                    <div className="flex items-center font-mono font-bold">
                      <input
                        type="text"
                        inputMode="numeric"
                        placeholder="0"
                        value={formData.koreksiTinggiCm === undefined || formData.koreksiTinggiCm === null ? '' : formData.koreksiTinggiCm}
                        onFocus={(e) => {
                          if (e.target.value === '0') e.target.select();
                        }}
                        onChange={handleKoreksiInputChange}
                        onBlur={handleKoreksiInputBlur}
                        className={`w-16 bg-transparent text-center font-mono font-bold text-xs sm:text-sm focus:outline-none border-b-2 transition-colors ${
                          isDark
                            ? 'text-white border-[#3E454D] focus:border-[#F4511E]'
                            : 'text-slate-900 border-slate-400 focus:border-[#F4511E]'
                        }`}
                        title="Koreksi Tinggi dalam cm (bisa ketik manual positif atau negatif, misal: -5, 10)"
                      />
                      <span className={`font-mono font-bold text-xs ml-1 ${isDark ? 'text-neutral-400' : 'text-slate-500'}`}>cm</span>
                    </div>
                  </div>

                  {/* Toggle Mechanism: Up and Down Arrows */}
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleKoreksiChange(5)}
                      className={`p-1.5 sm:p-2 rounded-lg border flex items-center justify-center transition-all cursor-pointer ${
                        isDark
                          ? 'bg-[#22262B] border-[#2E343C] text-neutral-200 hover:text-white hover:bg-[#2A3037] active:scale-95'
                          : 'bg-white border-slate-300 text-slate-700 hover:text-slate-900 hover:bg-slate-100 active:scale-95 shadow-xs'
                      }`}
                      title="Tambah 5 cm (Koreksi Naik)"
                      aria-label="Koreksi Naik"
                    >
                      <ChevronUp className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleKoreksiChange(-5)}
                      className={`p-1.5 sm:p-2 rounded-lg border flex items-center justify-center transition-all cursor-pointer ${
                        isDark
                          ? 'bg-[#22262B] border-[#2E343C] text-neutral-200 hover:text-white hover:bg-[#2A3037] active:scale-95'
                          : 'bg-white border-slate-300 text-slate-700 hover:text-slate-900 hover:bg-slate-100 active:scale-95 shadow-xs'
                      }`}
                      title="Kurangi 5 cm (Koreksi Turun)"
                      aria-label="Koreksi Turun"
                    >
                      <ChevronDown className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </button>
                  </div>
                </div>

                {/* Tinggi Hasil Koreksi Header */}
                <div className={`text-xs font-semibold flex items-center justify-between px-1 ${
                  isDark ? 'text-neutral-300' : 'text-slate-700'
                }`}>
                  <span>Tinggi Hasil Koreksi:</span>
                  <span className="text-[#F4511E] font-mono font-bold text-sm">
                    {kubikasi.tinggiHasilKoreksi} cm
                  </span>
                </div>

                {/* 3 Dimension Inputs: P, L, T */}
                {Boolean(formData.nomorPolisi) && (
                  <div className={`flex items-center justify-between px-3 py-2 rounded-lg border text-xs font-mono transition-colors ${
                    isDark ? 'bg-[#121417] border-[#252A30] text-neutral-300' : 'bg-slate-100 border-slate-200 text-slate-700'
                  }`}>
                    <div className="flex items-center gap-2">
                      <Lock className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                      <span>
                        Klasifikasi Default: <strong className={isDark ? 'text-white' : 'text-slate-900'}>{selectedArmadaClassification?.name || 'Armada Standar'}</strong>
                      </span>
                    </div>
                    <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/50">
                      Otomatis ({formData.nomorPolisi})
                    </span>
                  </div>
                )}

                <div className="grid grid-cols-3 gap-2">
                  <div className={`border rounded-md p-2 text-center transition-colors ${
                    formData.nomorPolisi
                      ? isDark ? 'bg-[#141619] border-[#22262B]' : 'bg-slate-100 border-slate-200'
                      : isDark ? 'bg-[#181B1E] border-[#2B3036]' : 'bg-white border-slate-300'
                  }`}>
                    <span className="block text-[10px] text-neutral-400 mb-0.5 flex items-center justify-center gap-1">
                      <span>Panjang *</span>
                      {formData.nomorPolisi && <Lock className="w-2.5 h-2.5 text-amber-500/80" />}
                    </span>
                    <div className="flex items-center justify-center gap-1 font-mono font-bold text-neutral-100 text-sm">
                      <input
                        type="number"
                        placeholder="0"
                        readOnly={Boolean(formData.nomorPolisi)}
                        disabled={Boolean(formData.nomorPolisi)}
                        value={formData.panjangCm === '' ? '' : formData.panjangCm}
                        onFocus={(e) => {
                          if (e.target.value === '0') e.target.select();
                        }}
                        onChange={(e) => {
                          if (formData.nomorPolisi) return;
                          const raw = e.target.value;
                          const clean = raw === '' ? '' : raw.replace(/^0+(?=\d)/, '');
                          setFormData({ ...formData, panjangCm: clean });
                        }}
                        className={`w-16 bg-transparent text-center focus:outline-none border-b-2 transition-colors ${
                          formData.nomorPolisi
                            ? 'cursor-not-allowed text-neutral-400 opacity-80 border-[#3E454D]'
                            : isDark
                              ? 'text-white border-[#3E454D] focus:border-[#F4511E]'
                              : 'text-slate-900 border-slate-400 focus:border-[#F4511E]'
                        }`}
                        title={formData.nomorPolisi ? 'Dimensi panjang bak otomatis diatur dari armada terdaftar' : 'Masukkan panjang bak (cm)'}
                      />
                      <span className="text-[10px] text-neutral-500 font-normal">cm</span>
                    </div>
                  </div>

                  <div className={`border rounded-md p-2 text-center transition-colors ${
                    formData.nomorPolisi
                      ? isDark ? 'bg-[#141619] border-[#22262B]' : 'bg-slate-100 border-slate-200'
                      : isDark ? 'bg-[#181B1E] border-[#2B3036]' : 'bg-white border-slate-300'
                  }`}>
                    <span className="block text-[10px] text-neutral-400 mb-0.5 flex items-center justify-center gap-1">
                      <span>Lebar *</span>
                      {formData.nomorPolisi && <Lock className="w-2.5 h-2.5 text-amber-500/80" />}
                    </span>
                    <div className="flex items-center justify-center gap-1 font-mono font-bold text-neutral-100 text-sm">
                      <input
                        type="number"
                        placeholder="0"
                        readOnly={Boolean(formData.nomorPolisi)}
                        disabled={Boolean(formData.nomorPolisi)}
                        value={formData.lebarCm === '' ? '' : formData.lebarCm}
                        onFocus={(e) => {
                          if (e.target.value === '0') e.target.select();
                        }}
                        onChange={(e) => {
                          if (formData.nomorPolisi) return;
                          const raw = e.target.value;
                          const clean = raw === '' ? '' : raw.replace(/^0+(?=\d)/, '');
                          setFormData({ ...formData, lebarCm: clean });
                        }}
                        className={`w-16 bg-transparent text-center focus:outline-none border-b-2 transition-colors ${
                          formData.nomorPolisi
                            ? 'cursor-not-allowed text-neutral-400 opacity-80 border-[#3E454D]'
                            : isDark
                              ? 'text-white border-[#3E454D] focus:border-[#F4511E]'
                              : 'text-slate-900 border-slate-400 focus:border-[#F4511E]'
                        }`}
                        title={formData.nomorPolisi ? 'Dimensi lebar bak otomatis diatur dari armada terdaftar' : 'Masukkan lebar bak (cm)'}
                      />
                      <span className="text-[10px] text-neutral-500 font-normal">cm</span>
                    </div>
                  </div>

                  <div className={`border rounded-md p-2 text-center transition-colors ${
                    formData.nomorPolisi
                      ? isDark ? 'bg-[#141619] border-[#22262B]' : 'bg-slate-100 border-slate-200'
                      : isDark ? 'bg-[#181B1E] border-[#2B3036]' : 'bg-white border-slate-300'
                  }`}>
                    <span className="block text-[10px] text-neutral-400 mb-0.5 flex items-center justify-center gap-1">
                      <span>Tinggi *</span>
                      {formData.nomorPolisi && <Lock className="w-2.5 h-2.5 text-amber-500/80" />}
                    </span>
                    <div className="flex items-center justify-center gap-1 font-mono font-bold text-neutral-100 text-sm">
                      <input
                        type="number"
                        placeholder="0"
                        readOnly={Boolean(formData.nomorPolisi)}
                        disabled={Boolean(formData.nomorPolisi)}
                        value={formData.tinggiCm === '' ? '' : formData.tinggiCm}
                        onFocus={(e) => {
                          if (e.target.value === '0') e.target.select();
                        }}
                        onChange={(e) => {
                          if (formData.nomorPolisi) return;
                          const raw = e.target.value;
                          const clean = raw === '' ? '' : raw.replace(/^0+(?=\d)/, '');
                          setFormData({ ...formData, tinggiCm: clean });
                        }}
                        className={`w-16 bg-transparent text-center focus:outline-none border-b-2 transition-colors ${
                          formData.nomorPolisi
                            ? 'cursor-not-allowed text-neutral-400 opacity-80 border-[#3E454D]'
                            : isDark
                              ? 'text-white border-[#3E454D] focus:border-[#F4511E]'
                              : 'text-slate-900 border-slate-400 focus:border-[#F4511E]'
                        }`}
                        title={formData.nomorPolisi ? 'Dimensi tinggi bak otomatis diatur dari armada terdaftar' : 'Masukkan tinggi bak (cm)'}
                      />
                      <span className="text-[10px] text-neutral-500 font-normal">cm</span>
                    </div>
                  </div>
                </div>

                {/* Results: Kubikasi Default & Akhir */}
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div className={`border rounded-md p-2.5 transition-colors ${isDark ? 'bg-[#181B1E] border-[#2B3036]' : 'bg-slate-50 border-slate-200'
                    }`}>
                    <div className="flex items-center justify-between mb-0.5">
                      <span className={`block text-[10px] ${isDark ? 'text-neutral-400' : 'text-slate-500'}`}>Kubikasi Default</span>
                      {selectedArmadaClassification && (
                        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-black/40 border border-[#2E3339] text-neutral-300">
                          {selectedArmadaClassification.name}
                        </span>
                      )}
                    </div>
                    <div className={`text-base font-bold font-mono ${isDark ? 'text-neutral-300' : 'text-slate-800'}`}>
                      {kubikasi.volumeDefault} <span className={`text-[10px] font-normal ${isDark ? 'text-neutral-500' : 'text-slate-500'}`}>m³</span>
                    </div>
                    <span className="text-[10px] text-neutral-500 font-mono block mt-0.5">
                      P &times; L &times; T (Tetap / Default)
                    </span>
                  </div>

                  <div className={`border rounded-md p-2.5 transition-colors ${isDark ? 'bg-[#1C1511] border-[#F4511E]/40' : 'bg-orange-50/70 border-orange-200'
                    }`}>
                    <div className="flex items-center justify-between mb-0.5">
                      <span className={`block text-[10px] font-medium ${isDark ? 'text-orange-400' : 'text-orange-600'}`}>Kubikasi Akhir</span>
                      {formData.koreksiTinggiCm !== 0 && (
                        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-[#F4511E]/20 text-[#F4511E] font-bold">
                          K: {formData.koreksiTinggiCm > 0 ? `+${formData.koreksiTinggiCm}` : formData.koreksiTinggiCm} cm
                        </span>
                      )}
                    </div>
                    <div className="text-base font-bold font-mono text-[#F4511E]">
                      {kubikasi.volumeAkhir} <span className={`text-[10px] font-normal ${isDark ? 'text-orange-400' : 'text-orange-600'}`}>m³</span>
                    </div>
                    <span className="text-[10px] text-neutral-400 font-mono block mt-0.5">
                      P &times; L &times; TK ({kubikasi.tinggiHasilKoreksi} cm)
                    </span>
                  </div>
                </div>
              </div>

              {/* Upload Foto Surat Jalan */}
              <div className="pt-2">
                <label className={`block text-[11px] font-medium mb-1 flex items-center gap-1 ${isDark ? 'text-neutral-400' : 'text-slate-600'
                  }`}>
                  <Camera className={`w-3.5 h-3.5 ${isDark ? 'text-neutral-500' : 'text-slate-400'}`} />
                  Foto Bukti Fisik Surat Jalan
                </label>
                <div className={`border border-dashed hover:border-[#F4511E] rounded-md p-3 text-center cursor-pointer transition-colors ${isDark ? 'border-[#333940] bg-[#101214]' : 'border-slate-300 bg-slate-50'
                  }`}>
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
                          className={`w-12 h-12 object-cover rounded border ${isDark ? 'border-[#333]' : 'border-slate-300'}`}
                        />
                        <div className="text-left font-mono text-xs">
                          <span className="text-emerald-500 font-bold block">✓ {formData.fotoSuratJalan}</span>
                          <span className={`text-[10px] ${isDark ? 'text-neutral-400' : 'text-slate-500'}`}>Klik untuk mengganti berkas</span>
                        </div>
                      </div>
                    ) : (
                      <span className={isDark ? 'text-neutral-400 hover:text-white' : 'text-slate-500 hover:text-slate-800'}>
                        Ambil Foto / Unggah Bukti Fisik Surat Jalan
                      </span>
                    )}
                  </label>
                </div>
              </div>
            </form>
          </Card>
        </div>

        {/* Right Column (5 cols) - Technical Blueprint & Dispatch Summary (Follows page scroll, adjusts alongside left form) */}
        <div className="lg:col-span-5 relative">
          <div className="lg:sticky lg:top-4 space-y-3">
            <TruckVisualizer
              panjangCm={Number(formData.panjangCm) || 0}
              lebarCm={Number(formData.lebarCm) || 0}
              tinggiCm={Number(formData.tinggiCm) || 0}
              koreksiCm={formData.koreksiTinggiCm}
              onApplyPreset={handleApplyPreset}
              isLocked={Boolean(formData.nomorPolisi)}
              selectedNopol={formData.nomorPolisi}
            />

            <Card className={`p-4 space-y-3 shadow-md border transition-colors ${isDark ? 'bg-[#14171A] border-[#22262A]' : 'bg-white border-slate-200'
              }`}>
              <div className={`flex items-center justify-between pb-2 border-b ${isDark ? 'border-[#202326]' : 'border-slate-200'
                }`}>
                <div className={`flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider font-mono ${isDark ? 'text-neutral-200' : 'text-slate-800'
                  }`}>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Verifikasi Kiriman Harian</span>
                </div>
                <Badge size="xs" variant={formData.isPpn ? 'primary' : 'outline'}>
                  {formData.isPpn ? 'Format PPN' : 'Non-PPN'}
                </Badge>
              </div>

              <div className="space-y-1.5 text-xs font-mono">
                <div className={`flex justify-between py-1 border-b ${isDark ? 'border-[#202326]' : 'border-slate-200'
                  }`}>
                  <span className={isDark ? 'text-neutral-500' : 'text-slate-500'}>Nopol Armada:</span>
                  <span className={`font-bold ${isDark ? 'text-neutral-200' : 'text-slate-900'}`}>{formData.nomorPolisi || '-'}</span>
                </div>
                <div className={`flex justify-between py-1 border-b ${isDark ? 'border-[#202326]' : 'border-slate-200'
                  }`}>
                  <span className={isDark ? 'text-neutral-500' : 'text-slate-500'}>Klasifikasi Default:</span>
                  <span className={`font-semibold font-mono ${isDark ? 'text-neutral-200' : 'text-slate-900'}`}>
                    {selectedArmadaClassification?.name || '-'} ({kubikasi.volumeDefault} m³)
                  </span>
                </div>
                <div className={`flex justify-between py-1 border-b ${isDark ? 'border-[#202326]' : 'border-slate-200'
                  }`}>
                  <span className={isDark ? 'text-neutral-500' : 'text-slate-500'}>Customer:</span>
                  <span className={`truncate max-w-[180px] font-medium ${isDark ? 'text-neutral-200' : 'text-slate-900'}`} title={formData.customer}>{formData.customer || '-'}</span>
                </div>
                <div className={`flex justify-between py-1 border-b ${isDark ? 'border-[#202326]' : 'border-slate-200'
                  }`}>
                  <span className={isDark ? 'text-neutral-500' : 'text-slate-500'}>No. PO:</span>
                  <span className={isDark ? 'text-neutral-300' : 'text-slate-700'}>{formData.poNumber || '-'}</span>
                </div>
                <div className={`flex justify-between py-1 border-b ${isDark ? 'border-[#202326]' : 'border-slate-200'
                  }`}>
                  <span className={isDark ? 'text-neutral-500' : 'text-slate-500'}>Material:</span>
                  <span className={`font-semibold truncate max-w-[180px] ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>
                    {materials.find((m) => m.id === formData.materialId)?.name || '-'}
                  </span>
                </div>
                <div className={`flex justify-between py-2.5 px-3 border rounded-lg items-baseline font-mono mt-1 shadow-2xs ${isDark ? 'border-[#F4511E]/30 bg-[#1C1511]' : 'border-orange-200 bg-orange-50/70'
                  }`}>
                  <span className={`font-semibold text-xs ${isDark ? 'text-neutral-200' : 'text-slate-800'}`}>Volume Riil Diterima:</span>
                  <span className="text-lg sm:text-xl font-black text-[#F4511E] tracking-tight">
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
                disabled={!formData.customer || !formData.preOrderId || customerApprovedPos.length === 0 || isNavPoUnapproved}
                className={`w-full cursor-pointer py-2.5 font-bold shadow-md shadow-[#F4511E]/20 transition-all ${!formData.customer || !formData.preOrderId || customerApprovedPos.length === 0 || isNavPoUnapproved
                  ? 'opacity-50 cursor-not-allowed border border-[#2B3037]'
                  : 'hover:brightness-110 active:scale-[0.99]'
                  }`}
                title={
                  !formData.customer || !formData.preOrderId || customerApprovedPos.length === 0 || isNavPoUnapproved
                    ? 'Pre Order harus dipilih dan disetujui Super Admin (APPROVED) sebelum Surat Jalan dapat disimpan'
                    : 'Simpan Good Issue'
                }
              >
                Simpan Good Issue
              </Button>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
