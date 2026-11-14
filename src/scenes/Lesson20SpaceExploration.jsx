import { useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { Line } from "@react-three/drei";
import SceneShell from "./SceneShell.jsx";
import KeepInView from "./KeepInView.jsx";
import { Panel, Note, Check, Tag, Sun, Earth, Planet, OrbitRing } from "./space.jsx";
import { Readout } from "../components/ui.jsx";
import { QuantityTag, QuantityToggles } from "./quantities.jsx";

// Conceitos mostrados dentro da cena (tocar na etiqueta oculta)
const Q = {
  orbita: { id: "orbita", symbol: "Órbita", name: "a gravidade da Terra mantém a nave girando", color: "#60a5fa" },
  satelite: {
    id: "satelite",
    symbol: "Satélite artificial",
    name: "objeto lançado para orbitar a Terra",
    color: "#e5e7eb",
  },
  viagem: { id: "viagem", symbol: "Trajetória", name: "viagem de ida e volta", color: "#fde68a" },
  gps: {
    id: "gps",
    symbol: "GPS",
    name: "receptor calcula a posição com sinais de vários satélites",
    color: "#86efac",
  },
};
const Q_LIST = Object.values(Q);

// Marcos da exploração espacial (datas e dados do material da aula).
const MILESTONES = [
  {
    year: "1957",
    title: "Sputnik 1",
    kind: "orbit",
    radius: 3.0,
    color: "#e5e7eb",
    text: "Primeiro satélite artificial, lançado pela União Soviética em 4 de outubro de 1957. Esférico, com quatro antenas, dava uma volta na Terra a cada 96 minutos emitindo sinais de rádio. Marcou o início da era espacial.",
  },
  {
    year: "1961",
    title: "Yuri Gagarin",
    kind: "orbit",
    radius: 3.3,
    color: "#fca5a5",
    text: 'Primeiro ser humano no espaço, a bordo da Vostok 1. Completou uma órbita ao redor da Terra em 108 minutos e disse: "A Terra é azul!".',
  },
  {
    year: "1963",
    title: "Valentina Tereshkova",
    kind: "orbit",
    radius: 3.5,
    color: "#f9a8d4",
    text: "Primeira mulher no espaço, na Vostok 6: 48 órbitas ao redor da Terra em cerca de três dias. Ajudou a estudar os efeitos do espaço no corpo humano.",
  },
  {
    year: "1969",
    title: "Apollo 11",
    kind: "moon",
    color: "#fde68a",
    text: "Em 20 de julho de 1969, Neil Armstrong e Buzz Aldrin pisaram na Lua, enquanto Michael Collins permaneceu em órbita. Impulsionou os trajes espaciais e a computação.",
  },
  {
    year: "1998",
    title: "Estação Espacial (ISS)",
    kind: "orbit",
    radius: 3.2,
    color: "#93c5fd",
    station: true,
    text: "Construída a partir de 1998 com a colaboração de vários países; habitada continuamente desde 2000. É o maior laboratório científico em órbita (microgravidade, corpo humano, tecnologias).",
  },
  {
    year: "Hoje",
    title: "Rovers em Marte",
    kind: "mars",
    color: "#f8a17f",
    text: "Robôs como Curiosity e Perseverance estudam o solo, o clima e a possibilidade de vida em Marte. A viagem dura de 6 a 7 meses.",
  },
];

function Craft({ color, station }) {
  return (
    <group>
      <mesh>
        {station ? <boxGeometry args={[0.22, 0.12, 0.12]} /> : <sphereGeometry args={[0.1, 16, 16]} />}
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.6} metalness={0.6} roughness={0.3} />
      </mesh>
      {station && (
        <mesh>
          <boxGeometry args={[0.06, 0.02, 0.7]} />
          <meshStandardMaterial color="#1d4ed8" emissive="#1d4ed8" emissiveIntensity={0.5} />
        </mesh>
      )}
    </group>
  );
}

function Orbiter({ radius, color, station, label, speed = 0.9, phase = 0, tilt = 0.35 }) {
  const ref = useRef();
  const a = useRef(phase);
  useFrame((_, delta) => {
    a.current += delta * speed;
    ref.current?.position.set(Math.cos(a.current) * radius, 0, Math.sin(a.current) * radius);
  });
  return (
    <group rotation={[tilt, 0, 0]}>
      <OrbitRing radius={radius} color="#334155" />
      <group ref={ref}>
        <Craft color={color} station={station} />
        {label && (
          <Tag position={[0, 0.4, 0]} size={0.24} color={color}>
            {label}
          </Tag>
        )}
      </group>
    </group>
  );
}

// Nave que vai e volta entre a Terra e um destino (Lua ou Marte).
function Trip({ objRef, to, color, label }) {
  const ref = useRef();
  const t = useRef(0);
  useFrame((_, delta) => {
    t.current = (t.current + delta * 0.18) % 1;
    const k = 0.5 - 0.5 * Math.cos(t.current * Math.PI * 2); // vai e volta
    ref.current?.position.set(2.6 + (to[0] - 3.4) * k, Math.sin(k * Math.PI) * 1.2, to[2] * k);
  });
  return (
    <>
      <Line points={[[2.6, 0, 0], to]} color="#334155" lineWidth={1} dashed dashSize={0.2} gapSize={0.15} />
      <group
        ref={(o) => {
          ref.current = o;
          if (objRef) objRef.current = o;
        }}
      >
        <Craft color={color} />
        <Tag position={[0, 0.4, 0]} size={0.24} color={color}>
          {label}
        </Tag>
      </group>
    </>
  );
}

// Rede de satélites de GPS: os sinais chegam a um receptor na superfície.
function Gps() {
  const receiver = [0, 1.55, 1.3];
  return (
    <>
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <Orbiter
          key={i}
          radius={5}
          color="#86efac"
          speed={0.25}
          phase={(i * Math.PI) / 3}
          tilt={0.5 + (i % 3) * 0.5}
          label={i === 0 ? "GPS" : null}
        />
      ))}
      <mesh position={receiver}>
        <sphereGeometry args={[0.09, 12, 12]} />
        <meshBasicMaterial color="#f87171" toneMapped={false} />
      </mesh>
      <Tag position={[receiver[0], receiver[1] + 0.4, receiver[2] + 0.2]} size={0.22} color="#fca5a5">
        receptor
      </Tag>
    </>
  );
}

export default function Lesson20SpaceExploration() {
  const followRef = useRef(); // nave que a câmera acompanha
  const [index, setIndex] = useState(0);
  const [gps, setGps] = useState(false);
  const m = MILESTONES[index];

  return (
    <div className="lesson__canvas">
      <SceneShell space cameraPosition={[2, 5, 15]} controlsTarget={[2, 0, 0]} maxDistance={40}>
        {/* a câmera acompanha a nave até o destino */}
        <KeepInView targets={[followRef]} axes={[1, 0, 1]} margin={0.85} />
        <Sun position={[-30, 12, 18]} radius={1.5} />
        <SpinningEarth />
        {m.kind === "orbit" && <Orbiter radius={m.radius} color={m.color} station={m.station} label={m.title} />}
        {m.kind === "orbit" && (
          <>
            <QuantityTag
              q={Q.orbita}
              position={[-m.radius, 0.2, 0]}
              value={m.title === "Sputnik 1" ? "1 volta a cada 96 min" : undefined}
            />
            <QuantityTag q={Q.satelite} position={[0, 2.9, 0]} value={m.title} />
          </>
        )}
        {m.kind === "moon" && <QuantityTag q={Q.viagem} position={[5.8, 1.9, -1]} value="Terra → Lua ≈ 384 mil km" />}
        {m.kind === "mars" && (
          <QuantityTag q={Q.viagem} position={[6.3, 1.9, 0.5]} value="Terra → Marte: 6 a 7 meses" />
        )}
        {gps && <QuantityTag q={Q.gps} position={[0.9, 2.4, 1.5]} value="posição: latitude e longitude" />}
        {m.kind === "moon" && (
          <>
            <group position={[9, 0, -2]}>
              <Planet radius={0.55} color="#cbd5e1" />
              <Tag position={[0, 0.95, 0]}>Lua</Tag>
            </group>
            <Trip objRef={followRef} to={[9, 0, -2]} color={m.color} label="Apollo 11" />
          </>
        )}
        {m.kind === "mars" && (
          <>
            <group position={[10, 0, 1]}>
              <Planet radius={1} color="#d1603d" />
              <mesh position={[-0.45, 0.92, 0.1]}>
                <boxGeometry args={[0.18, 0.1, 0.12]} />
                <meshStandardMaterial color="#e5e7eb" emissive="#e5e7eb" emissiveIntensity={0.4} />
              </mesh>
              <Tag position={[0, 1.6, 0]} color="#f8a17f">
                Marte · rover
              </Tag>
            </group>
            <Trip objRef={followRef} to={[10, 0, 1]} color={m.color} label="sonda" />
          </>
        )}
        {gps && <Gps />}
      </SceneShell>

      <Panel eyebrow="Aula 20 · Exploração espacial" title="Do Sputnik aos rovers em Marte">
        <div className="controls">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 12 }}>
            {MILESTONES.map((x, i) => (
              <button
                key={x.year}
                className={`btn ${i === index ? "btn--primary" : "btn--ghost"}`}
                style={{ padding: "8px 4px", fontSize: "0.8rem" }}
                onClick={() => setIndex(i)}
              >
                {x.year}
              </button>
            ))}
          </div>
          <div className="btnRow" style={{ marginBottom: 12 }}>
            <button className="btn btn--ghost" onClick={() => setIndex((i) => Math.max(0, i - 1))}>
              ◀ Anterior
            </button>
            <button
              className="btn btn--primary"
              onClick={() => setIndex((i) => Math.min(MILESTONES.length - 1, i + 1))}
            >
              Próximo ▶
            </button>
          </div>
          <Check label="Mostrar satélites de GPS" checked={gps} onChange={setGps} />
          <Readout
            items={[
              { label: "Ano", value: m.year },
              { label: "Marco", value: m.title },
            ]}
          />
        </div>
        <QuantityToggles items={Q_LIST} />
        <Note>
          <b>{m.title}:</b> {m.text}
        </Note>
        <Note>
          O <b>GPS</b> usa uma rede de satélites que enviam sinais para determinar a posição (latitude e longitude).
          Outras tecnologias que vieram do espaço: termômetro infravermelho, espuma de memória, filtro UV e painéis
          solares. O Brasil participa com satélites como SGDC, CBERS (com a China) e Amazônia-1, o primeiro totalmente
          brasileiro. Fora de escala.
        </Note>
      </Panel>
    </div>
  );
}

function SpinningEarth() {
  const ref = useRef();
  useFrame((_, delta) => {
    if (ref.current) ref.current.rotation.y += delta * 0.15;
  });
  return (
    <group ref={ref}>
      <Earth radius={2} />
    </group>
  );
}
