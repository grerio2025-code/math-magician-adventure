# Tambah Halaman Kebijakan Privasi dan Tautan Footer

Menambahkan halaman Privacy Policy yang sesuai standar aplikasi anak-anak/Google AdSense, plus tautan kecil di footer halaman utama tanpa mengganggu tata letak responsif.

## Yang dibangun

1. **Halaman Kebijakan Privasi** (`src/routes/privacy-policy.tsx`)
   - Rute `/privacy-policy` dengan metadata `head()` (title, description, og, twitter).
   - Tampilan sesuai tema Go-Q: latar gradasi pastel, kartu putih transparan membulat, bayangan lembut, font Nunito/Fredoka.
   - Menampilkan seluruh isi kebijakan privasi yang diberikan pengguna dalam struktur heading & bullet yang rapi.
   - Tombol kembali ke Home.

2. **Tautan footer di halaman utama** (`src/routes/index.tsx`)
   - Teks kecil "Kebijakan Privasi" ditempatkan tepat di bawah bar penjelas (footer strip).
   - Menggunakan `<Link>` dari TanStack Router ke `/privacy-policy` (bukan tag `<a>` biasa).
   - Styling ringan: ukuran teks kecil, warna muted, hover underline, tidak memecah tata letak di layar HP.

3. **Verifikasi**
   - Pastikan route tree tergenerate otomatis dan halaman bisa diakses dari preview.
   - Cek tampilan desktop dan mobile agar tidak ada overlap atau wrapping yang mengganggu.

## Catatan teknis
- Hanya menambah satu file route dan mengedit `src/routes/index.tsx`.
- Tidak ada perubahan logika bisnis, database, atau server function.
- Tidak ada perubahan global CSS; mengandalkan utility Tailwind yang sudah ada dan token tema.
