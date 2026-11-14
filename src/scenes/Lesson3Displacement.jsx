import { useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import SceneShell from "./SceneShell.jsx";
import { useThrottled } from "./useThrottled.js";
import { Vehicle, RulerTrack } from "./primitives.jsx";
import { Readout } from "../components/ui.jsx";
import FormulaCard, { num } from "../components/FormulaCard.jsx";
import { QuantityTag, Pin, SpanArrow, QuantityToggles, Term, useQuantityVisibility } from "./quantities.jsx";

// Exemplo do material: A (0 m) -> C (10 m) -> volta e para em B (6 m).
// Os três pontos podem ser digitados no painel (0 a 14 m).
const EXAMPLE = [0, 10, 6];
const TRACK = 14;
const SPEED = 2.5; // m/s

// Grandezas mostradas na cena. A mesma cor aparece na etiqueta, na seta e na
// fórmula do painel.
const Q = {
  s0: { id: "s0", symbol: "S₀", name: "posição inicial", color: "#4ade80" },
  s: { id: "s", symbol: "S", name: "posição", color: "#f472b6" },
  ds: { id: "ds", symbol: "ΔS", name: "deslocamento", color: "#fb923c" },
  d: { id: "d", symbol: "d", name: "distância percorrida", color: "#22d3ee" },
};
const Q_LIST = Object.values(Q);

const fmt = (v) => v.toFixed(1).replace(".", ",");

function Walker({ path: PATH, playing, sim, onUpdate, children }) {
  const ref = useRef();
  const turnRef = useRef();
  const legIndex = useRef(0);
  const pos = useRef(PATH[0]);
  const distance = useRef(0);
  const report = useThrottled(onUpdate);

  useFrame((_, delta) => {
    if (!playing || legIndex.current >= PATH.length - 1) return;
    const target = PATH[legIndex.current + 1];
    const dir = target >= pos.current ? 1 : -1;

    // Antes de voltar, o carro faz a meia-volta: ele sempre anda de frente.
    const heading = dir > 0 ? 0 : Math.PI;
    const turn = turnRef.current;
    if (turn && Math.abs(turn.rotation.y - heading) > 0.001) {
      const d = heading - turn.rotation.y;
      turn.rotation.y += Math.sign(d) * Math.min(Math.abs(d), 3.5 * delta);
      return;
    }
    const step = SPEED * delta * dir;

    if ((dir > 0 && pos.current + step >= target) || (dir < 0 && pos.current + step <= target)) {
      distance.current += Math.abs(target - pos.current);
      pos.current = target;
      legIndex.current += 1;
    } else {
      pos.current += step;
      distance.current += Math.abs(step);
    }

    // valores lidos a cada quadro pelas setas das grandezas
    sim.current.pos = pos.current;
    sim.current.leg = legIndex.current;

    if (ref.current) ref.current.position.x = pos.current;
    report(
      {
        position: pos.current,
        distance: distance.current,
        displacement: pos.current - PATH[0],
        leg: legIndex.current,
        finished: legIndex.current >= PATH.length - 1,
      },
      pos.current === target,
    );
  });

  return (
    <group ref={ref} position={[PATH[0], 0.3, 0]}>
      <group ref={turnRef}>
        <Vehicle color="#8b5cf6" />
      </group>
      {/* etiqueta que acompanha o carro */}
      {children}
    </group>
  );
}

const startOf = (p) => ({ position: p[0], distance: 0, displacement: 0, leg: 0, finished: false });

export default function Lesson3Displacement() {
  const [playing, setPlaying] = useState(false);
  const [resetKey, setResetKey] = useState(0);
  const [PATH, setPath] = useState(EXAMPLE);
  const [stats, setStats] = useState(() => startOf(EXAMPLE));
  const sim = useRef({ pos: EXAMPLE[0], leg: 0 });
  const vis = useQuantityVisibility(Q_LIST.map((q) => q.id));

  const reset = (p = PATH) => {
    setPlaying(false);
    setStats(startOf(p));
    sim.current = { pos: p[0], leg: 0 };
    setResetKey((k) => k + 1);
  };
  // mudar um ponto do trajeto recomeça a animação com os novos valores
  const setPoint = (i, v) => {
    const p = PATH.slice();
    p[i] = v;
    setPath(p);
    reset(p);
  };
  const leg1Len = Math.abs(PATH[1] - PATH[0]);
  const leg2Len = Math.abs(PATH[2] - PATH[1]);

  const finished = stats.finished;
  const moved = stats.distance > 0.05;
  const leg1 = Math.min(stats.distance, leg1Len);
  const leg2 = Math.max(0, stats.distance - leg1Len);
  const sLabel = finished ? (
    <>
      S<sub>f</sub>
    </>
  ) : (
    "S"
  );
  const legEnd = stats.leg === 0 ? stats.position : PATH[1];

  return (
    <div className="lesson__canvas">
      <SceneShell cameraPosition={[4.6, 4.6, 18]} controlsTarget={[5.8, 1.4, 0]}>
        <RulerTrack length={TRACK} start={0} highlight={PATH} />

        <Walker key={resetKey} path={PATH} playing={playing} sim={sim} onUpdate={setStats}>
          {vis.isVisible("s") && (
            <QuantityTag
              position={[0, 1.35, 0]}
              color={Q.s.color}
              symbol={sLabel}
              value={`= ${fmt(stats.position)} m`}
              name={finished ? "posição final" : "posição atual"}
              onHide={() => vis.hide("s")}
            />
          )}
        </Walker>

        {/* S₀: origem / posição inicial */}
        {vis.isVisible("s0") && (
          <>
            <Pin x={PATH[0]} z={-1.25} height={3.1} color={Q.s0.color} />
            <QuantityTag
              position={[PATH[0], 3.45, -1.25]}
              color={Q.s0.color}
              symbol="S₀"
              value={`= ${fmt(PATH[0])} m`}
              name="posição inicial (origem)"
              onHide={() => vis.hide("s0")}
            />
          </>
        )}

        {/* ΔS: seta da posição inicial até a posição atual/final */}
        {vis.isVisible("ds") && (
          <>
            <SpanArrow getFrom={() => PATH[0]} getTo={() => sim.current.pos} y={1.85} color={Q.ds.color} />
            {moved && (
              <QuantityTag
                position={[(PATH[0] + stats.position) / 2, 2.2, 0]}
                color={Q.ds.color}
                symbol="ΔS"
                value={`= ${fmt(stats.position)} − ${fmt(PATH[0])} = ${fmt(stats.displacement)} m`}
                name={`deslocamento: ${finished ? "Sf" : "S"} − S₀`}
                onHide={() => vis.hide("ds")}
              />
            )}
          </>
        )}

        {/* d: distância percorrida, trecho por trecho */}
        {vis.isVisible("d") && (
          <>
            <SpanArrow
              getFrom={() => PATH[0]}
              getTo={() => (sim.current.leg === 0 ? sim.current.pos : PATH[1])}
              y={2.85}
              color={Q.d.color}
              width={0.07}
            />
            <SpanArrow
              getFrom={() => PATH[1]}
              getTo={() => (sim.current.leg >= 1 ? sim.current.pos : PATH[1])}
              y={2.55}
              color={Q.d.color}
              width={0.07}
            />
            {moved && (
              <QuantityTag
                position={[Math.max(3.5, legEnd / 2 + 1), 3.4, 0]}
                color={Q.d.color}
                symbol="d"
                value={
                  leg2 > 0 ? `= ${fmt(leg1)} + ${fmt(leg2)} = ${fmt(stats.distance)} m` : `= ${fmt(stats.distance)} m`
                }
                name="distância percorrida (todo o trajeto)"
                onHide={() => vis.hide("d")}
              />
            )}
          </>
        )}
      </SceneShell>

      <div className="panel">
        <p className="panel__eyebrow">Aula 3 · Posição e deslocamento</p>
        <h1>Distância percorrida x deslocamento</h1>
        <div className="controls">
          <div className="btnRow">
            <button className="btn btn--primary" onClick={() => setPlaying(true)}>
              ▶ Ir de A ({num(PATH[0])} m) → C ({num(PATH[1])} m) → B ({num(PATH[2])} m)
            </button>
          </div>
          <div className="btnRow">
            <button className="btn btn--ghost" onClick={() => reset()}>
              ↺ Reiniciar
            </button>
          </div>
          <Readout
            items={[
              { label: finished ? "Posição final (Sf)" : "Posição atual (S)", value: `${fmt(stats.position)} m` },
              { label: "Distância percorrida (d)", value: `${fmt(stats.distance)} m` },
              { label: "Deslocamento (ΔS)", value: `${fmt(stats.displacement)} m` },
            ]}
          />
        </div>

        <FormulaCard
          title="Deslocamento"
          formula={
            <>
              <Term q={Q.ds} /> ={" "}
              <Term q={Q.s}>
                S<sub>f</sub>
              </Term>{" "}
              − <Term q={Q.s0} />
            </>
          }
          terms={[
            {
              symbol: "ΔS",
              name: "deslocamento: variação da posição (só importam o início e o fim)",
              unit: "m",
              color: Q.ds.color,
            },
            { symbol: "Sf", name: "posição final: onde o corpo termina", unit: "m", color: Q.s.color },
            {
              symbol: "S₀",
              name: "posição inicial: onde o corpo começa (em relação à origem)",
              unit: "m",
              color: Q.s0.color,
            },
          ]}
          inputs={[
            {
              key: "s0",
              symbol: "S₀ (ponto A)",
              unit: "m",
              value: PATH[0],
              onChange: (v) => setPoint(0, v),
              min: 0,
              max: TRACK,
              color: Q.s0.color,
            },
            {
              key: "sf",
              symbol: "Sf (ponto B)",
              unit: "m",
              value: PATH[2],
              onChange: (v) => setPoint(2, v),
              min: 0,
              max: TRACK,
              color: Q.s.color,
            },
          ]}
          steps={
            <>
              ΔS = {num(PATH[2])} − {num(PATH[0])} = <b>{num(PATH[2] - PATH[0])} m</b>
            </>
          }
          onReset={() => {
            setPath(EXAMPLE);
            reset(EXAMPLE);
          }}
          note="Posições entre 0 e 14 m (o tamanho da pista). A animação usa os valores digitados."
        />

        <FormulaCard
          title="Distância percorrida"
          formula={
            <>
              <Term q={Q.d} /> = d<sub>1</sub> + d<sub>2</sub>
            </>
          }
          terms={[
            { symbol: "d", name: "distância percorrida: soma de todo o caminho feito", unit: "m", color: Q.d.color },
            { symbol: "d₁", name: "trecho 1: de A até o ponto de retorno C = |C − A|", unit: "m", color: Q.d.color },
            { symbol: "d₂", name: "trecho 2: de C até B = |B − C|", unit: "m", color: Q.d.color },
          ]}
          inputs={[
            {
              key: "a",
              symbol: "A (início)",
              unit: "m",
              value: PATH[0],
              onChange: (v) => setPoint(0, v),
              min: 0,
              max: TRACK,
              color: Q.s0.color,
            },
            {
              key: "c",
              symbol: "C (retorno)",
              unit: "m",
              value: PATH[1],
              onChange: (v) => setPoint(1, v),
              min: 0,
              max: TRACK,
              color: Q.d.color,
            },
            {
              key: "b",
              symbol: "B (fim)",
              unit: "m",
              value: PATH[2],
              onChange: (v) => setPoint(2, v),
              min: 0,
              max: TRACK,
              color: Q.s.color,
            },
          ]}
          steps={
            <>
              d = |{num(PATH[1])} − {num(PATH[0])}| + |{num(PATH[2])} − {num(PATH[1])}| = {num(leg1Len)} +{" "}
              {num(leg2Len)} = <b>{num(leg1Len + leg2Len)} m</b>
              <br />
              ΔS = <b>{num(PATH[2] - PATH[0])} m</b> {leg1Len + leg2Len !== Math.abs(PATH[2] - PATH[0]) ? "≠" : "="} d
            </>
          }
          onReset={() => {
            setPath(EXAMPLE);
            reset(EXAMPLE);
          }}
        />

        <QuantityToggles items={Q_LIST} vis={vis} />

        <p style={{ fontSize: "0.82rem", color: "#a6adc9", marginTop: 14 }}>
          Repare que a distância percorrida soma o trajeto todo (no exemplo, 10 + 4 = 14 m), enquanto o deslocamento
          considera só a posição final e a inicial (6 − 0 = 6 m) — o exemplo do "Pause e responda" da aula. Troque os
          valores acima para criar outros problemas.
        </p>
      </div>
    </div>
  );
}
