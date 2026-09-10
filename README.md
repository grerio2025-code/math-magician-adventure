# Go-Q Math Adventure

saya ingin membuat satu aplikasi permainan untuk mengasah kemampuan anak dalam berhitung

nama aplikasinya "Go-Q"

ketika mulai aplikasi 

disuguhkan pilihan dalam bentuk button 2 kolom, sebelah kanan +

button 1 --> +level 1 --> ketika diklik menampilkan 2 pilihan, blind dan choices, "blind" mengharuskan pemain mengisi jawaban, dan "choices" menampilkan 3 jawaban yang bisa dipilih, permainan "level 1" merupakan penjumlahan 1 digit secara acak, misal 2 + 1, ketika setelah mengisi jawaban di "Blind" atau klik jawaban di "choices" langsung menampilkan benar atau salah sebelum lanjut ke soal berikutnya tampilan benar salah tidak perlu halaman khusus tapi cukup sekilas saja. permainan mempunyai 10 soal awal penjumlahan 1 digit angka kecil dibawah 5, 10 soal berikutnya tetap penjumlahan 1 digit misalnya 9 + 7 gunakan angka besar, dan 10 soal berikutnya penjumlahan 1 digit + 2 digit secara acak seperti 10+3 atau 2+12 gunakan angka kecil dn 20 soal terakhir tetap 1 digit + 2 digit namun gunakan angka besar seperti 54+9 atau 7+96.

button 2 --> +level 2 --> sama seperti level 1 menampilkan pilihan blind dan choices, sekarang 10 soal pertama penjumlahan menggunakan 2 digit (30+64) angka kecil, 10 soal berikutnya 2+2 digit (12+127) gunakan angka besar, 10 soal selanjutnya gabungan 3 digit + 2 digit (232+154) gunakan angka kecil, 20 soal selanjutnya 3 digit + 2 digit gunakan angka besar dan acak misal 87+682 atau 95+381

button 3 --> +level 3 --> gunakan pola seperti level 1 dan 2, tapi kini dimulai dari 3 digit + 3 digit untuk 30 soal pertama, 20 soal terakhir gabungan 3 digit + 4 digit

button 4 --> +level 4 --> gunakan pola seperti level 1 dan 2 dan 3, tapi kini dimulai dari 4 digit + 4 digit untuk 30 soal pertama, 20 soal terakhir gabungan 4 digit + 5 digit

sebelum memulai permainan setiap level, setiap user memasukkan nama dan usia 

skor betul dihitung 1 dan salah 0, hitung timer dalam detik dan menit

dikolom samping kanan mulai pengurangan -

button 5 --> -level 1 --> ketika diklik menampilkan 2 pilihan, blind dan choices, "blind" mengharuskan pemain mengisi jawaban, dan "choices" menampilkan 3 jawaban yang bisa dipilih, permainan "level 1" merupakan penjumlahan 1 digit secara acak, misal 2 + 1, ketika setelah mengisi jawaban di "Blind" atau klik jawaban di "choices" langsung menampilkan benar atau salah sebelum lanjut ke soal berikutnya tampilan benar salah tidak perlu halaman khusus tapi cukup sekilas saja. permainan mempunyai 10 soal awal pengurangan 1 digit angka kecil dibawah 5, 10 soal berikutnya tetap pengurangan 1 digit misalnya 9 - 2 gunakan angka besar, dan 10 soal berikutnya pengurangan 2 digit + 1 digit secara acak seperti 10-3 atau 2-12 gunakan angka kecil dn 20 soal terakhir tetap 2 digit - 1 digit namun gunakan angka besar seperti 54-9 atau 7-96.

button 6 --> -level 2 --> gunakan pola yang sama seperti penjumlahan namun kini pengurangan menggunakan 2 digit (30-24), tetap 50 soal dengan pola yang sama

demikian juga untuk -level 3 dan 4 memakai pengurangan dengan digit sama seperti penjumlahan

dibagian bawah ada tombol "Ranking" untuk melihat skor tertinggi dengan hitungan waktu nya

gunakan UI yang indah dan berwarna fancy serta tulisan yang menarik untuk anak2

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://math-magician-adventure.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/d10fde38-5d91-46c4-aad2-87d0f2b04e47).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
