# Cycle Craft: Eco Village Adventure (Desa Cycle Craft)

Game simulasi dan edukasi pengelolaan sampah serta petualangan ramah lingkungan, dibangun dengan **React + TypeScript + Vite + TailwindCSS + HTML5 Canvas 2D**.

---

## 🎮 Fitur Utama

1. **Top-Down 2D Game World & Karakter Anto**:
   - Kontrol karakter Antonius Columbus (Anto) menggunakan **WASD / Tombol Panah** atau **Klik / Sentuh** di layar.
   - Animasi sapu lidi interaktif saat menyapu dan mengumpulkan sampah.
   - Deteksi interaksi otomatis dengan efek teks melayang (*floating feedback particles*).

2. **Siklus 5 Langkah Daur Ulang**:
   - **Kumpulkan (Collect)**: Sampah tersebar di jalanan desa, taman kota, dan tepi sungai.
   - **Pilah (Sort)**: Pemilahan interaktif (*Drag & Drop* atau klik) ke Tong Organik (Hijau) dan Tong Anorganik (Plastik, Kertas, Logam).
   - **Olah (Craft)**: Mengolah sampah terpilah menjadi produk kerajinan ramah lingkungan (Pupuk Kompos, Pot Eco-Plastik, Tas Daur Ulang, Lentera Logam, Bangku Ecobrick).
   - **Jual (Shop)**: Menjual produk di Toko Desa untuk mendapatkan Koin.
   - **Upgrade**: Meningkatkan kapasitas karung, radius sapu, kecepatan sepatu bot, dan efisiensi mesin olah.

3. **Web Audio Synthesizer**:
   - Efek suara prosedural tanpa dependensi aset luar (suara sapu, pop sampah, nada pemilahan benar/salah, suara koin, dan unlock level).

4. **Sistem Progres & Peta Area**:
   - **Area 1**: Jalan & Pusat Desa.
   - **Area 2**: Taman Kota Asri (terbuka setelah memilah 8 sampah).
   - **Area 3**: Tepi Sungai Jernih (terbuka setelah memilah 18 sampah).
   - Sistem Badge Pemula hingga Pahlawan Bumi Cycle Craft.

5. **Katalog Edukatif & Ensiklopedia**:
   - Fakta ilmiah penguraian sampah dan manfaat pelestarian bumi.

6. **Penyimpanan Lokal (Local Storage)**:
   - Data koin, poin, progres area, upgrade, dan inventaris tersimpan otomatis di browser.

---

## 🚀 Cara Menjalankan Proyek

### 1. Prasyarat
- Node.js (versi 18 ke atas disarankan)
- npm

### 2. Instalasi Dependensi
```bash
npm install
```

### 3. Menjalankan Server Pengembangan (Dev)
```bash
npm run dev
```
Buka browser di [http://localhost:3000](http://localhost:3000)

### 4. Membangun untuk Produksi (Production Build)
```bash
npm run build
```
Hasil kompilasi siap didistribusikan di folder `dist/`.

### 5. Preview Hasil Build
```bash
npm run preview
```

---

## ⌨️ Kontrol Permainan

| Tombol / Aksi | Fungsi |
|---|---|
| **W / A / S / D** atau **Panah** | Bergerak (Atas, Kiri, Bawah, Kanan) |
| **Klik Kiri di Tanah** | Karakter berjalan ke titik tujuan |
| **E** atau **Spasi** | Mengambil sampah / Membuka fasilitas terdekat |
| **P** atau **I** | Membuka Tas & Modal Pemilahan Sampah |
| **C** | Membuka Workshop / Menu Crafting |
| **K** | Membuka Katalog Edukatif |
| **M** | Membuka Peta Area & Teleport Area Terbuka |
| **Esc** | Membuka Pengaturan / Menu Jeda |
| **Drag & Drop / Klik** | Memilah sampah dari karung ke tong yang sesuai |
