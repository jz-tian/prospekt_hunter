"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

export function RefreshDataButton({ weekScope = "current" }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function handleRefresh() {
    setError("");
    setMessage("");

    try {
      const response = await fetch(`/api/admin/ingest/run?week=${weekScope}`, {
        method: "POST"
      });

      if (!response.ok) {
        throw new Error(`refresh failed with ${response.status}`);
      }

      setMessage("Daten aktualisiert.");
      startTransition(() => {
        router.refresh();
      });
    } catch (refreshError) {
      setError("Aktualisierung fehlgeschlagen.");
      console.error(refreshError);
    }
  }

  return (
    <div className="refresh-control">
      <button type="button" className="ghost-button refresh-button" onClick={handleRefresh} disabled={isPending}>
        {isPending ? "Aktualisiere..." : "Daten aktualisieren"}
      </button>
      {message ? <span className="refresh-status success">{message}</span> : null}
      {error ? <span className="refresh-status error">{error}</span> : null}
    </div>
  );
}
