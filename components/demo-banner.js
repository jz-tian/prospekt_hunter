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
    <div className="demo-banner" role="banner">
      <div className="demo-banner-inner">
        <span className="demo-banner-badge">Demo</span>
        <span className="demo-banner-text">
          Live German supermarket discount tracker scraped from 5 retailers
          <span className="demo-banner-sep"> · </span>
          built by <a href="https://jiazheng.dev" target="_blank" rel="noreferrer">Jiazheng Tian</a>
        </span>
        <span className="demo-banner-sep">·</span>
        <span className="demo-banner-tags">
          <span className="demo-tag">Next.js 15</span>
          <span className="demo-tag">Turso</span>
          <span className="demo-tag">React 19</span>
          <span className="demo-tag">Live APIs</span>
        </span>
      </div>
      <button className="demo-banner-close" onClick={dismiss} aria-label="Banner schließen">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
          <path d="M18 6 6 18M6 6l12 12"/>
        </svg>
      </button>
    </div>
  );
}
