import { useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import SceneShell from "./SceneShell.jsx";
import { useThrottled } from "./useThrottled.js";
import { Vehicle, RulerTrack } from "./primitives.jsx";
import { Readout, Slider } from "../components/ui.jsx";

export default function Lesson7NewtonForces2() {
  const [mass, setMass] = useState(800); // kg
  const [force, setForce] = useState(4000); // N
  const [friction, setFriction] = useState(500); // N
  const [playing, setPlaying] = useState(false);
  const [resetKey, setResetKey] = useState(0);
  const [live, setLive] = useState({ v: 0, x: 0, t: 0 });

  const fRes = Math.max(force - friction, 0);
  const accel = mass > 0 ? fRes / mass : 0;
  const vKmh = live.v * 3.6;

  return (
    <div className="lesson__canvas">
      <SceneShell cameraPosition={[4, 3.4, 14]} controlsTarget={[8, 0.2, 0]}>
        <RulerTrack length={16} start={0} />
        <RaceCar key={resetKey} playing={playing} resetKey={resetKey} accel={accel} onUpdate={setLive} />
      </SceneShell>

      <div className="panel">
        <p className="panel__eyebrow">Aula 7 · Aceleração e força</p>
        <h1>Carro de corrida acelerando</h1>
        <div className="controls">
          <Slider label="Massa do carro" value={mass} onChange={setMass} min={400} max={1600} step={50} unit=" kg" />
          <Slider label="Força do motor" value={force} onChange={setForce} min={1000} max={8000} step={250} unit=" N" />
          <Slider label="Atrito + resistência" value={friction} onChange={setFriction} min={0} max={3000} step={100} unit=" N" />
          <div className="btnRow">
            <button className="btn btn--primary" onClick={() => setPlaying(true)}>
              ▶ Acelerar
            </button>
            <button
              className="btn btn--ghost"
              onClick={() => {
                setPlaying(false);
                setLive({ v: 0, x: 0, t: 0 });
                setResetKey((k) => k + 1);
              }}
            >
              ↺
            </button>
          </div>
          <Readout
            items={[
              { label: "FRes = F − atrito", value: `${fRes} N` },
              { label: "a = FRes / m", value: `${accel.toFixed(2)} m/s²` },
              { label: "Velocidade (m/s)", value: `${live.v.toFixed(1)} m/s` },
              { label: "Velocidade (km/h)", value: `${vKmh.toFixed(0)} km/h` },
            ]}
          />
        </div>
        <p style={{ fontSize: "0.82rem", color: "#a6adc9", marginTop: 14 }}>
          Para converter: km/h ÷ 3,6 = m/s. Aqui, quanto maior a força do motor e menor a massa ou o
          atrito, maior a aceleração resultante — exatamente como nos exercícios de corrida da aula.
        </p>
      </div>
    </div>
  );
}

function RaceCar({ playing, resetKey, accel, onUpdate }) {
  const ref = useRef();
  const state = useRef({ x: 0, v: 0, t: 0 });
  const report = useThrottled(onUpdate);

  useFrame((_, delta) => {
    if (!playing) return;
    const s = state.current;
    s.v += accel * delta;
    s.x += s.v * delta;
    s.t += delta;
    if (s.x > 15) {
      s.x = 15;
      s.v = 0;
    }
    if (ref.current) ref.current.position.x = s.x;
    report({ v: s.v, x: s.x, t: s.t });
  });

  return (
    <group key={resetKey} ref={ref} position={[0, 0.3, 0]}>
      <Vehicle color="#ef4444" />
    </group>
  );
}
