import "./Portraits.css";

// Retratos ilustrados (desenho original, em vetor) de Galileu Galilei e de
// Aristóteles, inspirados na iconografia clássica de cada um: Galileu idoso,
// de barba ruiva-grisalha, gola branca e roupa preta (como nos retratos do
// século XVII); Aristóteles como os bustos de mármore gregos, de cabelo e
// barba encaracolados e manto sobre o ombro.

export function GalileoPortrait() {
  return (
    <svg viewBox="0 0 100 100" className="portrait__svg" aria-hidden="true">
      <defs>
        <radialGradient id="gal-bg" cx="40%" cy="35%" r="75%">
          <stop offset="0" stopColor="#7a5a32" />
          <stop offset="1" stopColor="#2a1c0f" />
        </radialGradient>
        <linearGradient id="gal-skin" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#e2b48f" />
          <stop offset="1" stopColor="#c48e66" />
        </linearGradient>
      </defs>
      <rect width="100" height="100" fill="url(#gal-bg)" />
      {/* roupa preta */}
      <path d="M8 100 C12 78 30 70 50 70 C70 70 88 78 92 100 Z" fill="#141414" />
      {/* gola branca caída */}
      <path d="M30 74 L50 88 L70 74 L66 70 L50 78 L34 70 Z" fill="#efe9dc" />
      {/* pescoço */}
      <path d="M43 60 L57 60 L58 72 L42 72 Z" fill="#c48e66" />
      {/* rosto */}
      <ellipse cx="50" cy="44" rx="16" ry="20" fill="url(#gal-skin)" />
      {/* cabelo grisalho dos lados, careca no alto */}
      <path d="M34 42 C33 28 40 22 50 22 C60 22 67 28 66 42 C64 34 60 30 50 30 C40 30 36 34 34 42 Z" fill="#b9a48a" />
      <path d="M33 44 C31 50 33 56 36 58 L37 46 Z M67 44 C69 50 67 56 64 58 L63 46 Z" fill="#a8927a" />
      {/* barba e bigode ruivo-grisalhos */}
      <path
        d="M35 50 C36 64 42 72 50 74 C58 72 64 64 65 50 C61 58 57 60 50 60 C43 60 39 58 35 50 Z"
        fill="#a7774d"
      />
      <path d="M42 53 C46 51 54 51 58 53 C55 55 45 55 42 53 Z" fill="#8f6440" />
      {/* olhos e sobrancelhas */}
      <path d="M40 40 L46 39 M54 39 L60 40" stroke="#6b5642" strokeWidth="1.6" strokeLinecap="round" />
      <ellipse cx="43.5" cy="43" rx="2" ry="1.3" fill="#2a1d14" />
      <ellipse cx="56.5" cy="43" rx="2" ry="1.3" fill="#2a1d14" />
      <path d="M50 44 L48 50 L51 50" stroke="#a9755a" strokeWidth="1.2" fill="none" />
      {/* luneta */}
      <g transform="rotate(-28 78 82)">
        <rect x="62" y="79" width="34" height="6" rx="2" fill="#7b4f22" />
        <rect x="62" y="79" width="5" height="6" fill="#c9a23f" />
        <rect x="90" y="78" width="6" height="8" rx="1" fill="#c9a23f" />
      </g>
    </svg>
  );
}

export function AristotlePortrait() {
  return (
    <svg viewBox="0 0 100 100" className="portrait__svg" aria-hidden="true">
      <defs>
        <radialGradient id="ari-bg" cx="40%" cy="35%" r="75%">
          <stop offset="0" stopColor="#5d7ea6" />
          <stop offset="1" stopColor="#1e2c45" />
        </radialGradient>
        <linearGradient id="ari-marble" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stopColor="#f4efe6" />
          <stop offset="1" stopColor="#c9c1b3" />
        </linearGradient>
      </defs>
      <rect width="100" height="100" fill="url(#ari-bg)" />
      {/* manto (himation) sobre o ombro, em mármore */}
      <path d="M10 100 C14 80 30 72 50 72 C70 72 86 80 90 100 Z" fill="url(#ari-marble)" />
      <path d="M22 84 C36 78 52 90 72 76 M18 94 C34 86 54 98 80 86" stroke="#b4ab9c" strokeWidth="1.6" fill="none" />
      {/* pescoço */}
      <path d="M43 60 L57 60 L58 74 L42 74 Z" fill="#ddd5c7" />
      {/* rosto */}
      <ellipse cx="50" cy="43" rx="15" ry="19" fill="url(#ari-marble)" />
      {/* cabelo curto encaracolado */}
      <g fill="#d9d1c3" stroke="#b6ad9e" strokeWidth="0.8">
        {[
          [38, 28], [44, 25], [50, 24], [56, 25], [62, 28], [35, 34], [65, 34],
        ].map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r="4.2" />
        ))}
      </g>
      {/* barba encaracolada */}
      <g fill="#d6cebf" stroke="#b1a898" strokeWidth="0.8">
        {[
          [38, 52], [44, 58], [50, 61], [56, 58], [62, 52], [41, 64], [47, 67], [53, 67], [59, 64], [50, 71],
        ].map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r="4.6" />
        ))}
      </g>
      {/* olhos (vazados, como nas estátuas) e nariz */}
      <path d="M40 39 L46 38 M54 38 L60 39" stroke="#9d9486" strokeWidth="1.6" strokeLinecap="round" />
      <ellipse cx="43.5" cy="42" rx="2.2" ry="1.2" fill="#a59c8e" />
      <ellipse cx="56.5" cy="42" rx="2.2" ry="1.2" fill="#a59c8e" />
      <path d="M50 42 L48 50 L52 50" stroke="#a59c8e" strokeWidth="1.2" fill="none" />
      <path d="M45 54 C48 55 52 55 55 54" stroke="#a59c8e" strokeWidth="1.2" fill="none" />
    </svg>
  );
}

/**
 * Cartões clicáveis com os dois cientistas. `value` é a teoria ativa
 * ("aristoteles" | "galileu"); `onPick` é chamado ao clicar.
 */
export default function TheoryPortraits({ value, onPick }) {
  const people = [
    { id: "aristoteles", name: "Aristóteles", dates: "384–322 a.C.", Img: AristotlePortrait },
    { id: "galileu", name: "Galileu Galilei", dates: "1564–1642", Img: GalileoPortrait },
  ];
  return (
    <div className="portraits" role="group" aria-label="Escolha a teoria para simular">
      <p className="portraits__hint">Toque num cientista para simular a teoria dele</p>
      <div className="portraits__row">
        {people.map(({ id, name, dates, Img }) => (
          <button
            key={id}
            type="button"
            className={`portrait${value === id ? " is-on" : ""}`}
            onClick={() => onPick(id)}
            aria-pressed={value === id}
            title={`Simular a teoria de ${name}`}
          >
            <span className="portrait__frame">
              <Img />
            </span>
            <span className="portrait__name">{name}</span>
            <span className="portrait__dates">{dates}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
