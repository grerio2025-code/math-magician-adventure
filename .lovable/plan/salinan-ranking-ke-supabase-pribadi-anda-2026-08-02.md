# Salinan Ranking ke Supabase Pribadi Anda

Database ranking proyek ini tetap berada di Lovable Cloud (tidak bisa dipindahkan keluar). Yang dibuat: setiap skor baru juga dikirim sebagai salinan ke project Supabase milik Anda, jadi Anda punya data lengkap di akun sendiri.

## Catatan penting soal kunci

Kunci `service_role` yang Anda kirim di chat sebaiknya diputar (rotate) di project Supabase Anda setelah fitur ini jalan, karena sudah pernah terkirim sebagai teks biasa. Kunci akan disimpan sebagai rahasia proyek (server-only), tidak pernah dikirim ke browser.

Perlu konfirmasi satu hal: URL project. Kunci menunjuk ke ref `kraigpxlybewkjtywjdk`, sedangkan Project ID yang Anda tulis `kralgpxtybowkjtywjdk` — dua-duanya berbeda. Saya akan pakai URL `https://<ref>.supabase.co` sesuai ref di dalam kunci, dan menguji koneksi; kalau gagal saya minta URL persisnya dari halaman project Anda.

## Yang Anda perlu siapkan di Supabase Anda

Buat tabel `rankings` dengan kolom: `id` (uuid, default gen_random_uuid()), `name` (text), `age` (int), `op` (text), `level` (int), `mode` (text), `score` (int), `total` (int), `seconds` (int), `created_at` (timestamptz default now()). Saya berikan SQL siap tempel saat implementasi.

## Yang akan dibangun

### 1. Pengiriman salinan di sisi server
`src/lib/mirror.functions.ts` — server function `mirrorRanking` menerima satu baris ranking lalu menulisnya ke Supabase Anda memakai rahasia proyek (`MIRROR_SUPABASE_URL`, `MIRROR_SUPABASE_SERVICE_KEY`). Kalau rahasia belum ada, fungsi berhenti diam-diam tanpa mengganggu permainan.

### 2. Panggilan dari alur simpan skor
`src/lib/rankings.ts` — setelah skor tersimpan di database proyek, `mirrorRanking` dipanggil "fire and forget". Kegagalan salinan tidak menampilkan error ke pemain, hanya dicatat di log.

### 3. Migrasi data lama (sekali jalan)
`src/routes/api/public/mirror-backfill.ts` — endpoint terlindungi token rahasia untuk menyalin seluruh ranking yang sudah ada ke Supabase Anda, dijalankan sekali setelah koneksi terbukti bekerja.

## Catatan teknis
- Semua penulisan ke Supabase Anda dilakukan dari server, bukan browser, agar kunci tidak bocor dan bebas masalah CORS.
- Skema kolom dibuat identik supaya data langsung bisa dipakai/di-query di project Anda.
- Tidak ada perubahan pada logika permainan, medali, atau tampilan Ranking.
