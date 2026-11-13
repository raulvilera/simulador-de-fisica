import { useMemo, useState } from "react";
import { Line } from "@react-three/drei";
import SceneShell from "./SceneShell.jsx";
import { Panel, Note, Choice, Check, Tag, Earth, CameraRig } from "./space.jsx";

// Estrelas de Órion: posição aparente no céu (x, y) e distância aproximada até
// a Terra, em anos-luz. Vistas da Terra parecem vizinhas; no espaço, não são.
const STARS = [
  { name: "Betelgeuse", x: -1.5, y: 2.0, ly: 550, color: "#ff8a5c", size: 0.28 },
  { name: "Bellatrix", x: 1.3, y: 1.8, ly: 250, color: "#cfe0ff", size: 0.2 },
  { name: "Alnitak", x: -0.55, y: -0.1, ly: 1260, color: "#dbe7ff", size: 0.2 },
  { name: "Alnilam", x: 0, y: 0.1, ly: 2000, color: "#dbe7ff", size: 0.22 },
  { name: "Mintaka", x: 0.55, y: 0.3, ly: 1200, color: "#dbe7ff", size: 0.2 },
  { name: "Saiph", x: -1.1, y: -2.1, ly: 650, color: "#cfe0ff", size: 0.2 },
  { name: "Rigel", x: 1.5, y: -2.0, ly: 860, color: "#bcd4ff", size: 0.28 },
];
const LINES = [
  [0, 2], [1, 4], [2, 3], [3, 4], [2, 5], [4, 6], [0, 1], [5, 6],
];
const EARTH = [0, 0, 9];
const SCALE = 1 / 160; // anos-luz → unidades de cena
const DEPTH = 13; // quanto maior, mais "fechado" o desenho visto da Terra
// Estrelas mais distantes são desenhadas maiores, para todas aparecerem com
// tamanho parecido quando vistas da Terra.
const grow = (s) => (2 + s.ly * SCALE) / 5;

// Cada estrela fica na mesma direção em que é vista da Terra, mas na sua
// própria distância — por isso o desenho só "fecha" para quem olha da Terra.
function starPosition(s) {
  const d = 2 + s.ly * SCALE;
  const len = Math.hypot(s.x, s.y, DEPTH);
  return [EARTH[0] + (s.x / len) * d, EARTH[1] + (s.y / len) * d, EARTH[2] - (DEPTH / len) * d];
}

const VIEWS = {
  earth: [0, 0, 8.5], // logo à frente da Terra, olhando para as estrelas
  side: [24, 3, 2],
  top: [0, 26, 1],
};

export default function Lesson14SkyObservation() {
  const [view, setView] = useState("earth");
  const [lines, setLines] = useState(true);
  const [names, setNames] = useState(true);
  const positions = useMemo(() => STARS.map(starPosition), []);

  return (
    <div className="lesson__canvas">
      <SceneShell space cameraPosition={VIEWS.earth} controlsTarget={[0, 0, 0]} minDistance={1} maxDistance={45}>
        <CameraRig position={VIEWS[view]} trigger={view} />
        <group position={EARTH}>
          <Earth radius={0.3} />
          <Tag position={[0, -0.6, 0]} color="#7dd3fc">
            Terra
          </Tag>
        </group>
        {STARS.map((s, i) => (
          <group key={s.name} position={positions[i]}>
            <mesh>
              <sphereGeometry args={[s.size * grow(s), 24, 24]} />
              <meshBasicMaterial color={s.color} toneMapped={false} />
            </mesh>
            {names && (
              <Tag position={[0, (s.size + 0.3) * grow(s), 0]} size={0.17 * grow(s)} color="#e5e9f5">
                {`${s.name} · ${s.ly} a.l.`}
              </Tag>
            )}
            {/* linha de visada Terra → estrela */}
            {view !== "earth" && (
              <Line
                points={[[0, 0, 0], [EARTH[0] - positions[i][0], EARTH[1] - positions[i][1], EARTH[2] - positions[i][2]]]}
                color="#2d3a66"
                lineWidth={1}
              />
            )}
          </group>
        ))}
        {lines &&
          LINES.map(([a, b], i) => (
            <Line key={i} points={[positions[a], positions[b]]} color="#7dd3fc" lineWidth={1.5} />
          ))}
      </SceneShell>

      <Panel eyebrow="Aula 14 · Observação do céu" title="Constelação: questão de ponto de vista">
        <div className="controls">
          <Choice
            value={view}
            onChange={setView}
            options={[
              { value: "earth", label: "Ver da Terra" },
              { value: "side", label: "Ver de lado" },
              { value: "top", label: "Ver de cima" },
            ]}
          />
          <Check label="Linhas da constelação" checked={lines} onChange={setLines} />
          <Check label="Nomes e distâncias" checked={names} onChange={setNames} />
          <table className="labTable">
            <thead>
              <tr>
                <th>Estrela de Órion</th>
                <th>Distância (anos-luz)</th>
              </tr>
            </thead>
            <tbody>
              {STARS.map((s) => (
                <tr key={s.name}>
                  <td>{s.name}</td>
                  <td>≈ {s.ly}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Note>
          Da Terra, as estrelas de <b>Órion</b> parecem próximas e formam um desenho — as três do
          meio são as <b>Três Marias</b>, um asterismo. Mudando o ponto de vista, o desenho se
          desfaz: elas estão a distâncias muito diferentes. Constelações são padrões imaginários,
          por isso cada cultura viu figuras diferentes no mesmo céu (para os gregos, Órion era um
          caçador).
        </Note>
        <Note>
          Instrumentos ampliaram o que vemos: a luneta de Galileu (1609), os telescópios espaciais
          Hubble (1990) e James Webb (2021) e sondas como Mariner 2, Voyager 1 e 2 e Kepler.
        </Note>
      </Panel>
    </div>
  );
}
