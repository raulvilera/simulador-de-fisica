import { useEffect, useState } from "react";
import "./FormulaCard.css";

// Cartão de fórmula do painel:
//   1) a fórmula;
//   2) o conceito de cada símbolo (com a mesma cor usada na cena) e a unidade;
//   3) a aplicação: campos que o professor/aluno pode digitar (começam com os
//      valores do exemplo da aula) e a conta montada com esses valores.

export const num = (v, digits = 2) => {
  if (!Number.isFinite(v)) return "—";
  const r = Math.round(v * 10 ** digits) / 10 ** digits;
  return r.toLocaleString("pt-BR", { maximumFractionDigits: digits });
};

// Campo numérico que aceita vírgula ou ponto e não "briga" com quem digita.
export function NumberField({ value, onChange, min, max, unit, label, color }) {
  const [text, setText] = useState(num(value, 4));
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    if (!focused) setText(num(value, 4));
  }, [value, focused]);

  const parse = (t) => Number(String(t).replace(/\s/g, "").replace(",", "."));

  return (
    <label className="fcard__field">
      <span className="fcard__fieldLabel" style={{ color }}>
        {label}
      </span>
      <span className="fcard__inputWrap">
        <input
          type="text"
          inputMode="decimal"
          className="fcard__input"
          value={text}
          onFocus={(e) => {
            setFocused(true);
            e.target.select();
          }}
          onChange={(e) => {
            setText(e.target.value);
            const v = parse(e.target.value);
            if (e.target.value.trim() !== "" && Number.isFinite(v)) {
              if ((min == null || v >= min) && (max == null || v <= max)) onChange(v);
            }
          }}
          onBlur={() => {
            setFocused(false);
            let v = parse(text);
            if (!Number.isFinite(v)) v = value;
            if (min != null) v = Math.max(min, v);
            if (max != null) v = Math.min(max, v);
            onChange(v);
            setText(num(v, 4));
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") e.currentTarget.blur();
          }}
          aria-label={typeof label === "string" ? label : undefined}
        />
        {unit && <span className="fcard__unit">{unit}</span>}
      </span>
    </label>
  );
}

/**
 * props:
 *  title    – nome da fórmula ("Deslocamento")
 *  formula  – JSX da fórmula
 *  terms    – [{ symbol, name, unit, color }]  conceitos de cada símbolo
 *  inputs   – [{ key, symbol, name, unit, value, onChange, min, max, color }]
 *  steps    – JSX/texto com a conta substituída (ex.: "ΔS = 6 − 0 = 6 m")
 *  onReset  – volta para os valores do exemplo
 *  note     – observação opcional (ex.: limites da cena)
 */
export default function FormulaCard({ title, formula, terms = [], inputs = [], steps, onReset, note }) {
  return (
    <section className="panel__section fcard">
      <h3>{title}</h3>
      <div className="fcard__formula">{formula}</div>

      {terms.length > 0 && (
        <>
          <p className="fcard__sub">O que significa cada símbolo</p>
          <ul className="fcard__terms">
            {terms.map((t, i) => (
              <li key={i}>
                <b style={{ color: t.color }}>{t.symbol}</b>
                <span>
                  {t.name}
                  {t.unit && <em> ({t.unit})</em>}
                </span>
              </li>
            ))}
          </ul>
        </>
      )}

      {inputs.length > 0 && (
        <>
          <p className="fcard__sub">Aplicação: digite os valores</p>
          <div className="fcard__fields">
            {inputs.map((f) => (
              <NumberField
                key={f.key}
                label={f.symbol}
                color={f.color}
                unit={f.unit}
                value={f.value}
                onChange={f.onChange}
                min={f.min}
                max={f.max}
              />
            ))}
          </div>
        </>
      )}

      {steps && <div className="fcard__steps">{steps}</div>}
      {note && <p className="fcard__note">{note}</p>}
      {onReset && (
        <button type="button" className="btn btn--ghost fcard__reset" onClick={onReset}>
          ↺ Valores do exemplo
        </button>
      )}
    </section>
  );
}
