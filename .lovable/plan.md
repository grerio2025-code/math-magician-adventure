# Salinan Ranking ke Supabase Pribadi Anda

Database ranking proyek ini tetap berada di Lovable Cloud (tidak bisa dipindahkan keluar). Yang dibuat: setiap skor baru yang tersimpan juga dikirim sebagai salinan ke project Supabase milik Anda, jadi Anda punya data lengkap di akun sendiri.

## Yang Anda perlu siapkan

1. Di project Supabase Anda, buat tabel `rankings` dengan kolom: `name` (text), `age` (int), `op` (text), `level` (int), `mode` (text), `score` (int), `total` (int), `seconds` (int), `created_at` (timestamptz default now()), plus `id` (uuid default gen_random_uuid()).
2. Beri saya dua nilai untuk disimpan sebagai rahasia proyek:
   - URL project Supabase Anda
   - Service role key (atau secret key) project Anda — dipakai hanya di sisi server, tidak pernah tampil di browser

## Yang akan dibangun

### 1. Pengiriman salinan di sisi server
`src/lib/mirror.functions.ts` — server function `mirrorRanking` menerima satu baris ranking, lalu menulisnya ke Supabase Anda memakai kredensial dari rahasia proyek. Jika kredensial belum diisi, fungsi berhenti diam-diam tanpa mengganggu permainan.

### 2. Panggilan dari alur simpan skor
`src/lib/rankings.ts` — setelah `addRanking` berhasil menyimpan ke database proyek, panggil `mirrorRanking` secara "fire and forget". Kegagalan salinan tidak akan menampilkan error ke anak yang bermain; hanya dicatat di log.

### 3. Migrasi data yang sudah ada
Satu endpoint sekali-jalan `src/routes/api/public/mirror-backfill.ts` (dilindungi token rahasia) untuk menyalin seluruh ranking lama ke Supabase Anda, dijalankan sekali setelah kredensial masuk.

## Catatan teknis
- Salinan dikirim dari server (bukan browser) supaya kunci tidak bocor dan tidak ada masalah CORS.
- Skema kolom dibuat identik agar data langsung bisa dipakai/di-query di project Anda.
- Tidak ada perubahan pada logika permainan, medali, atau tampilan Ranking.
