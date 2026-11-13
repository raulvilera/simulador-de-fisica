import { useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import SceneShell from "./SceneShell.jsx";
import { Panel, Note, Check, Tag, Sun, Earth, Planet, OrbitRing } from "./space.jsx";
import { Readout, Slider } from "../components/ui.jsx";

const R_EARTH = 8; // raio da órbita da Terra na cena
const R_MOON = 1.9; // raio da órbita da Lua na cena
const YEAR = 365.25;
const MONTH = 29.5; // dias entre duas Luas novas
const TILT = (23.5 * Math.PI) / 180;

const PHASES = ["Lua nova", "Quarto crescente", "Lua cheia", "Quarto minguante"];
// Estações no hemisfério Sul; o dia 0 da simulação é o solstício de dezembro.
const SEASONS = ["Verão", "Outono", "Inverno", "Primavera"];

const phaseAngle = (day) => ((day % MONTH) / MONTH) * 360; // 0° = Lua entre a Terra e o Sol

function Bodies({ day, eclipse, showOrbits }) {
  const earthSpin = useRef();
  const ea = (day / YEAR) * Math.PI * 2;
  const ex = Math.cos(ea) * R_EARTH;
  const ez = Math.sin(ea) * R_EARTH;
  // Lua: ângulo medido a partir da direção Terra → Sol.
  const ma = ea + Math.PI + (phaseAngle(day) * Math.PI) / 180;
  const mx = Math.cos(ma) * R_MOON;
  const mz = Math.sin(ma) * R_MOON;

  useFrame(() => {
    // rotação da Terra (1 volta por dia); o eixo fica sempre inclinado 23,5°
    if (earthSpin.current) earthSpin.current.rotation.y = day * Math.PI * 2;
  });

  return (
    <>
      <Sun radius={1.3} />
      <Tag position={[0, 2, 0]} color="#ffc94d">Sol</Tag>
      {showOrbits && <OrbitRing radius={R_EARTH} color="#3b82f6" />}
      <group position={[ex, 0, ez]}>
        <group rotation={[0, 0, -TILT]}>
          <group ref={earthSpin}>
            <Earth radius={0.6} />
          </group>
          {/* eixo de rotação */}
          <mesh>
            <cylinderGeometry args={[0.015, 0.015, 1.9, 8]} />
            <meshBasicMaterial color="#e5e9f5" />
          </mesh>
        </group>
        <Tag position={[0, 1.35, 0]} color="#7dd3fc">Terra</Tag>
        {showOrbits && <OrbitRing radius={R_MOON} color="#64748b" />}
        <group position={[mx, 0, mz]}>
          <Planet radius={0.18} color={eclipse === "lunar" ? "#b4442b" : "#cbd5e1"} emissive={eclipse === "lunar" ? 0.5 : 0} />
          <Tag position={[0, 0.45, 0]} size={0.22}>Lua</Tag>
        </group>
        {/* cone de sombra desenhado só quando há alinhamento (eclipse) */}
        {eclipse && (
          <group rotation={[0, -ea, 0]}>
            <mesh position={[eclipse === "solar" ? -R_MOON / 2 : R_MOON / 2, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[eclipse === "solar" ? 0.18 : 0.5, eclipse === "solar" ? 0.05 : 0.3, R_MOON, 24, 1, true]} />
              <meshBasicMaterial color="#000000" transparent opacity={0.55} />
            </mesh>
          </group>
        )}
      </group>
    </>
  );
}

// Desenho da fase da Lua como vista da Terra (parte iluminada em branco).
function MoonIcon({ angle }) {
  const r = 26;
  const waxing = angle <= 180;
  const k = Math.abs(Math.cos((angle * Math.PI) / 180)) * r;
  const gibbous = angle > 90 && angle < 270;
  const d = `M 0 ${-r} A ${r} ${r} 0 0 1 0 ${r} A ${k} ${r} 0 0 ${gibbous ? 1 : 0} 0 ${-r} Z`;
  return (
    <svg width="64" height="64" viewBox="-32 -32 64 64" style={{ display: "block", margin: "0 auto 4px" }}>
      <circle r={r} fill="#1e2540" stroke="#3b4a7a" />
      <path d={d} fill="#f1f5ff" transform={waxing ? undefined : "scale(-1,1)"} />
    </svg>
  );
}

export default function Lesson18EarthMoon() {
  const [day, setDay] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [speed, setSpeed] = useState(3);
  const [orbits, setOrbits] = useState(true);
  const [eclipse, setEclipse] = useState(null);

  const angle = phaseAngle(day);
  const phase = PHASES[Math.round(angle / 90) % 4];
  const season = SEASONS[Math.floor(((day % YEAR) / YEAR) * 4) % 4];

  // Pula para a próxima Lua nova (eclipse solar) ou cheia (eclipse lunar).
  const goEclipse = (kind) => {
    const target = kind === "solar" ? 0 : MONTH / 2;
    const cycle = Math.floor(day / MONTH) * MONTH + target;
    setDay(cycle < day ? cycle + MONTH : cycle);
    setPlaying(false);
    setEclipse(kind);
  };

  return (
    <div className="lesson__canvas">
      <SceneShell space cameraPosition={[0, 13, 22]} controlsTarget={[0, 0, 0]} maxDistance={40}>
        <Clock playing={playing} speed={speed} setDay={setDay} />
        <Bodies day={day} eclipse={eclipse} showOrbits={orbits} />
      </SceneShell>

      <Panel eyebrow="Aula 18 · Sistema Sol-Terra-Lua" title="Movimentos da Terra e da Lua">
        <div className="controls">
          <Slider label="Dias por segundo" value={speed} onChange={setSpeed} min={1} max={30} step={1} />
          <Check label="Mostrar órbitas" checked={orbits} onChange={setOrbits} />
          <div className="btnRow">
            <button
              className="btn btn--primary"
              onClick={() => {
                setEclipse(null);
                setPlaying((p) => !p);
              }}
            >
              {playing ? "⏸ Pausar" : "▶ Continuar"}
            </button>
            <button className="btn btn--ghost" onClick={() => { setDay(0); setEclipse(null); }}>
              ↺ Reiniciar
            </button>
          </div>
          <div className="btnRow">
            <button className="btn btn--warn" onClick={() => goEclipse("solar")}>
              Eclipse solar
            </button>
            <button className="btn btn--warn" onClick={() => goEclipse("lunar")}>
              Eclipse lunar
            </button>
          </div>
          <div className="speedo" style={{ marginTop: 12 }}>
            <MoonIcon angle={angle} />
            <div className="readout__label">Lua vista da Terra</div>
            <div className="readout__value" style={{ fontSize: "1.1rem" }}>{phase}</div>
          </div>
          <Readout
            items={[
              { label: "Dia", value: Math.floor(day) },
              { label: "Estação (hemisfério Sul)", value: season },
              { label: "Alinhamento", value: eclipse === "solar" ? "Sol-Lua-Terra" : eclipse === "lunar" ? "Sol-Terra-Lua" : "—" },
              { label: "Voltas da Lua", value: (day / MONTH).toFixed(1).replace(".", ",") },
            ]}
          />
        </div>
        <Note>
          <b>Rotação</b> (cerca de 24 h): dia e noite. <b>Translação</b> (365 dias e 6 horas),
          combinada com o eixo inclinado 23,5°: estações do ano. A Lua completa uma volta ao redor
          da Terra em cerca de 29,5 dias e, como sua rotação é sincronizada, vemos sempre a mesma
          face. No <b>eclipse solar</b> a Lua fica entre o Sol e a Terra (Lua nova); no{" "}
          <b>eclipse lunar</b> a Terra fica entre o Sol e a Lua (Lua cheia), que pode ficar
          avermelhada. Tamanhos e distâncias fora de escala.
        </Note>
      </Panel>
    </div>
  );
}

function Clock({ playing, speed, setDay }) {
  useFrame((_, delta) => {
    if (playing) setDay((d) => d + delta * speed);
  });
  return null;
}
