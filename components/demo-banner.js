"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "rh-banner-dismissed";

export function DemoBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(sessionStorage.getItem(STORAGE_KEY) !== "1");
  }, []);

  function dismiss() {
    sessionStorage.setItem(STORAGE_KEY, "1");
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="news-strip" role="banner">
      <div className="shell">
        <span className="motif">◆ ━━━ 特報 ━━━ ◆</span>
        <span>
          Live-Angebote aus 5 Märkten
          <span className="dot" style={{ margin: "0 6px" }} />
          Next.js 15 · Turso · React 19
          <span className="dot" style={{ margin: "0 6px" }} />
          von <a href="https://jiazheng.dev" target="_blank" rel="noreferrer">Jiazheng Tian</a>
        </span>
        <span className="motif">◆ ━━━ 速報 ━━━ ◆</span>
        <button className="news-strip-close" onClick={dismiss} aria-label="Banner schließen">✕</button>
      </div>
    </div>
  );
}
