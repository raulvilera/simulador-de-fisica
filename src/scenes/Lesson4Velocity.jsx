import { useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import SceneShell from "./SceneShell.jsx";
import KeepInView from "./KeepInView.jsx";
import { useThrottled } from "./useThrottled.js";
import { Vehicle, RulerTrack } from "./primitives.jsx";
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
  ds: { id: "ds", symbol: "ΔS", name: "deslocamento da viagem", color: "#fb923c" },
  dt: { id: "dt", symbol: "Δt", name: "intervalo de tempo", color: "#a78bfa" },
  vm: { id: "vm", symbol: "v média", name: "ΔS ÷ Δt (a viagem inteira)", color: "#4ade80" },
  vi: { id: "vi", symbol: "v instantânea", name: "o que o velocímetro mostra agora", color: "#38bdf8" },
};
const Q_LIST = Object.values(Q);
const fmt = (v) => String(v).replace(".", ",");

export default function Lesson4Velocity() {
  const followRef = useRef(); // objeto que a câmera acompanha
  const [distance, setDistance] = useState(200); // km (ΔS)
  const [time, setTime] = useState(2); // h (Δt)
  const [playing, setPlaying] = useState(false);
  const [resetKey, setResetKey] = useState(0);
  // valores do instante atual: v instantânea, fração da viagem e posição na pista
  const [trip, setTrip] = useState({ v: 0, p: 0, x: 0 });
  const instSpeed = trip.v;
  const carX = useRef(0); // posição do carro na cena (para a seta ΔS até agora)
  const dsNow = (trip.x / 13) * distance; // km percorridos até agora
  const dtNow = trip.p * time; // horas desde a partida

  const vMedia = time > 0 ? (distance / time).toFixed(1) : "0";

  return (
    <div className="lesson__canvas">
      <SceneShell cameraPosition={[4.6, 4.4, 17]} controlsTarget={[6, 1.4, 0]}>
        {/* a câmera acompanha o movimento até o fim, sem perder o objeto de vista */}
        <KeepInView targets={[followRef]} axes={[1, 1, 1]} />
        {/* a pista (0 → 13) representa o ΔS digitado: as marcas mostram km */}
        <RulerTrack
          length={14}
          start={0}
          step={(niceStep(distance / 10) * 13) / distance}
          labelOf={(x) => fmtNum((x * distance) / 13, 1)}
        />
        <AnimatedCar
          objRef={followRef}
          key={resetKey}
          playing={playing}
          resetKey={resetKey}
          durationSeconds={6}
          vm={distance / time}
          onSpeedUpdate={setTrip}
          carX={carX}
        >
          {/* só a grandeza "do carro" anda com ele, logo acima do teto */}
          <QuantityTag q={Q.vi} position={[0, CAR_TAG_Y, 0]} value={`= ${num(instSpeed, 1)} km/h`} />
        </AnimatedCar>

        {/* Cotas acima da pista, cada uma na sua faixa (não se cruzam). As linhas
            tracejadas descem até a régua: dá para ler de onde a onde vai o ΔS. */}
        <Concept id="ds">
          {/* faixa 0: deslocamento até o instante atual (cresce com o carro) */}
          <SpanArrow
            getFrom={() => 0}
            getTo={() => carX.current}
            y={LANE_Y(0)}
            color={Q.ds.color}
            width={0.06}
            label={
              trip.p > 0 && trip.p < 1
                ? { id: "ds", symbol: "ΔS", value: `= ${num(dsNow, 1)} km`, name: "deslocamento até agora" }
                : undefined
            }
          />
          {/* faixa 1: deslocamento da viagem inteira */}
          <SpanArrow
            getFrom={() => 0}
            getTo={() => 13}
            y={LANE_Y(1)}
            color={Q.ds.color}
            label={{ q: Q.ds, value: `= ${num(distance)} km`, name: "deslocamento da viagem inteira" }}
          />
        </Concept>
      </SceneShell>
      {/* tempo e velocidade média não são comprimentos (não têm lugar na pista):
          ficam no quadro fixo do topo, sempre visíveis */}
      <QuantityHud>
        <HudTag
          q={Q.dt}
          value={trip.p > 0 ? `t = ${num(dtNow)} h de ${fmt(time)} h` : `= ${fmt(time)} h`}
          name="do início ao fim da viagem"
        />
        <HudTag q={Q.vm} value={`= ${distance} ÷ ${fmt(time)} = ${fmt(vMedia)} km/h`} />
      </QuantityHud>

      <div className="panel">
        <p className="panel__eyebrow">Aula 4 · Velocidade</p>
        <h1>Velocidade média x instantânea</h1>
        <div className="controls">
          <Slider
            label="Deslocamento (ΔS)"
            value={distance}
            onChange={setDistance}
            min={20}
            max={400}
            step={10}
            unit=" km"
          />
          <Slider label="Tempo (Δt)" value={time} onChange={setTime} min={1} max={8} step={0.5} unit=" h" />
          <div className="btnRow">
            <button className="btn btn--primary" onClick={() => setPlaying(true)}>
              ▶ Simular viagem
            </button>
            <button
              className="btn btn--ghost"
              onClick={() => {
                setPlaying(false);
                setTrip({ v: 0, p: 0, x: 0 });
                carX.current = 0;
                setResetKey((k) => k + 1);
              }}
            >
              ↺
            </button>
          </div>
          <div className="speedo">
            <div className="readout__label">Velocímetro (instantânea)</div>
            <div className="readout__value" style={{ fontSize: "1.8rem" }}>
              {num(instSpeed, 1)} km/h
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
            {
              symbol: "v",
              name: "velocidade média: quanto a posição muda, em média, por unidade de tempo",
              unit: "km/h ou m/s",
              color: Q.vm.color,
            },
            { symbol: "ΔS", name: "deslocamento: variação da posição na viagem", unit: "km ou m", color: Q.ds.color },
            { symbol: "Δt", name: "intervalo de tempo: quanto durou a viagem", unit: "h ou s", color: Q.dt.color },
          ]}
          inputs={[
            {
              key: "ds",
              symbol: "ΔS",
              unit: "km",
              value: distance,
              onChange: setDistance,
              min: 0.001,
              max: 1e12,
              color: Q.ds.color,
            },
            {
              key: "dt",
              symbol: "Δt",
              unit: "h",
              value: time,
              onChange: setTime,
              min: 0.0001,
              max: 1e12,
              color: Q.dt.color,
            },
          ]}
          steps={
            <>
              v = {num(distance)} ÷ {nump(time)} = <b>{num(distance / time)} km/h</b>
              <br />= {num(distance / time)} ÷ 3,6 = <b>{num(distance / time / 3.6)} m/s</b>
            </>
          }
          live={
            trip.p > 0 ? (
              <>
                Δt até agora = <b>{num(dtNow)} h</b> · ΔS até agora = <b>{num(dsNow, 1)} km</b>
                <br />v média até agora = {num(dsNow, 1)} ÷ {nump(dtNow)} ={" "}
                <b>{num(dtNow > 0 ? dsNow / dtNow : 0, 1)} km/h</b>
                <br />
                velocímetro (instantânea): <b>{num(instSpeed, 1)} km/h</b>
              </>
            ) : (
              <>Aperte ▶ Simular viagem: Δt, ΔS e as velocidades mudam enquanto o carro anda.</>
            )
          }
          onReset={() => {
            setDistance(200);
            setTime(2);
          }}
        />

        <QuantityToggles items={Q_LIST} />
        <p style={{ fontSize: "0.82rem", color: "#a6adc9", marginTop: 14 }}>
          A velocidade média (v = ΔS/Δt) descreve a viagem inteira. Já o velocímetro mostra a velocidade instantânea,
          que varia a cada momento — repare que ela oscila durante a simulação, mesmo com a mesma velocidade média.
        </p>
      </div>
    </div>
  );
}

// A viagem dura `durationSeconds` na tela (representando Δt). A velocidade
// instantânea oscila em torno da média v = ΔS/Δt, mas a média dela é sempre
// exatamente v: x(p) = 13·(p + A·sen(2πnp)/(2πn)).
const A = 0.3;
const N = 3;
function AnimatedCar({ objRef, playing, resetKey, durationSeconds, vm, onSpeedUpdate, carX, children }) {
  const ref = useRef();
  const t = useRef(0);
  const sent = useRef(false);
  const report = useThrottled(onSpeedUpdate);

  useFrame((_, delta) => {
    if (!playing || sent.current) return;
    t.current += delta;
    const progress = Math.min(t.current / durationSeconds, 1);
    const x = 13 * (progress + (A * Math.sin(2 * Math.PI * N * progress)) / (2 * Math.PI * N));
    // Velocidade instantânea "ruidosa" em torno de uma média, só para efeito visual/didático.
    const inst = vm * (1 + A * Math.cos(2 * Math.PI * N * progress));
    if (ref.current) ref.current.position.x = x;
    if (carX) carX.current = x;
    if (progress >= 1) sent.current = true; // chegou: último aviso e para
    report({ v: progress < 1 ? Math.max(inst, 0) : 0, p: progress, x }, progress >= 1);
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
      <Vehicle color="#3b82f6" />
      {children}
    </group>
  );
}
