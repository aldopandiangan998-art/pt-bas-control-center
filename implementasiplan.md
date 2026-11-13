# Implementation Plan: Aplikasi PT BAS Control Center

**Alur Harian Operasional:** Pre Order → Approve → Surat Jalan → Rekapan → BKK → Invoice → Pembayaran Customer

**Status Dokumen:** Terintegrasi & Disesuaikan dengan Kode Sumber `pt-bas-control-center`  
**Terakhir Diperbarui:** 13 November 2026 (Sinkronisasi Penuh Hasil Konfirmasi PT BAS & Implementasi Frontend React)

---

## 0. Ringkasan Eksekutif & Pemetaan Project

1. **Model Bisnis:** Customer → PT BAS → Supplier. PT BAS mengambil material tambang/galian dari supplier lalu mengirimkannya ke proyek customer. Satuan material adalah **m3, ton, atau rit**. Operasional saat ini terpusat di **Gresik, Jawa Timur**.
2. **Urutan Kerja Harian:** Surat Jalan (`/surat-jalan`) → Rekapan (`/rekapan`) → BKK (`/bkk`) → Invoice (`/invoices`) → Pembayaran Customer & Laporan (`/laporan`).
3. **Kirim Bertahap:** Satu PO dikirim per hari/ritase, sehingga satu PO memiliki banyak surat jalan. **Nomor PO** resmi terbit saat surat jalan pertama dibuat, lalu diikatkan terus ke seluruh surat jalan berikutnya pada PO yang sama.
4. **"Jurnal GI" di Program Sebenarnya Adalah Rekapan**, bukan jurnal akuntansi pembukuan (tanpa akun debit/kredit).
5. **Rekapan:** Dibuat per PO, per tanggal kirim, dan dipisah tegas antara **PPN** dan **non-PPN** untuk keperluan pembayaran vendor supplier. Invoice ke customer tetap menggabungkan keduanya.
6. **PO Menyimpan Satu Jenis Material, Satu Harga Jual, dan Satu Harga Beli.** Harga beli sama untuk supplier PPN dan non-PPN. Bedanya, supplier PPN menagih ditambah PPN.
7. **Invoice:** Satu invoice untuk satu PO. PPN 11% untuk semua invoice. **PPH ditentukan oleh jenis material** (2% untuk material curah atau 2,65% untuk material padat & cut/fill). PPH dikenakan atas seluruh komponen jasa dan **selalu mengurangi jumlah bersih yang dibayar customer**.
8. **CO Diganti Nama Menjadi BKK (Bukti Kas Keluar).** Satu BKK dapat menggabungkan beberapa rekapan dari PO yang sama. BKK tidak memerlukan approval sebelum bayar, tetapi **wajib dicatat saat realisasi pembayaran** (tanggal bayar dan rekening sumber PT BAS). Koreksi lebih/kurang bayar diselesaikan pada **BKK berikutnya untuk supplier yang sama** (BKK yang sudah dibayar tidak diedit).
9. **BKK untuk Supplier PPN:** Sementara dibuat di Excel; modul rekonsiliasi tagihan supplier PPN disiapkan bertahap di aplikasi.
10. **Pencatatan Pembayaran Customer:** Dicatat sebagian atau penuh, dengan tanggal bayar dan status aging piutang.
11. **Mekanisme Edit & Hapus:** Dilakukan melalui pengajuan yang disetujui oleh Staff Pusat. Setelah disetujui, **rekapan dan invoice terkait otomatis dihitung ulang**.
12. **Toleransi Kiriman 20%:** Kiriman kumulatif diizinkan hingga 120% dari total order PO. Jika melebihi 120%, sistem memberikan peringatan (warning) tanpa memblokir input lapangan.
13. **Nomor Surat Jalan Unik per PO:** Nomor surat jalan tidak boleh kembar dalam satu PO yang sama (sistem memvalidasi dan menolak duplikasi). Antar PO berbeda diperbolehkan sama. Foto fisik surat jalan disimpan sebagai arsip bukti audit.
14. **Perubahan Harga:** Jika harga berubah, PO lama ditutup dan PO baru dibuat serta diajukan approval ulang ke Superadmin sebelum surat jalan baru dapat diinput.
15. **Struktur Akun & Role:**
    - `Admin Gresik`: Input operasional harian (PO, SJ, Rekapan, BKK).
    - `Staff Pusat`: Review operasional dan persetujuan edit/hapus dokumen.
    - `Superadmin (Direktur & Kadiv Pusat)`: Hak approval Pre Order, monitoring seluruh data, dan administrasi sistem.
16. **Data Lama Dilanjutkan:** Seluruh riwayat transaksi berjalan tetap dipertahankan dan dimigrasikan ke skema baru.
17. **Format Penomoran Standar Dokumen:** `JENIS-YYYYMM-NNNNN` (Contoh: `INV-202611-00001`, `REK-202611-00001`, `BKK-202611-00001`).
18. **Tanpa Retur:** Material tambang tidak pernah mengalami retur fisik.
19. **3 Laporan Prioritas Utama:**
    - Rekapan Belum Di-Invoice (Unbilled Dispatch).
    - Piutang Customer / AR (Invoice Belum Dibayar).
    - Hutang Vendor / AP (BKK Belum Dibayar).
20. **Approval Pre Order Eksklusif Superadmin:** Hanya Direktur dan Kadiv Pusat yang memiliki wewenang menyetujui Pre Order.
21. **PO Terbit Berdasarkan Realitas Kiriman:** Tidak ada fitur pembatalan PO; PO yang sudah berjalan hanya dapat ditutup (`SELESAI_KIRIM` atau `DITUTUP`).

---

## 1. Alur Bisnis Sistem

```
[Customer Memesan Material (Pre Order / RO)]
 ├── Satu jenis material, satuan (m3 / ton / rit), total order
 └── Harga jual (customer) & harga beli (supplier)
        │
        ▼
[Approval oleh Superadmin (Direktur / Kadiv Pusat)]
 ├── Status: APPROVED ──► Lanjut ke Surat Jalan
 └── Status: REJECTED ──► Revisi & ajukan ulang
        │
        ▼
[Surat Jalan (Goods Issue) - Kiriman Harian]
 ├── Nomor PO resmi terbit pada surat jalan pertama
 ├── Nomor SJ wajib unik dalam satu PO
 ├── Penanda PPN (awalan "PPN", misal PPN29678) atau non-PPN
 └── Unggah foto fisik bukti timbangan/kirim
        │
        ▼
[Rekapan (Jurnal GI)]
 ├── 1 PO, 1 Tanggal Kirim, 1 Jenis Pajak (PPN vs Non-PPN terpisah)
 └── Rekap total ritase, volume m3/ton, nominal beli & jual
        │
        ▼
[BKK ke Supplier (Cash Out)]
 ├── Gabung 1 atau beberapa rekapan dari PO yang sama
 ├── Tanpa approval, langsung dicatat bayar (tanggal + rekening sumber)
 ├── Rekapan Non-PPN: Langsung dibuat di aplikasi
 └── Rekapan PPN: Sementara via Excel / Modul Pencocokan Tagihan
        │
        ▼
[Invoice Penjualan ke Customer]
 ├── 1 Invoice untuk 1 PO (gabung rekapan PPN + Non-PPN s/d tanggal cut-off)
 ├── PPN 11% otomatis dari total jasa/material
 └── PPH 2% (Curah) / 2.65% (Padat) mengurangi total bayar customer
        │
        ▼
[Pembayaran Customer & Monitoring Piutang]
 └── Dicatat bertahap/lunas pada Pusat Laporan & Kartu Piutang
```

---

## 1a. Matriks Role & Hak Akses

| Fungsi / Aksi | Admin Gresik | Staff Pusat | Superadmin (Direktur & Kadiv) | Implementasi di Kode |
|---|:---:|:---:|:---:|---|
| Akses Dashboard Operasional | Ya | Ya | Ya | `src/pages/Dashboard/DashboardPage.jsx` |
| Buat Pre Order (RO) | Ya | Ya | Ya | `src/pages/PreOrder/PreOrderPage.jsx` |
| **Approve / Tolak Pre Order** | **Tidak** | **Tidak** | **Ya** | `approvePreOrder`, `rejectPreOrder` di `DataContext.jsx` |
| Input Surat Jalan (GI) & Hitung Kubikasi | Ya | Ya | Ya | `src/pages/SuratJalan/SuratJalanPage.jsx` |
| Buat Rekapan Kiriman Harian | Ya | Ya | Ya | `src/pages/Rekapan/RekapanPage.jsx` |
| Buat BKK & Catat Pembayaran Kas Keluar | Ya | Ya | Ya | `src/pages/Bkk/BkkPage.jsx` |
| Terbitkan Invoice Penjualan & Faktur | Ya | Ya | Ya | `src/pages/Invoice/InvoicePage.jsx` |
| Catat Pembayaran Piutang Customer | Ya | Ya | Ya | `src/pages/Laporan/LaporanPage.jsx` |
| **Persetujuan Edit & Hapus Dokumen** | Tidak | **Ya** | **Ya** | `src/context/AuthContext.jsx` (Permission Check) |
| Kelola Data Master (Material, Armada, Bank, Supplier, Customer) | Ya | Ya | Ya | `src/pages/MasterData/MasterDataPage.jsx` |

---

## 2. Aturan Bisnis Utama (37 Butir Ketentuan PT BAS)

### PO dan Surat Jalan
1. **Pre Order Tanpa No. PO:** Saat dibuat berstatus draft/menunggu approval dengan ID referensi RO (`RO-YYYY-NNNN`).
2. **Approval Wajib Superadmin:** Surat jalan hanya dapat dibuat setelah PO berstatus `APPROVED`.
3. **Karakteristik PO:** 1 jenis material, 1 satuan (`m3`, `ton`, `rit`), volume total order, harga jual, dan harga beli tetap.
4. **Perubahan Harga:** PO lama ditutup manual; dibuatkan PO baru dengan nomor RO baru yang harus di-approve ulang.
5. **Penerbitan No. PO:** Terbit otomatis pada surat jalan pertama dan mengikat seluruh surat jalan selanjutnya.
6. **Kiriman Bertahap:** 1 PO dapat memiliki puluhan surat jalan harian.
7. **Batas Toleransi 20%:** Kiriman kumulatif boleh mencapai 120%. Melebihi 120% memicu alert visual tanpa memblokir penyimpanan.
8. **Penanda PPN Surat Jalan:** Surat jalan PPN diberi prefix `PPN` di depan nomor (contoh: `PPN29678`).
9. **Pemisahan Ritase Harian:** Kiriman PPN dan non-PPN pada hari yang sama diinput sebagai 2 berkas surat jalan terpisah.
10. **Keunikan No. Surat Jalan:** Sistem memvalidasi agar tidak ada nomor surat jalan kembar dalam 1 PO yang sama.
11. **Supplier Ditentukan di BKK:** Surat jalan lapangan tidak mengunci supplier; supplier dipilih saat pencairan BKK.
12. **Foto Fisik Surat Jalan:** Diunggah sebagai arsip bukti timbangan tambang.
13. **Tanpa Retur Material:** Tidak ada alur pengembalian material tambang.
14. **Kriteria Selesai PO:** Ditandai `SELESAI_KIRIM` saat volume terpenuhi atau ditutup manual, dan `SELESAI` saat seluruh tagihan lunas.
15. **Tanpa Pembatalan PO:** PO yang berjalan tidak dibatalkan, melainkan ditutup dengan catatan alasan penutupan.

### Rekapan (Jurnal GI)
16. **Isolasi Rekapan:** Dibuat per PO, per tanggal kirim, dan per status pajak (PPN vs Non-PPN tidak boleh bercampur).
17. **Parameter Rekapan:** Menyimpan total ritase, total volume kubikasi/tonase, nominal beli (vendor), dan nominal jual (customer).
18. **Proteksi Integritas Hapus:** Surat jalan yang sudah masuk rekapan terkunci. Rekapan yang sudah memiliki BKK atau Invoice tidak dapat dihapus sebelum BKK dan Invoice-nya dihapus terlebih dahulu.

### BKK (Bukti Kas Keluar)
19. **Konsolidasi Rekapan:** 1 BKK dapat menggabungkan beberapa rekapan non-PPN dari PO yang sama.
20. **Pemilihan Supplier:** Supplier dipilih dari master data supplier saat pembuatan BKK.
21. **Nominal BKK:** Mengacu pada volume x harga beli PO dan dapat disesuaikan pada saat input.
22. **Tanpa Approval Kas Keluar:** BKK langsung dieksekusi pembayaran dengan mencatat **tanggal bayar** dan **rekening sumber bank PT BAS**.
23. **Penyelesaian Selisih:** BKK yang sudah dibayar tidak diedit. Kelebihan/kekurangan bayar dicatat di kolom penyesuaian pada BKK berikutnya untuk supplier yang sama.

### Invoice & Ketentuan Perpajakan
24. **Integritas PO:** 1 invoice khusus untuk 1 PO, tidak dapat lintas PO.
25. **Tanggal Cut-Off:** Invoice mencakup seluruh rekapan hingga tanggal cut-off yang dipilih.
26. **Penggabungan Pajak Invoice:** Rekapan PPN dan non-PPN disatukan dalam tagihan customer.
27. **Harga Acuan Invoice:** Menggunakan harga jual satuan dari PO.
28. **Tarif PPN 11%:** Dihitung dari total dasar pengenaan pajak (DPP) jasa/material.
29. **Tarif PPH Berdasarkan Kategori Material:**
    - **PPH 2,0% (Curah):** Limestone Curah, Sirtu Curah, Paras Curah, Tanah Curah, Pasir, Sirtu Ayak.
    - **PPH 2,65% (Padat & Pekerjaan):** Limestone Padat, Sirtu Padat Vibro, Sirtu Padat Doser, Cut & Fill, Base Course, Batu Boulder, Paving Stone.
30. **PPH Dikenakan Tanpa Syarat:** Seluruh invoice PT BAS mengandung unsur jasa angkut/galian sehingga PPH selalu dihitung tanpa opsi pengecualian.
31. **PPH Mengurangi Jumlah Bayar:**  
    Rumus: $\text{Total Bayar} = \text{DPP} + \text{PPN 11\%} - \text{PPH (2\% / 2.65\%)}$.  
    *Contoh:* DPP Rp10.000.000 + PPN Rp1.100.000 - PPH 2% Rp200.000 = **Rp10.900.000**.
32. **Preferensi Label PPN Customer:** Mendukung opsi cetak "PPN 11%" atau hanya "PPN" sesuai permintaan customer.
33. **Carry-Over Unbilled Volume:** Selisih volume kirim yang belum ditagih otomatis terbawa ke invoice periode berikutnya.

### Pembayaran & Audit Trail
34. **Pencatatan Piutang:** Mencatat termin bayar, nominal masuk, dan sisa saldo per faktur invoice.
35. **Persetujuan Edit Staff Pusat:** Setiap perubahan dokumen berstatus approved/terbit mewajibkan verifikasi Staff Pusat dengan riwayat audit.
36. **Kompensasi Selisih BKK:** BKK berbayar terkunci; selisih disalurkan via penyesuaian BKK berikutnya.
37. **Format Kode Dokumen:** Memakai format resmi:
    - Pre Order: `RO-YYYYMM-NNNN`
    - Surat Jalan: `[PPN]NNNNN`
    - Rekapan: `REK-YYYYMM-NNNNN`
    - BKK: `BKK-YYYYMM-NNNNN`
    - Invoice: `INV-YYYYMM-NNNNN`

---

## 3. Matriks Status Dokumen

| Dokumen | Status Alur | Keterangan Operasional |
|---|---|---|
| **Pre Order** | `DRAFT` → `MENUNGGU_APPROVAL` → `APPROVED` / `REJECTED` → `SELESAI_KIRIM` → `SELESAI` | Tidak ada status batal; PO hanya ditutup jika harga berubah |
| **Surat Jalan** | `DRAFT` → `DIREKAP` → `DITAGIH_SEBAGIAN` / `DITAGIH` | Mengunci kubikasi dan foto surat jalan |
| **Rekapan** | `OPEN` → `SUDAH_BKK` & `SUDAH_INVOICE` | Menjadi jembatan antara logistik dan penagihan |
| **BKK** | `DIBUAT` → `DIBAYAR` | Terkunci permanen setelah status dibayar terisi |
| **Invoice** | `DRAFT` → `TERBIT` → `DIBAYAR_SEBAGIAN` → `LUNAS` | Faktur komersial dan perpajakan resmi |
| **Pengajuan Edit** | `DIAJUKAN` → `DISETUJUI` / `DITOLAK` | Dikelola melalui otorisasi Staff Pusat |

---

## 4. Model Data & Implementasi State (`DataContext.jsx`)

Struktur state terpusat pada project React diimplementasikan di `src/context/DataContext.jsx`:

1. **`materials`**:  
   `{ id, name, category, pphRate, defaultUnit, beli, jual, aktif }`
2. **`customers`**:  
   `{ id, name, alias, jenisBadanUsaha, kodePrefix, npwp, telepon, alamat, tampilkanPersenPpn, aktif }`  
   *Catatan:* Opsi `jenisBadanUsaha` diselaraskan menjadi:
   - `CV-Persekutuan Komanditer`
   - `PE-Personal`
   - `PT-Perusahaan Terbatas`
   - `UD-Usaha Dagang`
3. **`suppliers`**:  
   `{ id, name, idProgram, penerima, telepon, pkp, bank, noRekening, rekeningAtasNama, aktif }`  
   *Catatan:* `noRekening` divalidasi ketat **hanya menerima angka (numeric-only)**.
4. **`armadaList`**:  
   `{ id, nopol, driver, panjangCm, lebarCm, tinggiCm, kubikasiM3, aktif }`
5. **`bankAccounts`**:  
   `{ id, bank, jenisRekening, nomorRekening, rekeningAtasNama, namaAlias, saldo }`
6. **`preOrders`**:  
   `{ id, nomorPo, tanggal, customer, customerId, materialId, materialName, materialCategory, pphRate, satuan, totalOrder, hargaJual, hargaBeli, marginPerUnit, totalMargin, toleransiPersen, status, createdBy, approvedBy, approvedAt, rejectedBy, rejectionReason }`
7. **`suratJalanList`**:  
   `{ id, preOrderId, nomorPo, nomorSj, customer, materialId, tanggal, waktu, nomorNota, nomorPolisi, isPpn, kubikasi, panjangCm, lebarCm, tinggiCm, koreksiTinggiCm, fotoSuratJalan, status }`
8. **`bkkList`**:  
   `{ id, volume, material, kodeTransaksi, jenis, perusahaan, subDetail, timestamp, periode, amount, statusBayar, tanggalBayar, rekeningSumber, penyesuaian }`

---

## 5. Matriks Status Pelaksanaan per Fase

| Fase | Deskripsi & Ruang Lingkup | Status di Project | File Terkait |
|:---:|---|:---:|---|
| **Fase 0** | Baseline project, tema industrial dark `#F4511E`, mitigasi bug & audit struktur | **SELESAI** | `src/App.jsx`, `src/index.css` |
| **Fase 1** | Pre Order (RO), Master Material dengan PPH, Approval Superadmin | **SELESAI** | `src/pages/PreOrder/PreOrderPage.jsx` |
| **Fase 2** | Surat Jalan (GI), Kalkulator Dimensi Bak Truk & Kubikasi, No. SJ unik, Foto SJ | **SELESAI** | `src/pages/SuratJalan/SuratJalanPage.jsx` |
| **Fase 3** | Rekapan Kiriman Harian (Jurnal GI), Filter PO, Tanggal & PPN | **SELESAI** | `src/pages/Rekapan/RekapanPage.jsx` |
| **Fase 4** | BKK (Cash Out), Pencatatan Tanggal Bayar & Rekening Sumber PT BAS | **SELESAI** | `src/pages/Bkk/BkkPage.jsx` |
| **Fase 5** | Invoice Penjualan, Otomasi PPN 11%, PPH 2% / 2.65% pengurang tagihan | **SELESAI** | `src/pages/Invoice/InvoicePage.jsx` |
| **Fase 6** | Pencatatan Pembayaran Customer & Aging Piutang | **SELESAI** | `src/pages/Laporan/LaporanPage.jsx` |
| **Fase 7** | Alur Pengajuan Edit/Hapus & Otorisasi Staff Pusat | **DALAM PENGEMBANGAN** | `src/context/AuthContext.jsx` |
| **Fase 8** | Pencocokan Tagihan Vendor Supplier PPN | **TAHAP BERIKUTNYA** | Modul Ekstensi BKK |
| **Fase 9** | 3 Laporan Utama (Rekapan Belum Invoice, Piutang AR, Hutang AP) & Export | **SELESAI** | `src/pages/Laporan/LaporanPage.jsx` |

---

## 5a. Analisis & Pencegahan Masalah Aplikasi

1. **Pencegahan Sesi Keluar Sendiri:**  
   Penyebab utama aplikasi web keluar sendiri adalah state auth yang hilang saat refresh atau token timeout tanpa refresh otomatis. Di project ini, `AuthContext` dikelola dengan penyimpanan lokal persisten (`localStorage`) sehingga sesi pengguna tetap stabil saat berpindah halaman.
2. **Penanganan Detail PO yang Belum Memiliki No. PO:**  
   Di `PreOrderPage.jsx`, penanganan nilai `null` / `undefined` pada `nomorPo` telah diantisipasi dengan fallback kode referensi RO (`RO-YYYY-NNNN`) dan badge status `MENUNGGU APPROVAL`.
3. **Pencegahan Duplikasi Nomor Surat Jalan:**  
   Fungsi submit surat jalan memeriksa keberadaan `nomorSj` pada `suratJalanList` dengan `preOrderId` yang sama sebelum menyimpan data baru.

---

## 5b. Teknologi & Arsitektur Terpasang

- **Frontend Core:** React 18 (Vite 6 build system) dengan JavaScript modern (ESNext).
- **Styling & UI Components:** Tailwind CSS, DaisyUI, Lucide React (ikonografi resmi), Motion/React untuk transisi halaman yang halus.
- **Warna Identitas Operasional:** Safety Orange (`#F4511E`) sebagai Color Primary dipadukan dengan Console Dark Slate (`#0B0F17` / `#0E1520`).
- **State Management:** Centralized Context API (`DataContext`, `AuthContext`, `ToastContext`) yang reaktif, modular, dan siap dihubungkan ke REST API backend.
- **Validasi Data Lapangan:** Numeric input protection pada rekening bank supplier, kalkulator dimensi bak dump truck otomatis, dan proteksi perhitungan pajak 100% konsisten.

---

## 6. Checklist Verifikasi Keselarasan Kode

- [x] Pre Order tidak dapat di-approve oleh Admin; tombol approval hanya muncul untuk Superadmin.
- [x] Surat jalan menghitung kubikasi riil dari panjang, lebar, tinggi, dan koreksi tinggi dalam satuan cm.
- [x] Rekapan memisahkan transaksi PPN dan non-PPN secara tegas.
- [x] BKK mencatat tanggal bayar dan pilihan rekening bank sumber PT BAS secara akurat.
- [x] Perhitungan invoice menghitung PPN 11% dan PPH (2% curah / 2.65% padat) yang mengurangi total bersih tagihan.
- [x] Modal Customer menggunakan opsi Jenis Badan Usaha: `CV-Persekutuan Komanditer`, `PE-Personal`, `PT-Perusahaan Terbatas`, `UD-Usaha Dagang`.
- [x] Input Nomor Rekening Supplier memvalidasi hanya karakter numerik (angka 0-9).
- [x] Halaman Laporan menyajikan 3 pilar: Rekapan Belum Di-Invoice, Piutang Customer (AR), dan Hutang Supplier (AP).

