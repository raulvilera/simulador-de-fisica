import { useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import SceneShell from "./SceneShell.jsx";
import { Vehicle, RulerTrack } from "./primitives.jsx";
import { Readout, Slider } from "../components/ui.jsx";

export default function Lesson4Velocity() {
  const [distance, setDistance] = useState(200); // km (ΔS)
  const [time, setTime] = useState(2); // h (Δt)
  const [playing, setPlaying] = useState(false);
  const [resetKey, setResetKey] = useState(0);
  const [instSpeed, setInstSpeed] = useState(0);

  const vMedia = time > 0 ? (distance / time).toFixed(1) : "0";

  return (
    <div className="lesson__canvas">
      <SceneShell cameraPosition={[5, 6, 11]} controlsTarget={[5, 0.5, 0]}>
        <RulerTrack length={14} start={0} />
        <AnimatedCar
          playing={playing}
          resetKey={resetKey}
          durationSeconds={6}
          onSpeedUpdate={setInstSpeed}
        />
      </SceneShell>

      <div className="panel" style={panelOverlayStyle}>
        <p className="panel__eyebrow">Aula 4 · Velocidade</p>
        <h1>Velocidade média x instantânea</h1>
        <div className="controls">
          <Slider label="Deslocamento (ΔS)" value={distance} onChange={setDistance} min={20} max={400} step={10} unit=" km" />
          <Slider label="Tempo (Δt)" value={time} onChange={setTime} min={1} max={8} step={0.5} unit=" h" />
          <div className="btnRow">
            <button className="btn btn--primary" onClick={() => setPlaying(true)}>
              ▶ Simular viagem
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
          <div className="speedo">
            <div className="readout__label">Velocímetro (instantânea)</div>
            <div className="readout__value" style={{ fontSize: "1.8rem" }}>
              {instSpeed.toFixed(0)} km/h
            </div>
          </div>
          <Readout
            items={[
              { label: "v média = ΔS/Δt", value: `${vMedia} km/h` },
              { label: "Δt total", value: `${time} h` },
            ]}
          />
        </div>
        <p style={{ fontSize: "0.82rem", color: "#a6adc9", marginTop: 14 }}>
          A velocidade média (v = ΔS/Δt) descreve a viagem inteira. Já o velocímetro mostra a
          velocidade instantânea, que varia a cada momento — repare que ela oscila durante a
          simulação, mesmo com a mesma velocidade média.
        </p>
      </div>
    </div>
  );
}

function AnimatedCar({ playing, resetKey, durationSeconds, onSpeedUpdate }) {
  const ref = useRef();
  const t = useRef(0);

  useFrame((_, delta) => {
    if (!playing) return;
    t.current += delta;
    const progress = Math.min(t.current / durationSeconds, 1);
    const x = progress * 13;
    // Velocidade instantânea "ruidosa" em torno de uma média, só para efeito visual/didático.
    const inst = 70 + Math.sin(t.current * 3) * 25 + Math.sin(t.current * 7) * 10;
    if (ref.current) ref.current.position.x = x;
    onSpeedUpdate?.(progress < 1 ? Math.max(inst, 0) : 0);
  });

  return (
    <group key={resetKey} ref={ref} position={[0, 0.3, 0]}>
      <Vehicle color="#3b82f6" />
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
