export function showAdThen(callback: () => void, delayMs = 3000): () => void {
  let done = false;
  const finish = () => {
    if (!done) {
      done = true;
      callback();
    }
  };

  if (typeof window === "undefined") {
    finish();
    return () => {};
  }

  const w = window as any;

  try {
    // Coba API umum yang sering dipakai Monetag / vignette.
    if (typeof w.showVignette === "function") {
      w.showVignette();
    } else if (typeof w.show_ === "function") {
      w.show_();
    } else if (w.monetag && typeof w.monetag.showVignette === "function") {
      w.monetag.showVignette();
    } else if (w.monetag && typeof w.monetag.show === "function") {
      w.monetag.show();
    }

    // Picu event klik pada script yang sudah disuntikkan agar Monetag mendeteksi interaksi.
    const script = document.querySelector('script[data-zone="11599940"]') as HTMLElement | null;
    if (script) {
      script.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
    }
  } catch (e) {
    console.warn("Ad trigger failed", e);
  }

  const id = window.setTimeout(finish, delayMs);
  return () => {
    if (!done) {
      window.clearTimeout(id);
      finish();
    }
  };
}
