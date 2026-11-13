import { useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import SceneShell from "./SceneShell.jsx";
import { Vehicle, RulerTrack } from "./primitives.jsx";
import { Readout, Slider } from "../components/ui.jsx";

export default function Lesson5VelocityMulti() {
  const [d1, setD1] = useState(60); // km
  const [v1, setV1] = useState(20); // km/h
  const [d2, setD2] = useState(40); // km
  const [v2, setV2] = useState(40); // km/h
  const [playing, setPlaying] = useState(false);
  const [resetKey, setResetKey] = useState(0);

  const t1 = d1 / v1;
  const t2 = d2 / v2;
  const vMediaTotal = (d1 + d2) / (t1 + t2);
  const vMediaErrada = (v1 + v2) / 2;

  return (
    <div className="lesson__canvas">
      <SceneShell cameraPosition={[3.5, 3.2, 12.5]} controlsTarget={[7, 0.2, 0]}>
        <RulerTrack length={14} start={0} highlight={[0, (14 * d1) / (d1 + d2), 14]} />
        <AnimatedCar
          key={resetKey}
          playing={playing}
          resetKey={resetKey}
          t1={t1}
          t2={t2}
          splitX={(14 * d1) / (d1 + d2)}
        />
      </SceneShell>

      <div className="panel" style={panelOverlayStyle}>
        <p className="panel__eyebrow">Aula 5 · Velocidade em trechos</p>
        <h1>Percurso com dois trechos</h1>
        <div className="controls">
          <Slider label="Trecho 1 — distância" value={d1} onChange={setD1} min={10} max={150} step={5} unit=" km" />
          <Slider label="Trecho 1 — velocidade" value={v1} onChange={setV1} min={10} max={100} step={5} unit=" km/h" />
          <Slider label="Trecho 2 — distância" value={d2} onChange={setD2} min={10} max={150} step={5} unit=" km" />
          <Slider label="Trecho 2 — velocidade" value={v2} onChange={setV2} min={10} max={100} step={5} unit=" km/h" />
          <div className="btnRow">
            <button className="btn btn--primary" onClick={() => setPlaying(true)}>
              ▶ Simular percurso
            </button>
            <button
              className="btn btn--ghost"
              onClick={() => {
                setPlaying(false);
                setResetKey((k) => k + 1);
              }}
            >
              ↺
            </button>
          </div>
          <Readout
            items={[
              { label: "Tempo trecho 1", value: `${t1.toFixed(2)} h` },
              { label: "Tempo trecho 2", value: `${t2.toFixed(2)} h` },
              { label: "v média (correta)", value: `${vMediaTotal.toFixed(1)} km/h` },
              { label: "média aritmética (errada)", value: `${vMediaErrada.toFixed(1)} km/h` },
            ]}
          />
        </div>
        <p style={{ fontSize: "0.82rem", color: "#a6adc9", marginTop: 14 }}>
          A velocidade média do percurso completo é ΔS<sub>total</sub>/Δt<sub>total</sub>, e{" "}
          <strong>não</strong> a média aritmética das velocidades de cada trecho — os dois valores só
          coincidem se os tempos dos trechos forem iguais.
        </p>
      </div>
    </div>
  );
}

function AnimatedCar({ playing, resetKey, t1, t2, splitX }) {
  const ref = useRef();
  const clock = useRef(0);
  const SCALE = 2; // segundos de simulação por "hora" do problema, só para visualização

  useFrame((_, delta) => {
    if (!playing) return;
    clock.current += delta;
    const simT1 = t1 * SCALE;
    const simT2 = t2 * SCALE;
    let x;
    if (clock.current <= simT1) {
      x = (clock.current / simT1) * splitX;
    } else if (clock.current <= simT1 + simT2) {
      x = splitX + ((clock.current - simT1) / simT2) * (14 - splitX);
    } else {
      x = 14;
    }
    if (ref.current) ref.current.position.x = x;
  });

  return (
    <group key={resetKey} ref={ref} position={[0, 0.3, 0]}>
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
