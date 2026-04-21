export function Signboard({ jp, title, sub }) {
  return (
    <div className="signboard">
      <div className="rule" />
      <div className="title-frame">
        {jp && <span className="jp">{jp}</span>}
        <h2>{title}</h2>
        {sub && <div className="sub">{sub}</div>}
      </div>
      <div className="rule" />
    </div>
  );
}
