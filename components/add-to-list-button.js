"use client";

import { useState, useTransition } from "react";

export function AddToListButton({ offerId }) {
  const [pending, startTransition] = useTransition();
  const [label, setLabel] = useState("Zur Liste");

  function handleClick() {
    startTransition(async () => {
      const response = await fetch("/api/shopping-list", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ offerId, quantity: 1 })
      });

      if (response.ok) {
        setLabel("In Liste");
        window.dispatchEvent(new CustomEvent("shopping-list-updated"));
      } else {
        setLabel("Fehler");
      }
    });
  }

  return (
    <button type="button" className="cart-button" onClick={handleClick} disabled={pending}>
      {pending ? "..." : label}
    </button>
  );
}
