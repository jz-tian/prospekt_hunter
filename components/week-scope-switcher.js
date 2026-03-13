import Link from "next/link";

function withWeek(href, weekScope) {
  const separator = href.includes("?") ? "&" : "?";
  return `${href}${separator}week=${weekScope}`;
}

export function WeekScopeSwitcher({ weekScope = "current", href = "/" }) {
  return (
    <div className="filters" style={{ marginBottom: 12 }}>
      <Link href={withWeek(href, "current")} className="chip" aria-current={weekScope === "current" ? "page" : undefined}>
        Diese Woche
      </Link>
      <Link href={withWeek(href, "next")} className="chip" aria-current={weekScope === "next" ? "page" : undefined}>
        Nächste Woche
      </Link>
    </div>
  );
}
