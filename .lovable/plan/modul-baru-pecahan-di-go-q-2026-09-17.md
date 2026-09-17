# Modul Baru "Pecahan" di Go-Q

Menambahkan kolom kelima "Pecahan" di halaman depan plus tiga level kuis dan satu Lab eksplorasi bebas. Semua soal memakai data contoh di dalam aplikasi — belum menyentuh database.

## 1. Halaman depan

- Grid operasi jadi 5 kolom di layar lebar (1 kolom di ponsel, 3 di tablet), dengan kartu "Pecahan" di sebelah kanan Pembagian.
- Header kartu: gradasi pink/rose, ikon potongan pizza, judul "Pecahan", subjudul "Eksplorasi & Kuasai".
- Empat baris tombol: Level 1 "Mengenal Gambar", Level 2 "Bandingkan Nilai", Level 3 "Penjumlahan Dasar", "HC / Lab" dengan "Lab Pecahan Interaktif".
- Gaya kartu/pill mengikuti pola kartu operasi lain agar konsisten.

## 2. Layar permainan

Halaman penuh khusus pecahan dengan header berisi:
- Tombol kembali di kiri atas.
- Tiga hati nyawa di tengah (berkurang saat salah).
- Progres "Soal 1 dari 10" berupa bar.
- Skor di kanan atas.

### Level 1 — Mengenal Gambar
Gambar pizza (lingkaran) atau cokelat (batang) terbagi rata, sebagian diarsir warna terang. Anak memilih satu dari 4 kartu pecahan besar.

### Level 2 — Bandingkan Nilai
Dua gambar pecahan bersanding beserta tulisan pecahannya. Anak memilih tombol besar `>`, `<`, atau `=`.

### Level 3 — Penjumlahan Dasar
Dua pecahan berpenyebut sama, dengan visual dua bar yang potongannya menyatu setelah dijawab. Empat kartu jawaban.

### HC / Lab — Lab Pecahan Interaktif
Bebas, tanpa nyawa dan tanpa waktu:
- Slider "Banyak Potongan" 2–12 mengubah jumlah potongan pizza.
- Setiap potongan bisa ditekan untuk dipilih/"dimakan".
- Tampilan langsung: bentuk pecahan M/N, kalimat "M dari N bagian dipilih", desimal dan persen.
- Tombol reset dan pilih semua.

## 3. Umpan balik & hasil

- Benar: centang hijau, konfeti singkat, +20 poin.
- Salah: kartu bergetar merah, satu hati hilang, muncul petunjuk singkat.
- Layar hasil (soal habis atau nyawa habis): skor akhir, bintang 1–3 sesuai ketepatan, pesan motivasi, tombol "Coba Lagi" dan "Kembali ke Menu Utama".

## Catatan teknis

- Rute baru `src/routes/fraction.$level.tsx` (level: `1`, `2`, `3`, `lab`), dengan `head()` sendiri; tautan dari `src/routes/index.tsx`.
- Soal contoh di `src/lib/fractions.ts`: tipe soal berisi `id`, `level`, `question`, `visualType` (`pie`/`bar`), `totalParts`, `shadedParts`, `options`, `correctAnswer`, `hint`; minimal 10 soal per level, diacak saat mulai, diambil 10.
- Komponen visual `src/components/FractionVisual.tsx` — SVG murni untuk pie dan bar, tanpa gambar aset.
- Warna pecahan ditambah sebagai token semantik di `src/styles.css` (`--op-fraction`, `--gradient-op-fraction`) plus keyframes shake/konfeti; tidak ada warna hardcoded di komponen.
- Skor, nyawa, dan progres hanya di state React; tidak ada penulisan ke database dan tidak ada perubahan pada ranking, medali, kompetisi, maupun iklan.
