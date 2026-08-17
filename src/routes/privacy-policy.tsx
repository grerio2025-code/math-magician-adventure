import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/privacy-policy")({
  head: () => ({
    meta: [
      { title: "Kebijakan Privasi — Go-Q" },
      { name: "description", content: "Kebijakan Privasi Go-Q: platform edukasi matematika interaktif yang aman untuk anak-anak sekolah dasar." },
      { property: "og:title", content: "Kebijakan Privasi — Go-Q" },
      { property: "og:description", content: "Cara Go-Q melindungi privasi anak-anak dan mengelola data pengguna." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PrivacyPolicy,
});

function Section({
  number,
  title,
  children,
}: {
  number: number;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-8">
      <h2 className="font-display text-xl md:text-2xl font-bold text-foreground mb-3">
        {number}. {title}
      </h2>
      <div className="space-y-3 text-sm md:text-base text-foreground/85 leading-relaxed">
        {children}
      </div>
    </section>
  );
}

function Bullet({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex gap-2">
      <span className="text-primary mt-1">•</span>
      <span className="flex-1">{children}</span>
    </li>
  );
}

function PrivacyPolicy() {
  return (
    <div className="relative min-h-screen overflow-hidden px-4 py-8 md:py-12">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-4 right-2 select-none font-display text-6xl md:text-8xl font-bold opacity-10"
        style={{ color: "var(--primary)" }}
      >
        2 4 ＋ ✕ 3 － ÷ 5
      </div>

      <div className="relative mx-auto max-w-3xl">
        <div className="mb-6 flex items-center justify-between">
          <Link
            to="/"
            className="inline-flex items-center gap-1 rounded-full bg-white/70 px-4 py-2 text-sm font-semibold text-foreground shadow-[var(--shadow-soft)] transition-colors hover:bg-white"
          >
            ← Kembali
          </Link>
        </div>

        <article
          className="rounded-3xl border-4 border-white/70 p-6 md:p-10"
          style={{ background: "oklch(1 0 0 / 0.75)", boxShadow: "var(--shadow-fun)" }}
        >
          <header className="mb-8 text-center">
            <h1 className="font-display text-3xl md:text-5xl font-bold bg-gradient-to-r from-fuchsia-500 via-orange-400 to-emerald-500 bg-clip-text text-transparent">
              Kebijakan Privasi
            </h1>
            <p className="mt-2 text-sm md:text-base text-muted-foreground font-semibold">
              Go-Q — Aman, Ramah Anak, dan Transparan
            </p>
          </header>

          <p className="mb-8 text-sm md:text-base text-foreground/85 leading-relaxed">
            Selamat datang di Go-Q ("Aplikasi"), sebuah platform edukasi matematika interaktif untuk anak-anak sekolah dasar. Kami sangat berkomitmen untuk melindungi privasi pengguna kami, terutama anak-anak. Kebijakan Privasi ini menjelaskan bagaimana kami mengelola informasi di dalam Aplikasi ini.
          </p>

          <Section number={1} title="Informasi yang Kami Kumpulkan">
            <p>
              Aplikasi Go-Q didesain agar aman digunakan oleh anak-anak.
            </p>
            <ul className="space-y-2 rounded-2xl bg-white/50 p-4">
              <Bullet>
                <strong>Tidak Ada Data Pribadi:</strong> Kami TIDAK mengumpulkan informasi identitas pribadi dari pengguna kami, seperti nama, alamat email, nomor telepon, atau lokasi spesifik.
              </Bullet>
              <Bullet>
                <strong>Data Penggunaan Non-Pribadi:</strong> Kami hanya menyimpan data lokal di perangkat Anda (seperti nama panggilan, skor kuis atau level yang sudah diselesaikan) untuk memastikan fitur permainan berjalan lancar. Data ini tidak dikirim ke server kami.
              </Bullet>
            </ul>
          </Section>

          <Section number={2} title="Layanan Pihak Ketiga dan Iklan">
            <p>
              Kami bekerja sama dengan penyedia layanan pihak ketiga untuk mendukung operasional dan monetisasi Aplikasi:
            </p>
            <ul className="space-y-2 rounded-2xl bg-white/50 p-4">
              <Bullet>
                <strong>Google AdSense:</strong> Kami menggunakan Google AdSense untuk menampilkan iklan. Google menggunakan cookie untuk menayangkan iklan berdasarkan kunjungan pengguna ke Aplikasi ini atau situs lain di Internet.
              </Bullet>
              <Bullet>
                <strong>Perlindungan Anak (COPPA & GDPR-K):</strong> Karena Aplikasi ini ditujukan untuk anak-anak, kami mengaktifkan setelan pembatasan data pada jaringan iklan kami. Iklan yang ditayangkan adalah iklan non-personalisasi (tidak melacak minat anak) dan disaring agar hanya menampilkan konten yang ramah anak.
              </Bullet>
            </ul>
          </Section>

          <Section number={3} title="Cookie dan Kontrol Pengguna">
            <p>
              Anda dapat memilih untuk menonaktifkan cookie melalui setelan browser Anda masing-masing jika tidak ingin data penjelajahan non-pribadi digunakan oleh penyedia iklan pihak ketiga.
            </p>
          </Section>

          <Section number={4} title="Persetujuan Orang Tua">
            <p>
              Dengan mengizinkan anak Anda menggunakan Aplikasi Go-Q, Anda menyetujui ketentuan dalam Kebijakan Privasi ini. Kami menyarankan orang tua atau wali untuk mendampingi anak-anak saat berselancar di internet.
            </p>
          </Section>

          <Section number={5} title="Hubungi Kami">
            <p>
              Jika Anda memiliki pertanyaan atau masukan mengenai kebijakan privasi ini, silakan hubungi kami melalui email{" "}
              <a
                href="mailto:grerio2025@gmail.com"
                className="font-semibold text-primary underline underline-offset-2 hover:text-primary/80"
              >
                grerio2025@gmail.com
              </a>
              .
            </p>
          </Section>

          <div className="mt-10 rounded-2xl border-2 border-dashed border-primary/30 bg-primary/5 p-4 text-center text-xs md:text-sm text-muted-foreground">
            Terakhir diperbarui: 17 Agustus 2026
          </div>
        </article>
      </div>
    </div>
  );
}
