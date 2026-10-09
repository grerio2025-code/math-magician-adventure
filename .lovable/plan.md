# Mode Quiz Live di Kompetisi

Menambah jenis lomba baru "Quiz Live": soal ditulis sendiri oleh pembuat quiz, dibacakan MC di acara, dan MC mengatur jalannya soal satu per satu.

## Cara pakai

1. **Buat Quiz** — Di halaman Buat Kompetisi ada pilihan jenis: **Hitung Cepat** (yang sudah ada) atau **🎤 Quiz Live**.
   - Quiz Live: isi judul, PIN (opsional), tanggal/jam, jenis jawaban **Blind** (ketik jawaban) atau **Choices** (pilih jawaban), waktu per soal (bawaan 20 detik, bisa diubah), lalu tambah soal satu per satu:
     - Teks pertanyaan
     - Choices: 2–4 pilihan jawaban, tandai satu yang benar
     - Blind: isi jawaban benar (huruf besar/kecil & spasi diabaikan)
   - Captcha tetap dipakai sebelum menyimpan.
2. **Dua tautan berbagi** setelah quiz dibuat:
   - **Tautan Peserta** — saat dibuka, peserta memilih **Ikut Lomba** (isi nama, usia, sekolah, negara seperti biasa) atau **Lihat Ranking**.
   - **Tautan MC** — berisi kunci rahasia MC; hanya yang memegang tautan ini yang melihat Panel MC.
3. **Panel MC**:
   - Tombol **Mulai** → soal 1 tampil besar di layar MC (beserta jawaban benar, khusus MC) dan muncul di HP peserta.
   - Tombol **Next** → lanjut ke soal berikutnya; jawaban soal sebelumnya ditutup.
   - Tombol **Selesai** → lomba berakhir, semua peserta diarahkan ke papan peringkat.
   - MC melihat jumlah peserta yang sudah menjawab soal saat ini.
4. **Peserta** — layar mengikuti MC secara langsung: menunggu → soal muncul → jawab sekali per soal → "Menunggu soal berikutnya…". Pertanyaan teks tetap ditampilkan juga di HP agar mudah diikuti.
5. **Penilaian** — benar = 1 poin, salah/tidak menjawab = 0. Ranking: skor tertinggi, bila sama total waktu menjawab tercepat. Papan peringkat live sama seperti lomba lainnya, dan hasil tersimpan permanen di tab Kompetisi Selesai.
6. Iklan tetap dimatikan selama peserta berada di layar lomba.

## Rincian teknis

**Database (migrasi tambahan, tanpa mengubah kolom lama):**
- `competitions`: kolom baru `kind text default 'speed'` ('speed' | 'quiz'), `current_question int default -1`, `question_started_at timestamptz`, `question_seconds int default 20`.
- Tabel baru `quiz_questions` (competition_id, position, prompt, choices text[] null, answer text) — tidak bisa dibaca publik; soal dikirim lewat server function tanpa kolom `answer` kecuali ke MC.
- Tabel baru `quiz_answers` (competition_id, player_key, position, correct, ms) unik per (competition, player, position) agar satu jawaban per soal.
- `competition_secrets` diberi kolom `mc_key`. GRANT + RLS sesuai pola sekarang; realtime untuk `competitions`.
- File `supabase/schema-untuk-supabase-sendiri.sql` diperbarui dengan bagian tambahan untuk Supabase pribadi Anda.

**Kode:**
- `competitions.functions.ts`: `createQuiz`, `getQuizState` (soal aktif tanpa jawaban), `getMcState` (verifikasi mc_key), `mcStart` / `mcNext` / `mcFinish`, `submitQuizAnswer` (cek di server, tolak bila soal sudah lewat/waktu habis).
- `competitions.new.tsx`: pilihan jenis + editor soal (tambah/hapus/urutkan).
- Rute baru: `competitions.$code.mc.tsx` (Panel MC, kunci dari `?k=`), `competitions.$code.quiz.tsx` (layar peserta). Lobi `competitions.$code.index.tsx` menampilkan pilihan Ikut Lomba / Lihat Ranking untuk quiz.
- Kartu di daftar kompetisi diberi label "🎤 Quiz Live" dan tombol bagikan Peserta / MC (MC hanya terlihat di perangkat pembuat).
- Pembersihan otomatis yang ada (2 hari, 0 peserta, maks 50) berlaku juga untuk quiz.
