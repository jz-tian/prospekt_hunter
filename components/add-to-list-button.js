"use client";

import { useState, useTransition } from "react";

const IconPlus = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
    <path d="M12 5v14M5 12h14"/>
  </svg>
);

const IconCheck = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M20 6 9 17l-5-5"/>
  </svg>
);

const IconSpinner = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true" style={{ animation: "spin 600ms linear infinite" }}>
    <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
  </svg>
);

export function AddToListButton({ offerId }) {
  const [pending, startTransition] = useTransition();
  const [done, setDone] = useState(false);
  const [error, setError] = useState(false);

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
      className={`add-to-list-btn${done ? " done" : ""}${error ? " error" : ""}`}
      onClick={handleClick}
      disabled={pending || done}
      aria-label={label}
      title={label}
    >
      {pending ? <IconSpinner /> : done ? <IconCheck /> : <IconPlus />}
    </button>
  );
}
