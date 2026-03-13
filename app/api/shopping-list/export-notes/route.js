import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { NextResponse } from "next/server";
import { listShoppingItems } from "@/lib/db";
import { formatEuro } from "@/lib/format";

const execFileAsync = promisify(execFile);

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll("\"", "&quot;");
}

function buildGroupedSummaries(items) {
  const grouped = items.reduce((accumulator, item) => {
    accumulator[item.retailerName] ??= [];
    accumulator[item.retailerName].push(item);
    return accumulator;
  }, {});

  return Object.entries(grouped).map(([retailerName, retailerItems]) => ({
    retailerName,
    items: retailerItems,
    total: retailerItems.reduce((sum, item) => sum + item.salePrice * item.quantity, 0)
  }));
}

function buildNotesHtml(items) {
  const grouped = buildGroupedSummaries(items);
  const total = items.reduce((sum, item) => sum + item.salePrice * item.quantity, 0);
  const sections = grouped
    .map((summary) => {
      const lines = summary.items
        .map(
          (item) =>
            `<li>${item.checked ? "☑" : "☐"} ${item.quantity}x ${escapeHtml(item.productName)} ` +
            `(${escapeHtml(formatEuro(item.salePrice))})</li>`
        )
        .join("");

      return `<h2>${escapeHtml(summary.retailerName)} · ${escapeHtml(formatEuro(summary.total))}</h2><ul>${lines}</ul>`;
    })
    .join("");

  return `<html><body><h1>Einkaufsliste</h1>${sections}<p><strong>Gesamtsumme: ${escapeHtml(formatEuro(total))}</strong></p></body></html>`;
}

export async function POST() {
  if (process.platform !== "darwin") {
    return NextResponse.json({ message: "Notizen-Export ist nur auf macOS verfügbar." }, { status: 400 });
  }

  const items = listShoppingItems();

  if (items.length === 0) {
    return NextResponse.json({ message: "Die Einkaufsliste ist leer." }, { status: 400 });
  }

  const title = `Einkaufsliste ${new Date().toLocaleDateString("de-DE")}`;
  const body = buildNotesHtml(items);
  const script = `
    tell application "Notes"
      activate
      tell first account
        if (count of folders) is 0 then error "No notes folder available."
        set targetFolder to first folder
        set newNote to make new note at targetFolder with properties {name:${JSON.stringify(title)}, body:${JSON.stringify(body)}}
      end tell
      show newNote
    end tell
  `;

  try {
    await execFileAsync("osascript", ["-e", script]);
    return NextResponse.json({ message: "In Apple Notizen exportiert." });
  } catch (error) {
    return NextResponse.json(
      { message: "Notizen-Export fehlgeschlagen.", detail: String(error?.stderr || error?.message || error) },
      { status: 500 }
    );
  }
}
