import { useEffect, useState } from "react";
import { Download, Printer, QrCode, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import type { PosterCompetition } from "@/lib/competition-poster";

export default function CompetitionPoster({ competition }: { competition: PosterCompetition }) {
  const [open, setOpen] = useState(false);
  const [blob, setBlob] = useState<Blob | null>(null);
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");
  const [sharing, setSharing] = useState(false);
  useEffect(() => {
    if (!open) return;
    let active = true;
    let objectUrl = "";
    setBlob(null); setUrl(""); setError("");
    import("@/lib/competition-poster").then(({ createCompetitionPoster }) => createCompetitionPoster(competition, window.location.origin)).then((image) => {
      if (!active) return;
      objectUrl = URL.createObjectURL(image); setUrl(objectUrl); setBlob(image);
    }).catch(() => { if (active) setError("Poster gagal dibuat. Tutup lalu coba lagi."); });
    return () => { active = false; if (objectUrl) URL.revokeObjectURL(objectUrl); };
  }, [open, competition.title, competition.start_at, competition.join_code, competition.kind]);
  const download = () => {
    const a = document.createElement("a"); a.href = url; a.download = `Go-Qiu-${competition.join_code}.png`; a.click();
  };
  const share = async () => {
    if (!blob) return;
    const file = new File([blob], `Go-Qiu-${competition.join_code}.png`, { type: "image/png" });
    if (!navigator.canShare?.({ files: [file] })) { download(); return; }
    setSharing(true);
    try { await navigator.share({ files: [file], title: competition.title }); }
    catch (err) { if (!(err instanceof Error && err.name === "AbortError")) setError("Bagikan belum tersedia. Gunakan Unduh PNG."); }
    finally { setSharing(false); }
  };
  const print = () => {
    const popup = window.open("", "_blank");
    if (!popup) { setError("Izinkan jendela baru untuk mencetak poster."); return; }
    popup.opener = null;
    popup.document.title = `Poster Go-Qiu — ${competition.title}`;
    const style = popup.document.createElement("style");
    style.textContent = "@page{size:A4 portrait;margin:10mm}body{margin:0;text-align:center}img{height:270mm;max-width:100%;object-fit:contain}@media screen{img{height:95vh}}";
    popup.document.head.append(style);
    const img = popup.document.createElement("img");
    img.alt = competition.title;
    img.onload = () => { popup.focus(); popup.print(); };
    img.src = url;
    popup.document.body.append(img);
  };
  return <>
    <Button variant="outline" className="btn-pop h-auto rounded-full border-2 border-border bg-card px-5 py-3 font-display font-bold" onClick={() => setOpen(true)}><QrCode /> Buat Poster QR</Button>
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-h-[94dvh] w-[calc(100%-2rem)] max-w-md overflow-y-auto bg-card p-4">
        <DialogTitle className="pr-8 font-display">Poster QR Lomba</DialogTitle>
        <div className="flex min-h-40 justify-center">
          {url ? <img src={url} alt={`Poster Go-Qiu: ${competition.title}, kode ${competition.join_code}`} className="max-h-[62dvh] w-auto max-w-full object-contain" /> : <p role="status" className="py-12 text-muted-foreground">{error || "Menyiapkan poster…"}</p>}
        </div>
        {url && <div className="grid grid-cols-3 gap-2">
          <Button onClick={download} variant="outline"><Download /> PNG</Button>
          <Button onClick={share} disabled={sharing}><Share2 /> Bagikan</Button>
          <Button onClick={print} variant="outline"><Printer /> Cetak</Button>
        </div>}
        {url && error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      </DialogContent>
    </Dialog>
  </>;
}