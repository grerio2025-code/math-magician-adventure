## Diagnosis

DB masih 0 baris untuk `x`, `/`, dan `+ level 4` (HC). Perbaikan `await addRanking` + `console.warn` sudah ada tapi belum terkonfirmasi jalan — kemungkinan penyebabnya:

1. Insert ditolak oleh check constraint / RLS (belum bisa dites di plan mode).
2. Game tidak pernah sampai soal ke-50 untuk mode hafalan/HC, jadi `addRanking` tak pernah dipanggil.
3. Feedback sekilas 700ms yang membungkus `addRanking` — jika user meninggalkan tab tepat setelah menjawab soal terakhir, insert bisa terputus.

## Rencana

### 1) Verifikasi DB menerima row × / ÷ / HC
Jalankan insert uji lewat tool (butuh build mode) untuk 3 baris:
- `op='x', level=1`
- `op='/', level=1`
- `op='+', level=4`
Jika sukses → penyebab bukan constraint DB, murni sisi klien.
Row uji dihapus segera setelah verifikasi.

### 2) Simpan skor saat selesai — tanpa menunggu animasi feedback
`src/routes/play.$op.$level.tsx`:
- Panggil `addRanking` **sebelum** `setTimeout` yang menunda 700ms feedback, saat soal ke-50 selesai dijawab. Alurnya:
  - Deteksi soal terakhir (`index + 1 >= questions.length`).
  - Hitung `seconds` & `finalScore` langsung.
  - Kirim `addRanking(...)` (fire tanpa `await`, tapi promise-nya diberi `.catch(console.warn)`).
  - Tetap tampilkan feedback ✅/❌ 700ms lalu `setStage("done")`.
- Efek: hasil terkirim segera, tidak bergantung pada apakah user menunggu animasi selesai.

### 3) Retry ringan pada `addRanking`
`src/lib/rankings.ts`:
- Jika insert error, coba ulang sekali setelah 800ms. Log kedua error jika keduanya gagal.
- Tetap kembalikan `{ error }`.

### 4) Tombol darurat “Simpan skor” di layar hasil
`src/routes/play.$op.$level.tsx` (stage `done`):
- Tambah tombol kecil “💾 Simpan ulang” yang memanggil `addRanking` lagi jika user curiga skornya belum tersimpan. Disable setelah sukses. Menghindari kasus race/insert gagal senyap.

### 5) Log ke UI (opsional, minimal)
Kalau `addRanking` return error, tampilkan pesan kecil di layar hasil: “Gagal menyimpan skor — coba tombol Simpan ulang”. Warna netral, tidak menutupi konten.

## File yang berubah
- `src/lib/rankings.ts` — retry + return error.
- `src/routes/play.$op.$level.tsx` — kirim skor lebih awal, tombol simpan ulang, badge status.

Tidak ada perubahan schema.
