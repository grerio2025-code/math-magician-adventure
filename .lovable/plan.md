## Tambahan: Perkalian (×) & Pembagian (÷) + Ranking Filter

### 1. Home page (`src/routes/index.tsx`)
- Ganti layout dari 2 kolom → 4 kolom (di layar besar) / 2×2 (di layar kecil): **+**, **−**, **×**, **÷**.
- **×** punya 3 level, **÷** punya 3 level.
- Ubah subtitle di bawah "Go-Q" menjadi: **"Go Count and Memorize Numbers with Q"** (sebelumnya "🚀 Petualangan Berhitung Seru!").

### 2. Route baru untuk mode hafalan
Perkalian L1/L2 dan Pembagian L1/L2 pakai **mode hafalan** (memory) — beda alur dari + / −. Buat route/komponen terpisah agar tidak mencampur logika:
- Route dinamis tetap `/play/$op/$level` dengan `op` ∈ `plus | minus | times | divide`.
- Di dalam komponen play, deteksi `op`:
  - `plus`/`minus` → alur lama (tidak berubah).
  - `times`/`divide` **level 1 & 2** → alur **memory**.
  - `times`/`divide` **level 3** → alur **acak** mirip + / − (tanpa fase hafalan).

### 3. Generator soal (`src/lib/questions.ts`)
Tambah tipe `Op = "+" | "-" | "x" | "/"` dan generator:
- **× L1 (angka 1–5), × L2 (angka 6–10)** dan **÷ L1 (1–5), ÷ L2 (6–10)** — alur *memory*:
  - Tabel per grup: perkalian/pembagian dengan pengali/pembagi tertentu (mis. tabel-1 untuk L1 grup pertama), 10 soal per grup, 5 grup → 50 soal.
  - Struktur soal berisi:
    - `shown`: daftar fakta yang ditampilkan untuk dihafal (2, 3, atau 4 fakta).
    - `hideSeconds`: 2 / 3 / 4 detik sesuai jumlah fakta.
    - `question` + `choices` (2 angka, salah satunya benar) dari salah satu fakta yang tadi ditampilkan.
  - Dalam 10 soal per grup: 3 soal pakai 2 fakta (2 dtk), 3 soal pakai 3 fakta (3 dtk), 4 soal pakai 4 fakta (4 dtk).
  - Pembagian: gunakan hasil bulat, mis. tabel-3 → `3,6,9,12,15 ÷ 3 = 1..5`.
- **× L3** (50 soal acak):
  - 10 soal pakai pengali ∈ {1,2,3}, pengali lain 1..10.
  - 20 soal pengali ∈ {4,5,6}.
  - 20 soal pengali ∈ {7,8,9}.
  - Mode `blind` atau `choices` (choices = 3 opsi, sama seperti +/−).
- **÷ L3** (50 soal acak, hasil selalu bulat): pola sama seperti × L3, dibuat dengan generate hasil × pembagi lalu balik jadi soal ÷.

### 4. Komponen Play — mode memory
Di `src/routes/play.$op.$level.tsx` (atau pecah sedikit menjadi sub-komponen):
- Deteksi bila soal punya `shown` → render fase hafalan:
  - Tampilkan kartu-kartu fakta besar-besar (mis. `1 × 3 = 3`).
  - Timer countdown (2/3/4 detik) + tombol **⏭ Lanjut** untuk skip lebih cepat.
- Setelah countdown/skip → tampilkan pertanyaan (`1 × 3 = ?`) dengan 2 tombol pilihan.
- Feedback ✅/❌ sekilas, sama seperti alur lama.
- Timer permainan berjalan sejak "Mulai" sampai soal ke-50 (fase hafalan **ikut dihitung**, konsisten dengan spec "meringkas waktu").

### 5. Sistem medali (`src/lib/medals.ts`)
- Perluas `getTargets` agar menerima level 1–3 untuk × dan ÷.
- **xL1 & ÷L1** pakai target Level 1 (+/−) — Emas 48–50 ≤1:30, Perak 45–47 ≤2:00, Perunggu 40–44 ≤3:00.
- **xL2 & ÷L2** pakai target Level 2 — Emas 47–50 ≤2:00, Perak 44–46 ≤2:45, Perunggu 38–43 ≤4:00.
- **xL3 & ÷L3** pakai target Level 3 — Emas 46–50 ≤3:00, Perak 42–45 ≤4:00, Perunggu 36–41 ≤5:00.

### 6. Ranking (`src/routes/ranking.tsx`)
- Ganti filter chip lama menjadi **2 dropdown**:
  - Operasi: `Semua`, `➕ Plus`, `➖ Minus`, `✖ Kali`, `➗ Bagi`.
  - Level: `Semua`, `1`, `2`, `3`, `4` (level 4 di-disable bila operasi × atau ÷ dipilih).
- Filter diterapkan client-side pada hasil `getRankings()` yang sudah ada.
- Emoji medali per baris tetap; medal lookup diperluas untuk × dan ÷.

### 7. Database
Tabel `rankings` sudah pakai `op text` dan `level integer` — **tidak perlu migrasi**. Nilai baru `"x"` dan `"/"` cukup disimpan lewat insert yang sudah ada.

### File yang berubah
- `src/routes/index.tsx` — 4 kolom operasi, subtitle baru.
- `src/lib/questions.ts` — tipe `Op` diperluas, generator memory & acak untuk × dan ÷.
- `src/routes/play.$op.$level.tsx` — dukung `op` baru + fase hafalan.
- `src/lib/medals.ts` — target medali untuk × dan ÷.
- `src/routes/ranking.tsx` — dropdown operasi & level.
- `src/lib/rankings.ts` — perluas tipe `op` menjadi `"+" | "-" | "x" | "/"`.
