## Perubahan yang akan dilakukan

### 1) Perkalian & Pembagian L1/L2 — pengali sampai 10
`src/lib/questions.ts` → `tablePool(op, N)`:
- Ubah loop `m` dari 1..5 menjadi **1..10**.
- Seri (N) tetap: L1 = tabel 1–5, L2 = tabel 6–10.
- Pool per seri jadi 10 fakta (mis. `3×1, 3×2, … 3×10`). Mode hafalan tetap ambil 2/3/4 fakta acak dari pool ini.
- Pembagian ikut otomatis (dividend = N×m, hasil m ∈ 1..10).

### 2) Durasi hafalan diperpanjang
`memoryQuestions` di `src/lib/questions.ts`:
- Petakan `hideSeconds`: **k=2 → 2 dtk**, **k=3 → 4 dtk**, **k=4 → 6 dtk** (sebelumnya 2/3/4).

### 3) Ranking × / ÷ tidak ter-record
Diagnosis belum terkonfirmasi (DB view read-only). Dari data yang ada, semua baris `rankings` hanya op `+` / `-`; belum pernah ada `x` / `/`. Kemungkinan: insert gagal senyap karena `addRanking` di-fire tanpa `await` sehingga error tidak terlihat, atau ada nilai yang menabrak check constraint saat mode hafalan.

Yang akan dilakukan:
- `src/lib/rankings.ts` → `addRanking` mengembalikan `{ error }` dari Supabase.
- `src/routes/play.$op.$level.tsx` → `await addRanking(...)` di dalam handler selesai; kalau ada error, `console.warn` dengan payload agar cause-nya kelihatan (score/total/seconds/mode). Pindahkan `setStage("done")` setelah await agar UI tidak balapan.
- Verifikasi setelah build: main × L1 sampai selesai, cek Ranking dan console.

### 4) Penjumlahan Level 4 → “HC Level 1” (Lomba Hitung Cepat)
Home (`src/routes/index.tsx`):
- Tombol keempat di kolom Penjumlahan tetap di posisinya. Ubah `label: "HC Level 1"`, `sub: "Lomba Hitung Cepat"`. Route parameter tetap `plus/4` supaya kompatibel dengan schema `rankings` (op tersimpan sebagai `+`, level `4`).

Generator `src/lib/questions.ts`:
- Perluas `Question` dengan field opsional `operands: number[]`, `signs: ("+"|"-")[]`, `display: string` untuk soal multi-operand.
- Fungsi baru `hcLevel1(mode)` menghasilkan 50 soal:
  - **25 soal pertama**: 3 operand dengan ukuran digit `{1d, 2d, 3d}` di-shuffle posisinya, semua tanda `+`. Contoh: `20+43+4`, `63+5+253`.
  - **25 soal terakhir**: 3 operand ukuran `{1d, 2d, 3d}` di-shuffle, tanda operand ke-2 & ke-3 dipilih acak `+`/`-`. Jamin hasil ≥ 0 (kalau negatif, flip tanda). Contoh: `320-20+88`, `543+7-45`.
- Range digit: 1d = 1..9, 2d = 10..99, 3d = 100..999.
- Choices: pakai `makeChoices(answer, 3)` yang sudah ada.

### 5) Pengurangan Level 4 → “HC Level 2”
Home: tombol keempat kolom Pengurangan tetap di posisinya. `label: "HC Level 2"`, `sub: "Lomba Hitung Cepat"`. Route tetap `minus/4` (tersimpan sebagai op `-`, level `4`).

Generator: fungsi `hcLevel2(mode)` menghasilkan 50 soal, semuanya multi-operand:
- 4 operand dengan ukuran digit `[3d, 2d, 3d, 1d]` di-shuffle posisinya.
- Operand pertama selalu `+`; tiga tanda berikutnya acak `+`/`-`.
- Jamin hasil ≥ 0 (flip tanda operand yang bikin negatif).
- Contoh: `200+25-115+9`, `400+200-150-50`.

### 6) Play component — render multi-operand
`src/routes/play.$op.$level.tsx`:
- Kalau `current.display` ada, tampilkan `current.display` menggantikan `a op b` di kartu soal.
- Alur lainnya (blind/choices, feedback, timer, medali) tidak berubah.
- Judul header kartu setup: kalau `op+/− level 4`, ganti tampilan “➕/➖ Level 4” jadi “HC Level 1/2” dan subtitle jadi “Lomba Hitung Cepat” (kosmetik saja; tetap simpan op/level asli di DB).

### 7) Medali & Ranking untuk HC
- Target medali HC1 & HC2 pakai baris Level 4 yang sudah ada di `src/lib/medals.ts` (tidak diubah).
- Ranking page tidak perlu berubah — tetap muncul di filter “Plus / Level 4” dan “Minus / Level 4”. (Tidak menambah label “HC” di ranking supaya konsisten dgn data lama; bisa ditambah bila diminta.)

## Detail teknis singkat

- Tipe `Question` ditambah opsional: `operands?: number[]; signs?: ("+"|"-")[]; display?: string;`. Untuk HC, `a`/`b` diisi dua operand pertama saja agar tipe backwards-compatible; komponen play memakai `display` bila ada.
- Tidak ada perubahan schema database.
- Perubahan file: `src/lib/questions.ts`, `src/lib/rankings.ts`, `src/routes/play.$op.$level.tsx`, `src/routes/index.tsx`.
