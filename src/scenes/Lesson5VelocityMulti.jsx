import { useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import SceneShell from "./SceneShell.jsx";
import KeepInView from "./KeepInView.jsx";
import { Vehicle, RulerTrack } from "./primitives.jsx";
import { useThrottled } from "./useThrottled.js";
import { niceStep, fmtNum } from "./scale.js";
import { Readout, Slider } from "../components/ui.jsx";
import {
  QuantityTag,
  QuantityToggles,
  SpanArrow,
  Concept,
  Term,
  LANE_Y,
  CAR_TAG_Y,
  QuantityHud,
  HudTag,
} from "./quantities.jsx";
import FormulaCard, { num, nump } from "../components/FormulaCard.jsx";

// Conceitos mostrados dentro da cena (tocar na etiqueta oculta)
const Q = {
  t1: { id: "t1", symbol: "Trecho 1", name: "d₁, v₁ e t₁", color: "#38bdf8" },
  t2: { id: "t2", symbol: "Trecho 2", name: "d₂, v₂ e t₂", color: "#f472b6" },
  vm: { id: "vm", symbol: "v média", name: "ΔS total ÷ Δt total", color: "#4ade80" },
  err: { id: "err", symbol: "média aritmética", name: "(v₁ + v₂) ÷ 2 — NÃO é a velocidade média", color: "#f87171" },
};
const Q_LIST = Object.values(Q);
const DS_COLOR = "#fb923c"; // deslocamento (mesma cor das outras aulas)
const DT_COLOR = "#a78bfa"; // tempo
const f1 = (v) => (Math.round(v * 10) / 10).toString().replace(".", ",");

export default function Lesson5VelocityMulti() {
  const followRef = useRef(); // objeto que a câmera acompanha
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
  const splitX = (14 * d1) / (d1 + d2); // fim do trecho 1 na cena
  const carX = useRef(0); // posição do carro na cena (seta ΔS até agora)

  // valores do instante atual
  const [now, setNow] = useState({ tH: 0, x: 0 });
  const inLeg1 = now.tH <= t1;
  const dNow = inLeg1 ? v1 * now.tH : Math.min(d1 + v2 * (now.tH - t1), d1 + d2);
  const vNow = now.tH >= t1 + t2 ? 0 : inLeg1 ? v1 : v2;

  return (
    <div className="lesson__canvas">
      <SceneShell cameraPosition={[4.6, 4.8, 18]} controlsTarget={[6, 1.8, 0]}>
        {/* a câmera acompanha o movimento até o fim, sem perder o objeto de vista */}
        <KeepInView targets={[followRef]} axes={[1, 1, 1]} />
        {/* a pista inteira (0 → 14) representa d₁ + d₂: as marcas mostram km */}
        <RulerTrack
          length={14}
          start={0}
          step={(niceStep((d1 + d2) / 10) * 14) / (d1 + d2)}
          labelOf={(x) => fmtNum((x * (d1 + d2)) / 14, 1)}
          highlight={[0, (14 * d1) / (d1 + d2), 14]}
        />
        <AnimatedCar
          objRef={followRef}
          key={resetKey}
          playing={playing}
          resetKey={resetKey}
          t1={t1}
          t2={t2}
          splitX={splitX}
          onTick={setNow}
          carX={carX}
        >
          {/* só a grandeza "do carro" anda com ele, logo acima do teto */}
          {now.tH > 0 && (
            <QuantityTag
              id="agora"
              position={[0, CAR_TAG_Y, 0]}
              color={inLeg1 ? Q.t1.color : Q.t2.color}
              symbol={now.tH >= t1 + t2 ? "chegou" : inLeg1 ? "trecho 1" : "trecho 2"}
              value={`v = ${num(vNow, 1)} km/h`}
              name="velocidade do trecho atual"
            />
          )}
        </AnimatedCar>

        {/* Cotas acima da pista, uma faixa por grandeza (não se cruzam).
            Faixa 0: deslocamento desde a partida (cresce com o carro). */}
        <SpanArrow
          getFrom={() => 0}
          getTo={() => carX.current}
          y={LANE_Y(0)}
          color={DS_COLOR}
          width={0.06}
          label={
            now.tH > 0
              ? { id: "desloc", symbol: "ΔS", value: `= ${num(dNow, 1)} km`, name: "distância desde a partida" }
              : undefined
          }
        />
        {/* faixas 1 e 2: cada trecho na sua faixa, com o que vale nele */}
        <Concept id="t1">
          <SpanArrow
            getFrom={() => 0}
            getTo={() => splitX}
            y={LANE_Y(1)}
            color={Q.t1.color}
            label={{ q: Q.t1, value: `d₁ = ${d1} km · v₁ = ${v1} km/h`, name: `t₁ = d₁ ÷ v₁ = ${f1(t1)} h` }}
          />
        </Concept>
        <Concept id="t2">
          <SpanArrow
            getFrom={() => splitX}
            getTo={() => 14}
            y={LANE_Y(2)}
            color={Q.t2.color}
            label={{ q: Q.t2, value: `d₂ = ${d2} km · v₂ = ${v2} km/h`, name: `t₂ = d₂ ÷ v₂ = ${f1(t2)} h` }}
          />
        </Concept>
      </SceneShell>
      {/* tempo e velocidades médias não são comprimentos: quadro fixo do topo */}
      <QuantityHud>
        {now.tH > 0 && <HudTag id="tempo" color={DT_COLOR} symbol="t" value={`= ${num(now.tH)} h`} name="tempo desde a partida" />}
        <HudTag q={Q.vm} value={`= (${d1} + ${d2}) ÷ (${f1(t1)} + ${f1(t2)}) = ${f1(vMediaTotal)} km/h`} />
        <HudTag q={Q.err} value={`= ${f1(vMediaErrada)} km/h ✗`} />
      </QuantityHud>

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
                setNow({ tH: 0, x: 0 });
                carX.current = 0;
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
            {
              symbol: "ΔS",
              name: "ΔS total = d₁ + d₂ (soma das distâncias dos trechos)",
              unit: "km",
              color: DS_COLOR,
            },
            { symbol: "Δt", name: "Δt total = t₁ + t₂, com t = d ÷ v em cada trecho", unit: "h", color: DT_COLOR },
            { symbol: "d₁, v₁", name: "distância e velocidade do trecho 1", color: Q.t1.color },
            { symbol: "d₂, v₂", name: "distância e velocidade do trecho 2", color: Q.t2.color },
          ]}
          inputs={[
            {
              key: "d1",
              symbol: "d₁",
              unit: "km",
              value: d1,
              onChange: setD1,
              min: 0.001,
              max: 1e12,
              color: Q.t1.color,
            },
            {
              key: "v1",
              symbol: "v₁",
              unit: "km/h",
              value: v1,
              onChange: setV1,
              min: 0.001,
              max: 1e12,
              color: Q.t1.color,
            },
            {
              key: "d2",
              symbol: "d₂",
              unit: "km",
              value: d2,
              onChange: setD2,
              min: 0.001,
              max: 1e12,
              color: Q.t2.color,
            },
            {
              key: "v2",
              symbol: "v₂",
              unit: "km/h",
              value: v2,
              onChange: setV2,
              min: 0.001,
              max: 1e12,
              color: Q.t2.color,
            },
          ]}
          steps={
            <>
              t₁ = {num(d1)} ÷ {nump(v1)} = {num(t1)} h · t₂ = {num(d2)} ÷ {nump(v2)} = {num(t2)} h
              <br />v = ({num(d1)} + {nump(d2)}) ÷ ({nump(t1)} + {nump(t2)}) = <b>{num(vMediaTotal)} km/h</b>
              <br />
              <span style={{ color: "#fca5a5" }}>
                média aritmética ({num(v1)} + {nump(v2)}) ÷ 2 = {num(vMediaErrada)} km/h ✗
              </span>
            </>
          }
          live={
            now.tH > 0 ? (
              <>
                {inLeg1 ? "Trecho 1" : now.tH >= t1 + t2 ? "Fim do percurso" : "Trecho 2"}: t = <b>{num(now.tH)} h</b> ·
                ΔS = <b>{num(dNow, 1)} km</b>
                <br />v média até agora = {num(dNow, 1)} ÷ {nump(now.tH)} = <b>{num(dNow / now.tH, 1)} km/h</b>
              </>
            ) : (
              <>Aperte ▶ Simular percurso: o tempo, a distância e a velocidade média mudam durante a viagem.</>
            )
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
          A velocidade média do percurso completo é ΔS<sub>total</sub>/Δt<sub>total</sub>, e <strong>não</strong> a
          média aritmética das velocidades de cada trecho — os dois valores só coincidem se os tempos dos trechos forem
          iguais.
        </p>
      </div>
    </div>
  );
}

function AnimatedCar({ objRef, playing, resetKey, t1, t2, splitX, onTick, carX, children }) {
  const ref = useRef();
  const clock = useRef(0);
  const tick = useThrottled(onTick, 100);
  const sent = useRef(false);
  // o percurso todo dura ~8 s na tela, mantendo a proporção entre t₁ e t₂
  const SCALE = 8 / (t1 + t2);

  useFrame((_, delta) => {
    if (!playing || sent.current) return;
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
    if (carX) carX.current = x;
    // tempo do problema (h) desde a partida
    const end = clock.current >= (t1 + t2) * SCALE;
    if (end) sent.current = true;
    tick({ tH: Math.min(clock.current / SCALE, t1 + t2), x }, end);
  });

  return (
    <group
      key={resetKey}
      ref={(o) => {
        ref.current = o;
        if (objRef) objRef.current = o;
      }}
      position={[0, 0.3, 0]}
    >
      <Vehicle color="#22c55e" />
      {children}
    </group>
  );
}
