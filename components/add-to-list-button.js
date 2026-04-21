"use client";

import { useState, useTransition } from "react";

export function AddToListButton({ offerId }) {
  const [pending, startTransition] = useTransition();
  const [done, setDone] = useState(false);
  const [error, setError] = useState(false);
  const [flash, setFlash] = useState(false);

  function handleClick() {
    if (done) return;
    startTransition(async () => {
      const response = await fetch("/api/shopping-list", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ offerId, quantity: 1 })
      });

      if (response.ok) {
        setDone(true);
        setFlash(true);
        setTimeout(() => setFlash(false), 520);
        window.dispatchEvent(new CustomEvent("shopping-list-updated"));
      } else {
        setError(true);
      }
    });
  }

  const label = done
    ? "Bereits in der Einkaufsliste"
    : error
    ? "Fehler beim Hinzufügen"
    : "Zur Einkaufsliste hinzufügen";

  return (
    <button
      type="button"
      className={`add-stamp${done ? " added" : ""}${error ? " error" : ""}${flash ? " flash" : ""}`}
      onClick={handleClick}
      disabled={pending || done}
      aria-label={label}
      title={label}
    >
      {pending ? (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true" style={{ animation: "spin 600ms linear infinite" }}>
          <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
        </svg>
      ) : done ? "✓" : "＋"}
    </button>
  );
}
