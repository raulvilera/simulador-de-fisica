import "./LiveHud.css";

/**
 * Quadro "Agora" no canto da cena: as grandezas físicas do instante atual,
 * atualizadas enquanto o movimento acontece (logo abaixo do selo da aula).
 * items: [{ symbol, value, color, note }]
 * phase: texto curto da etapa ("empurrando", "inércia", "parado"...)
 */
export default function LiveHud({ items, phase, offset = 0 }) {
  return (
    <div className="livehud" style={offset ? { marginTop: offset } : undefined} aria-live="off">
      <div className="livehud__head">
        <span className="livehud__dot" />
        Agora{phase ? <span className="livehud__phase"> · {phase}</span> : null}
      </div>
      <dl className="livehud__list">
        {items.map((it, i) => (
          <div key={i} className="livehud__row">
            <dt style={{ color: it.color }}>{it.symbol}</dt>
            <dd>
              {it.value}
              {it.note && <small> {it.note}</small>}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
