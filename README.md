# PT BAS Control Center

Sistem Manajemen Kontrol & Operasional Rantai Pasok, Material Tambang/Konstruksi, dan Armada Truk untuk **PT Berkah Alam Semesta (PT BAS)** - Gresik.

## 📋 Alur Operasional Harian
```
Pre Order ──► Approve (Superadmin) ──► Surat Jalan (GI) + Foto 
                                              │
Pembayaran Customer ◄── Invoice ◄── Rekapan (Jurnal GI) ──► BKK ke Supplier
```

1. **Pre Order (PO)**: Customer memesan material (Limestone, Sirtu, Paras, Tanah) dengan satuan ($m^3$, ton, rit), harga jual, dan harga beli. Wajib di-approve oleh Superadmin (Direktur).
2. **Surat Jalan (Good Issue / GI)**: Pengiriman harian per armada, dilengkapi kalkulator kubikasi dimensi bak truk ($P \times L \times T$) dan koreksi tinggi ($K$) dengan stepper $(-)(+)$. Foto surat jalan disimpan sebagai bukti fisik.
3. **Rekapan (Jurnal GI)**: Rekap kiriman per PO, per tanggal kirim, dipisah tegas antara PPN dan Non-PPN.
4. **BKK (Bukti Kas Keluar / Cash Out)**: Kas keluar ke supplier dari rekapan PO yang sama. Mencatat tanggal bayar dan rekening sumber PT BAS.
5. **Invoice Customer**: 1 Invoice per PO menggabungkan rekapan PPN & Non-PPN. Menghitung PPN 11% dan tarif PPH otomatis (2% untuk material curah, 2,65% untuk material padat).
6. **Pembayaran Customer**: Mencatat cicilan atau pelunasan faktur invoice.

---

## 🛠️ Tech Stack (Strict JavaScript)
- **Framework**: React 19 (Functional Components & Modern Hooks)
- **Language**: JavaScript (ES6+ Murni - Tanpa TypeScript)
- **Build Tool**: Vite
- **Styling**: Tailwind CSS v4 dengan Design Tokens custom (Dark Theme, Wood-grain Header, Safety Orange Accent)
- **Routing**: React Router DOM v7
- **Icons**: Lucide React
- **State Management**: React Context API (`AuthContext`, `AppContext`)

---

## 🚀 Menjalankan Aplikasi
```bash
# Install dependencies
npm install

# Jalankan server pengembangan
npm run dev

# Build produksi
npm run build

# Preview build produksi
npm run preview
```

---

## 📂 Struktur Folder
```text
src/
├── assets/          # Static assets & brand icons
├── components/      # Reusable UI & Layout components
│   └── layout/      # Header (wood grain), Sidebar (responsive), Footer, MainLayout
├── context/         # AuthContext (roles & permissions), AppContext
├── pages/           # Layar modul aplikasi
│   ├── Dashboard/   # Menu operasional & quick actions
│   ├── PreOrder/    # Form Buat RO & approval
│   ├── SuratJalan/  # Form Good Issue & kalkulator kubikasi truk
│   ├── Rekapan/     # Buat Jurnal GI & rekap kiriman
│   ├── Bkk/         # Buat Cash Out & daftar transaksi supplier
│   ├── Invoice/     # Buat Invoice & kalkulator PPN/PPH
│   ├── Laporan/     # 3 Laporan utama (Rekapan belum invoice, Piutang, Hutang)
│   ├── MasterData/  # 8 Data master & tarif PPH material
│   └── NotFound/    # Halaman 404
├── utils/           # Formatters (IDR, m3), Constants, Tax Rules
├── App.jsx          # Routing & Providers
├── main.jsx         # Entry point
└── index.css        # Tailwind directives & theme tokens
```

---
&copy; 2026 **PT BAS Control Center** • PT Berkah Alam Semesta.

