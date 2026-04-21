"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

const STORAGE_KEY = "rh-admin-key";

export function RefreshDataButton({ weekScope = "current" }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [phase, setPhase] = useState("idle"); // idle | prompting | busy
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const inputRef = useRef(null);

  function handleClick() {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    if (stored) {
      doRefresh(stored);
    } else {
      setError("");
      setMessage("");
      setPhase("prompting");
      setTimeout(() => inputRef.current?.focus(), 40);
    }
  }

  async function doRefresh(key) {
    setPhase("busy");
    setError("");
    setMessage("");

    try {
      const res = await fetch(`/api/refresh?week=${weekScope}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${key}` },
      });

      if (res.status === 401 || res.status === 403) {
        sessionStorage.removeItem(STORAGE_KEY);
        setError("Falsches Passwort.");
        setPhase("prompting");
        setTimeout(() => inputRef.current?.focus(), 40);
        return;
      }

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      sessionStorage.setItem(STORAGE_KEY, key);
      const payload = await res.json();
      setMessage(payload?.status?.detail || "Daten aktualisiert.");
      setPhase("idle");
      startTransition(() => router.refresh());
    } catch {
      setError("Aktualisierung fehlgeschlagen.");
      setPhase("idle");
    }
  }

  function handleSubmit(e) {
    e.preventDefault();
    const key = inputRef.current?.value?.trim();
    if (key) doRefresh(key);
  }

  function handleCancel() {
    setPhase("idle");
    setError("");
  }

  return (
    <div className="refresh-control">
      {phase === "prompting" ? (
        <form className="admin-key-form" onSubmit={handleSubmit}>
          <input
            ref={inputRef}
            type="password"
            placeholder="Admin-Schlüssel"
            className="admin-key-input"
            autoComplete="off"
          />
          <button type="submit" className="admin-btn">OK</button>
          <button type="button" className="admin-btn" onClick={handleCancel} style={{ background: "var(--surface)", color: "var(--text)" }}>
            Abbrechen
          </button>
        </form>
      ) : (
        <button
          type="button"
          className="refresh-btn"
          onClick={handleClick}
          disabled={phase === "busy" || isPending}
        >
          <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
            <path d="M14 8a6 6 0 1 1-1.8-4.3"/>
            <path d="M14 2v4h-4"/>
          </svg>
          {phase === "busy" || isPending ? "Aktualisiere…" : "Daten aktualisieren"}
        </button>
      )}
      {message && <span className="refresh-status success">{message}</span>}
      {error && <span className="refresh-status error">{error}</span>}
    </div>
  );
}
