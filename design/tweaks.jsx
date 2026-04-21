// Tweaks panel — palette + density + ornament toggles

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "palette": "bengara",
  "density": "normal",
  "showStamps": true,
  "grainIntensity": 0.09
}/*EDITMODE-END*/;

const PALETTES = {
  bengara: { label: "Bengara Rot", red: "#9B2335", redDeep: "#7A1A28", accent: "#D4A017" },
  sumi:    { label: "Sumi Schwarz", red: "#1F1B18", redDeep: "#0E0C0A", accent: "#D4A017" },
  ai:      { label: "Ai Indigo", red: "#2C4A6E", redDeep: "#1A3150", accent: "#D4A017" },
  cha:     { label: "Cha Sepia", red: "#8B5A2B", redDeep: "#5E3A18", accent: "#C8A028" }
};

function TweaksPanel({ state, setState }) {
  const [open, setOpen] = React.useState(false);
  React.useEffect(() => {
    const onMsg = (e) => {
      if (!e.data) return;
      if (e.data.type === "__activate_edit_mode") setOpen(true);
      if (e.data.type === "__deactivate_edit_mode") setOpen(false);
    };
    window.addEventListener("message", onMsg);
    try { window.parent.postMessage({ type: "__edit_mode_available" }, "*"); } catch (_) {}
    return () => window.removeEventListener("message", onMsg);
  }, []);

  React.useEffect(() => {
    const p = PALETTES[state.palette] || PALETTES.bengara;
    const root = document.documentElement;
    root.style.setProperty("--red", p.red);
    root.style.setProperty("--red-deep", p.redDeep);
    root.style.setProperty("--accent", p.accent);
    document.body.classList.remove("density-cozy", "density-dense");
    if (state.density !== "normal") document.body.classList.add("density-" + state.density);
  }, [state]);

  const update = (partial) => {
    const next = { ...state, ...partial };
    setState(next);
    try { window.parent.postMessage({ type: "__edit_mode_set_keys", edits: partial }, "*"); } catch (_) {}
  };

  return (
    <div className={"tweaks-panel" + (open ? " on" : "")}>
      <h4>
        Tweaks
        <span className="jp">調整</span>
      </h4>
      <div className="body">
        <div className="row">
          <span>Palette</span>
          <div className="swatches">
            {Object.entries(PALETTES).map(([k, p]) => (
              <div
                key={k}
                className={"sw" + (state.palette === k ? " on" : "")}
                title={p.label}
                style={{ background: p.red }}
                onClick={() => update({ palette: k })}
              />
            ))}
          </div>
        </div>
        <div className="row">
          <span>Dichte</span>
          <select value={state.density} onChange={e => update({ density: e.target.value })}>
            <option value="cozy">3-spaltig (großzügig)</option>
            <option value="normal">4-spaltig (normal)</option>
            <option value="dense">5-spaltig (dicht)</option>
          </select>
        </div>
        <div className="row">
          <span>Hanko-Stempel</span>
          <button className={"toggle" + (state.showStamps ? " on" : "")} onClick={() => update({ showStamps: !state.showStamps })}>
            {state.showStamps ? "An" : "Aus"}
          </button>
        </div>
        <div style={{ fontSize: 10, color: "var(--muted)", marginTop: 8, fontStyle: "italic", letterSpacing: "0.05em" }}>
          Änderungen werden gespeichert · 変更は保存されます
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { TweaksPanel, TWEAK_DEFAULTS });
