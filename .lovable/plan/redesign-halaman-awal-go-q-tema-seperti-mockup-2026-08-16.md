# Redesign Halaman Awal Go-Q (tema seperti mockup)

Mengubah tampilan halaman depan agar mengikuti gambar referensi: latar gradasi lembut, 4 kartu kolom operasi dengan header berwarna, dan daftar level berbentuk pill dengan ikon + tombol panah.

## Yang berubah (tampilan saja)

1. **Latar & suasana**
   - Latar gradasi pastel (biru muda → ungu muda → peach di sudut bawah kanan).
   - Angka/simbol operasi samar sebagai dekorasi di sudut atas kanan (murni CSS/teks, tanpa gambar).

2. **Header**
   - Judul "Go-Q" tetap besar dan berwarna gradasi.
   - Subjudul "Go Count and Memorize Numbers with Q" dipertegas (lebih tebal, warna gelap).
   - Baris tagline "Belajar Hitung • Latih Ingatan • Raih Prestasi" di bawahnya, lalu garis gradasi pendek sebagai pemisah.
   - Baris "untuk Ananda Quddus MIN 5 Ulee Kareng - Banda Aceh" tetap ada, ditempatkan di bawah tagline dengan ukuran kecil.

3. **Empat kartu operasi (Penjumlahan, Pengurangan, Perkalian, Pembagian)**
   - Tiap operasi jadi satu kartu putih transparan dengan sudut membulat besar dan bayangan lembut.
   - Header kartu berwarna solid/gradasi per operasi (hijau, oranye, ungu, teal) berisi lingkaran ikon operasi (+ − × ÷), nama operasi, dan sub-teks: "Tambah dan Kuasai", "Kurangi dengan Cermat", "Latih Otak Logis", "Pecahkan dengan Tepat".
   - Di dalam kartu, tiap level jadi baris pill: kotak ikon (🏆 / ⚡ / 🚀 / 👑) + "Level N" + deskripsi kecil (teks sub yang sudah ada) + tombol bulat panah di kanan berwarna sesuai operasi.
   - Kartu HC Level 1 / HC Level 2 diberi aksen khusus (border menonjol + ikon 👑) tapi posisi tetap di baris terakhir kolom Penjumlahan/Pengurangan.

4. **Footer strip**
   - Bar putih membulat berisi tiga item: "🧠 Melatih Fokus | 📈 Meningkatkan Daya Ingat | ⭐ Menuju Generasi Cerdas".
   - Tombol 🏆 Ranking dan 📤 Bagikan tetap ada, ditempatkan di atas bar tersebut.

5. **Responsif**
   - Desktop: 4 kolom berdampingan. Tablet: 2 kolom. HP: 1 kolom bertumpuk, pill level tetap mudah disentuh.

## Catatan teknis

- Hanya `src/routes/index.tsx` dan token/utility di `src/styles.css` yang disentuh; tautan route level tetap `/play/$op/$level`.
- Warna per operasi ditambahkan sebagai token semantik di `src/styles.css` (mis. `--op-plus`, `--op-minus`, `--op-times`, `--op-divide` beserta gradasinya) — tidak ada warna hardcoded di komponen.
- Gambar referensi tidak dipakai sebagai aset; semua visual dibangun dengan CSS + emoji.
- Logika permainan, ranking, medali, dan penyimpanan skor tidak diubah.
