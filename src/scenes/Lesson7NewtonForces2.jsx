import { useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import SceneShell from "./SceneShell.jsx";
import { useThrottled } from "./useThrottled.js";
import { Vehicle, RulerTrack, Arrow3D } from "./primitives.jsx";
import { Readout, Slider } from "../components/ui.jsx";
import { QuantityTag, QuantityToggles, Concept, Term } from "./quantities.jsx";
import FormulaCard, { num } from "../components/FormulaCard.jsx";

// Conceitos mostrados dentro da cena (tocar na etiqueta oculta)
const Q = {
  f: { id: "f", symbol: "F motor", name: "força que empurra o carro", color: "#4ade80" },
  fat: { id: "fat", symbol: "F atrito", name: "atrito + resistência do ar", color: "#f87171" },
  fres: { id: "fres", symbol: "FRes", name: "F motor − F atrito", color: "#fbbf24" },
  a: { id: "a", symbol: "a", name: "aceleração = FRes ÷ m", color: "#a78bfa" },
  v: { id: "v", symbol: "v", name: "velocidade (aumenta com a aceleração)", color: "#38bdf8" },
};
const Q_LIST = Object.values(Q);
const ARROW_SCALE = 1 / 1600; // 1 unidade de seta a cada 1600 N
const aLen = (f) => Math.min(Math.max(f * ARROW_SCALE, 0.45), 6);

export default function Lesson7NewtonForces2() {
  const [mass, setMass] = useState(800); // kg
  const [force, setForce] = useState(4000); // N
  const [friction, setFriction] = useState(500); // N
  const [playing, setPlaying] = useState(false);
  const [resetKey, setResetKey] = useState(0);
  const [live, setLive] = useState({ v: 0, x: 0, t: 0 });

  const [kmh, setKmh] = useState(108); // conversor km/h → m/s
  const fRes = Math.max(force - friction, 0);
  const accel = mass > 0 ? fRes / mass : 0;
  const vKmh = live.v * 3.6;

  return (
    <div className="lesson__canvas">
      <SceneShell cameraPosition={[2, 4.6, 18.5]} controlsTarget={[5.6, 1.4, 0]}>
        <RulerTrack length={16} start={0} />
        <RaceCar key={resetKey} playing={playing} resetKey={resetKey} accel={accel} onUpdate={setLive}>
          <Concept id="f">
            <Arrow3D from={[1.15, 0.45, 0.75]} length={aLen(force)} color={Q.f.color} />
          </Concept>
          <QuantityTag q={Q.f} position={[1.15 + aLen(force) / 2, 1.0, 0.75]} value={`= ${force} N`} />
          {friction > 0 && (
            <Concept id="fat">
              <Arrow3D from={[-1.15, 0.45, 0.75]} dir={-1} length={aLen(friction)} color={Q.fat.color} />
            </Concept>
          )}
          {friction > 0 && (
            <QuantityTag q={Q.fat} position={[-1.15 - aLen(friction) / 2, 1.0, 0.75]} value={`= ${friction} N`} />
          )}
          {fRes > 0 && (
            <Concept id="fres">
              <Arrow3D from={[-0.2, 1.75, 0]} length={aLen(fRes)} thickness={1.4} color={Q.fres.color} />
            </Concept>
          )}
          <QuantityTag q={Q.fres} position={[-0.2 + aLen(fRes) / 2, 2.2, 0]} value={`= ${force} − ${friction} = ${fRes} N`} />
          <QuantityTag q={Q.a} position={[0, 2.95, 0]} value={`= ${fRes} ÷ ${mass} = ${accel.toFixed(2).replace(".", ",")} m/s²`} />
          <QuantityTag q={Q.v} position={[0, 0, 2.7]} value={`= ${live.v.toFixed(1).replace(".", ",")} m/s`} />
        </RaceCar>
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
        <FormulaCard
          title="Força resultante e aceleração"
          formula={
            <>
              <Term q={Q.fres} /> = <Term q={Q.f}>F</Term> − <Term q={Q.fat}>Fat</Term> · <Term q={Q.a} /> = FRes ÷ m
            </>
          }
          terms={[
            { symbol: "F", name: "força do motor (empurra para frente)", unit: "N", color: Q.f.color },
            { symbol: "Fat", name: "atrito + resistência do ar (contra o movimento)", unit: "N", color: Q.fat.color },
            { symbol: "FRes", name: "força resultante: o que sobra para acelerar", unit: "N", color: Q.fres.color },
            { symbol: "m", name: "massa do carro", unit: "kg", color: "#e5e9f5" },
            { symbol: "a", name: "aceleração", unit: "m/s²", color: Q.a.color },
          ]}
          inputs={[
            { key: "m", symbol: "m", unit: "kg", value: mass, onChange: setMass, min: 1, max: 100000, color: "#e5e9f5" },
            { key: "f", symbol: "F", unit: "N", value: force, onChange: setForce, min: 0, max: 1000000, color: Q.f.color },
            { key: "fat", symbol: "Fat", unit: "N", value: friction, onChange: setFriction, min: 0, max: 1000000, color: Q.fat.color },
          ]}
          steps={
            <>
              FRes = {num(force)} − {num(friction)} = <b>{num(force - friction)} N</b>
              {force - friction < 0 && <span style={{ color: "#fca5a5" }}> (o carro não sai do lugar)</span>}
              <br />a = {num(fRes)} ÷ {num(mass)} = <b>{num(accel)} m/s²</b>
            </>
          }
          onReset={() => {
            setMass(800);
            setForce(4000);
            setFriction(500);
          }}
        />

        <FormulaCard
          title="Conversão de unidades"
          formula={<>v (m/s) = v (km/h) ÷ 3,6</>}
          terms={[
            { symbol: "km/h", name: "quilômetros por hora", color: "#38bdf8" },
            { symbol: "m/s", name: "metros por segundo (SI)", color: "#4ade80" },
          ]}
          inputs={[{ key: "kmh", symbol: "v", unit: "km/h", value: kmh, onChange: setKmh, min: 0, max: 100000, color: "#38bdf8" }]}
          steps={
            <>
              {num(kmh)} ÷ 3,6 = <b>{num(kmh / 3.6)} m/s</b>
            </>
          }
          onReset={() => setKmh(108)}
        />

        <QuantityToggles items={Q_LIST} />
        <p style={{ fontSize: "0.82rem", color: "#a6adc9", marginTop: 14 }}>
          Para converter: km/h ÷ 3,6 = m/s. Aqui, quanto maior a força do motor e menor a massa ou o
          atrito, maior a aceleração resultante — exatamente como nos exercícios de corrida da aula.
        </p>
      </div>
    </div>
  );
}

function RaceCar({ playing, resetKey, accel, onUpdate, children }) {
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
      {children}
    </group>
  );
}
