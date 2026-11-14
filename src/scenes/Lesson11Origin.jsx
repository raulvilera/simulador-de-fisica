import { useMemo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import SceneShell from "./SceneShell.jsx";
import { Panel, Note, Choice, Sun, Planet, Tag } from "./space.jsx";
import { Readout, Slider } from "../components/ui.jsx";
import { QuantityTag, QuantityToggles } from "./quantities.jsx";

// Conceitos mostrados dentro da cena (tocar na etiqueta oculta)
const Q = {
  bigbang: { id: "bigbang", symbol: "Big Bang", name: "toda a matéria reunida", color: "#facc15" },
  expansao: { id: "expansao", symbol: "Expansão", name: "os astros se afastam uns dos outros", color: "#60a5fa" },
  nebulosa: { id: "nebulosa", symbol: "Nebulosa", name: "nuvem de gás e poeira", color: "#c4b5fd" },
  gravidade: { id: "gravidade", symbol: "Gravidade", name: "contrai a nuvem e faz girar", color: "#f472b6" },
  disco: { id: "disco", symbol: "Disco de acreção", name: "nuvem achatada girando", color: "#fb923c" },
  sol: { id: "sol", symbol: "Sol", name: "nasce no centro, mais quente e denso", color: "#fde047" },
  planetas: { id: "planetas", symbol: "Planetas", name: "fragmentos que se juntaram na parte externa", color: "#4ade80" },
};
const Q_UNIVERSE = [Q.bigbang, Q.expansao];
const Q_SOLAR = [Q.nebulosa, Q.gravidade, Q.disco, Q.sol, Q.planetas];

const N = 900;
const PLANETS = [
  { r: 1.6, size: 0.09, color: "#9c9c9c" },
  { r: 2.1, size: 0.13, color: "#e0b672" },
  { r: 2.7, size: 0.14, color: "#3b82f6" },
  { r: 3.3, size: 0.11, color: "#d1603d" },
  { r: 4.3, size: 0.32, color: "#d9a066" },
  { r: 5.3, size: 0.27, color: "#e8d28a" },
  { r: 6.2, size: 0.2, color: "#8fd3dc" },
  { r: 7.0, size: 0.2, color: "#4f6fe0" },
];

const PLANET_TAG = [Math.cos(4 * 2.4) * PLANETS[4].r, 0, Math.sin(4 * 2.4) * PLANETS[4].r];

function rng(seed) {
  let a = seed;
  return () => {
    a = (a * 1664525 + 1013904223) % 4294967296;
    return a / 4294967296;
  };
}

// Expansão do Universo: as "galáxias" se afastam umas das outras conforme o
// tempo avança; voltando o tempo, tudo se junta (analogia da xícara quebrada).
function Expansion({ time }) {
  const group = useRef();
  const positions = useMemo(() => {
    const rand = rng(11);
    const arr = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) {
      const u = rand() * 2 - 1;
      const a = rand() * Math.PI * 2;
      const r = 9 * Math.cbrt(rand());
      const s = Math.sqrt(1 - u * u);
      arr.set([r * s * Math.cos(a), r * u, r * s * Math.sin(a)], i * 3);
    }
    return arr;
  }, []);

  useFrame(() => {
    const s = 0.02 + (time / 100) * 0.98;
    group.current?.scale.setScalar(s);
  });

  return (
    <group ref={group}>
      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        </bufferGeometry>
        <pointsMaterial size={0.16} color="#bcd4ff" sizeAttenuation toneMapped={false} />
      </points>
    </group>
  );
}

// Formação do Sistema Solar: nuvem (nebulosa) → contração e rotação → disco de
// acreção → Sol no centro e planetas na parte externa do disco.
function Formation({ time, children }) {
  const geo = useRef();
  const spin = useRef();
  const p = time / 100;
  const { cloud, disk, start } = useMemo(() => {
    const rand = rng(5);
    const c = new Float32Array(N * 3);
    const d = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) {
      const u = rand() * 2 - 1;
      const a = rand() * Math.PI * 2;
      const r = 7.5 * Math.cbrt(rand());
      const s = Math.sqrt(1 - u * u);
      c.set([r * s * Math.cos(a), r * u, r * s * Math.sin(a)], i * 3);
      const dr = 0.6 + rand() * 6.8;
      const da = rand() * Math.PI * 2;
      d.set([dr * Math.cos(da), (rand() - 0.5) * 0.18, dr * Math.sin(da)], i * 3);
    }
    return { cloud: c, disk: d, start: c.slice() };
  }, []);

  useFrame((_, delta) => {
    const k = Math.min(1, p / 0.6); // 0 → nuvem, 1 → disco
    const e = k * k * (3 - 2 * k);
    const attr = geo.current?.attributes.position;
    if (attr) {
      for (let i = 0; i < N * 3; i++) attr.array[i] = cloud[i] + (disk[i] - cloud[i]) * e;
      attr.needsUpdate = true;
    }
    if (spin.current) spin.current.rotation.y += delta * (0.05 + e * 0.5);
  });

  const sunScale = Math.max(0, Math.min(1, (p - 0.4) / 0.3));
  const planetScale = Math.max(0, Math.min(1, (p - 0.65) / 0.3));
  const dust = 1 - planetScale * 0.85;

  return (
    <group ref={spin}>
      <points>
        <bufferGeometry ref={geo}>
          <bufferAttribute attach="attributes-position" args={[start, 3]} />
        </bufferGeometry>
        <pointsMaterial size={0.11} color="#e6c79a" transparent opacity={dust} sizeAttenuation />
      </points>
      {sunScale > 0 && (
        <group scale={sunScale}>
          <Sun radius={0.8} />
        </group>
      )}
      {planetScale > 0 &&
        PLANETS.map((pl, i) => (
          <group key={i} position={[Math.cos(i * 2.4) * pl.r, 0, Math.sin(i * 2.4) * pl.r]} scale={planetScale}>
            <Planet radius={pl.size} color={pl.color} emissive={0.25} />
          </group>
        ))}
      {children}
    </group>
  );
}

function stageName(mode, time) {
  if (mode === "universe") {
    if (time < 4) return "Big Bang";
    if (time < 40) return "Universo jovem";
    return "Em expansão";
  }
  if (time < 20) return "Nebulosa";
  if (time < 45) return "Contração";
  if (time < 68) return "Disco de acreção";
  return "Sol e planetas";
}

export default function Lesson11Origin() {
  const [mode, setMode] = useState("universe");
  const [time, setTime] = useState(100);
  const [dir, setDir] = useState(0); // 1 avança, -1 volta, 0 parado

  return (
    <div className="lesson__canvas">
      <SceneShell space cameraPosition={[0, 9, 16]} controlsTarget={[0, 0, 0]}>
        <Ticker dir={dir} setTime={setTime} setDir={setDir} />
        {mode === "universe" ? (
          <Expansion time={time} />
        ) : (
          <Formation time={time}>
            {time >= 75 && <QuantityTag q={Q.planetas} position={[PLANET_TAG[0], 0.9, PLANET_TAG[2]]} />}
          </Formation>
        )}
        {mode === "universe" && time < 4 && <Tag position={[0, 1.2, 0]}>toda a matéria reunida</Tag>}
        {mode === "universe" && time < 12 && <QuantityTag q={Q.bigbang} position={[0, 2.4, 0]} value="(início)" />}
        {mode === "universe" && time >= 12 && (
          <QuantityTag q={Q.expansao} position={[time * 0.03, 2 + time * 0.012, 0]} value={`${Math.round(time)} %`} />
        )}
        {mode === "solar" && time < 45 && <QuantityTag q={Q.nebulosa} position={[4.5, 3.5, 0]} />}
        {mode === "solar" && time >= 15 && time < 60 && <QuantityTag q={Q.gravidade} position={[-4.5, 2.6, 0]} />}
        {mode === "solar" && time >= 45 && time < 80 && <QuantityTag q={Q.disco} position={[6, 0.9, 1.5]} />}
        {mode === "solar" && time >= 55 && <QuantityTag q={Q.sol} position={[0, 1.9, 0]} />}
      </SceneShell>

      <Panel eyebrow="Aula 11 · Origens" title="Do Big Bang ao Sistema Solar">
        <div className="controls">
          <Choice
            value={mode}
            onChange={(m) => {
              setMode(m);
              setDir(0);
              setTime(m === "universe" ? 100 : 0);
            }}
            options={[
              { value: "universe", label: "Expansão do Universo" },
              { value: "solar", label: "Formação do Sistema Solar" },
            ]}
          />
          <Slider label="Tempo" value={Math.round(time)} onChange={(v) => { setDir(0); setTime(v); }} min={0} max={100} unit="%" />
          <div className="btnRow">
            <button className="btn btn--ghost" onClick={() => setDir(-1)}>
              ◀ Voltar o filme
            </button>
            <button className="btn btn--primary" onClick={() => setDir(1)}>
              ▶ Avançar
            </button>
          </div>
          <Readout
            items={[
              { label: "Etapa", value: stageName(mode, time) },
              { label: "Sentido do tempo", value: dir < 0 ? "Para trás" : dir > 0 ? "Para frente" : "Pausado" },
            ]}
          />
        </div>
        <QuantityToggles items={mode === "universe" ? Q_UNIVERSE : Q_SOLAR} />
        {mode === "universe" ? (
          <Note>
            O Universo está em expansão: os astros se afastam uns dos outros. Se "voltarmos o
            filme", como no vídeo da xícara quebrando, eles se aproximam até que toda a matéria
            esteja reunida — essa é a base da <b>Teoria do Big Bang</b> (George Gamow, 1948). Na
            ciência, "teoria" é uma explicação bem fundamentada por evidências.
          </Note>
        ) : (
          <Note>
            A gravidade faz a <b>nebulosa</b> de gás e poeira se contrair e girar cada vez mais,
            formando o <b>disco de acreção</b>. No centro, mais quente e denso, nasce o Sol; na
            parte externa, fragmentos se juntam em corpos cada vez maiores até formar os planetas —
            por isso todos orbitam o Sol no mesmo sentido e quase no mesmo plano.
          </Note>
        )}
      </Panel>
    </div>
  );
}

// Anima o controle de tempo quando o professor aperta "avançar"/"voltar".
function Ticker({ dir, setTime, setDir }) {
  useFrame((_, delta) => {
    if (!dir) return;
    setTime((t) => {
      const next = t + dir * delta * 14;
      if (next >= 100 || next <= 0) {
        setDir(0);
        return Math.max(0, Math.min(100, next));
      }
      return next;
    });
  });
  return null;
}
