// Decorative SVG ornaments — original geometric motifs (no recreation of trademarked art)

function Asanoha({ size = 80, opacity = 0.15, color = "#2A1A0E" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 60 52" style={{ opacity }}>
      <g fill="none" stroke={color} strokeWidth="0.8">
        <path d="M30 0 L60 17 L60 35 L30 52 L0 35 L0 17 Z" />
        <path d="M30 0 L30 52 M0 17 L60 35 M60 17 L0 35 M30 0 L0 35 M30 0 L60 35 M30 52 L0 17 M30 52 L60 17" />
      </g>
    </svg>
  );
}

function Seigaiha({ w = 60, h = 30, opacity = 0.2, color = "#9B2335" }) {
  return (
    <svg width={w} height={h} viewBox="0 0 60 30" style={{ opacity }}>
      <g fill="none" stroke={color} strokeWidth="1">
        <path d="M0 30 A15 15 0 0 1 30 30" />
        <path d="M30 30 A15 15 0 0 1 60 30" />
        <path d="M0 30 A10 10 0 0 1 30 30" />
        <path d="M30 30 A10 10 0 0 1 60 30" />
        <path d="M0 30 A5 5 0 0 1 30 30" />
        <path d="M30 30 A5 5 0 0 1 60 30" />
      </g>
    </svg>
  );
}

function BasketIcon({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M3 8h18l-2 11H5L3 8z" />
      <path d="M3 8l3-4 4 4 M21 8l-3-4-4 4" />
      <path d="M9 12v4 M15 12v4 M12 12v4" />
    </svg>
  );
}

function EmptyBasket({ size = 64 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" stroke="#8B7355" strokeWidth="1.5">
      <path d="M10 35 L90 35 L82 85 L18 85 Z" />
      <path d="M10 35 L25 15 L40 35 M90 35 L75 15 L60 35" />
      <path d="M22 50 L78 50 M22 65 L78 65" strokeDasharray="2 3" />
      <path d="M30 35 V85 M50 35 V85 M70 35 V85" strokeDasharray="2 3" />
    </svg>
  );
}

function GlassIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="7" cy="7" r="4.5" />
      <path d="M10.5 10.5 L14 14" />
    </svg>
  );
}

function Refresh({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M14 8a6 6 0 1 1-1.8-4.3" />
      <path d="M14 2v4h-4" />
    </svg>
  );
}

Object.assign(window, { Asanoha, Seigaiha, BasketIcon, EmptyBasket, GlassIcon, Refresh });
