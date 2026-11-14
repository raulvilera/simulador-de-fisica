import { useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import SceneShell from "./SceneShell.jsx";
import { Panel, Note, Tag, Glow } from "./space.jsx";
import { Readout, Slider } from "../components/ui.jsx";
import { QuantityTag, QuantityToggles } from "./quantities.jsx";

// Conceitos mostrados dentro da cena (tocar na etiqueta oculta)
const Q = {
  fase: { id: "fase", symbol: "Fase", name: "etapa da vida da estrela", color: "#facc15" },
  massa: { id: "massa", symbol: "Massa", name: "define cor, tempo de vida e destino", color: "#60a5fa" },
  fusao: { id: "fusao", symbol: "Fusão nuclear", name: "hidrogênio se une formando hélio (energia)", color: "#fb923c" },
  gravidade: { id: "gravidade", symbol: "Gravidade", name: "puxa a matéria para o centro", color: "#f472b6" },
  destino: { id: "destino", symbol: "Destino final", name: "depende da massa inicial", color: "#a78bfa" },
};
const Q_LIST = Object.values(Q);

// Cor de uma estrela na fase principal conforme a massa (mais massa → mais
// quente → mais azulada).
function starColor(m) {
  if (m < 0.6) return "#ff6b3d";
  if (m < 1.5) return "#ffd35a";
  if (m < 4) return "#fff4e0";
  if (m < 12) return "#cfe0ff";
  return "#8fb4ff";
}
function colorName(m) {
  if (m < 0.6) return "Vermelha";
  if (m < 1.5) return "Amarela";
  if (m < 4) return "Branca";
  return "Azulada";
}
// Tempo de vida aproximado: o Sol (massa 1) vive cerca de 10 bilhões de anos;
// quanto maior a massa, mais rápido o hidrogênio é consumido.
function lifetime(m) {
  const years = 1e10 * Math.pow(m, -2.5);
  if (years >= 1e12) return `${(years / 1e12).toFixed(0)} trilhões de anos`;
  if (years >= 1e9) return `${(years / 1e9).toFixed(1).replace(".", ",")} bilhões de anos`;
  return `${(years / 1e6).toFixed(0)} milhões de anos`;
}
// Destino final (faixas de massa aproximadas, em massas solares).
function fate(m) {
  if (m < 8) return "Anã branca";
  if (m < 25) return "Estrela de nêutrons";
  return "Buraco negro";
}

function phaseOf(p, m) {
  if (p < 0.15) return "Nebulosa";
  if (p < 0.3) return "Protoestrela";
  if (p < 0.68) return "Fusão de hidrogênio";
  if (p < 0.86) return m < 8 ? "Gigante vermelha" : "Supergigante vermelha";
  if (p < 0.92) return m < 8 ? "Perde as camadas" : "Supernova";
  return fate(m);
}

function Nebula({ opacity }) {
  const ref = useRef();
  const positions = useMemo(() => {
    const arr = new Float32Array(700 * 3);
    let a = 3;
    const rand = () => ((a = (a * 1664525 + 1013904223) % 4294967296) / 4294967296);
    for (let i = 0; i < 700; i++) {
      const r = 4.5 * Math.cbrt(rand());
      const t = rand() * Math.PI * 2;
      const u = rand() * 2 - 1;
      const s = Math.sqrt(1 - u * u);
      arr.set([r * s * Math.cos(t), r * u * 0.7, r * s * Math.sin(t)], i * 3);
    }
    return arr;
  }, []);
  useFrame((_, d) => {
    if (ref.current) ref.current.rotation.y += d * 0.08;
  });
  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial size={0.12} color="#c9a3ff" transparent opacity={opacity} sizeAttenuation />
    </points>
  );
}

function Star({ p, mass }) {
  const f = fate(mass);
  const base = 0.5 + Math.log10(mass + 1) * 0.9; // raio na fase principal
  let radius = base;
  let color = starColor(mass);
  let label = null;

  if (p < 0.15) radius = 0;
  else if (p < 0.3) {
    radius = base * 0.5 * ((p - 0.15) / 0.15);
    color = "#ff8a4c";
  } else if (p < 0.68) radius = base;
  else if (p < 0.86) {
    const k = (p - 0.68) / 0.18;
    radius = base * (1 + k * 2.2);
    color = new THREE.Color(starColor(mass)).lerp(new THREE.Color("#ff4b2b"), k).getStyle();
  } else if (p < 0.92) {
    radius = base * 3.2 * (1 + (p - 0.86) * 9);
    color = mass < 8 ? "#ff8a6b" : "#ffffff";
  } else if (f === "Anã branca") {
    radius = 0.22;
    color = "#f4f7ff";
    label = "anã branca";
  } else if (f === "Estrela de nêutrons") {
    radius = 0.1;
    color = "#bfe3ff";
    label = "estrela de nêutrons";
  } else {
    radius = 0.6;
    label = "buraco negro";
  }

  const shell = p >= 0.86 && p < 0.92;
  const hole = p >= 0.92 && f === "Buraco negro";

  return (
    <group>
      {radius > 0 && (
        <mesh>
          <sphereGeometry args={[radius, 48, 48]} />
          <meshBasicMaterial
            color={hole ? "#000000" : color}
            transparent={shell}
            opacity={shell ? 0.45 : 1}
            toneMapped={hole}
          />
        </mesh>
      )}
      {radius > 0 && !hole && !shell && <Glow scale={radius * 5} color={color} />}
      {radius > 0 && !hole && <pointLight intensity={2} decay={0} color={color} />}
      {hole && (
        <mesh rotation={[Math.PI / 2 - 0.3, 0, 0]}>
          <torusGeometry args={[1.25, 0.16, 16, 96]} />
          <meshBasicMaterial color="#ffb347" toneMapped={false} />
        </mesh>
      )}
      {label && <Tag position={[0, hole ? 1.9 : 0.8, 0]}>{label}</Tag>}
    </group>
  );
}

export default function Lesson13StarLife() {
  const [mass, setMass] = useState(1);
  const [age, setAge] = useState(40);
  const [playing, setPlaying] = useState(false);
  const p = age / 100;

  return (
    <div className="lesson__canvas">
      <SceneShell space cameraPosition={[0, 3, 13]} controlsTarget={[0, 0, 0]}>
        <Clock playing={playing} setAge={setAge} setPlaying={setPlaying} />
        {p < 0.3 && <Nebula opacity={1 - p / 0.3} />}
        <Star p={p} mass={mass} />
        <QuantityTag q={Q.fase} position={[0, 4.2, 0]} value={phaseOf(p, mass)} />
        <QuantityTag q={Q.massa} position={[-5, 2.2, 0]} value={`= ${String(mass).replace(".", ",")} M☉`} />
        {p >= 0.3 && p < 0.86 && <QuantityTag q={Q.fusao} position={[5, 1.2, 0]} name={p < 0.68 ? "H + H → He: a energia da estrela" : "acaba o hidrogênio do núcleo"} />}
        {(p < 0.3 || p >= 0.86) && (
          <QuantityTag q={Q.gravidade} position={[5, 1.2, 0]} name={p < 0.3 ? "junta gás e poeira da nebulosa" : "sem fusão, a gravidade faz a estrela colapsar"} />
        )}
        <QuantityTag q={Q.destino} position={[-5, -2, 0]} value={fate(mass)} />
      </SceneShell>

      <Panel eyebrow="Aula 13 · Estrelas" title="Ciclo de vida das estrelas">
        <div className="controls">
          <Slider label="Massa inicial" value={mass} onChange={setMass} min={0.2} max={40} step={0.2} unit=" M☉" />
          <Slider label="Idade" value={Math.round(age)} onChange={(v) => { setPlaying(false); setAge(v); }} min={0} max={100} unit="%" />
          <div className="btnRow">
            <button
              className="btn btn--primary"
              onClick={() => {
                if (age >= 100) setAge(0);
                setPlaying((x) => !x);
              }}
            >
              {playing ? "⏸ Pausar" : "▶ Viver a estrela"}
            </button>
            <button className="btn btn--ghost" onClick={() => { setPlaying(false); setAge(0); }}>
              ↺ Reiniciar
            </button>
          </div>
          <Readout
            items={[
              { label: "Fase atual", value: phaseOf(p, mass) },
              { label: "Destino final", value: fate(mass) },
              { label: "Cor (fase principal)", value: colorName(mass) },
              { label: "Tempo de vida", value: lifetime(mass) },
            ]}
          />
        </div>
        <QuantityToggles items={Q_LIST} />
        <Note>
          Estrelas nascem em <b>nebulosas</b>: a gravidade junta gás e poeira até formar uma
          protoestrela. A energia vem da <b>fusão nuclear</b> (hidrogênio se une formando hélio) —
          o Sol não está "pegando fogo". Quando o hidrogênio acaba, a gravidade vence e a estrela
          colapsa. A <b>massa inicial</b> define a cor, o tempo de vida e o destino: anã branca,
          estrela de nêutrons ou buraco negro (de onde nem a luz escapa). M☉ = massa do Sol; faixas
          de massa aproximadas.
        </Note>
      </Panel>
    </div>
  );
}

function Clock({ playing, setAge, setPlaying }) {
  useFrame((_, delta) => {
    if (!playing) return;
    setAge((a) => {
      const next = a + delta * 7;
      if (next >= 100) {
        setPlaying(false);
        return 100;
      }
      return next;
    });
  });
  return null;
}
