import { useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import SceneShell from "./SceneShell.jsx";
import { useThrottled } from "./useThrottled.js";
import { Vehicle, RulerTrack } from "./primitives.jsx";
import { Readout } from "../components/ui.jsx";

const TRACK_LENGTH_CM = 24; // comprimento fixo da "pista", como no roteiro da aula
const SCENE_LENGTH = 8; // unidades de cena equivalentes aos 24 cm

export default function Lesson8LabVelocity() {
  const [running, setRunning] = useState(false);
  const [resetKey, setResetKey] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [trials, setTrials] = useState([]);

  const launch = () => {
    setElapsed(0);
    setRunning(true);
  };

  const onFinish = (time) => {
    setRunning(false);
    setElapsed(time);
    setTrials((prev) =>
      prev.length >= 5
        ? prev
        : [...prev, { ds: TRACK_LENGTH_CM, dt: time, v: TRACK_LENGTH_CM / time }]
    );
  };

  const avgV =
    trials.length > 0 ? trials.reduce((a, t) => a + t.v, 0) / trials.length : 0;

  return (
    <div className="lesson__canvas">
      <SceneShell cameraPosition={[2, 2.4, 8.5]} controlsTarget={[4.2, 0.2, 0]}>
        <RulerTrack length={SCENE_LENGTH} start={0} highlight={[0, SCENE_LENGTH]} />
        <FrictionCart
          running={running}
          resetKey={resetKey}
          onFinish={onFinish}
          onTick={setElapsed}
        />
      </SceneShell>

      <div className="panel" style={panelOverlayStyle}>
        <p className="panel__eyebrow">Aula 8 · Desafio experimental</p>
        <h1>Carrinho de fricção: medindo v</h1>
        <div className="controls">
          <div className="btnRow">
            <button className="btn btn--primary" onClick={launch} disabled={running}>
              ▶ Soltar carrinho
            </button>
            <button
              className="btn btn--ghost"
              onClick={() => {
                setRunning(false);
                setTrials([]);
                setElapsed(0);
                setResetKey((k) => k + 1);
              }}
            >
              ↺ Zerar tudo
            </button>
          </div>
          <div className="speedo">
            <div className="readout__label">Cronômetro</div>
            <div className="readout__value" style={{ fontSize: "1.8rem" }}>
              {elapsed.toFixed(2)} s
            </div>
          </div>
          <Readout
            items={[
              { label: "ΔS (pista)", value: `${TRACK_LENGTH_CM} cm` },
              { label: "Medições feitas", value: `${trials.length} / 5` },
              { label: "v média (ΔS/Δt)", value: trials.length ? `${avgV.toFixed(1)} cm/s` : "—" },
            ]}
          />
          <table className="labTable">
            <thead>
              <tr>
                <th>Δt (s)</th>
                <th>v (cm/s)</th>
              </tr>
            </thead>
            <tbody>
              {trials.map((t, i) => (
                <tr key={i}>
                  <td>{t.dt.toFixed(2)}</td>
                  <td>{t.v.toFixed(1)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p style={{ fontSize: "0.82rem", color: "#a6adc9", marginTop: 10 }}>
          Repita a medição até 5 vezes (cada tentativa tem uma leve variação, como no experimento
          real). V = ΔS/Δt — os dados preenchem a mesma tabela usada na aula 9 para calcular a
          aceleração.
        </p>
      </div>
    </div>
  );
}

function FrictionCart({ running, resetKey, onFinish, onTick }) {
  const ref = useRef();
  const t = useRef(0);
  const speed = useRef(2 + Math.random() * 0.6); // variação entre tentativas
  const tick = useThrottled(onTick, 80);

  useFrame((_, delta) => {
    if (!running) return;
    t.current += delta;
    const x = Math.min(speed.current * t.current, SCENE_LENGTH);
    if (ref.current) ref.current.position.x = x;
    tick(t.current);
    if (x >= SCENE_LENGTH) {
      onFinish?.(t.current);
      speed.current = 2 + Math.random() * 0.6;
      t.current = 0;
    }
  });

  return (
    <group key={resetKey} ref={ref} position={[0, 0.25, 0]} scale={0.7}>
      <Vehicle color="#22c55e" />
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
