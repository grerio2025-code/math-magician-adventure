# Fitur Kompetisi Go-Q

Menambah mode lomba serentak: host membuat lomba, peserta bergabung, skor naik langsung di papan peringkat, dan semua hasil tersimpan permanen untuk dilihat kapan pun.

## Cara pakai (dari sisi pemain)

1. Di halaman utama ada tombol baru **🏁 Kompetisi** (di samping Ranking & Bagikan).
2. Halaman Kompetisi punya dua tab: **Kompetisi Aktif** (akan dimulai / sedang berjalan) dan **Kompetisi Selesai** (riwayat + papan peringkat lama).
3. Tombol **Buat Kompetisi Baru** membuka formulir host:
   - Judul lomba (wajib)
   - Keamanan: **Gunakan PIN** (host isi 4 angka) atau **Tanpa PIN**
   - Tanggal & jam mulai
   - Mode soal (bisa pilih beberapa): Penjumlahan, Pengurangan, Perkalian, Pembagian
   - Kesulitan: Mudah / Sedang / Sulit — dengan pilihan **Pakai level Go-Q yang ada** (Mudah=Level 1, Sedang=Level 2, Sulit=Level 3) atau **Aturan khusus** (host mengatur sendiri rentang angka minimum–maksimum)
   - Jenis jawaban: **Blind** (isi jawaban) atau **Choices** (pilih 3 jawaban)
   - Durasi: otomatis 2 menit untuk Blind, 1 menit untuk Choices, bisa diubah host
   - Jumlah soal: bawaan 50, bisa diubah
   - **Captcha ramah anak**: soal hitung sederhana acak ("Berapa 7 + 2?") harus benar sebelum lomba bisa disimpan
4. Peserta ikut lewat daftar lomba aktif (isi PIN bila host memakai PIN) **atau** lewat tautan undangan/kode lomba yang dibagikan host (tombol Bagikan di kartu lomba). Sebelum masuk, peserta mengisi **Nama, Usia, Nama Sekolah, Negara** (pilihan negara dengan emoji bendera). Data ini diingat di perangkat untuk lomba berikutnya.
5. Perangkat yang membuat lomba otomatis melihat **Panel Host**: tombol **Mulai** (menyalakan lomba serentak untuk semua peserta) dan **Stop** (menghentikan paksa). Lomba juga berhenti sendiri saat waktu habis.
6. Saat bermain: timer berjalan, jawaban benar = 1 poin, jawaban salah = 0 poin (tidak ada nilai minus). Papan peringkat live memperbarui skor semua peserta secara langsung tanpa perlu memuat ulang halaman.
7. Urutan peringkat: jumlah jawaban benar terbanyak dulu; bila sama, waktu tercepat menang. Baris peringkat menampilkan nama, usia, sekolah, dan bendera negara.
8. Setelah selesai, lomba berpindah ke tab **Kompetisi Selesai** dan tersimpan permanen beserta seluruh catatan skor peserta.

## Iklan

- Ada penanda global `is_in_competition`. Selama peserta sedang bermain di lomba, semua iklan layar penuh / sela / pop-up Monetag tidak dimuat dan tidak ditampilkan.
- Setelah lomba berakhir (waktu habis atau dihentikan host) dan pemain keluar dari layar permainan, iklan kembali normal di halaman utama, riwayat, dan statistik.

## Rincian teknis

**Database (satu migrasi):**
- `competitions`: title, host_key_hash, pin (nullable, 4 digit), join_code (unik, untuk tautan undangan), start_at, ops (text[]), difficulty, difficulty_custom (jsonb, nullable), input_type (blind/choices), duration_seconds, total_questions, status (`upcoming`|`live`|`completed`), started_at, ended_at, question_seed, created_at.
- `competition_participants`: competition_id, player_key, name, age, school, country_code, score, answered, seconds, finished_at, created_at; unik (competition_id, player_key).
- `players` (profil ringan per perangkat): player_key, name, age, school, country_code.
- GRANT ke `anon`, `authenticated`, `service_role` sesuai kebijakan; RLS aktif: siapa pun boleh melihat lomba & peserta; peserta boleh mendaftar dan memperbarui barisnya sendiri lewat `player_key`; perubahan status/`start`/`stop` dan penulisan skor dilakukan lewat server function yang memverifikasi `host_key`/`player_key`, bukan langsung dari klien.
- `ALTER PUBLICATION supabase_realtime ADD TABLE public.competitions, public.competition_participants` untuk pembaruan langsung.
- Kolom `pin` dan `host_key_hash` tidak diekspos ke klien (server function saja / kolom terproyeksi).

**Kode:**
- `src/lib/player.ts` — `player_key` acak di localStorage + profil (nama, usia, sekolah, negara).
- `src/lib/countries.ts` — daftar negara + emoji bendera.
- `src/lib/competitions.functions.ts` — server functions: `createCompetition` (validasi captcha & input via zod), `joinCompetition` (cek PIN/join_code), `startCompetition` / `stopCompetition` (verifikasi host key), `submitAnswer` (skor bertambah hanya di server, salah = 0), `finishParticipant`, `listCompetitions`, `getCompetition`.
- `src/lib/competition-questions.ts` — membangun soal dari `ops` + kesulitan (pakai generator `src/lib/questions.ts` untuk mode level, atau rentang khusus host), memakai `question_seed` agar semua peserta dapat soal yang sama.
- Rute baru: `src/routes/competitions.tsx` (dua tab + tombol buat), `src/routes/competitions.new.tsx` (formulir + captcha), `src/routes/competitions.$code.tsx` (lobi, panel host, papan peringkat live), `src/routes/competitions.$code.play.tsx` (permainan lomba), `src/routes/competitions.$code.results.tsx` (hasil akhir/riwayat). Setiap rute punya `head()` sendiri, plus `errorComponent`/`notFoundComponent` sesuai pola proyek.
- Realtime: langganan `postgres_changes` pada `competition_participants` + status lomba di dalam `useEffect` dengan pembersihan channel.
- `src/lib/ads.ts` diperluas: `setInCompetition(bool)` dan penjaga di `showAdThen` sehingga iklan dilewati saat lomba berjalan; skrip vignette Monetag dibiarkan seperti sekarang tapi tidak dipicu saat bermain lomba.
- Halaman utama (`src/routes/index.tsx`) mendapat tombol Kompetisi bergaya tema pastel Go-Q; halaman lomba memakai tema yang sama dengan Ranking.

**Catatan:** fitur ini tidak mengubah permainan level yang sudah ada maupun tabel `rankings` serta pencerminan data yang sudah berjalan.
