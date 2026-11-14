import { memo, useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { useThrottled } from "./useThrottled.js";
import SceneShell from "./SceneShell.jsx";
import KeepInView from "./KeepInView.jsx";
import { useProtected } from "./LabelLayout.jsx";
import { Arrow3D, Crate, Pusher } from "./primitives.jsx";
import { Readout, Slider } from "../components/ui.jsx";
import { QuantityTag, QuantityToggles, Concept, Term } from "./quantities.jsx";
import FormulaCard, { num, nump } from "../components/FormulaCard.jsx";

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
  const followRef = useRef(); // objeto que a câmera acompanha
  const [mass, setMass] = useState(40); // kg
  const [f1, setF1] = useState(15); // N (sentido +)
  const [f2, setF2] = useState(25); // N (sentido +, ou negativo se oposto)
  const [opposite, setOpposite] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [resetKey, setResetKey] = useState(0);

  const [dtA, setDtA] = useState(4); // tempo de empurrão (s)
  const [meas, setMeas] = useState({ v: 0, t: 0, x: 0, done: false }); // medido na cena
  const fRes = opposite ? f1 - f2 : f1 + f2;
  const accel = mass > 0 ? fRes / mass : 0;
  // grandezas do instante atual (mudam quando as pessoas soltam o caixote)
  const fResNow = meas.done ? 0 : fRes;
  const aNow = meas.done ? 0 : accel;
  const tNow = meas.t + (meas.coast ?? 0); // tempo total (empurrão + deslizamento)

  return (
    <div className="lesson__canvas">
      <SceneShell setting="yard" fov={50} cameraPosition={[-0.6, 2.7, 9]} controlsTarget={[-1.2, 1.3, 0]}>
        {/* a câmera acompanha o movimento até o fim, sem perder o objeto de vista */}
        <KeepInView targets={[followRef]} axes={[1, 1, 1]} />
        <PushedBox
          objRef={followRef}
          key={`${resetKey}-${dtA}-${accel}`}
          playing={playing}
          accel={accel}
          mass={mass}
          f1={f1}
          f2={f2}
          fRes={fRes}
          opposite={opposite}
          pushTime={dtA}
          onMeasure={setMeas}
        />
        {/* velocidade medida: acompanha o caixote (fora do componente, para não
            redesenhar as pessoas e o caixote a cada atualização) */}
        <FollowX target={followRef}>
          {/* grandezas que mudam durante o movimento: cada uma na sua etiqueta */}
          {meas.t > 0 && (
            <>
              <QuantityTag
                id="tempo"
                position={[-1.55, -0.95, 1.2]}
                color="#a78bfa"
                symbol="t"
                value={`= ${num(tNow, 1)} s`}
                name={meas.done ? "tempo total (empurrão + deslizamento)" : "tempo de empurrão"}
              />
              <QuantityTag
                id="agora"
                position={[0, -0.95, 1.2]}
                color="#38bdf8"
                symbol="v"
                value={`= ${num(meas.v)} m/s`}
                name={meas.done ? "constante: ninguém empurra (inércia)" : "aumenta: v = a · t"}
              />
              <QuantityTag
                id="desloc"
                position={[1.6, -0.95, 1.2]}
                color="#e5e9f5"
                symbol="x"
                value={`= ${num(meas.x, 1)} m`}
                name="quanto o caixote já andou"
              />
            </>
          )}
        </FollowX>
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
          {/* valores do instante atual: depois que soltam o caixote, FRes e a viram 0 */}
          <Readout
            items={[
              { label: meas.done ? "FRes agora (soltaram)" : "FRes = F1 ± F2", value: `${num(fResNow)} N` },
              { label: meas.done ? "a agora (inércia)" : "a = FRes / m", value: `${num(aNow)} m/s²` },
              { label: "Velocidade agora", value: `${num(meas.v)} m/s` },
              { label: "Tempo", value: `${num(meas.t + (meas.coast ?? 0), 1)} s` },
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
            {
              symbol: "FRes",
              name: "força resultante: soma das forças (sentidos opostos se subtraem)",
              unit: "N",
              color: Q.fres.color,
            },
            { symbol: "m", name: "massa: quantidade de matéria do corpo (inércia)", unit: "kg", color: Q.m.color },
            {
              symbol: "a",
              name: "aceleração: quanto a velocidade muda a cada segundo",
              unit: "m/s²",
              color: Q.a.color,
            },
            { symbol: "F1, F2", name: "forças aplicadas pelas pessoas", unit: "N", color: Q.f1.color },
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
              color: Q.m.color,
            },
            { key: "f1", symbol: "F1", unit: "N", value: f1, onChange: setF1, min: 0, max: 1e12, color: Q.f1.color },
            { key: "f2", symbol: "F2", unit: "N", value: f2, onChange: setF2, min: 0, max: 1e12, color: Q.f2.color },
          ]}
          steps={
            <>
              FRes = {num(f1)} {opposite ? "−" : "+"} {num(f2)} = <b>{num(fRes)} N</b>
              <br />a = {num(fRes)} ÷ {nump(mass)} = <b>{num(accel)} m/s²</b>
            </>
          }
          live={
            meas.t > 0 ? (
              <>
                t = <b>{num(meas.t)} s</b> {meas.done ? "(as pessoas pararam de empurrar)" : "empurrando"}
                <br />v = a · t = {num(accel)} × {nump(meas.t)} = <b>{num(meas.v)} m/s</b>
                <br />
                deslocamento = ½ · a · t² = <b>{num(0.5 * accel * Math.min(meas.t, dtA) ** 2, 1)} m</b>
                {meas.done && <> + depois {num(meas.x - 0.5 * accel * dtA * dtA, 1)} m sem força (inércia)</>}
              </>
            ) : (
              <>Aperte ▶ Aplicar forças para ver t, v e o deslocamento mudarem.</>
            )
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
            {
              symbol: "ΔV",
              name: "variação da velocidade = V final − V inicial (medida na cena)",
              unit: "m/s",
              color: "#38bdf8",
            },
            { symbol: "Δt", name: "tempo que as pessoas empurram o caixote", unit: "s", color: "#a78bfa" },
          ]}
          inputs={[
            {
              key: "dt",
              symbol: "Δt",
              unit: "s",
              value: dtA,
              onChange: (v) => {
                setDtA(v);
                setPlaying(false);
                setResetKey((k) => k + 1);
              },
              min: 0.001,
              max: 1e9,
              color: "#a78bfa",
            },
          ]}
          steps={
            meas.t > 0 ? (
              <>
                ΔV = {num(meas.v)} − 0 = {num(meas.v)} m/s {meas.done ? "" : `(empurrando… ${num(meas.t, 1)} s)`}
                <br />a = {num(meas.v)} ÷ {nump(meas.done ? dtA : meas.t)} ={" "}
                <b>{num(meas.done ? meas.v / dtA : accel)} m/s²</b>
                <br />
                <span style={{ opacity: 0.8 }}>igual a FRes ÷ m = {num(accel)} m/s² ✓</span>
              </>
            ) : (
              <>Aperte ▶ Aplicar forças: as pessoas empurram durante Δt = {num(dtA)} s e a cena mede ΔV.</>
            )
          }
          onReset={() => {
            setDtA(4);
            setPlaying(false);
            setResetKey((k) => k + 1);
          }}
        />

        <QuantityToggles items={Q_LIST} />
        <p style={{ fontSize: "0.82rem", color: "#a6adc9", marginTop: 14 }}>
          2ª Lei de Newton: F<sub>Res</sub> = m·a. Quando as forças têm sentidos opostos, a resultante é a diferença
          entre elas. A 3ª Lei (ação e reação) aparece, por exemplo, nos pés de quem empurra o caixote: ao empurrar o
          chão para trás, o chão empurra a pessoa para frente — mas essas forças atuam em corpos diferentes, por isso
          não se anulam. Na cena, a pessoa de azul aplica F1, a de vermelho aplica F2 e a seta amarela mostra a
          resultante.
        </p>
      </div>
    </div>
  );
}

// Grupo que copia a posição X (no mundo) de outro objeto a cada quadro.
function FollowX({ target, children }) {
  const g = useRef();
  const p = useRef(new THREE.Vector3());
  useFrame(() => {
    if (target.current && g.current) {
      target.current.getWorldPosition(p.current);
      g.current.position.set(p.current.x, p.current.y, 0);
    }
  });
  return <group ref={g}>{children}</group>;
}

// Caixote e as duas pessoas que o empurram. Enquanto empurram, as pessoas
// andam junto com o caixote; quando param (fim de Δt), elas ficam onde estão e
// o caixote segue deslizando sozinho (sem atrito) por mais COAST segundos —
// é o fim da ação. Tudo em metros, nas proporções reais (caixote de 1,1 m,
// pessoas de ~1,75 m).
const HALF = 0.55;
const START_X = -2.6;
const COAST = 3; // s de deslizamento depois que param de empurrar
const SCALE = 1 / 25; // comprimento da seta: 1 unidade a cada 25 N
const arrowLen = (f) => Math.min(Math.max(Math.abs(f) * SCALE, 0.45), 5);

// O deslocamento mostrado é comprimido quando seria grande demais (o valor
// medido continua real); empurrões longos são acelerados na tela.
const PushedBox = memo(function PushedBox({
  objRef,
  playing,
  accel,
  mass,
  f1,
  f2,
  fRes,
  opposite,
  pushTime,
  onMeasure,
}) {
  const crate = useRef();
  const people = useRef();
  const state = useRef({ x: 0, v: 0, t: 0, coast: 0, done: false, ended: false });
  const report = useThrottled(onMeasure);
  useProtected(crate, people); // etiquetas não cobrem o caixote nem as pessoas
  const vEnd = Math.abs(accel) * pushTime;
  const travel = 0.5 * Math.abs(accel) * pushTime * pushTime + vEnd * COAST; // metros reais
  const kVis = travel > 9 ? 9 / travel : 1;
  const rate = pushTime > 8 ? pushTime / 8 : 1;
  const [pushing, setPushing] = useState(true);
  // nova montagem (novos valores ou reinício): zera a medição do painel
  useEffect(() => onMeasure?.({ v: 0, t: 0, x: 0, done: false }), [onMeasure]);

  useFrame((_, delta) => {
    const s = state.current;
    if (!playing || s.ended) return;
    // passo de tempo real (até 0,1 s por quadro): não "trava" em computadores lentos
    const dt = Math.min(delta, 0.1) * rate;
    if (s.t < pushTime) {
      const step = Math.min(dt, pushTime - s.t);
      s.v += accel * step;
      s.x += s.v * step;
      s.t += step;
      if (s.t >= pushTime) {
        s.done = true;
        setPushing(false);
      }
    } else {
      const step = Math.min(dt, COAST - s.coast);
      s.x += s.v * step; // segue em movimento uniforme (inércia)
      s.coast += step;
      if (s.coast >= COAST) s.ended = true;
    }
    const vx = START_X + s.x * kVis;
    if (crate.current) crate.current.position.x = vx;
    if (!s.done && people.current) people.current.position.x = vx; // param onde soltaram o caixote
    const force = (s.done && !s.sent) || s.ended;
    if (s.done) s.sent = true;
    report({ v: s.v, t: s.t, coast: s.coast, x: s.x, done: s.done, ended: s.ended }, force);
  });

  const side2 = opposite ? 1 : -1; // lado do caixote onde fica quem aplica F2
  return (
    <>
      <group ref={people} position={[START_X, 0, 0]}>
        {/* pessoa de azul: aplica F1 para a direita */}
        <Pusher position={[-HALF - 0.62, 0, opposite ? 0 : 0.3]} dir={1} shirt="#3b82f6" upright={!pushing} />
        {/* pessoa de vermelho: aplica F2 — no mesmo sentido ou no sentido oposto */}
        <Pusher
          position={[side2 * (HALF + 0.62), 0, opposite ? 0 : -0.3]}
          dir={-side2}
          shirt="#ef4444"
          skin="#8d5a3b"
          hair="#111111"
          pants="#3a3f45"
          shoes="#2b2b2b"
          upright={!pushing}
        />
        {/* a 3ª Lei aparece nos pés de quem empurra: fica junto das pessoas */}
        <QuantityTag
          q={Q.rr}
          position={[-HALF - 0.9, 0.18, opposite ? 0.7 : 1]}
          name="o pé empurra o chão para trás; o chão empurra a pessoa para frente"
        />
      </group>
      <group ref={crate} position={[START_X, 0, 0]}>
        <Crate size={HALF * 2} />
        {/* ponto que a câmera mantém no centro: meio do caixote */}
        <group ref={objRef} position={[0, 0.7, 0]} />

        {/* forças aplicadas no caixote */}
        {pushing && f1 > 0 && (
          <Concept id="f1">
            <Arrow3D from={[HALF + 0.08, 0.75, 0.64]} length={arrowLen(f1)} color={Q.f1.color} />
          </Concept>
        )}
        {pushing && f1 > 0 && (
          <QuantityTag q={Q.f1} position={[HALF + 0.08 + arrowLen(f1) + 0.55, 0.75, 0.64]} value={`= ${f1} N`} />
        )}
        {pushing && f2 > 0 && (
          <Concept id="f2">
            <Arrow3D
              from={opposite ? [-HALF - 0.08, 0.75, 0.64] : [HALF + 0.08, 1.3, 0]}
              dir={opposite ? -1 : 1}
              length={arrowLen(f2)}
              color={Q.f2.color}
            />
          </Concept>
        )}
        {pushing && f2 > 0 && (
          <QuantityTag
            q={Q.f2}
            position={
              opposite ? [-HALF - 0.08 - arrowLen(f2) - 0.55, 0.75, 0.64] : [HALF + 0.08 + arrowLen(f2) + 0.55, 1.3, 0]
            }
            value={`= ${f2} N`}
          />
        )}
        {pushing && fRes !== 0 && (
          <Concept id="fres">
            <Arrow3D
              from={[0, 2.3, 0]}
              dir={Math.sign(fRes)}
              length={arrowLen(fRes)}
              thickness={1.5}
              color={Q.fres.color}
            />
          </Concept>
        )}
        <QuantityTag
          q={Q.fres}
          position={pushing ? [Math.sign(fRes || 1) * (arrowLen(fRes) + 0.75), 2.3, 0] : [0, 1.75, 0]}
          value={pushing ? `= ${opposite ? `${f1} − ${f2}` : `${f1} + ${f2}`} = ${fRes} N` : "= 0 N"}
          name={pushing ? "força resultante" : "ninguém empurra: o caixote segue por inércia (1ª Lei)"}
        />
        <QuantityTag q={Q.m} position={[0, HALF * 2 + 0.25, 0]} value={`= ${mass} kg`} />
        <QuantityTag
          q={Q.a}
          position={pushing ? [0, 3.05, 0] : [0, 2.2, 0]}
          value={pushing ? `= ${fRes} ÷ ${mass} = ${f2d(accel)} m/s²` : "= 0 (velocidade constante)"}
        />
      </group>
    </>
  );
});
