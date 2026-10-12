import QRCode from "qrcode";

export interface PosterCompetition {
  title: string;
  join_code: string;
  start_at: string;
  kind?: string;
}

export function participantUrl(origin: string, code: string) {
  return new URL(`/competitions/${encodeURIComponent(code)}`, origin).href;
}

export async function createCompetitionPoster(comp: PosterCompetition, origin: string): Promise<Blob> {
  await document.fonts.ready;
  const canvas = document.createElement("canvas");
  canvas.width = 1080;
  canvas.height = 1920;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Gambar tidak dapat dibuat di perangkat ini.");
  const css = getComputedStyle(document.documentElement);
  const color = (token: string) => css.getPropertyValue(token).trim();
  const ink = color("--poster-ink");
  const paper = color("--poster-paper");
  const pink = color("--poster-pink");
  const teal = color("--poster-teal");
  const yellow = color("--poster-yellow");
  const text = (value: string, x: number, y: number, size: number, fill = ink, font = "Nunito") => {
    ctx.fillStyle = fill;
    ctx.font = `800 ${size}px ${font}, sans-serif`;
    ctx.textAlign = "center";
    ctx.fillText(value, x, y);
  };
  ctx.fillStyle = paper;
  ctx.fillRect(0, 0, 1080, 1920);
  ctx.fillStyle = teal;
  ctx.fillRect(0, 0, 1080, 24);
  ctx.fillStyle = yellow;
  ctx.beginPath(); ctx.moveTo(0, 40); ctx.lineTo(205, 40); ctx.lineTo(0, 245); ctx.fill();
  ctx.fillStyle = pink;
  ctx.beginPath(); ctx.moveTo(1080, 40); ctx.lineTo(875, 40); ctx.lineTo(1080, 245); ctx.fill();
  text("Go-Qiu", 540, 215, 128, teal, "Fredoka");
  text(comp.kind === "quiz" ? "QUIZ LIVE" : "KOMPETISI HITUNG", 540, 295, 32, pink);

  // Fit even long titles within the reserved four-line region.
  let size = 68;
  let lines: string[] = [];
  for (; size >= 22; size -= 2) {
    ctx.font = `700 ${size}px Fredoka, sans-serif`;
    lines = [];
    let line = "";
    for (const word of comp.title.split(/\s+/)) {
      if (ctx.measureText(word).width > 880) {
        if (line) { lines.push(line); line = ""; }
        let chunk = "";
        for (const char of word) {
          if (ctx.measureText(chunk + char).width > 880) { lines.push(chunk); chunk = ""; }
          chunk += char;
        }
        line = chunk;
      } else if (line && ctx.measureText(`${line} ${word}`).width > 880) {
        lines.push(line); line = word;
      } else line = line ? `${line} ${word}` : word;
    }
    if (line) lines.push(line);
    if (lines.length <= 4) break;
  }
  const lineHeight = size * 1.2;
  const titleStart = 440 - ((lines.length - 1) * lineHeight) / 2;
  lines.forEach((line, i) => text(line, 540, titleStart + i * lineHeight, size, ink, "Fredoka"));
  const date = new Date(comp.start_at);
  const dateText = new Intl.DateTimeFormat("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Jakarta" }).format(date);
  const timeText = new Intl.DateTimeFormat("id-ID", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "Asia/Jakarta" }).format(date);
  ctx.fillStyle = color("--poster-tint");
  ctx.beginPath(); ctx.roundRect(100, 620, 880, 160, 28); ctx.fill();
  text(dateText, 540, 685, 36);
  text(`Pukul ${timeText} WIB`, 540, 742, 38, teal);
  text("PINDAI & IKUT LOMBA", 540, 866, 34, pink);
  const qr = document.createElement("canvas");
  await QRCode.toCanvas(qr, participantUrl(origin, comp.join_code), { width: 680, margin: 4, errorCorrectionLevel: "M", color: { dark: color("--poster-qr-ink"), light: color("--poster-qr-paper") } });
  ctx.drawImage(qr, 200, 900, 680, 680);
  text("KODE LOMBA", 540, 1632, 26, teal);
  text(comp.join_code, 540, 1715, 70, ink, "Fredoka");
  text("Belajar seru. Berani mencoba. Jadi juara!", 540, 1800, 30);
  ctx.fillStyle = pink; ctx.fillRect(0, 1860, 360, 60);
  ctx.fillStyle = yellow; ctx.fillRect(360, 1860, 360, 60);
  ctx.fillStyle = teal; ctx.fillRect(720, 1860, 360, 60);
  return new Promise((resolve, reject) => canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error("Gagal membuat poster.")), "image/png"));
}