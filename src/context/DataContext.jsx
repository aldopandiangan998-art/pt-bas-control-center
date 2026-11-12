import { createContext, useContext, useState } from 'react';
import { useToast } from './ToastContext';
import { calculateKubikasi } from '../utils/formatters';

const DataContext = createContext(null);

export function DataProvider({ children }) {
  const { addToast } = useToast();

  // 1. Pre Order list per PT BAS Gresik
  const [preOrders, setPreOrders] = useState([
    {
      id: 'PO-DRAFT-01',
      nomorPo: 'PO-LW-2026-089', // Generated upon 1st SJ
      customer: 'PT LION WINGS',
      customerAddress: 'Kawasan Industri Gresik (KIG) Blok C-12, Manyar, Gresik',
      materialId: 'mat-2',
      materialName: 'Sirtu Curah',
      materialCategory: 'Curah',
      pphRate: 2.0,
      satuan: 'm3',
      totalOrder: 500,
      terkirim: 161.43,
      hargaJual: 120000,
      hargaBeli: 95000,
      tanggal: '2026-11-01',
      top: '30 Hari',
      status: 'APPROVED', // 'DRAFT' | 'MENUNGGU_APPROVAL' | 'APPROVED' | 'REJECTED' | 'SELESAI_KIRIM'
      createdBy: 'Admin Gresik',
      approvedBy: 'David Rusiah (Direktur)',
      approvedAt: '2026-11-01 10:30',
      rejectionReason: null,
    },
    {
      id: 'PO-DRAFT-02',
      nomorPo: null, // Still waiting for 1st SJ
      customer: 'PT SEMEN INDONESIA',
      customerAddress: 'Jl. Veteran, Gresik',
      materialId: 'mat-5',
      materialName: 'Limestone Padat',
      materialCategory: 'Padat',
      pphRate: 2.65,
      satuan: 'm3',
      totalOrder: 1200,
      terkirim: 0,
      hargaJual: 145000,
      hargaBeli: 115000,
      tanggal: '2026-11-10',
      top: '14 Hari',
      status: 'MENUNGGU_APPROVAL',
      createdBy: 'Admin Gresik',
      approvedBy: null,
      approvedAt: null,
      rejectionReason: null,
    },
    {
      id: 'PO-DRAFT-03',
      nomorPo: 'PO-PG-2026-041',
      customer: 'PT PETROKIMIA GRESIK',
      customerAddress: 'Jl. Jenderal Ahmad Yani, Gresik',
      materialId: 'mat-4',
      materialName: 'Tanah Curah',
      materialCategory: 'Curah',
      pphRate: 2.0,
      satuan: 'rit',
      totalOrder: 150,
      terkirim: 45,
      hargaJual: 350000,
      hargaBeli: 280000,
      tanggal: '2026-11-04',
      top: 'Cash / Tunai',
      status: 'APPROVED',
      createdBy: 'Admin Gresik',
      approvedBy: 'David Rusiah (Direktur)',
      approvedAt: '2026-11-04 14:10',
      rejectionReason: null,
    },
  ]);

  // 2. Surat Jalan (Good Issue) list
  const [suratJalanList, setSuratJalanList] = useState([
    {
      id: 'SJ-202611-0089',
      nomorSj: '29678',
      poNumber: 'PO-LW-2026-089',
      customer: 'PT LION WINGS',
      material: 'Sirtu Curah',
      nopol: 'W 9821 UB',
      driver: 'Bambang Suprianto',
      tanggal: '2026-11-07',
      waktu: '09:43',
      nomorNota: 'NT-88921',
      isPpn: false,
      panjangCm: 650,
      lebarCm: 250,
      tinggiCm: 200,
      koreksiCm: 0,
      volumeAkhir: 32.5,
      fotoSuratJalan: 'sj_29678_w9821ub.jpg',
      statusRekap: 'DIREKAP', // 'DRAFT' | 'DIREKAP' | 'DITAGIH'
    },
    {
      id: 'SJ-202611-0090',
      nomorSj: '29679',
      poNumber: 'PO-LW-2026-089',
      customer: 'PT LION WINGS',
      material: 'Sirtu Curah',
      nopol: 'W 8812 UA',
      driver: 'Agus Triono',
      tanggal: '2026-11-07',
      waktu: '11:15',
      nomorNota: 'NT-88922',
      isPpn: false,
      panjangCm: 620,
      lebarCm: 240,
      tinggiCm: 190,
      koreksiCm: -5,
      volumeAkhir: 27.53,
      fotoSuratJalan: 'sj_29679_w8812ua.jpg',
      statusRekap: 'DIREKAP',
    },
  ]);

  // 3. BKK (Cash Out) transactions per Screenshot 2
  const [bkkList, setBkkList] = useState([
    {
      id: 'bkk-1',
      volume: 81.09,
      material: 'SIRTU',
      kodeTransaksi: '2026-11-07 - RCP - RU4TN',
      jenis: 'CURAH | JASA ANGKUT + MATERIAL',
      perusahaan: 'LION WINGS, PT',
      subDetail: 'LW 655 - CUR - 459001...',
      timestamp: '2026-11-09 09:43:20',
      periode: 'Periode: 2026-11-07',
      amount: 9730800.0,
      statusBayar: 'Belum Dibayar', // 'Belum Dibayar' (Hutang) | 'Lunas'
      tanggalBayar: null,
      rekeningSumber: null,
    },
    {
      id: 'bkk-2',
      volume: 80.34,
      material: 'SIRTU',
      kodeTransaksi: '2026-11-05 - RCP - XAGXH',
      jenis: 'CURAH | JASA ANGKUT + MATERIAL',
      perusahaan: 'LION WINGS, PT',
      subDetail: 'LW 655 - CUR - 459002...',
      timestamp: '2026-11-09 09:43:20',
      periode: 'Periode: 2026-11-05',
      amount: 9640800.0,
      statusBayar: 'Belum Dibayar',
      tanggalBayar: null,
      rekeningSumber: null,
    },
    {
      id: 'bkk-3',
      volume: 54.2,
      material: 'TANAH',
      kodeTransaksi: '2026-11-04 - RCP - PG99A',
      jenis: 'CURAH | JASA ANGKUT',
      perusahaan: 'PETROKIMIA GRESIK, PT',
      subDetail: 'PG 102 - TNH - 0021...',
      timestamp: '2026-11-06 14:12:00',
      periode: 'Periode: 2026-11-04',
      amount: 6500000.0,
      statusBayar: 'Lunas',
      tanggalBayar: '2026-11-08',
      rekeningSumber: 'BCA - 0188920199 a/n PT Berkah Alam Semesta',
    },
  ]);

  // ACTIONS

  // Add Pre Order
  const createPreOrder = (data) => {
    const id = `PO-DRAFT-${String(preOrders.length + 1).padStart(2, '0')}`;
    const newPo = {
      ...data,
      id,
      nomorPo: null, // No PO until 1st SJ per PT BAS rule
      terkirim: 0,
      status: 'MENUNGGU_APPROVAL',
      createdBy: 'Admin Gresik',
      approvedBy: null,
      approvedAt: null,
      rejectionReason: null,
    };
    setPreOrders((prev) => [newPo, ...prev]);
    addToast('Pre Order berhasil diajukan! Menunggu persetujuan Direktur.', 'success');
    return newPo;
  };

  // Approve Pre Order (Superadmin only)
  const approvePreOrder = (id, approverName = 'David Rusiah (Direktur)') => {
    setPreOrders((prev) =>
      prev.map((po) => {
        if (po.id === id) {
          return {
            ...po,
            status: 'APPROVED',
            approvedBy: approverName,
            approvedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
            rejectionReason: null,
          };
        }
        return po;
      })
    );
    addToast('Pre Order resmi DISETUJUI! Surat Jalan kini dapat dibuat.', 'success');
  };

  // Reject Pre Order
  const rejectPreOrder = (id, reason) => {
    setPreOrders((prev) =>
      prev.map((po) => {
        if (po.id === id) {
          return {
            ...po,
            status: 'REJECTED',
            rejectionReason: reason || 'Harga atau kuota tidak sesuai',
          };
        }
        return po;
      })
    );
    addToast('Pre Order ditolak dan dikembalikan untuk revisi.', 'error');
  };

  // Create Surat Jalan & Auto-assign PO Number if first delivery!
  const createSuratJalan = (sjData) => {
    const sjId = `SJ-${new Date().toISOString().slice(0, 7).replace('-', '')}-${String(
      suratJalanList.length + 1
    ).padStart(4, '0')}`;

    // Calculate dimensions
    const calc = calculateKubikasi(
      sjData.panjangCm,
      sjData.lebarCm,
      sjData.tinggiCm,
      sjData.koreksiTinggiCm || 0
    );

    const newSj = {
      ...sjData,
      id: sjId,
      volumeAkhir: calc.volumeAkhir,
      statusRekap: 'DRAFT',
    };

    setSuratJalanList((prev) => [newSj, ...prev]);

    // Update PO delivered volume & generate PO number if not existing
    setPreOrders((prev) =>
      prev.map((po) => {
        if (po.nomorPo === sjData.poNumber || po.customer === sjData.customer) {
          const generatedPoNum = po.nomorPo || `PO-${sjData.customer.replace(/[^A-Z]/g, '').slice(0, 2)}-2026-${Math.floor(100 + Math.random() * 900)}`;
          return {
            ...po,
            nomorPo: generatedPoNum,
            terkirim: Number((po.terkirim + calc.volumeAkhir).toFixed(2)),
          };
        }
        return po;
      })
    );

    addToast(`Surat Jalan No. ${sjData.nomorSj} berhasil disimpan! (${calc.volumeAkhir} m³)`, 'success');
    return newSj;
  };

  // Mark BKK as Paid (Per Implementation Plan Section 2, Aturan 22)
  const markBkkPaid = (bkkIds, paymentDetails) => {
    setBkkList((prev) =>
      prev.map((item) => {
        if (bkkIds.includes(item.id)) {
          return {
            ...item,
            statusBayar: 'Lunas',
            tanggalBayar: paymentDetails.tanggalBayar || new Date().toISOString().split('T')[0],
            rekeningSumber: paymentDetails.rekeningSumber || 'BCA - 0188920199 a/n PT Berkah Alam Semesta',
          };
        }
        return item;
      })
    );
    addToast(`${bkkIds.length} BKK berhasil dicatat LUNAS! Hutang diperbarui.`, 'success');
  };

  return (
    <DataContext.Provider
      value={{
        preOrders,
        suratJalanList,
        bkkList,
        createPreOrder,
        approvePreOrder,
        rejectPreOrder,
        createSuratJalan,
        markBkkPaid,
      }}
    >
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within DataProvider');
  }
  return context;
}
