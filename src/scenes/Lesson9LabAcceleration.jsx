import { useEffect, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import SceneShell from "./SceneShell.jsx";
import KeepInView from "./KeepInView.jsx";
import { Vehicle, RulerTrack } from "./primitives.jsx";
import { useThrottled } from "./useThrottled.js";
import { Readout, Slider } from "../components/ui.jsx";
import { QuantityTag, QuantityToggles, Term, SpanArrow, QuantityHud, HudTag } from "./quantities.jsx";
import FormulaCard, { num, nump } from "../components/FormulaCard.jsx";

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
  const followRef = useRef(); // objeto que a câmera acompanha
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

  // Velocidades das duas medições: começam com os valores do exemplo e podem
  // ser digitadas — o carrinho da cena anda exatamente com a velocidade digitada.
  const [v1c, setV1c] = useState(8);
  const [v2c, setV2c] = useState(14);
  const [run, setRun] = useState(null); // medição em andamento: { t, d, v, boost }
  const v1 = readings.length >= 1 ? v1c : null;
  const v2 = readings.length >= 2 ? v2c : null;
  // largada do carrinho na cena (com velocidade negativa ele sai do fim da pista)
  const runStartX = (boost === 2 ? v2c : v1c) < 0 ? SCENE_LENGTH : 0;
  const deltaV = v1 != null && v2 != null ? v2 - v1 : null;
  const accel = deltaV != null ? deltaV / dt : null;

  return (
    <div className="lesson__canvas">
      <SceneShell setting="lab" cameraPosition={[2.2, 3, 10]} controlsTarget={[3.8, 0.8, 0]}>
        {/* a câmera acompanha o movimento até o fim, sem perder o objeto de vista */}
        <KeepInView targets={[followRef]} axes={[1, 1, 1]} />
        <RulerTrack length={SCENE_LENGTH} start={0} />
        <FrictionCart
          objRef={followRef}
          running={running}
          boost={boost}
          speed={boost === 2 ? v2c : v1c}
          onTick={setRun}
          resetKey={resetKey}
          onFinish={onFinish}
        >
          {/* só a grandeza "do carrinho" anda com ele (o grupo tem escala 0,7) */}
          {run && (
            <QuantityTag
              id="vagora"
              position={[0, 1.45, 0]}
              color={run.boost === 2 ? Q.v2.color : Q.v1.color}
              symbol={`V${run.boost}`}
              value={`= ${num(run.t > 0 ? run.d / run.t : 0, 1)} cm/s`}
              name="d ÷ t até agora"
            />
          )}
        </FrictionCart>
        {/* cota acima da pista: distância desde a largada (cresce com o carrinho) */}
        {run && (
          <SpanArrow
            getFrom={() => runStartX}
            getTo={() => followRef.current?.position.x ?? runStartX}
            y={1.6}
            color="#fb923c"
            width={0.05}
            label={{ id: "desloc", symbol: "d", value: `= ${num(run.d, 1)} cm`, name: "distância desde a largada" }}
          />
        )}
      </SceneShell>
      {/* resultados das medições não têm lugar na pista: quadro fixo do topo */}
      <QuantityHud>
        {run && <HudTag id="tempo" color="#a78bfa" symbol="t" value={`= ${num(run.t)} s`} name="tempo da medição" />}
        <HudTag q={Q.v1} value={v1 != null ? `= ${c(v1)} cm/s` : "= ? (faça a medição 1)"} />
        <HudTag q={Q.v2} value={v2 != null ? `= ${c(v2)} cm/s` : "= ? (faça a medição 2)"} />
        <HudTag q={Q.dt} value={`= ${c(dt)} s`} />
        {deltaV != null && (
          <>
            <HudTag q={Q.dv} value={`= ${c(v2)} − ${c(v1)} = ${c(deltaV)} cm/s`} />
            <HudTag q={Q.a} value={`= ${c(deltaV)} ÷ ${c(dt)} = ${c(accel, 2)} cm/s²`} />
          </>
        )}
      </QuantityHud>

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
            {
              symbol: "a",
              name: "aceleração: quanto a velocidade muda a cada segundo",
              unit: "cm/s²",
              color: Q.a.color,
            },
            { symbol: "ΔV", name: "variação da velocidade = V2 − V1", unit: "cm/s", color: Q.dv.color },
            { symbol: "V1", name: "velocidade na medição 1 (impulso fraco)", unit: "cm/s", color: Q.v1.color },
            { symbol: "V2", name: "velocidade na medição 2 (impulso forte)", unit: "cm/s", color: Q.v2.color },
            { symbol: "Δt", name: "tempo entre as duas medições", unit: "s", color: Q.dt.color },
          ]}
          inputs={[
            {
              key: "v1",
              symbol: "V1",
              unit: "cm/s",
              value: v1c,
              onChange: setV1c,
              min: -1e12,
              max: 1e12,
              color: Q.v1.color,
            },
            {
              key: "v2",
              symbol: "V2",
              unit: "cm/s",
              value: v2c,
              onChange: setV2c,
              min: -1e12,
              max: 1e12,
              color: Q.v2.color,
            },
            {
              key: "dt",
              symbol: "Δt",
              unit: "s",
              value: dt,
              onChange: setDt,
              min: 0.0001,
              max: 1e12,
              color: Q.dt.color,
            },
          ]}
          steps={
            <>
              ΔV = {num(v2c)} − {nump(v1c)} = {num(v2c - v1c)} cm/s
              <br />a = {num(v2c - v1c)} ÷ {nump(dt)} = <b>{num((v2c - v1c) / dt)} cm/s²</b>
            </>
          }
          live={
            run && (running || deltaV == null) ? (
              <>
                Medição {run.boost}: t = <b>{num(run.t)} s</b> · distância = <b>{num(run.d, 1)} cm</b>
                <br />V{run.boost} = {num(run.d, 1)} ÷ {nump(run.t)} ={" "}
                <b>{num(run.t > 0 ? run.d / run.t : 0, 1)} cm/s</b>
              </>
            ) : deltaV != null ? (
              <>
                ΔV = {num(v2c)} − {nump(v1c)} = <b>{num(deltaV)} cm/s</b> em Δt = {num(dt)} s → a ={" "}
                <b>{num(accel)} cm/s²</b>
              </>
            ) : (
              <>Faça as medições: o tempo e a distância de cada uma aparecem aqui enquanto o carrinho anda.</>
            )
          }
          note="O carrinho de cada medição anda com a velocidade digitada (negativa = de ré). Digite os valores medidos em sala e repita as medições."
          onReset={() => {
            setV1c(8);
            setV2c(14);
            setDt(3);
          }}
        />

        <QuantityToggles items={Q_LIST} />
        <p style={{ fontSize: "0.82rem", color: "#a6adc9", marginTop: 10 }}>
          Faça a medição 1 (impulso fraco) e a medição 2 (impulso forte); a cena calcula a variação de velocidade (ΔV)
          e, dividindo pelo intervalo de tempo entre as medições, obtém a aceleração média — mesmo princípio de a =
          ΔV/Δt usado em toda a aula.
        </p>
      </div>
    </div>
  );
}

// 8 unidades de pista = 24 cm. O carrinho anda com a velocidade `speed` (cm/s)
// digitada; negativa = de trás para a frente. Percursos muito longos/curtos
// são acelerados/desacelerados na tela, sem mudar o valor medido.
function FrictionCart({ objRef, running, boost, speed, resetKey, onFinish, onTick, children }) {
  const ref = useRef();
  const t = useRef(0);
  const T = Math.abs(speed) > 1e-9 ? 24 / Math.abs(speed) : 0; // tempo real (s)
  const rate = T > 8 ? T / 8 : T < 0.6 && T > 0 ? T / 0.6 : 1;
  const startX = speed < 0 ? SCENE_LENGTH : 0;
  const tick = useThrottled(onTick, 90);
  const finished = useRef(false);
  useEffect(() => {
    if (running) {
      finished.current = false;
      t.current = 0;
    }
  }, [running]);

  useFrame((_, delta) => {
    if (!running || finished.current) return;
    t.current = Math.min(t.current + delta * rate, T);
    const p = T > 0 ? t.current / T : 1;
    const x = speed < 0 ? SCENE_LENGTH * (1 - p) : SCENE_LENGTH * p;
    if (ref.current) ref.current.position.x = x;
    tick({ t: t.current, d: 24 * p, v: speed, boost }, t.current >= T);
    if (t.current >= T) {
      finished.current = true;
      onFinish?.(speed, boost);
    }
  });

  return (
    <group
      key={resetKey + "-" + boost}
      ref={(o) => {
        ref.current = o;
        if (objRef) objRef.current = o;
      }}
      position={[startX, 0.25, 0]}
      scale={0.7}
    >
      <Vehicle color={boost === 2 ? "#ef4444" : "#3b82f6"} rotationY={speed < 0 ? Math.PI : 0} />
      {children}
    </group>
  );
}
