import Link from "next/link";

function withWeek(href, weekScope) {
  const separator = href.includes("?") ? "&" : "?";
  return `${href}${separator}week=${weekScope}`;
}

export function WeekScopeSwitcher({ weekScope = "current", href = "/" }) {
  return (
    <div className="week-switcher">
      <Link href={withWeek(href, "current")} className={`week-tab${weekScope === "current" ? " week-tab--active" : ""}`}>
        Diese Woche
      </Link>
      <Link href={withWeek(href, "next")} className={`week-tab${weekScope === "next" ? " week-tab--active" : ""}`}>
        Nächste Woche
      </Link>
    </div>
  );
}
