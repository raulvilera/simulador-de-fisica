import { useEffect, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import SceneShell from "./SceneShell.jsx";
import { Vehicle, RulerTrack } from "./primitives.jsx";
import { Readout, Slider } from "../components/ui.jsx";
import { QuantityTag, QuantityToggles, Term } from "./quantities.jsx";
import FormulaCard, { num } from "../components/FormulaCard.jsx";

// Conceitos mostrados dentro da cena (tocar na etiqueta oculta)
const Q = {
  v1: { id: "v1", symbol: "V1", name: "velocidade com impulso fraco", color: "#3b82f6" },
  v2: { id: "v2", symbol: "V2", name: "velocidade com impulso forte", color: "#ef4444" },
  dv: { id: "dv", symbol: "ΔV", name: "variação da velocidade = V2 − V1", color: "#fbbf24" },
  dt: { id: "dt", symbol: "Δt", name: "tempo entre as medições", color: "#a78bfa" },
  a: { id: "a", symbol: "a", name: "aceleração = ΔV ÷ Δt", color: "#4ade80" },
};
const Q_LIST = Object.values(Q);
const c = (v, n = 1) => v.toFixed(n).replace(".", ",");

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

  // calculadora: recebe as medições da cena, mas aceita valores digitados
  const [v1c, setV1c] = useState(8);
  const [v2c, setV2c] = useState(14);
  useEffect(() => {
    if (v1 != null) setV1c(Math.round(v1 * 10) / 10);
  }, [v1]);
  useEffect(() => {
    if (v2 != null) setV2c(Math.round(v2 * 10) / 10);
  }, [v2]);

  return (
    <div className="lesson__canvas">
      <SceneShell setting="lab" cameraPosition={[2.2, 3, 10]} controlsTarget={[3.8, 0.8, 0]}>
        <RulerTrack length={SCENE_LENGTH} start={0} />
        <FrictionCart
          running={running}
          boost={boost}
          resetKey={resetKey}
          onFinish={onFinish}
        />
        <QuantityTag q={Q.v1} position={[1.6, 1.7, 0]} value={v1 != null ? `= ${c(v1)} cm/s` : "= ? (faça a medição 1)"} />
        <QuantityTag q={Q.v2} position={[6.4, 1.7, 0]} value={v2 != null ? `= ${c(v2)} cm/s` : "= ? (faça a medição 2)"} />
        <QuantityTag q={Q.dt} position={[4, 1.7, 0]} value={`= ${c(dt)} s`} />
        {deltaV != null && (
          <>
            <QuantityTag q={Q.dv} position={[2.6, 2.7, 0]} value={`= ${c(v2)} − ${c(v1)} = ${c(deltaV)} cm/s`} />
            <QuantityTag q={Q.a} position={[5.6, 2.7, 0]} value={`= ${c(deltaV)} ÷ ${c(dt)} = ${c(accel, 2)} cm/s²`} />
          </>
        )}
      </SceneShell>

      <div className="panel">
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
        <FormulaCard
          title="Aceleração média"
          formula={
            <>
              <Term q={Q.a} /> = <Term q={Q.dv} /> ÷ <Term q={Q.dt} /> = (V2 − V1) ÷ Δt
            </>
          }
          terms={[
            { symbol: "a", name: "aceleração: quanto a velocidade muda a cada segundo", unit: "cm/s²", color: Q.a.color },
            { symbol: "ΔV", name: "variação da velocidade = V2 − V1", unit: "cm/s", color: Q.dv.color },
            { symbol: "V1", name: "velocidade na medição 1 (impulso fraco)", unit: "cm/s", color: Q.v1.color },
            { symbol: "V2", name: "velocidade na medição 2 (impulso forte)", unit: "cm/s", color: Q.v2.color },
            { symbol: "Δt", name: "tempo entre as duas medições", unit: "s", color: Q.dt.color },
          ]}
          inputs={[
            { key: "v1", symbol: "V1", unit: "cm/s", value: v1c, onChange: setV1c, min: -100000, max: 100000, color: Q.v1.color },
            { key: "v2", symbol: "V2", unit: "cm/s", value: v2c, onChange: setV2c, min: -100000, max: 100000, color: Q.v2.color },
            { key: "dt", symbol: "Δt", unit: "s", value: dt, onChange: setDt, min: 0.01, max: 100000, color: Q.dt.color },
          ]}
          steps={
            <>
              ΔV = {num(v2c)} − {num(v1c)} = {num(v2c - v1c)} cm/s
              <br />a = {num(v2c - v1c)} ÷ {num(dt)} = <b>{num((v2c - v1c) / dt)} cm/s²</b>
            </>
          }
          note="V1 e V2 são preenchidos pelas medições da cena; você também pode digitar os valores medidos em sala."
          onReset={() => {
            setV1c(v1 != null ? Math.round(v1 * 10) / 10 : 8);
            setV2c(v2 != null ? Math.round(v2 * 10) / 10 : 14);
            setDt(3);
          }}
        />

        <QuantityToggles items={Q_LIST} />
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
