import { useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { Line } from "@react-three/drei";
import SceneShell from "./SceneShell.jsx";
import { Panel, Note, Check, Tag } from "./space.jsx";
import { Readout, Slider } from "../components/ui.jsx";
import { QuantityTag, QuantityToggles } from "./quantities.jsx";

// Conceitos mostrados dentro da cena (tocar na etiqueta oculta)
const Q = {
  periodo: { id: "periodo", symbol: "Período", name: "tempo novo ou tempo velho", color: "#facc15" },
  visiveis: { id: "visiveis", symbol: "Visíveis", name: "constelações acima do horizonte", color: "#4ade80" },
  abaixo: { id: "abaixo", symbol: "Abaixo do horizonte", name: "não podem ser vistas neste mês", color: "#94a3b8" },
  calendario: { id: "calendario", symbol: "Calendário", name: "o céu marca plantio, colheita, caça e pesca", color: "#fb923c" },
};
const Q_LIST = Object.values(Q);

const MONTHS = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

// Figuras ESQUEMÁTICAS (não são as posições reais das estrelas): servem para
// mostrar qual constelação marca cada época do ano na tradição guarani.
const CONSTELLATIONS = [
  {
    name: "Homem Velho (Tuya)", color: "#fca5a5", peak: 0, season: "novo",
    info: "Vista entre dezembro e maio; ligada ao período de chuvas. No mito guarani, um homem idoso que perdeu uma perna e foi transformado em constelação pelos deuses.",
    pts: [[0, 2], [0, 1.2], [-0.8, 0.9], [0.8, 0.9], [0, 0.2], [-0.5, -1.2], [0.4, -0.4]],
    seg: [[0, 1], [1, 2], [1, 3], [1, 4], [4, 5], [4, 6]],
  },
  {
    name: "Veado (Guaxu)", color: "#fde68a", peak: 3, season: "velho",
    info: "Marca a transição entre as chuvas e a seca; mais conhecida pelos povos da região Sul. Sua cauda e perna (o Cruzeiro do Sul) seguram a cabeça da Ema.",
    pts: [[-1.4, 0.3], [-0.5, 0.5], [0.8, 0.5], [1.3, 1.3], [1.6, 2], [1.0, 2.1], [-1.2, -1.2], [-0.4, -1.2], [0.7, -1.2], [1.0, -1.2]],
    seg: [[0, 1], [1, 2], [2, 3], [3, 4], [3, 5], [1, 6], [1, 7], [2, 8], [2, 9]],
  },
  {
    name: "Ema (Guyra Nhandu)", color: "#86efac", peak: 6, season: "velho",
    info: "Vista entre junho e setembro; indica a estação seca, o inverno. As manchas da Via Láctea formam a plumagem da ave.",
    pts: [[-1.2, 0], [0, 0.6], [1.0, 0.2], [0.2, -0.3], [1.3, 1.2], [1.2, 2.1], [1.6, 2.2], [-0.2, -1.6], [0.5, -1.6]],
    seg: [[0, 1], [1, 2], [2, 3], [3, 0], [2, 4], [4, 5], [5, 6], [3, 7], [3, 8]],
  },
  {
    name: "Anta (Tapi'i)", color: "#93c5fd", peak: 9, season: "novo",
    info: "Marca a transição entre a seca e as chuvas; conhecida principalmente por povos da região Norte. Fica sobre um braço da Via Láctea, o \"Caminho da Anta\".",
    pts: [[-1.5, 0.4], [-0.6, 0.9], [0.7, 0.9], [1.4, 0.5], [1.9, 0.1], [0.9, -0.2], [-1.0, -0.2], [-1.0, -1.3], [-0.5, -1.3], [0.6, -1.3], [0.9, -1.3]],
    seg: [[0, 1], [1, 2], [2, 3], [3, 4], [3, 5], [5, 6], [6, 0], [6, 7], [6, 8], [5, 9], [5, 10]],
  },
];

const R = 9; // raio da "abóbada" do céu

function Figure({ c, visible, showNames }) {
  const a = (c.peak / 12) * Math.PI * 2;
  const color = visible ? c.color : "#3a4466";
  return (
    <group rotation={[0, 0, -a]}>
      <group position={[0, R, 0]} scale={0.9}>
        {c.seg.map(([i, j], k) => (
          <Line key={k} points={[[...c.pts[i], 0], [...c.pts[j], 0]]} color={color} lineWidth={visible ? 2 : 1} />
        ))}
        {c.pts.map((p, k) => (
          <mesh key={k} position={[p[0], p[1], 0]}>
            <sphereGeometry args={[visible ? 0.11 : 0.07, 12, 12]} />
            <meshBasicMaterial color={visible ? "#ffffff" : "#56608a"} toneMapped={false} />
          </mesh>
        ))}
        {showNames && (
          <Tag position={[0, 3, 0]} color={color} size={0.42}>
            {c.name}
          </Tag>
        )}
      </group>
    </group>
  );
}

// O céu gira ao longo do ano: a constelação da época fica no alto.
function SkyWheel({ month, children }) {
  const ref = useRef();
  useFrame((_, delta) => {
    if (!ref.current) return;
    const target = ((month - 1) / 12) * Math.PI * 2;
    let d = target - ref.current.rotation.z;
    while (d > Math.PI) d -= 2 * Math.PI;
    while (d < -Math.PI) d += 2 * Math.PI;
    ref.current.rotation.z += d * Math.min(1, delta * 3);
  });
  return <group ref={ref}>{children}</group>;
}

export default function Lesson15IndigenousSky() {
  const [month, setMonth] = useState(6);
  const [names, setNames] = useState(true);
  const [sel, setSel] = useState(2);

  // Tradição guarani: tempo novo (primavera e verão, chuvas) e tempo velho
  // (outono e inverno, seca).
  const season = month >= 4 && month <= 9 ? "velho" : "novo";

  return (
    <div className="lesson__canvas">
      <SceneShell space skyBrightness={0.4} cameraPosition={[0, 5, 22]} controlsTarget={[0, 5, 0]} maxDistance={40}>
        <SkyWheel month={month}>
          {CONSTELLATIONS.map((c) => (
            <Figure key={c.name} c={c} visible={c.season === season} showNames={names} />
          ))}
        </SkyWheel>
        {/* horizonte: tudo abaixo dele está "do outro lado da Terra" */}
        <mesh position={[0, -6, 0.5]}>
          <boxGeometry args={[60, 12, 0.2]} />
          <meshBasicMaterial color="#07130d" />
        </mesh>
        <Tag position={[0, 0.5, 1]} color="#86efac" size={0.4}>
          horizonte
        </Tag>
        <QuantityTag
          q={Q.periodo}
          position={[0, 11, 1]}
          value={season === "novo" ? "Tempo novo (Ara pyau)" : "Tempo velho (Ara ymã)"}
          name={season === "novo" ? "chuvas · primavera e verão" : "seca · outono e inverno"}
        />
        <QuantityTag
          q={Q.visiveis}
          position={[-8.5, 7.5, 1]}
          value={CONSTELLATIONS.filter((c) => c.season === season).map((c) => c.name.split(" (")[0]).join(" e ")}
        />
        <QuantityTag q={Q.abaixo} position={[0, -2.2, 1]} />
        <QuantityTag q={Q.calendario} position={[8.5, 7.5, 1]} value={MONTHS[month - 1]} />
      </SceneShell>

      <Panel eyebrow="Aula 15 · Etnoastronomia" title="Constelações indígenas: o céu guarani">
        <div className="controls">
          <Slider label="Mês do ano" value={month} onChange={setMonth} min={1} max={12} step={1} />
          <Check label="Mostrar nomes" checked={names} onChange={setNames} />
          <Readout
            items={[
              { label: "Mês", value: MONTHS[month - 1] },
              { label: "Período guarani", value: season === "novo" ? "Tempo novo" : "Tempo velho" },
              { label: "Estações", value: season === "novo" ? "Primavera e verão" : "Outono e inverno" },
              { label: "Clima", value: season === "novo" ? "Chuvas" : "Seca" },
            ]}
          />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 12 }}>
            {CONSTELLATIONS.map((c, i) => (
              <button
                key={c.name}
                className={`btn ${i === sel ? "btn--primary" : "btn--ghost"}`}
                style={{ padding: "8px 6px", fontSize: "0.76rem" }}
                onClick={() => setSel(i)}
              >
                {c.name.split(" (")[0]}
              </button>
            ))}
          </div>
        </div>
        <QuantityToggles items={Q_LIST} />
        <Note>
          <b>{CONSTELLATIONS[sel].name}:</b> {CONSTELLATIONS[sel].info}
        </Note>
        <Note>
          Na tradição guarani, o ano tem dois períodos: o <b>tempo novo</b> (Ara pyau), com a Anta e
          o Homem Velho no céu, e o <b>tempo velho</b> (Ara ymã), com o Veado e a Ema. O céu
          funcionava como calendário para plantio, colheita, caça e pesca. Figuras esquemáticas: não
          representam as posições reais das estrelas.
        </Note>
      </Panel>
    </div>
  );
}
