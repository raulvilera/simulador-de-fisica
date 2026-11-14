import { useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import SceneShell from "./SceneShell.jsx";
import { useThrottled } from "./useThrottled.js";
import { Vehicle, RulerTrack } from "./primitives.jsx";
import { Readout, Slider } from "../components/ui.jsx";
import { QuantityTag, QuantityToggles, SpanArrow, Concept, Term } from "./quantities.jsx";
import FormulaCard, { num } from "../components/FormulaCard.jsx";

// Conceitos mostrados dentro da cena (tocar na etiqueta oculta)
const Q = {
  ds: { id: "ds", symbol: "ΔS", name: "deslocamento da viagem", color: "#fb923c" },
  dt: { id: "dt", symbol: "Δt", name: "intervalo de tempo", color: "#a78bfa" },
  vm: { id: "vm", symbol: "v média", name: "ΔS ÷ Δt (a viagem inteira)", color: "#4ade80" },
  vi: { id: "vi", symbol: "v instantânea", name: "o que o velocímetro mostra agora", color: "#38bdf8" },
};
const Q_LIST = Object.values(Q);
const fmt = (v) => String(v).replace(".", ",");

export default function Lesson4Velocity() {
  const [distance, setDistance] = useState(200); // km (ΔS)
  const [time, setTime] = useState(2); // h (Δt)
  const [playing, setPlaying] = useState(false);
  const [resetKey, setResetKey] = useState(0);
  const [instSpeed, setInstSpeed] = useState(0);

  const vMedia = time > 0 ? (distance / time).toFixed(1) : "0";
  const [kmh, setKmh] = useState(72); // conversor km/h → m/s

  return (
    <div className="lesson__canvas">
      <SceneShell cameraPosition={[4.6, 4.4, 17]} controlsTarget={[6, 1.4, 0]}>
        <RulerTrack length={14} start={0} />
        <AnimatedCar
          key={resetKey}
          playing={playing}
          resetKey={resetKey}
          durationSeconds={6}
          onSpeedUpdate={setInstSpeed}
        >
          <QuantityTag q={Q.vi} position={[0, 1.45, 0]} value={`= ${instSpeed.toFixed(0)} km/h`} />
        </AnimatedCar>

        <Concept id="ds">
          <SpanArrow getFrom={() => 0} getTo={() => 13} y={2.3} color={Q.ds.color} />
        </Concept>
        <QuantityTag q={Q.ds} position={[4, 2.7, 0]} value={`= ${distance} km`} />
        <QuantityTag q={Q.dt} position={[9.5, 2.7, 0]} value={`= ${fmt(time)} h`} name="do início ao fim da viagem" />
        <QuantityTag q={Q.vm} position={[6.5, 3.6, 0]} value={`= ${distance} ÷ ${fmt(time)} = ${fmt(vMedia)} km/h`} />
      </SceneShell>

      <div className="panel">
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
        <FormulaCard
          title="Velocidade média"
          formula={
            <>
              <Term q={Q.vm}>v</Term> = <Term q={Q.ds} /> ÷ <Term q={Q.dt} />
            </>
          }
          terms={[
            { symbol: "v", name: "velocidade média: quanto a posição muda, em média, por unidade de tempo", unit: "km/h ou m/s", color: Q.vm.color },
            { symbol: "ΔS", name: "deslocamento: variação da posição na viagem", unit: "km ou m", color: Q.ds.color },
            { symbol: "Δt", name: "intervalo de tempo: quanto durou a viagem", unit: "h ou s", color: Q.dt.color },
          ]}
          inputs={[
            { key: "ds", symbol: "ΔS", unit: "km", value: distance, onChange: setDistance, min: 0, max: 100000, color: Q.ds.color },
            { key: "dt", symbol: "Δt", unit: "h", value: time, onChange: setTime, min: 0.01, max: 10000, color: Q.dt.color },
          ]}
          steps={
            <>
              v = {num(distance)} ÷ {num(time)} = <b>{num(distance / time)} km/h</b>
              <br />= {num(distance / time)} ÷ 3,6 = <b>{num(distance / time / 3.6)} m/s</b>
            </>
          }
          onReset={() => {
            setDistance(200);
            setTime(2);
          }}
        />

        <FormulaCard
          title="Conversão de unidades"
          formula={<>v (m/s) = v (km/h) ÷ 3,6</>}
          terms={[
            { symbol: "km/h", name: "quilômetros por hora (velocímetro)", color: "#38bdf8" },
            { symbol: "m/s", name: "metros por segundo (unidade do SI)", color: "#4ade80" },
            { symbol: "3,6", name: "1 km/h = 1000 m ÷ 3600 s", color: "#fbbf24" },
          ]}
          inputs={[{ key: "kmh", symbol: "v", unit: "km/h", value: kmh, onChange: setKmh, min: 0, max: 100000, color: "#38bdf8" }]}
          steps={
            <>
              {num(kmh)} ÷ 3,6 = <b>{num(kmh / 3.6)} m/s</b>
            </>
          }
          onReset={() => setKmh(72)}
        />

        <QuantityToggles items={Q_LIST} />
        <p style={{ fontSize: "0.82rem", color: "#a6adc9", marginTop: 14 }}>
          A velocidade média (v = ΔS/Δt) descreve a viagem inteira. Já o velocímetro mostra a
          velocidade instantânea, que varia a cada momento — repare que ela oscila durante a
          simulação, mesmo com a mesma velocidade média.
        </p>
      </div>
    </div>
  );
}

function AnimatedCar({ playing, resetKey, durationSeconds, onSpeedUpdate, children }) {
  const ref = useRef();
  const t = useRef(0);
  const report = useThrottled(onSpeedUpdate);

  useFrame((_, delta) => {
    if (!playing) return;
    t.current += delta;
    const progress = Math.min(t.current / durationSeconds, 1);
    const x = progress * 13;
    // Velocidade instantânea "ruidosa" em torno de uma média, só para efeito visual/didático.
    const inst = 70 + Math.sin(t.current * 3) * 25 + Math.sin(t.current * 7) * 10;
    if (ref.current) ref.current.position.x = x;
    report(progress < 1 ? Math.max(inst, 0) : 0, progress >= 1);
  });

  return (
    <group key={resetKey} ref={ref} position={[0, 0.3, 0]}>
      <Vehicle color="#3b82f6" />
      {children}
    </group>
  );
}
