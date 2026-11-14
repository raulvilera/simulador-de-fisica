import { useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import SceneShell from "./SceneShell.jsx";
import { Arrow3D, Crate, Pusher } from "./primitives.jsx";
import { Readout, Slider } from "../components/ui.jsx";
import { QuantityTag, QuantityToggles, Concept, Term } from "./quantities.jsx";
import FormulaCard, { num } from "../components/FormulaCard.jsx";

// Conceitos mostrados dentro da cena (tocar na etiqueta oculta)
const Q = {
  f1: { id: "f1", symbol: "F1", name: "força da pessoa de azul", color: "#3b82f6" },
  f2: { id: "f2", symbol: "F2", name: "força da pessoa de vermelho", color: "#f87171" },
  fres: { id: "fres", symbol: "FRes", name: "força resultante", color: "#fbbf24" },
  m: { id: "m", symbol: "m", name: "massa do caixote", color: "#a78bfa" },
  a: { id: "a", symbol: "a", name: "aceleração = FRes ÷ m", color: "#4ade80" },
  rr: { id: "rr", symbol: "ação e reação", name: "3ª Lei de Newton", color: "#f472b6" },
};
const Q_LIST = Object.values(Q);
const f2d = (v) => v.toFixed(2).replace(".", ",");

export default function Lesson6NewtonForces() {
  const [mass, setMass] = useState(40); // kg
  const [f1, setF1] = useState(15); // N (sentido +)
  const [f2, setF2] = useState(25); // N (sentido +, ou negativo se oposto)
  const [opposite, setOpposite] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [resetKey, setResetKey] = useState(0);

  const [dv, setDv] = useState(20); // a = ΔV/Δt (exemplo: 0 → 20 m/s em 4 s)
  const [dtA, setDtA] = useState(4);
  const fRes = opposite ? f1 - f2 : f1 + f2;
  const accel = mass > 0 ? fRes / mass : 0;

  return (
    <div className="lesson__canvas">
      <SceneShell setting="yard" fov={50} cameraPosition={[-0.6, 2.7, 9]} controlsTarget={[-1.2, 1.3, 0]}>
        <PushedBox key={resetKey} playing={playing} accel={accel} mass={mass} f1={f1} f2={f2} fRes={fRes} opposite={opposite} />
      </SceneShell>

      <div className="panel">
        <p className="panel__eyebrow">Aula 6 · 2ª e 3ª Leis de Newton</p>
        <h1>Força resultante e aceleração</h1>
        <div className="controls">
          <Slider label="Massa do corpo" value={mass} onChange={setMass} min={5} max={100} step={5} unit=" kg" />
          <Slider label="Força 1" value={f1} onChange={setF1} min={0} max={100} step={5} unit=" N" />
          <Slider label="Força 2" value={f2} onChange={setF2} min={0} max={100} step={5} unit=" N" />
          <div className="controls__row">
            <span>Forças em sentidos opostos</span>
            <input type="checkbox" checked={opposite} onChange={(e) => setOpposite(e.target.checked)} />
          </div>
          <div className="btnRow">
            <button className="btn btn--primary" onClick={() => setPlaying(true)}>
              ▶ Aplicar forças
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
              { label: "FRes = F1 ± F2", value: `${fRes.toFixed(0)} N` },
              { label: "a = FRes / m", value: `${accel.toFixed(2)} m/s²` },
            ]}
          />
        </div>
        <FormulaCard
          title="2ª Lei de Newton"
          formula={
            <>
              <Term q={Q.fres} /> = <Term q={Q.m} /> · <Term q={Q.a} />
              <span style={{ fontSize: "0.85em", opacity: 0.8 }}> → a = FRes ÷ m</span>
            </>
          }
          terms={[
            { symbol: "FRes", name: "força resultante: soma das forças (sentidos opostos se subtraem)", unit: "N", color: Q.fres.color },
            { symbol: "m", name: "massa: quantidade de matéria do corpo (inércia)", unit: "kg", color: Q.m.color },
            { symbol: "a", name: "aceleração: quanto a velocidade muda a cada segundo", unit: "m/s²", color: Q.a.color },
            { symbol: "F1, F2", name: "forças aplicadas pelas pessoas", unit: "N", color: Q.f1.color },
          ]}
          inputs={[
            { key: "m", symbol: "m", unit: "kg", value: mass, onChange: setMass, min: 0.1, max: 100000, color: Q.m.color },
            { key: "f1", symbol: "F1", unit: "N", value: f1, onChange: setF1, min: 0, max: 100000, color: Q.f1.color },
            { key: "f2", symbol: "F2", unit: "N", value: f2, onChange: setF2, min: 0, max: 100000, color: Q.f2.color },
          ]}
          steps={
            <>
              FRes = {num(f1)} {opposite ? "−" : "+"} {num(f2)} = <b>{num(fRes)} N</b>
              <br />a = {num(fRes)} ÷ {num(mass)} = <b>{num(accel)} m/s²</b>
            </>
          }
          note="Use a caixa “Forças em sentidos opostos” acima para subtrair F2."
          onReset={() => {
            setMass(40);
            setF1(15);
            setF2(25);
            setOpposite(false);
          }}
        />

        <FormulaCard
          title="Aceleração"
          formula={<>a = ΔV ÷ Δt</>}
          terms={[
            { symbol: "a", name: "aceleração média", unit: "m/s²", color: Q.a.color },
            { symbol: "ΔV", name: "variação da velocidade = V final − V inicial", unit: "m/s", color: "#38bdf8" },
            { symbol: "Δt", name: "intervalo de tempo da mudança", unit: "s", color: "#a78bfa" },
          ]}
          inputs={[
            { key: "dv", symbol: "ΔV", unit: "m/s", value: dv, onChange: setDv, min: -100000, max: 100000, color: "#38bdf8" },
            { key: "dt", symbol: "Δt", unit: "s", value: dtA, onChange: setDtA, min: 0.01, max: 100000, color: "#a78bfa" },
          ]}
          steps={
            <>
              a = {num(dv)} ÷ {num(dtA)} = <b>{num(dv / dtA)} m/s²</b>
            </>
          }
          onReset={() => {
            setDv(20);
            setDtA(4);
          }}
        />

        <QuantityToggles items={Q_LIST} />
        <p style={{ fontSize: "0.82rem", color: "#a6adc9", marginTop: 14 }}>
          2ª Lei de Newton: F<sub>Res</sub> = m·a. Quando as forças têm sentidos opostos, a
          resultante é a diferença entre elas. A 3ª Lei (ação e reação) aparece, por exemplo, nos pés
          de quem empurra o caixote: ao empurrar o chão para trás, o chão empurra a pessoa para
          frente — mas essas forças atuam em corpos diferentes, por isso não se anulam. Na cena, a
          pessoa de azul aplica F1, a de vermelho aplica F2 e a seta amarela mostra a resultante.
        </p>
      </div>
    </div>
  );
}

// Caixote com as duas pessoas que o empurram. Tudo anda junto: quem aplica a
// força maior "vence" e a outra pessoa é levada de costas.
const HALF = 0.55;
const START_X = -2.6;
const LIMIT = 7; // meia largura do caixote
const SCALE = 1 / 25; // comprimento da seta: 1 unidade a cada 25 N
const arrowLen = (f) => Math.min(Math.max(Math.abs(f) * SCALE, 0.45), 5);

function PushedBox({ playing, accel, mass, f1, f2, fRes, opposite }) {
  const ref = useRef();
  const state = useRef({ x: START_X, v: 0 });

  useFrame((_, delta) => {
    if (!playing) return;
    const s = state.current;
    s.v += accel * Math.min(delta, 0.05);
    s.x += s.v * Math.min(delta, 0.05);
    if (s.x > LIMIT || s.x < -LIMIT) {
      s.x = Math.sign(s.x) * LIMIT;
      s.v = 0;
    }
    if (ref.current) ref.current.position.x = s.x;
  });

  const side2 = opposite ? 1 : -1; // lado do caixote onde fica quem aplica F2
  return (
    <group ref={ref} position={[START_X, 0, 0]}>
      <Crate size={HALF * 2} />

      {/* pessoa de azul: aplica F1 para a direita */}
      <Pusher position={[-HALF - 0.62, 0, opposite ? 0 : 0.3]} dir={1} shirt="#3b82f6" />
      {/* pessoa de vermelho: aplica F2 — no mesmo sentido ou no sentido oposto */}
      <Pusher
        position={[side2 * (HALF + 0.62), 0, opposite ? 0 : -0.3]}
        dir={-side2}
        shirt="#ef4444"
        skin="#8d5a3b"
        hair="#111111"
        pants="#3a3f45"
      />

      {/* forças aplicadas no caixote */}
      {f1 > 0 && (
        <Concept id="f1">
          <Arrow3D from={[HALF + 0.08, 0.75, 0.64]} length={arrowLen(f1)} color={Q.f1.color} />
        </Concept>
      )}
      {f1 > 0 && (
        <QuantityTag q={Q.f1} position={[HALF + 0.08 + arrowLen(f1) / 2, 1.05, 0.64]} value={`= ${f1} N`} />
      )}
      {f2 > 0 && (
        <Concept id="f2">
          <Arrow3D
            from={opposite ? [-HALF - 0.08, 0.75, 0.64] : [HALF + 0.08, 1.3, 0]}
            dir={opposite ? -1 : 1}
            length={arrowLen(f2)}
            color={Q.f2.color}
          />
        </Concept>
      )}
      {f2 > 0 && (
        <QuantityTag
          q={Q.f2}
          position={
            opposite
              ? [-HALF - 0.08 - arrowLen(f2) / 2, 1.05, 0.64]
              : [HALF + 0.08 + arrowLen(f2) / 2, 1.6, 0]
          }
          value={`= ${f2} N`}
        />
      )}
      {fRes !== 0 && (
        <Concept id="fres">
          <Arrow3D from={[0, 2.3, 0]} dir={Math.sign(fRes)} length={arrowLen(fRes)} thickness={1.5} color={Q.fres.color} />
        </Concept>
      )}
      <QuantityTag
        q={Q.fres}
        position={[(Math.sign(fRes) * arrowLen(fRes)) / 2, 2.75, 0]}
        value={`= ${opposite ? `${f1} − ${f2}` : `${f1} + ${f2}`} = ${fRes} N`}
      />
      <QuantityTag q={Q.m} position={[-0.55, HALF * 2 + 0.3, 0]} value={`= ${mass} kg`} />
      <QuantityTag
        q={Q.a}
        position={[0, 3.45, 0]}
        value={`= ${fRes} ÷ ${mass} = ${f2d(accel)} m/s²`}
      />
      <QuantityTag
        q={Q.rr}
        position={[-HALF - 0.9, 0.18, opposite ? 0.7 : 1]}
        name="o pé empurra o chão para trás; o chão empurra a pessoa para frente"
      />
    </group>
  );
}
