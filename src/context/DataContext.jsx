import { createContext, useContext, useState } from 'react';
import { useToast } from './ToastContext';
import { calculateKubikasi } from '../utils/formatters';

const DataContext = createContext(null);

export function DataProvider({ children }) {
  const { addToast } = useToast();

  // ==========================================
  // 1. DATA TRANSAKSI OPERASIONAL
  // ==========================================

  // Pre Order list per PT BAS Gresik
  const [preOrders, setPreOrders] = useState([
    {
      id: 'PO-DRAFT-01',
      nomorPo: 'PO-LW-2026-089', // Generated upon 1st SJ
      customer: 'PT LION WINGS',
      customerAddress: 'Kawasan Industri Gresik (KIG) Blok C-12, Manyar, Gresik',
      materialId: 'mat-8',
      materialName: 'SIRTU',
      materialCategory: 'Curah',
      pphRate: 2.0,
      satuan: 'm3',
      totalOrder: 500,
      terkirim: 161.43,
      hargaJual: 67233,
      hargaBeli: 50765,
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
      materialId: 'mat-4',
      materialName: 'LIMESTONE',
      materialCategory: 'Padat',
      pphRate: 2.65,
      satuan: 'm3',
      totalOrder: 1200,
      terkirim: 0,
      hargaJual: 42857,
      hargaBeli: 38991,
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
      materialId: 'mat-6',
      materialName: 'PASIR',
      materialCategory: 'Curah',
      pphRate: 2.0,
      satuan: 'rit',
      totalOrder: 150,
      terkirim: 45,
      hargaJual: 50000,
      hargaBeli: 40000,
      tanggal: '2026-11-04',
      top: 'Cash / Tunai',
      status: 'APPROVED',
      createdBy: 'Admin Gresik',
      approvedBy: 'David Rusiah (Direktur)',
      approvedAt: '2026-11-04 14:10',
      rejectionReason: null,
    },
  ]);

  // Surat Jalan (Good Issue) list
  const [suratJalanList, setSuratJalanList] = useState([
    {
      id: 'SJ-202611-0089',
      nomorSj: '29678',
      poNumber: 'PO-LW-2026-089',
      customer: 'PT LION WINGS',
      material: 'SIRTU',
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
      material: 'SIRTU',
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

  // BKK (Cash Out) transactions strictly matching Screenshot 2
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

  // ==========================================
  // 2. DATA MASTER (FAITHFUL TO SCREENSHOTS)
  // ==========================================

  // Data Material per Screenshot e79f026e
  const [materials, setMaterials] = useState([
    {
      id: 'mat-1',
      name: 'BASE COURSE',
      beli: 40000.0,
      jual: 50000.0,
      coa: '110-10',
      coaPiutang: '112-01',
      coaPendapatan: '410-01',
      category: 'Padat',
      pphRate: 2.65,
      satuan: 'm3',
      aktif: true,
    },
    {
      id: 'mat-2',
      name: 'BATU BOULDER',
      beli: 32580.0,
      jual: 45800.0,
      coa: '110-20',
      coaPiutang: '112-02',
      coaPendapatan: '410-02',
      category: 'Padat',
      pphRate: 2.65,
      satuan: 'm3',
      aktif: true,
    },
    {
      id: 'mat-3',
      name: 'JASA ANGKUT',
      beli: 20408.0,
      jual: 20408.0,
      coa: '110-30',
      coaPiutang: '112-03',
      coaPendapatan: '410-03',
      category: 'Jasa',
      pphRate: 2.0,
      satuan: 'rit',
      aktif: false,
    },
    {
      id: 'mat-4',
      name: 'LIMESTONE',
      beli: 38991.0,
      jual: 42857.0,
      coa: '110-40',
      coaPiutang: '112-04',
      coaPendapatan: '410-04',
      category: 'Padat',
      pphRate: 2.65,
      satuan: 'm3',
      aktif: true,
    },
    {
      id: 'mat-5',
      name: 'PARAS',
      beli: 41000.0,
      jual: 45000.0,
      coa: '110-50',
      coaPiutang: '112-05',
      coaPendapatan: '410-05',
      category: 'Curah',
      pphRate: 2.0,
      satuan: 'm3',
      aktif: true,
    },
    {
      id: 'mat-6',
      name: 'PASIR',
      beli: 40000.0,
      jual: 50000.0,
      coa: '110-60',
      coaPiutang: '112-06',
      coaPendapatan: '410-06',
      category: 'Curah',
      pphRate: 2.0,
      satuan: 'm3',
      aktif: true,
    },
    {
      id: 'mat-7',
      name: 'PAVING STONE',
      beli: 71000.0,
      jual: 76000.0,
      coa: '110-70',
      coaPiutang: '112-07',
      coaPendapatan: '410-07',
      category: 'Padat',
      pphRate: 2.65,
      satuan: 'm2',
      aktif: true,
    },
    {
      id: 'mat-8',
      name: 'SIRTU',
      beli: 50765.0,
      jual: 67233.0,
      coa: '110-80',
      coaPiutang: '112-08',
      coaPendapatan: '410-08',
      category: 'Curah',
      pphRate: 2.0,
      satuan: 'm3',
      aktif: true,
    },
    {
      id: 'mat-9',
      name: 'SIRTU AYAK',
      beli: 25000.0,
      jual: 37000.0,
      coa: '110-85',
      coaPiutang: '112-09',
      coaPendapatan: '410-09',
      category: 'Curah',
      pphRate: 2.0,
      satuan: 'm3',
      aktif: true,
    },
  ]);

  // Data Supplier per Screenshot 38e7625c
  const [suppliers, setSuppliers] = useState([
    {
      id: 'sup-1',
      name: 'UKHY DIAN',
      idProgram: 'SUP-001',
      penerima: 'UKHY DIAN',
      telepon: '0812-3456-7890',
      pkp: true,
      bank: 'BCA',
      noRekening: '6150832452',
      rekeningAtasNama: 'UKHY DIAN',
      aktif: true,
    },
    {
      id: 'sup-2',
      name: 'PT. TENANG JAYA SEJAHTERA',
      idProgram: 'SUP-002',
      penerima: 'ARIF NURCAHYADI',
      telepon: '0811-9876-5432',
      pkp: true,
      bank: 'BCA',
      noRekening: '0503800800',
      rekeningAtasNama: 'ARIF NURCAHYADI',
      aktif: true,
    },
    {
      id: 'sup-3',
      name: 'PT SOYO APIK',
      idProgram: 'SUP-003',
      penerima: 'PT SOYO APIK',
      telepon: '0821-3344-5566',
      pkp: true,
      bank: 'BCA',
      noRekening: '829-189-1888',
      rekeningAtasNama: 'PT SOYO APIK',
      aktif: true,
    },
    {
      id: 'sup-4',
      name: 'PAK TEGUH (BARU)',
      idProgram: 'SUP-004',
      penerima: 'EKO WAHYUDI PRAYOGO',
      telepon: '0857-1122-3344',
      pkp: false,
      bank: 'BCA',
      noRekening: '7415250533',
      rekeningAtasNama: 'EKO WAHYUDI PRAYOGO',
      aktif: true,
    },
    {
      id: 'sup-5',
      name: 'PAK TEGUH',
      idProgram: 'SUP-005',
      penerima: 'EKO WAHYUDI PRAYOGO',
      telepon: '0857-1122-3345',
      pkp: false,
      bank: 'BCA',
      noRekening: '7415094256',
      rekeningAtasNama: 'EKO WAHYUDI PRAYOGO',
      aktif: true,
    },
    {
      id: 'sup-6',
      name: 'PAK KAMBYA',
      idProgram: 'SUP-006',
      penerima: 'KAMBYA',
      telepon: '0813-9988-7766',
      pkp: false,
      bank: 'BCA',
      noRekening: '4110777715',
      rekeningAtasNama: 'KAMBYA',
      aktif: true,
    },
    {
      id: 'sup-7',
      name: 'PAK HALIDI',
      idProgram: 'SUP-007',
      penerima: 'MOCHAMMAD HALIDI ARSYAD',
      telepon: '0812-8877-6655',
      pkp: false,
      bank: 'BCA',
      noRekening: '7415281200',
      rekeningAtasNama: 'MOCHAMMAD HALIDI ARSYAD',
      aktif: true,
    },
    {
      id: 'sup-8',
      name: 'ADITA JUSTIA SAPUTRA',
      idProgram: 'SUP-008',
      penerima: 'ADITA JUSTIA SAPUTRA',
      telepon: '0822-6655-4433',
      pkp: false,
      bank: 'BCA',
      noRekening: '7415428618',
      rekeningAtasNama: 'ADITA JUSTIA SAPUTRA',
      aktif: true,
    },
  ]);

  // Data Customer per Screenshot cbe2d441 & e339cc44
  const [customers, setCustomers] = useState([
    {
      id: 'cust-1',
      kodePrefix: 'LW 655',
      name: 'PT LION WINGS',
      jenisBadanUsaha: 'PT',
      alias: 'PT LION WINGS',
      alamat: 'KIG Blok C-12, Manyar, Gresik',
      npwp: '01.234.567.8-612.000',
      telepon: '031-3981122',
      aktif: true,
    },
    {
      id: 'cust-2',
      kodePrefix: 'SI 901',
      name: 'PT SEMEN INDONESIA',
      jenisBadanUsaha: 'PT',
      alias: 'PT SEMEN INDONESIA (PERSERO) TBK',
      alamat: 'Jl. Veteran, Gresik 61122',
      npwp: '01.001.605.3-093.000',
      telepon: '031-3981732',
      aktif: true,
    },
    {
      id: 'cust-3',
      kodePrefix: 'PG 102',
      name: 'PT PETROKIMIA GRESIK',
      jenisBadanUsaha: 'PT',
      alias: 'PT PETROKIMIA GRESIK',
      alamat: 'Jl. Jenderal Ahmad Yani, Gresik 61119',
      npwp: '01.000.013.3-051.000',
      telepon: '031-3977001',
      aktif: true,
    },
    {
      id: 'cust-4',
      kodePrefix: 'ADM 044',
      name: 'PT ADHI KARYA',
      jenisBadanUsaha: 'PT',
      alias: 'PT ADHI KARYA (PERSERO) TBK',
      alamat: 'Proyek Smelter Freeport Manyar, Gresik',
      npwp: '01.001.611.1-093.000',
      telepon: '031-7992000',
      aktif: true,
    },
    {
      id: 'cust-5',
      kodePrefix: 'AS 734',
      name: 'PT ANEKA SISTEM',
      jenisBadanUsaha: 'PT',
      alias: 'PT ANEKA SISTEM ENERGI',
      alamat: 'Jl. Raya Manyar Km. 11, Gresik',
      npwp: '02.345.678.9-612.000',
      telepon: '031-3958800',
      aktif: true,
    },
    {
      id: 'cust-6',
      kodePrefix: 'BAS 724',
      name: 'PT BERKAH ALAM SEMESTA',
      jenisBadanUsaha: 'PT',
      alias: 'PT BERKAH ALAM SEMESTA',
      alamat: 'Gresik Hub, Jawa Timur',
      npwp: '03.456.789.0-612.000',
      telepon: '031-3980000',
      aktif: true,
    },
  ]);

  // Data Armada Dump Truck per Screenshot bf8de022 & d26f8f80
  const [armadaList, setArmadaList] = useState([
    {
      id: 'arm-1',
      nopol: 'W 9821 UB',
      panjangCm: 650,
      lebarCm: 250,
      tinggiCm: 200,
      kapasitas: 32.5,
      merk: 'Hino Dutro 130 HD',
      vin: 'MHM123456789',
      mesin: 'W04D-TN',
      tahun: 2021,
      aktif: true,
    },
    {
      id: 'arm-2',
      nopol: 'W 8812 UA',
      panjangCm: 620,
      lebarCm: 240,
      tinggiCm: 190,
      kapasitas: 28.27,
      merk: 'Isuzu Giga FVR',
      vin: 'ISZ987654321',
      mesin: '6HK1-TCS',
      tahun: 2022,
      aktif: true,
    },
    {
      id: 'arm-3',
      nopol: 'L 9402 UK',
      panjangCm: 640,
      lebarCm: 245,
      tinggiCm: 195,
      kapasitas: 30.58,
      merk: 'Mitsubishi Fuso Fighter',
      vin: 'MTS554433221',
      mesin: '6M60',
      tahun: 2020,
      aktif: true,
    },
    {
      id: 'arm-4',
      nopol: 'W 9041 ZN',
      panjangCm: 650,
      lebarCm: 250,
      tinggiCm: 210,
      kapasitas: 34.13,
      merk: 'Hino Ranger FL',
      vin: 'HIN778899001',
      mesin: 'J08E-WD',
      tahun: 2023,
      aktif: true,
    },
    {
      id: 'arm-5',
      nopol: 'B 9110 TDA',
      panjangCm: 600,
      lebarCm: 230,
      tinggiCm: 180,
      kapasitas: 24.84,
      merk: 'Toyota Dyna 130HT',
      vin: 'TYT443322110',
      mesin: 'W04D-TM',
      tahun: 2019,
      aktif: true,
    },
    {
      id: 'arm-6',
      nopol: 'N 8820 UF',
      panjangCm: 660,
      lebarCm: 250,
      tinggiCm: 200,
      kapasitas: 33.0,
      merk: 'UD Trucks Quester',
      vin: 'UDT667788990',
      mesin: 'GH8E',
      tahun: 2022,
      aktif: true,
    },
    {
      id: 'arm-7',
      nopol: '21606',
      panjangCm: 650,
      lebarCm: 240,
      tinggiCm: 190,
      kapasitas: 29.64,
      merk: 'Internal Index 24',
      vin: 'INT112233445',
      mesin: 'IND-24-01',
      tahun: 2020,
      aktif: true,
    },
  ]);

  // Data Bank per Screenshot 6584ca21 & ef502847
  const [banks, setBanks] = useState([
    {
      id: 'bank-1',
      namaBank: 'Bank Central Asia',
      namaAlias: 'BCA - 014',
      kodeSwift: 'CENAIDJA',
      kodeBank: '014',
      aktif: true,
    },
    {
      id: 'bank-2',
      namaBank: 'Bank Mandiri',
      namaAlias: 'BMRII - 008',
      kodeSwift: 'BMRIIDJA',
      kodeBank: '008',
      aktif: true,
    },
    {
      id: 'bank-3',
      namaBank: 'Bank Rakyat Indonesia',
      namaAlias: 'BRI - 002',
      kodeSwift: 'BRINIDJA',
      kodeBank: '002',
      aktif: true,
    },
    {
      id: 'bank-4',
      namaBank: 'Bank Negara Indonesia',
      namaAlias: 'BNI - 009',
      kodeSwift: 'BNINIDJA',
      kodeBank: '009',
      aktif: true,
    },
  ]);

  // Data Rekening Bank PT BAS per Screenshot 5b565e7a
  const [bankAccounts, setBankAccounts] = useState([
    {
      id: 'acc-1',
      bank: 'BCA',
      jenisRekening: 'Giro Bisnis',
      nomorRekening: '0188920199',
      rekeningAtasNama: 'PT Berkah Alam Semesta',
      namaAlias: 'BCA Operasional Gresik',
      aktif: true,
    },
    {
      id: 'acc-2',
      bank: 'Bank Mandiri',
      jenisRekening: 'Giro Utama',
      nomorRekening: '1420019283741',
      rekeningAtasNama: 'PT Berkah Alam Semesta',
      namaAlias: 'Mandiri Penerimaan Proyek',
      aktif: true,
    },
    {
      id: 'acc-3',
      bank: 'Bank Central Asia',
      jenisRekening: 'Tabungan Escrow',
      nomorRekening: '0503800800',
      rekeningAtasNama: 'PT Berkah Alam Semesta',
      namaAlias: 'BCA Cadangan Kas Supplier',
      aktif: true,
    },
  ]);

  // Data Pengguna (Users)
  const [usersList, setUsersList] = useState([
    { id: 'usr-1', name: 'David Rusiah', role: 'Super Admin', email: 'superadmin@ptbas.co.id', phone: '0811-3001-992', aktif: true },
    { id: 'usr-2', name: 'Rudi Hartono', role: 'Admin', email: 'admin@ptbas.co.id', phone: '0813-8899-112', aktif: true },
  ]);

  // ==========================================
  // 3. ACTION DISPATCHERS
  // ==========================================

  // Pre Order Actions
  const createPreOrder = (data) => {
    const id = `PO-DRAFT-${String(preOrders.length + 1).padStart(2, '0')}`;
    const newPo = {
      ...data,
      id,
      nomorPo: null, // Generated on 1st SJ
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

  // Surat Jalan Actions
  const createSuratJalan = (sjData) => {
    const sjId = `SJ-${new Date().toISOString().slice(0, 7).replace('-', '')}-${String(
      suratJalanList.length + 1
    ).padStart(4, '0')}`;

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

    // Update PO delivered volume & auto-assign PO number if first delivery
    setPreOrders((prev) =>
      prev.map((po) => {
        if (po.nomorPo === sjData.poNumber || po.customer === sjData.customer) {
          const generatedPoNum =
            po.nomorPo ||
            `PO-${sjData.customer.replace(/[^A-Z]/g, '').slice(0, 2)}-2026-${Math.floor(
              100 + Math.random() * 900
            )}`;
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

  // BKK Cash Out Actions
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
    addToast(`${bkkIds.length} BKK berhasil dicatat LUNAS! Hutang supplier diperbarui.`, 'success');
  };

  // ------------------------------------------
  // MASTER DATA CRUD HELPERS
  // ------------------------------------------

  // Material CRUD
  const toggleMaterialStatus = (id) => {
    setMaterials((prev) =>
      prev.map((m) => (m.id === id ? { ...m, aktif: !m.aktif } : m))
    );
    addToast('Status material berhasil diubah', 'info');
  };

  const addMaterial = (newMat) => {
    const item = {
      ...newMat,
      id: `mat-${Date.now()}`,
      aktif: true,
      pphRate: newMat.category === 'Padat' ? 2.65 : 2.0,
      satuan: newMat.satuan || 'm3',
    };
    setMaterials((prev) => [...prev, item]);
    addToast(`Material "${item.name}" berhasil ditambahkan!`, 'success');
  };

  const deleteMaterial = (id) => {
    setMaterials((prev) => prev.filter((m) => m.id !== id));
    addToast('Material berhasil dihapus', 'info');
  };

  // Supplier CRUD
  const toggleSupplierStatus = (id) => {
    setSuppliers((prev) =>
      prev.map((s) => (s.id === id ? { ...s, aktif: !s.aktif } : s))
    );
    addToast('Status supplier berhasil diubah', 'info');
  };

  const addSupplier = (newSup) => {
    const item = {
      ...newSup,
      id: `sup-${Date.now()}`,
      aktif: true,
    };
    setSuppliers((prev) => [...prev, item]);
    addToast(`Supplier "${item.name}" berhasil disimpan!`, 'success');
  };

  const deleteSupplier = (id) => {
    setSuppliers((prev) => prev.filter((s) => s.id !== id));
    addToast('Supplier berhasil dihapus', 'info');
  };

  // Customer CRUD
  const toggleCustomerStatus = (id) => {
    setCustomers((prev) =>
      prev.map((c) => (c.id === id ? { ...c, aktif: !c.aktif } : c))
    );
    addToast('Status customer berhasil diubah', 'info');
  };

  const addCustomer = (newCust) => {
    const item = {
      ...newCust,
      id: `cust-${Date.now()}`,
      aktif: true,
      alias: newCust.alias || `${newCust.jenisBadanUsaha} ${newCust.name}`,
    };
    setCustomers((prev) => [...prev, item]);
    addToast(`Customer "${item.name}" berhasil disimpan!`, 'success');
  };

  const deleteCustomer = (id) => {
    setCustomers((prev) => prev.filter((c) => c.id !== id));
    addToast('Customer berhasil dihapus', 'info');
  };

  // Armada CRUD
  const toggleArmadaStatus = (id) => {
    setArmadaList((prev) =>
      prev.map((a) => (a.id === id ? { ...a, aktif: !a.aktif } : a))
    );
    addToast('Status armada berhasil diubah', 'info');
  };

  const addArmada = (newArmada) => {
    const p = Number(newArmada.panjangCm) || 0;
    const l = Number(newArmada.lebarCm) || 0;
    const t = Number(newArmada.tinggiCm) || 0;
    const kapasitas = Number(((p * l * t) / 1000000).toFixed(2));

    const item = {
      ...newArmada,
      id: `arm-${Date.now()}`,
      kapasitas,
      aktif: newArmada.aktif !== undefined ? newArmada.aktif : true,
    };
    setArmadaList((prev) => [...prev, item]);
    addToast(`Armada "${item.nopol}" (${kapasitas} m³) berhasil ditambahkan!`, 'success');
  };

  const deleteArmada = (id) => {
    setArmadaList((prev) => prev.filter((a) => a.id !== id));
    addToast('Armada berhasil dihapus', 'info');
  };

  // Bank CRUD
  const toggleBankStatus = (id) => {
    setBanks((prev) =>
      prev.map((b) => (b.id === id ? { ...b, aktif: !b.aktif } : b))
    );
    addToast('Status bank berhasil diubah', 'info');
  };

  const addBank = (newBank) => {
    const item = {
      ...newBank,
      id: `bank-${Date.now()}`,
      aktif: true,
    };
    setBanks((prev) => [...prev, item]);
    addToast(`Bank "${item.namaBank}" berhasil ditambahkan!`, 'success');
  };

  const deleteBank = (id) => {
    setBanks((prev) => prev.filter((b) => b.id !== id));
    addToast('Bank berhasil dihapus', 'info');
  };

  // Bank Account CRUD
  const toggleBankAccountStatus = (id) => {
    setBankAccounts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, aktif: !a.aktif } : a))
    );
    addToast('Status rekening berhasil diubah', 'info');
  };

  const addBankAccount = (newAcc) => {
    const item = {
      ...newAcc,
      id: `acc-${Date.now()}`,
      aktif: true,
    };
    setBankAccounts((prev) => [...prev, item]);
    addToast(`Rekening "${item.nomorRekening}" berhasil ditambahkan!`, 'success');
  };

  const deleteBankAccount = (id) => {
    setBankAccounts((prev) => prev.filter((a) => a.id !== id));
    addToast('Rekening bank berhasil dihapus', 'info');
  };

  return (
    <DataContext.Provider
      value={{
        // Operational Transactions
        preOrders,
        suratJalanList,
        bkkList,
        createPreOrder,
        approvePreOrder,
        rejectPreOrder,
        createSuratJalan,
        markBkkPaid,

        // Master Data States
        materials,
        suppliers,
        customers,
        armadaList,
        banks,
        bankAccounts,
        usersList,

        // Master Data Actions
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
