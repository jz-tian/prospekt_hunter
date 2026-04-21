import Link from "next/link";

function withWeek(href, weekScope) {
  const separator = href.includes("?") ? "&" : "?";
  return `${href}${separator}week=${weekScope}`;
}

export function WeekScopeSwitcher({ weekScope = "current", href = "/" }) {
  return (
    <div className="noren-switch" role="tablist">
      <Link
        href={withWeek(href, "current")}
        className={`noren-tab${weekScope === "current" ? " on" : ""}`}
        role="tab"
        aria-selected={weekScope === "current"}
      >
        <span className="slit" />
        <span className="jp-mini">今週</span>
        <span className="lbl">Diese Woche</span>
      </Link>
      <Link
        href={withWeek(href, "next")}
        className={`noren-tab${weekScope === "next" ? " on" : ""}`}
        role="tab"
        aria-selected={weekScope === "next"}
      >
        <span className="slit" />
        <span className="jp-mini">来週</span>
        <span className="lbl">Nächste Woche</span>
      </Link>
    </div>
  );
}
