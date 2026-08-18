Pasang service worker Monetag (sw.js) untuk verifikasi

1. Salin file `sw.js` dari upload (`/mnt/user-uploads/sw.js`) ke `public/sw.js` agar tersedia di URL root aplikasi (`/sw.js`).
2. Verifikasi file tersedia via dev server (`/sw.js`) dengan membaca isinya.
3. Tidak memasang kode tag iklan Monetag atau memicu iklan saat ini — hanya verifikasi service worker saja sesuai permintaan.
4. Build/dev akan dijalankan untuk memastikan tidak ada error.
