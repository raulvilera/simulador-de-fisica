import { useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import SceneShell from "./SceneShell.jsx";
import KeepInView from "./KeepInView.jsx";
import { useThrottled } from "./useThrottled.js";
import { Vehicle, RulerTrack, Arrow3D } from "./primitives.jsx";
import { niceStep, fmtNum } from "./scale.js";
import { Readout, Slider } from "../components/ui.jsx";
import { QuantityTag, QuantityToggles, Concept, Term } from "./quantities.jsx";
import FormulaCard, { num, nump } from "../components/FormulaCard.jsx";

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
const aLen = (f) => Math.min(Math.max(Math.abs(f) * ARROW_SCALE, 0.45), 6);

export default function Lesson7NewtonForces2() {
  const followRef = useRef(); // objeto que a câmera acompanha
  const [mass, setMass] = useState(800); // kg
  const [force, setForce] = useState(4000); // N
  const [friction, setFriction] = useState(500); // N
  const [playing, setPlaying] = useState(false);
  const [resetKey, setResetKey] = useState(0);
  const [live, setLive] = useState({ v: 0, x: 0, t: 0 });

  const [kmh, setKmh] = useState(0); // velocidade inicial do carro, em km/h
  const v0 = kmh / 3.6;
  // parado, o carro só sai se F > Fat; andando, FRes pode ser negativa (freia)
  const moving = v0 > 0 || force > friction;
  const fRes = moving ? force - friction : 0;
  const accel = mass > 0 ? fRes / mass : 0;
  // a pista mostra o que o carro anda em 5 s (régua em metros, escala automática)
  const RUN = 5;
  const tStop = accel < 0 ? v0 / -accel : Infinity;
  const tEnd = Math.min(RUN, tStop);
  const L = Math.max(v0 * tEnd + 0.5 * accel * tEnd * tEnd, 0) || 15;
  const kTrack = 15 / L;
  const restart = () => {
    setPlaying(false);
    setLive({ v: v0, x: 0, t: 0 });
    setResetKey((k) => k + 1);
  };
  const vKmh = live.v * 3.6;

  return (
    <div className="lesson__canvas">
      <SceneShell cameraPosition={[2, 4.6, 18.5]} controlsTarget={[5.6, 1.4, 0]}>
        {/* a câmera acompanha o movimento até o fim, sem perder o objeto de vista */}
        <KeepInView targets={[followRef]} axes={[1, 1, 1]} />
        <RulerTrack length={16} start={0} step={niceStep(L / 10) * kTrack} labelOf={(x) => fmtNum(x / kTrack, 1)} />
        <RaceCar
          objRef={followRef}
          key={`${resetKey}-${v0}-${accel}-${L}`}
          playing={playing}
          accel={accel}
          v0={v0}
          kTrack={kTrack}
          runTime={RUN}
          onUpdate={setLive}
        >
          <Concept id="f">
            <Arrow3D from={[1.15, 0.45, 0.75]} length={aLen(force)} color={Q.f.color} />
          </Concept>
          <QuantityTag q={Q.f} position={[1.15 + aLen(force) + 0.9, 0.45, 0.75]} value={`= ${force} N`} />
          {friction > 0 && (
            <Concept id="fat">
              <Arrow3D from={[-1.15, 0.45, 0.75]} dir={-1} length={aLen(friction)} color={Q.fat.color} />
            </Concept>
          )}
          {friction > 0 && (
            <QuantityTag q={Q.fat} position={[-1.15 - aLen(friction) - 0.9, 0.45, 0.75]} value={`= ${friction} N`} />
          )}
          {fRes !== 0 && (
            <Concept id="fres">
              <Arrow3D
                from={[-0.2, 1.75, 0]}
                dir={Math.sign(fRes)}
                length={aLen(fRes)}
                thickness={1.4}
                color={Q.fres.color}
              />
            </Concept>
          )}
          <QuantityTag
            q={Q.fres}
            position={[-0.2 + Math.sign(fRes || 1) * (aLen(fRes) + 1.1), 1.75, 0]}
            value={`= ${num(force)} − ${num(friction)} = ${num(fRes)} N`}
          />
          <QuantityTag q={Q.a} position={[0, 2.95, 0]} value={`= ${num(fRes)} ÷ ${num(mass)} = ${num(accel)} m/s²`} />
          <QuantityTag
            q={Q.v}
            position={[0, 0, 2.7]}
            value={`= ${num(live.v, 1)} m/s (${num(live.v * 3.6, 0)} km/h)`}
            name={
              live.t > 0 ? `t = ${num(live.t, 1)} s · andou ${num(live.x, 1)} m` : "velocidade (muda com a aceleração)"
            }
          />
        </RaceCar>
      </SceneShell>

      <div className="panel">
        <p className="panel__eyebrow">Aula 7 · Aceleração e força</p>
        <h1>Carro de corrida acelerando</h1>
        <div className="controls">
          <Slider label="Massa do carro" value={mass} onChange={setMass} min={400} max={1600} step={50} unit=" kg" />
          <Slider label="Força do motor" value={force} onChange={setForce} min={1000} max={8000} step={250} unit=" N" />
          <Slider
            label="Atrito + resistência"
            value={friction}
            onChange={setFriction}
            min={0}
            max={3000}
            step={100}
            unit=" N"
          />
          <div className="btnRow">
            <button className="btn btn--primary" onClick={() => setPlaying(true)}>
              ▶ Acelerar
            </button>
            <button
              className="btn btn--ghost"
              onClick={() => {
                setPlaying(false);
                restart();
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
            {
              key: "m",
              symbol: "m",
              unit: "kg",
              value: mass,
              onChange: setMass,
              min: 0.001,
              max: 1e12,
              color: "#e5e9f5",
            },
            { key: "f", symbol: "F", unit: "N", value: force, onChange: setForce, min: 0, max: 1e12, color: Q.f.color },
            {
              key: "fat",
              symbol: "Fat",
              unit: "N",
              value: friction,
              onChange: setFriction,
              min: 0,
              max: 1e12,
              color: Q.fat.color,
            },
          ]}
          steps={
            <>
              FRes = {num(force)} − {nump(friction)} = <b>{num(force - friction)} N</b>
              {!moving && (
                <span style={{ color: "#fca5a5" }}> (parado, o atrito equilibra: o carro não sai do lugar)</span>
              )}
              {moving && fRes < 0 && <span style={{ color: "#fca5a5" }}> (resultante para trás: o carro freia)</span>}
              <br />a = {num(fRes)} ÷ {nump(mass)} = <b>{num(accel)} m/s²</b>
            </>
          }
          live={
            live.t > 0 ? (
              <>
                t = <b>{num(live.t)} s</b>
                <br />v = v₀ + a · t = {num(v0)} + {nump(accel)} × {nump(live.t)} = <b>{num(live.v, 1)} m/s</b> (
                {num(live.v * 3.6, 0)} km/h)
                <br />
                distância = <b>{num(live.x, 1)} m</b>
              </>
            ) : (
              <>Aperte ▶ Acelerar: t, v e a distância mudam enquanto o carro anda.</>
            )
          }
          onReset={() => {
            setMass(800);
            setForce(4000);
            setFriction(500);
          }}
        />

        <FormulaCard
          title="Velocidade inicial (conversão)"
          formula={<>v₀ (m/s) = v₀ (km/h) ÷ 3,6</>}
          terms={[
            { symbol: "v₀", name: "velocidade com que o carro passa pela largada", color: "#38bdf8" },
            { symbol: "km/h", name: "quilômetros por hora (velocímetro)", color: "#38bdf8" },
            { symbol: "m/s", name: "metros por segundo (SI, usado na conta da aceleração)", color: "#4ade80" },
          ]}
          inputs={[
            {
              key: "kmh",
              symbol: "v₀",
              unit: "km/h",
              value: kmh,
              onChange: (v) => {
                setKmh(v);
                restart();
              },
              min: 0,
              max: 1e9,
              color: "#38bdf8",
            },
          ]}
          steps={
            <>
              v₀ = {num(kmh)} ÷ 3,6 = <b>{num(v0)} m/s</b>
              <br />
              após {RUN} s: v = {num(v0)} + {nump(accel)} × {nump(tEnd)} = <b>{num(v0 + accel * tEnd)} m/s</b> (
              {num((v0 + accel * tEnd) * 3.6)} km/h)
            </>
          }
          note="O carro da cena sai com v₀ e acelera (ou freia, se Fat > F) durante 5 s; a régua da pista se ajusta à distância percorrida."
          onReset={() => {
            setKmh(0);
            restart();
          }}
        />

        <QuantityToggles items={Q_LIST} />
        <p style={{ fontSize: "0.82rem", color: "#a6adc9", marginTop: 14 }}>
          Para converter: km/h ÷ 3,6 = m/s. Aqui, quanto maior a força do motor e menor a massa ou o atrito, maior a
          aceleração resultante — exatamente como nos exercícios de corrida da aula.
        </p>
      </div>
    </div>
  );
}

// Movimento real durante `runTime` s; na tela a pista (15 unidades) representa
// a distância percorrida nesse tempo (kTrack = unidades da cena por metro).
function RaceCar({ objRef, playing, accel, v0, kTrack, runTime, onUpdate, children }) {
  const ref = useRef();
  const state = useRef({ x: 0, v: v0, t: 0 });
  const report = useThrottled(onUpdate);

  useFrame((_, delta) => {
    if (!playing) return;
    const s = state.current;
    if (s.t >= runTime) return;
    const dt = Math.min(delta, runTime - s.t);
    s.v += accel * dt;
    if (s.v < 0) s.v = 0; // freou até parar
    s.x += s.v * dt;
    s.t += dt;
    if (ref.current) ref.current.position.x = Math.min(s.x * kTrack, 15.5);
    report({ v: s.v, x: s.x, t: s.t }, s.t >= runTime);
  });

  return (
    <group
      ref={(o) => {
        ref.current = o;
        if (objRef) objRef.current = o;
      }}
      position={[0, 0.3, 0]}
    >
      <Vehicle color="#ef4444" />
      {children}
    </group>
  );
}
