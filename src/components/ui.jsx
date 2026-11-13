export function Slider({ label, value, onChange, min, max, step = 1, unit = "" }) {
  return (
    <div className="controls__row">
      <span style={{ minWidth: 120 }}>{label}</span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
      <span className="controls__value">
        {value}
        {unit}
      </span>
    </div>
  );
}

export function Readout({ items }) {
  return (
    <div className="readout">
      {items.map((it, i) => (
        <div className="readout__card" key={i}>
          <span className="readout__label">{it.label}</span>
          <span className="readout__value">{it.value}</span>
        </div>
      ))}
    </div>
  );
}

export function Formulas({ list }) {
  if (!list?.length) return null;
  return (
    <div className="panel__section">
      <h3>Equações</h3>
      {list.map((f, i) => (
        <span className="formula" key={i}>
          {f}
        </span>
      ))}
    </div>
  );
}
