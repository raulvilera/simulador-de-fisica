import { useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import SceneShell from "./SceneShell.jsx";
import { Vehicle, RulerTrack } from "./primitives.jsx";
import { Readout, Slider } from "../components/ui.jsx";

const SCENE_LENGTH = 8;

export default function Lesson9LabAcceleration() {
  const [running, setRunning] = useState(false);
  const [boost, setBoost] = useState(1); // 1 = impulso fraco, 2 = impulso forte
  const [resetKey, setResetKey] = useState(0);
  const [readings, setReadings] = useState([]); // [{v, boost}]
  const [dt, setDt] = useState(3);

  const launch = (level) => {
    setBoost(level);
    setRunning(true);
  };

  const onFinish = (v, level) => {
    setRunning(false);
    setReadings((prev) => (prev.length >= 2 ? prev : [...prev, { v, boost: level }]));
  };

  const v1 = readings[0]?.v ?? null;
  const v2 = readings[1]?.v ?? null;
  const deltaV = v1 != null && v2 != null ? v2 - v1 : null;
  const accel = deltaV != null ? deltaV / dt : null;

  return (
    <div className="lesson__canvas">
      <SceneShell cameraPosition={[2, 2.4, 8.5]} controlsTarget={[4.2, 0.2, 0]}>
        <RulerTrack length={SCENE_LENGTH} start={0} />
        <FrictionCart
          running={running}
          boost={boost}
          resetKey={resetKey}
          onFinish={onFinish}
        />
      </SceneShell>

      <div className="panel" style={panelOverlayStyle}>
        <p className="panel__eyebrow">Aula 9 · Desafio experimental</p>
        <h1>Calculando a aceleração</h1>
        <div className="controls">
          <div className="btnRow">
            <button className="btn btn--primary" onClick={() => launch(1)} disabled={running || readings.length >= 1}>
              ▶ Medição 1 (impulso fraco)
            </button>
          </div>
          <div className="btnRow">
            <button className="btn btn--primary" onClick={() => launch(2)} disabled={running || readings.length !== 1}>
              ▶ Medição 2 (impulso forte)
            </button>
          </div>
          <div className="btnRow">
            <button
              className="btn btn--ghost"
              onClick={() => {
                setReadings([]);
                setRunning(false);
                setResetKey((k) => k + 1);
              }}
            >
              ↺ Reiniciar
            </button>
          </div>
          <Slider label="Δt entre medições" value={dt} onChange={setDt} min={1} max={6} step={0.5} unit=" s" />
          <Readout
            items={[
              { label: "V1 (fraco)", value: v1 != null ? `${v1.toFixed(1)} cm/s` : "—" },
              { label: "V2 (forte)", value: v2 != null ? `${v2.toFixed(1)} cm/s` : "—" },
              { label: "ΔV = V2 − V1", value: deltaV != null ? `${deltaV.toFixed(1)} cm/s` : "—" },
              { label: "a = ΔV/Δt", value: accel != null ? `${accel.toFixed(2)} cm/s²` : "—" },
            ]}
          />
        </div>
        <p style={{ fontSize: "0.82rem", color: "#a6adc9", marginTop: 10 }}>
          Faça a medição 1 (impulso fraco) e a medição 2 (impulso forte); a cena calcula a variação
          de velocidade (ΔV) e, dividindo pelo intervalo de tempo entre as medições, obtém a
          aceleração média — mesmo princípio de a = ΔV/Δt usado em toda a aula.
        </p>
      </div>
    </div>
  );
}

function FrictionCart({ running, boost, resetKey, onFinish }) {
  const ref = useRef();
  const t = useRef(0);
  const speed = useRef(2);

  useFrame((_, delta) => {
    if (!running) return;
    if (t.current === 0) speed.current = boost === 2 ? 4 + Math.random() * 0.6 : 2 + Math.random() * 0.4;
    t.current += delta;
    const x = Math.min(speed.current * t.current, SCENE_LENGTH);
    if (ref.current) ref.current.position.x = x;
    if (x >= SCENE_LENGTH) {
      const v = (SCENE_LENGTH / t.current) * 3; // escala para "cm/s" ilustrativo
      onFinish?.(v, boost);
      t.current = 0;
    }
  });

  return (
    <group key={resetKey + "-" + boost} ref={ref} position={[0, 0.25, 0]} scale={0.7}>
      <Vehicle color={boost === 2 ? "#ef4444" : "#3b82f6"} />
    </group>
  );
}

const panelOverlayStyle = {
  position: "absolute",
  top: 0,
  right: 0,
  width: 340,
  height: "100%",
  background: "rgba(10,14,26,0.72)",
  backdropFilter: "blur(8px)",
  borderLeft: "1px solid rgba(255,255,255,0.08)",
};
