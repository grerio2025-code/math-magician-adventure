## Perubahan

### 1) HC Level 1 & 2 berwarna abu-abu tua
`src/routes/index.tsx`: tombol level 4 untuk `+` dan `-` (HC Level 1 & 2) diberi gradient abu-abu tua (mis. `linear-gradient(135deg, #4b5563, #1f2937)` — slate-700 → slate-900) sebagai override khusus, sementara level 1-3 tetap pakai gradient plus/minus. Posisi tombol tidak diubah.

### 2) Tombol Share di halaman depan
`src/routes/index.tsx`: di samping tombol "🏆 Ranking" (bagian bawah home), tambah tombol "📤 Bagikan". Fungsi:
- Coba `navigator.share({ title: "Go-Q", text: "Yuk main Go-Q — asah berhitung!", url: window.location.origin })`.
- Fallback: `navigator.clipboard.writeText(url)` + toast kecil "Link disalin!".

### 3) Tombol Share di layar hasil (summary)
`src/routes/play.$op.$level.tsx` stage `done`: tombol "📤 Bagikan" di baris tombol Main Lagi / Ranking / Home. Teks share menyertakan nama, level, skor, waktu, dan medali:
> "🎉 [Nama] main Go-Q [judul level] — skor [x]/50 dalam [waktu], dapat [medali]! Coba juga: [url]"
Fallback clipboard sama seperti di home.

### File yang berubah
- `src/routes/index.tsx` — warna tombol HC + tombol Share.
- `src/routes/play.$op.$level.tsx` — tombol Share di summary.

Tidak ada perubahan database atau logika permainan.