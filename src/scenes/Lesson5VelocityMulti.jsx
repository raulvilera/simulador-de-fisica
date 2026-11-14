import { useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import SceneShell from "./SceneShell.jsx";
import { Vehicle, RulerTrack } from "./primitives.jsx";
import { Readout, Slider } from "../components/ui.jsx";
import { QuantityTag, QuantityToggles, SpanArrow, Concept, Term } from "./quantities.jsx";
import FormulaCard, { num } from "../components/FormulaCard.jsx";

// Conceitos mostrados dentro da cena (tocar na etiqueta oculta)
const Q = {
  t1: { id: "t1", symbol: "Trecho 1", name: "d₁, v₁ e t₁", color: "#38bdf8" },
  t2: { id: "t2", symbol: "Trecho 2", name: "d₂, v₂ e t₂", color: "#f472b6" },
  vm: { id: "vm", symbol: "v média", name: "ΔS total ÷ Δt total", color: "#4ade80" },
  err: { id: "err", symbol: "média aritmética", name: "(v₁ + v₂) ÷ 2 — NÃO é a velocidade média", color: "#f87171" },
};
const Q_LIST = Object.values(Q);
const f1 = (v) => (Math.round(v * 10) / 10).toString().replace(".", ",");

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
      <SceneShell cameraPosition={[4.6, 4.8, 18]} controlsTarget={[6, 1.8, 0]}>
        <RulerTrack length={14} start={0} highlight={[0, (14 * d1) / (d1 + d2), 14]} />
        <AnimatedCar
          key={resetKey}
          playing={playing}
          resetKey={resetKey}
          t1={t1}
          t2={t2}
          splitX={(14 * d1) / (d1 + d2)}
        />

        <Concept id="t1">
          <SpanArrow getFrom={() => 0} getTo={() => (14 * d1) / (d1 + d2)} y={2.2} color={Q.t1.color} />
        </Concept>
        <QuantityTag
          q={Q.t1}
          position={[(7 * d1) / (d1 + d2), 2.65, 0]}
          value={`d₁ = ${d1} km · v₁ = ${v1} km/h`}
          name={`t₁ = d₁ ÷ v₁ = ${f1(t1)} h`}
        />
        <Concept id="t2">
          <SpanArrow getFrom={() => (14 * d1) / (d1 + d2)} getTo={() => 14} y={2.2} color={Q.t2.color} />
        </Concept>
        <QuantityTag
          q={Q.t2}
          position={[(14 * d1) / (d1 + d2) + (7 * d2) / (d1 + d2), 1.6, 0]}
          value={`d₂ = ${d2} km · v₂ = ${v2} km/h`}
          name={`t₂ = d₂ ÷ v₂ = ${f1(t2)} h`}
        />
        <Concept id="vm">
          <SpanArrow getFrom={() => 0} getTo={() => 14} y={3.3} color={Q.vm.color} width={0.07} />
        </Concept>
        <QuantityTag
          q={Q.vm}
          position={[7, 3.75, 0]}
          value={`= (${d1} + ${d2}) ÷ (${f1(t1)} + ${f1(t2)}) = ${f1(vMediaTotal)} km/h`}
        />
        <QuantityTag q={Q.err} position={[7, 4.65, 0]} value={`= ${f1(vMediaErrada)} km/h ✗`} />
      </SceneShell>

      <div className="panel">
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
        <FormulaCard
          title="Velocidade média do percurso"
          formula={
            <>
              <Term q={Q.vm}>v</Term> = ΔS<sub>total</sub> ÷ Δt<sub>total</sub>
            </>
          }
          terms={[
            { symbol: "v", name: "velocidade média do percurso inteiro", unit: "km/h", color: Q.vm.color },
            { symbol: "ΔS", name: "ΔS total = d₁ + d₂ (soma das distâncias dos trechos)", unit: "km", color: "#fb923c" },
            { symbol: "Δt", name: "Δt total = t₁ + t₂, com t = d ÷ v em cada trecho", unit: "h", color: "#a78bfa" },
            { symbol: "d₁, v₁", name: "distância e velocidade do trecho 1", color: Q.t1.color },
            { symbol: "d₂, v₂", name: "distância e velocidade do trecho 2", color: Q.t2.color },
          ]}
          inputs={[
            { key: "d1", symbol: "d₁", unit: "km", value: d1, onChange: setD1, min: 0.1, max: 100000, color: Q.t1.color },
            { key: "v1", symbol: "v₁", unit: "km/h", value: v1, onChange: setV1, min: 0.1, max: 100000, color: Q.t1.color },
            { key: "d2", symbol: "d₂", unit: "km", value: d2, onChange: setD2, min: 0.1, max: 100000, color: Q.t2.color },
            { key: "v2", symbol: "v₂", unit: "km/h", value: v2, onChange: setV2, min: 0.1, max: 100000, color: Q.t2.color },
          ]}
          steps={
            <>
              t₁ = {num(d1)} ÷ {num(v1)} = {num(t1)} h · t₂ = {num(d2)} ÷ {num(v2)} = {num(t2)} h
              <br />v = ({num(d1)} + {num(d2)}) ÷ ({num(t1)} + {num(t2)}) = <b>{num(vMediaTotal)} km/h</b>
              <br />
              <span style={{ color: "#fca5a5" }}>
                média aritmética ({num(v1)} + {num(v2)}) ÷ 2 = {num(vMediaErrada)} km/h ✗
              </span>
            </>
          }
          onReset={() => {
            setD1(60);
            setV1(20);
            setD2(40);
            setV2(40);
          }}
        />

        <QuantityToggles items={Q_LIST} />
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
