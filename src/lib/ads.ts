/**
 * Ad control. While a player is inside a live competition match we suppress
 * every full-screen / interstitial / pop-up ad so nothing distracts them.
 */
let inCompetition = false;

export function setInCompetition(active: boolean) {
  inCompetition = active;
  if (typeof window !== "undefined") {
    (window as any).is_in_competition = active;
  }
}

export function isInCompetition(): boolean {
  if (typeof window !== "undefined" && typeof (window as any).is_in_competition === "boolean") {
    return (window as any).is_in_competition;
  }
  return inCompetition;
}

export function showAdThen(callback: () => void, delayMs = 3000): () => void {
  let done = false;
  const finish = () => {
    if (!done) {
      done = true;
      callback();
    }
  };

  if (typeof window === "undefined" || isInCompetition()) {
    // No interstitial ads during a competition match.
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
