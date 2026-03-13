import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { NextResponse } from "next/server";
import { listShoppingItems } from "@/lib/db";
import { formatEuro } from "@/lib/format";

const execFileAsync = promisify(execFile);

function buildRetailerSummaries(items) {
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

function escapeAppleScriptString(value) {
  return String(value)
    .replaceAll("\\", "\\\\")
    .replaceAll("\"", "\\\"");
}

function buildAppleScript(items) {
  const summaries = buildRetailerSummaries(items);
  const total = items.reduce((sum, item) => sum + item.salePrice * item.quantity, 0);
  const exportDate = new Date().toLocaleDateString("de-DE");
  const listName = `AngebotsRadar ${exportDate}`;
  const listNameEscaped = escapeAppleScriptString(listName);
  const summaryReminderName = escapeAppleScriptString(`Gesamtsumme ${formatEuro(total)}`);
  const summaryNote = escapeAppleScriptString(
    summaries.map((summary) => `${summary.retailerName}: ${formatEuro(summary.total)}`).join("\n")
  );

  const reminderCommands = summaries.flatMap((summary) =>
    summary.items.map((item) => {
      const title = escapeAppleScriptString(`${summary.retailerName} · ${item.quantity}x ${item.productName}`);
      const note = escapeAppleScriptString(
        [
          `Markt: ${summary.retailerName}`,
          `Preis pro Stück: ${formatEuro(item.salePrice)}`,
          `Menge: ${item.quantity}`,
          `Positionssumme: ${formatEuro(item.salePrice * item.quantity)}`
        ].join("\n")
      );

      return `
        set newReminder to make new reminder at end of reminders of targetList with properties {name:"${title}", body:"${note}"}
        set completed of newReminder to ${item.checked ? "true" : "false"}
      `;
    })
  );

  return `
    tell application "Reminders"
      activate
      if not (exists list "${listNameEscaped}") then
        make new list with properties {name:"${listNameEscaped}"}
      end if

      set targetList to list "${listNameEscaped}"
      delete every reminder of targetList

      set summaryReminder to make new reminder at end of reminders of targetList with properties {name:"${summaryReminderName}", body:"${summaryNote}"}
      set completed of summaryReminder to false

      ${reminderCommands.join("\n")}
    end tell
  `;
}

export async function POST() {
  if (process.platform !== "darwin") {
    return NextResponse.json({ message: "Erinnerungen-Export ist nur auf macOS verfügbar." }, { status: 400 });
  }

  const items = listShoppingItems();

  if (items.length === 0) {
    return NextResponse.json({ message: "Die Einkaufsliste ist leer." }, { status: 400 });
  }

  try {
    await execFileAsync("osascript", ["-e", buildAppleScript(items)]);
    return NextResponse.json({ message: "In Apple Erinnerungen exportiert." });
  } catch (error) {
    return NextResponse.json(
      {
        message: "Erinnerungen-Export fehlgeschlagen.",
        detail: String(error?.stderr || error?.message || error)
      },
      { status: 500 }
    );
  }
}
