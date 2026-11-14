import { useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import SceneShell from "./SceneShell.jsx";
import KeepInView from "./KeepInView.jsx";
import { useProtected } from "./LabelLayout.jsx";
import { useMarbleTexture } from "./settings.jsx";
import { Arrow3D, Ball } from "./primitives.jsx";
import { useThrottled } from "./useThrottled.js";
import { QuantityTag, QuantityToggles, Pin, Concept } from "./quantities.jsx";
import FormulaCard, { num, nump } from "../components/FormulaCard.jsx";
import TheoryPortraits from "../components/Portraits.jsx";
import { Readout } from "../components/ui.jsx";

// A torre da cena (9 unidades) representa a Torre de Pisa real: a galeria do
// sino, de onde Galileu teria soltado as esferas, fica a ~55 m do chão.
const TOWER_HEIGHT = 9; // unidades da cena
const TOWER_REAL = 55; // metros
const G = 9.8;
// Aristóteles: um corpo com o dobro do peso cairia com o dobro da velocidade.
const WEIGHT_RATIO = 2;
// Esferas um pouco exageradas para dar para ver (na escala da torre teriam ~0,02).
const R_HEAVY = 0.28;
const R_LIGHT = 0.17;
const BALL_Z = 0.55; // à frente da torre, que se inclina para o lado da câmera

// Conceitos mostrados dentro da cena (tocar na etiqueta oculta)
const Q = {
  m: { id: "m", symbol: "m", name: "massas diferentes", color: "#f87171" },
  h: { id: "h", symbol: "h", name: "altura da queda", color: "#a78bfa" },
  g: { id: "g", symbol: "g", name: "aceleração da gravidade", color: "#fbbf24" },
  ar: { id: "ar", symbol: "ar", name: "resistência do ar", color: "#7dd3fc" },
  t: { id: "t", symbol: "t", name: "tempo de queda", color: "#4ade80" },
  vq: { id: "vq", symbol: "v", name: "velocidade da esfera durante a queda", color: "#38bdf8" },
  marcas: { id: "marcas", symbol: "Δt iguais", name: "posições a cada mesmo intervalo de tempo", color: "#e5e9f5" },
  gal: { id: "gal", symbol: "Galileu", name: "no alto da torre, soltando as esferas", color: "#fde68a" },
};
const Q_LIST = Object.values(Q);

// Escala da altura: a torre inteira = 55 m; alturas maiores são comprimidas.
const sceneScale = (h) => TOWER_HEIGHT / Math.max(h, TOWER_REAL);
// Quedas muito longas são aceleradas (no máximo ~6 s de animação) e as muito
// curtas, desaceleradas (mínimo ~0,8 s), para dar para ver. O tempo medido é o real.
const playRate = (T) => (T > 6 ? T / 6 : T < 0.8 ? T / 0.8 : 1);

// Modelos de queda. TG = tempo de queda segundo Galileu (√(2h/g)).
//  Galileu: as duas caem juntas, com aceleração g:  y = h − ½·g·t².
//  Aristóteles: cada uma cai com velocidade CONSTANTE proporcional ao peso;
//  a pesada (2× o peso) chega em TG e a leve leva o dobro do tempo.
function model(theory, h, g) {
  const TG = Math.sqrt((2 * h) / g);
  if (theory === "galileu") {
    const y = (t) => Math.max(h - 0.5 * g * t * t, 0);
    return { TG, Theavy: TG, Tlight: TG, yHeavy: y, yLight: y, vLight: (t) => g * t, vHeavy: (t) => g * t };
  }
  const vH = h / TG;
  const vL = vH / WEIGHT_RATIO;
  return {
    TG,
    Theavy: TG,
    Tlight: TG * WEIGHT_RATIO,
    yHeavy: (t) => Math.max(h - vH * t, 0),
    yLight: (t) => Math.max(h - vL * t, 0),
    vLight: () => vL,
    vHeavy: () => vH,
  };
}

function FallingBalls({ objRef, dropping, theory, onLanded, onTick, h, g, live }) {
  const heavyRef = useRef();
  const lightRef = useRef();
  const t = useRef(0);
  const landed = useRef(false);
  const tick = useThrottled(onTick, 90);
  useProtected(heavyRef, lightRef); // etiquetas não cobrem as esferas
  const M = useMemo(() => model(theory, h, g), [theory, h, g]);
  const k = sceneScale(h);

  useFrame((_, delta) => {
    if (!dropping || landed.current) return;
    const T = Math.max(M.Theavy, M.Tlight);
    t.current = Math.min(t.current + delta * playRate(T), T);
    const yH = M.yHeavy(t.current);
    const yL = M.yLight(t.current);
    if (heavyRef.current) heavyRef.current.position.y = Math.max(yH * k, 0.3);
    if (lightRef.current) lightRef.current.position.y = Math.max(yL * k, 0.3);
    const vL = yL > 0 ? M.vLight(t.current) : 0;
    tick({ t: t.current, v: vL, fall: h - yL, y: yL, yH }, t.current >= T);
    if (t.current >= T) {
      landed.current = true;
      onLanded?.({ heavy: M.Theavy, light: M.Tlight });
    }
  });

  // "Fotos" a cada intervalo igual de tempo (Δt = TG/4): na queda de Galileu
  // as distâncias entre as marcas crescem como 1 : 3 : 5 : 7; na de
  // Aristóteles ficam iguais (velocidade constante).
  const dt = M.TG / 4;
  const shots = [];
  for (let i = 1; i <= 8; i++) {
    const ti = i * dt;
    if (!live || live.t < ti - 1e-9) break;
    shots.push({ i, yH: M.yHeavy(ti), yL: M.yLight(ti), yLprev: M.yLight((i - 1) * dt) });
  }

  return (
    <>
      <group ref={heavyRef} position={[-0.6, Math.max(h * k, 0.3), BALL_Z]}>
        <Ball position={[0, 0, 0]} color="#f87171" radius={R_HEAVY} />
        <QuantityTag
          id="m"
          position={[-1.0, 0.1, 0]}
          color="#f87171"
          symbol="m maior"
          name={theory === "aristoteles" ? `esfera pesada (${WEIGHT_RATIO}× o peso)` : "esfera pesada"}
        />
      </group>
      <group
        ref={(o) => {
          lightRef.current = o;
          if (objRef) objRef.current = o;
        }}
        position={[0.6, Math.max(h * k, 0.3), BALL_Z]}
      >
        <Ball position={[0, 0, 0]} color="#38bdf8" radius={R_LIGHT} />
        <QuantityTag id="m" position={[1.0, 0.1, 0]} color="#38bdf8" symbol="m menor" name="esfera leve" />
        {live && live.t > 0 && live.y > 0.05 && (
          <QuantityTag
            id="vq"
            position={[1.25, -0.45, 0]}
            color="#38bdf8"
            symbol="v"
            value={theory === "galileu" ? `= g·t = ${num(live.v, 1)} m/s` : `= ${num(live.v, 1)} m/s (constante)`}
            name={theory === "galileu" ? "aumenta durante a queda" : "Aristóteles: não muda"}
          />
        )}
        {live && live.t > 0 && live.y > 0.05 && (
          <QuantityTag
            id="altura"
            position={[1.25, -1.05, 0]}
            color="#a78bfa"
            symbol="altura"
            value={`= ${num(live.y, 1)} m`}
            name="quanto falta para chegar ao chão"
          />
        )}
      </group>

      {/* marcas de tempo (estroboscópicas) */}
      <Concept id="marcas">
        {shots.map((s) => (
          <group key={s.i}>
            {s.yH > 0 && (
              <mesh position={[-0.6, Math.max(s.yH * k, 0.3), BALL_Z]}>
                <sphereGeometry args={[R_HEAVY, 16, 12]} />
                <meshBasicMaterial color="#f87171" transparent opacity={0.22} depthWrite={false} />
              </mesh>
            )}
            {s.yL > 0 && (
              <mesh position={[0.6, Math.max(s.yL * k, 0.3), BALL_Z]}>
                <sphereGeometry args={[R_LIGHT, 16, 12]} />
                <meshBasicMaterial color="#38bdf8" transparent opacity={0.3} depthWrite={false} />
              </mesh>
            )}
            {/* traço na altura de cada "foto" e distância percorrida no intervalo */}
            <mesh position={[0, Math.max(s.yL * k, 0.02), BALL_Z]}>
              <boxGeometry args={[2.1, 0.02, 0.02]} />
              <meshBasicMaterial color="#e5e9f5" transparent opacity={0.6} />
            </mesh>
          </group>
        ))}
      </Concept>
      {shots.length > 0 && (
        <QuantityTag
          q={Q.marcas}
          position={[-2.9, Math.max(shots[shots.length - 1].yL * k, 0.4), 0]}
          value={`Δt = ${num(dt)} s`}
          name={
            theory === "galileu"
              ? `esfera leve: ${shots
                  .slice(0, 4)
                  .map((s) => num(s.yLprev - s.yL, 1))
                  .join(" · ")} m  →  1 : 3 : 5 : 7`
              : `esfera leve: ${shots
                  .slice(0, 4)
                  .map((s) => num(s.yLprev - s.yL, 1))
                  .join(" · ")} m  →  distâncias iguais`
          }
        />
      )}
    </>
  );
}

// Galileu (escala da torre) no alto da torre, de roupa preta e gola branca.
function GalileoOnTop() {
  return (
    <group position={[0.05, 8.78, -0.55]} rotation={[0, 0.3, 0]}>
      <mesh position={[0, 0.1, 0]}>
        <coneGeometry args={[0.075, 0.2, 10]} />
        <meshLambertMaterial color="#141414" />
      </mesh>
      <mesh position={[0, 0.24, 0]}>
        <cylinderGeometry args={[0.045, 0.06, 0.1, 10]} />
        <meshLambertMaterial color="#1c1c1c" />
      </mesh>
      <mesh position={[0, 0.29, 0]}>
        <cylinderGeometry args={[0.05, 0.05, 0.012, 12]} />
        <meshLambertMaterial color="#efe9dc" />
      </mesh>
      <mesh position={[0, 0.33, 0]}>
        <sphereGeometry args={[0.035, 12, 10]} />
        <meshLambertMaterial color="#d9a77f" />
      </mesh>
      <mesh position={[0, 0.31, 0.02]}>
        <sphereGeometry args={[0.03, 10, 8, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2]} />
        <meshLambertMaterial color="#a7774d" />
      </mesh>
      {/* braços estendidos para frente, segurando as esferas */}
      <mesh position={[0, 0.25, 0.08]} rotation={[Math.PI / 2.4, 0, 0]}>
        <boxGeometry args={[0.14, 0.02, 0.12]} />
        <meshLambertMaterial color="#1c1c1c" />
      </mesh>
    </group>
  );
}

const THEORY_TEXT = {
  aristoteles: {
    title: "Teoria de Aristóteles (séc. IV a.C.)",
    items: [
      "Movimento natural: cada corpo busca seu “lugar natural”; os pesados (elemento terra) buscam o centro da Terra.",
      "A velocidade de queda é proporcional ao peso: um corpo 2× mais pesado cai 2× mais rápido.",
      "O meio (ar, água) resiste; no vácuo a velocidade seria infinita — por isso ele dizia que o vácuo não existe.",
      "Na simulação: cada esfera desce com velocidade constante; as marcas ficam igualmente espaçadas e a pesada chega na metade do tempo.",
    ],
  },
  galileu: {
    title: "Teoria de Galileu (Pisa, c. 1590)",
    items: [
      "Segundo seu discípulo Vincenzo Viviani, Galileu soltou corpos de pesos diferentes do alto da torre.",
      "Desprezando o ar, todos caem com a mesma aceleração g: a velocidade cresce (v = g·t).",
      "Em intervalos de tempo iguais, as distâncias percorridas crescem como 1 : 3 : 5 : 7 (h = ½·g·t²) — lei estudada com planos inclinados.",
      "Na simulação: as duas esferas chegam juntas e as marcas se afastam cada vez mais.",
    ],
  },
};

// Torre no estilo da Torre de Pisa: base, seis galerias com colunatas, campanário
// e a famosa inclinação (as esferas caem do lado "pendurado").
const LEVELS = 6;
const COLS = 22;
function Tower() {
  const columns = useMemo(() => {
    const dummy = new THREE.Object3D();
    const mesh = new THREE.InstancedMesh(
      new THREE.CylinderGeometry(0.045, 0.05, 0.92, 8),
      new THREE.MeshStandardMaterial({ color: "#f1ece0", roughness: 0.55 }),
      LEVELS * COLS,
    );
    let i = 0;
    for (let l = 0; l < LEVELS; l++) {
      for (let c = 0; c < COLS; c++) {
        const ang = (c / COLS) * Math.PI * 2 + (l % 2) * (Math.PI / COLS);
        dummy.position.set(Math.cos(ang) * 1.17, 1.5 + l + 0.5, Math.sin(ang) * 1.17);
        dummy.updateMatrix();
        mesh.setMatrixAt(i++, dummy.matrix);
      }
    }
    mesh.castShadow = true;
    return mesh;
  }, []);
  // Mármore com faixas e arcadas (o mesmo da Catedral ao lado).
  const stone = useMarbleTexture();
  const [baseMap, coreMap] = useMemo(() => {
    const base = stone.clone();
    base.repeat.set(4, 1);
    const core = stone.clone();
    core.repeat.set(5, LEVELS);
    return [base, core];
  }, [stone]);
  const marble = <meshStandardMaterial color="#e7e1d3" roughness={0.62} metalness={0.02} />;
  return (
    <group position={[0, 0, -1.9]} rotation={[0.07, 0, 0]}>
      <mesh position={[0, 0.75, 0]} castShadow>
        <cylinderGeometry args={[1.26, 1.32, 1.5, 40]} />
        <meshStandardMaterial map={baseMap} roughness={0.62} metalness={0.02} />
      </mesh>
      <mesh position={[0, 1.5 + LEVELS / 2, 0]} castShadow>
        <cylinderGeometry args={[0.98, 0.98, LEVELS, 40]} />
        <meshStandardMaterial map={coreMap} color="#d9d3c6" roughness={0.75} />
      </mesh>
      {Array.from({ length: LEVELS + 1 }, (_, l) => (
        <mesh key={l} position={[0, 1.5 + l, 0]} castShadow>
          <cylinderGeometry args={[1.3, 1.3, 0.09, 40]} />
          {marble}
        </mesh>
      ))}
      <primitive object={columns} />
      <mesh position={[0, 1.5 + LEVELS + 0.62, 0]} castShadow>
        <cylinderGeometry args={[0.86, 0.9, 1.24, 32]} />
        <meshStandardMaterial map={baseMap} roughness={0.62} metalness={0.02} />
      </mesh>
      <mesh position={[0, 1.5 + LEVELS + 1.28, 0]} castShadow>
        <cylinderGeometry args={[0.95, 0.95, 0.08, 32]} />
        {marble}
      </mesh>
    </group>
  );
}

export default function Lesson1History() {
  const followRef = useRef(); // esfera que a câmera acompanha
  const [dropping, setDropping] = useState(false);
  const [theory, setTheory] = useState("galileu"); // "galileu" | "aristoteles"
  const aristotleMode = theory === "aristoteles";
  const [showTheory, setShowTheory] = useState(false);
  const [resetKey, setResetKey] = useState(0);
  const [landTime, setLandTime] = useState(null); // { heavy, light } (s)
  const [hC, setHC] = useState(TOWER_REAL); // altura da queda (m)
  const [gC, setGC] = useState(G);
  const START = { t: 0, v: 0, fall: 0, y: null, yH: null };
  const [live, setLive] = useState(START); // valores durante a queda

  const drop = () => {
    setLandTime(null);
    setLive(START);
    setDropping(true);
  };
  const reset = () => {
    setDropping(false);
    setLandTime(null);
    setLive(START);
    setResetKey((k) => k + 1);
  };
  // clicar num cientista: troca a teoria e já repete o experimento com ela
  const pick = (id) => {
    setTheory(id);
    setShowTheory(true);
    reset();
    setTimeout(() => {
      setLive(START);
      setDropping(true);
    }, 350);
  };

  const k = sceneScale(hC);
  const tLight = landTime ? landTime.light : null;

  return (
    <div className="lesson__canvas">
      <SceneShell setting="pisa" cameraPosition={[7.5, 3, 15]} controlsTarget={[0, 4.3, -0.6]} maxDistance={22}>
        <Tower />
        <GalileoOnTop />
        <QuantityTag
          q={Q.gal}
          position={[0, 10.45, -0.55]}
          name="no alto da torre (escala real: 1 pessoa ≈ 0,3 da cena)"
        />
        {/* a câmera acompanha a esfera até o chão */}
        <KeepInView targets={[followRef]} axes={[0, 1, 0]} />
        <FallingBalls
          objRef={followRef}
          key={`${resetKey}-${hC}-${gC}-${theory}`}
          dropping={dropping}
          theory={theory}
          onLanded={setLandTime}
          onTick={setLive}
          live={live}
          h={hC}
          g={gC}
        />

        {/* h: altura de onde as esferas são soltas */}
        <Concept id="h">
          <Pin x={2.1} z={0} height={Math.max(hC * k, 0.05)} color={Q.h.color} />
        </Concept>
        <QuantityTag
          q={Q.h}
          position={[2.9, Math.max((hC * k) / 2, 0.6), 0]}
          value={`= ${num(hC)} m`}
          name={hC > TOWER_REAL ? "altura da queda (fora de escala)" : "altura da queda"}
        />

        {/* g: aceleração da gravidade, apontando para baixo */}
        <Concept id="g">
          <group position={[-2.3, 7.4, 0]} rotation={[0, 0, -Math.PI / 2]}>
            <Arrow3D from={[0, 0, 0]} length={2.2} color={Q.g.color} />
          </group>
        </Concept>
        <QuantityTag
          q={Q.g}
          position={[-3.6, 6.3, 0]}
          symbol={aristotleMode ? "v ∝ peso" : "g"}
          value={aristotleMode ? "sem aceleração" : `= ${num(gC)} m/s²`}
          name={
            aristotleMode ? "Aristóteles: o mais pesado cai mais rápido (errado)" : "Galileu: igual para as duas massas"
          }
        />

        <QuantityTag
          q={Q.ar}
          position={[-4.1, 3.4, 0]}
          value={aristotleMode ? "o meio resiste" : "desprezada"}
          name={
            aristotleMode
              ? "para Aristóteles, sem meio (vácuo) a queda seria instantânea"
              : "sem ar, pena e martelo caem juntos"
          }
        />

        {!landTime && live.t > 0 && (
          <QuantityTag
            q={Q.t}
            position={[0, 1.4, 1.4]}
            value={`= ${num(live.t)} s`}
            name="cronômetro da queda (tempo real)"
          />
        )}
        {landTime && (
          <QuantityTag
            q={Q.t}
            position={[0, 1.4, 1.4]}
            value={
              aristotleMode
                ? `pesada ${num(landTime.heavy)} s · leve ${num(landTime.light)} s`
                : `= ${num(landTime.light)} s`
            }
            name={aristotleMode ? "a pesada chegou antes (modelo de Aristóteles)" : "as duas chegam juntas ao chão"}
          />
        )}
      </SceneShell>

      {/* retratos clicáveis: escolhem a teoria simulada */}
      <TheoryPortraits value={theory} onPick={pick} />
      {showTheory && (
        <div className="theoryCard">
          <button type="button" className="theoryCard__close" onClick={() => setShowTheory(false)} aria-label="Fechar">
            ×
          </button>
          <h4>{THEORY_TEXT[theory].title}</h4>
          <ul>
            {THEORY_TEXT[theory].items.map((t, i) => (
              <li key={i}>{t}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="panel">
        <p className="panel__eyebrow">Aula 1 · Experimento</p>
        <h1>Torre de Pisa: Galileu x Aristóteles</h1>
        <div className="controls">
          <div className="controls__row">
            <span>Teoria</span>
            <div className="btnRow" style={{ marginTop: 0 }}>
              <button
                className={`btn ${aristotleMode ? "btn--primary" : "btn--ghost"}`}
                onClick={() => pick("aristoteles")}
              >
                Aristóteles
              </button>
              <button
                className={`btn ${!aristotleMode ? "btn--primary" : "btn--ghost"}`}
                onClick={() => pick("galileu")}
              >
                Galileu
              </button>
            </div>
          </div>
          <div className="btnRow">
            <button className="btn btn--primary" onClick={drop}>
              ▶ Soltar as esferas
            </button>
            <button className="btn btn--ghost" onClick={reset}>
              ↺ Reiniciar
            </button>
          </div>
          <Readout
            items={[
              { label: "Queda da pesada", value: landTime ? `${num(landTime.heavy)} s` : "—" },
              { label: "Queda da leve", value: tLight ? `${num(tLight)} s` : "—" },
              { label: "Teoria simulada", value: aristotleMode ? "Aristóteles" : "Galileu" },
            ]}
          />
        </div>
        <FormulaCard
          title={aristotleMode ? "Queda segundo Aristóteles" : "Queda livre (sem resistência do ar)"}
          formula={aristotleMode ? <>v ∝ peso · t = h ÷ v</> : <>t = √(2 · h ÷ g)</>}
          terms={
            aristotleMode
              ? [
                  {
                    symbol: "v",
                    name: "velocidade de queda: constante, proporcional ao peso (ideia errada)",
                    unit: "m/s",
                    color: Q.vq.color,
                  },
                  { symbol: "h", name: "altura de onde o corpo é solto", unit: "m", color: Q.h.color },
                  {
                    symbol: "t",
                    name: `tempo: a leve (metade do peso) levaria ${WEIGHT_RATIO}× mais`,
                    unit: "s",
                    color: Q.t.color,
                  },
                ]
              : [
                  { symbol: "t", name: "tempo de queda: não depende da massa", unit: "s", color: Q.t.color },
                  { symbol: "h", name: "altura de onde o corpo é solto", unit: "m", color: Q.h.color },
                  {
                    symbol: "g",
                    name: "aceleração da gravidade (Terra ≈ 9,8; Lua ≈ 1,6)",
                    unit: "m/s²",
                    color: Q.g.color,
                  },
                ]
          }
          inputs={[
            {
              key: "h",
              symbol: "h",
              unit: "m",
              value: hC,
              onChange: (v) => {
                setHC(v);
                reset();
              },
              min: 0.01,
              max: 1e9,
              color: Q.h.color,
            },
            {
              key: "g",
              symbol: "g",
              unit: "m/s²",
              value: gC,
              onChange: (v) => {
                setGC(v);
                reset();
              },
              min: 0.001,
              max: 1e9,
              color: Q.g.color,
            },
          ]}
          steps={
            aristotleMode ? (
              <>
                pesada: t = {num(Math.sqrt((2 * hC) / gC))} s · leve (metade do peso):{" "}
                <b>{num(WEIGHT_RATIO * Math.sqrt((2 * hC) / gC))} s</b>
                <br />
                previsão que o experimento NÃO confirma
              </>
            ) : (
              <>
                t = √(2 × {nump(hC)} ÷ {nump(gC)}) = <b>{num(Math.sqrt((2 * hC) / gC))} s</b>
                <br />o mesmo tempo para a esfera pesada e para a leve
              </>
            )
          }
          live={
            live.t > 0 ? (
              aristotleMode ? (
                <>
                  t = <b>{num(live.t)} s</b> · esfera leve com v constante = <b>{num(live.v, 1)} m/s</b>
                  <br />
                  altura: pesada {num(Math.max(live.yH ?? 0, 0), 1)} m · leve <b>{num(Math.max(live.y, 0), 1)} m</b>
                </>
              ) : (
                <>
                  t = <b>{num(live.t)} s</b>
                  <br />v = g · t = {num(gC)} × {nump(live.t)} = <b>{num(live.v, 1)} m/s</b>
                  <br />
                  já caiu: ½ · g · t² = <b>{num(live.fall, 1)} m</b> · falta: {num(Math.max(live.y, 0), 1)} m
                </>
              )
            ) : (
              <>Aperte ▶ Soltar as esferas (ou toque num cientista) para ver t, v e a altura mudarem durante a queda.</>
            )
          }
          note="A torre da cena representa os ~55 m da Torre de Pisa (alturas maiores ficam fora de escala; quedas longas são aceleradas na tela e o tempo mostrado é o real). Experimente g = 1,6 (Lua)."
          onReset={() => {
            setHC(TOWER_REAL);
            setGC(G);
            reset();
          }}
        />

        <QuantityToggles items={Q_LIST} />
        <p style={{ fontSize: "0.82rem", color: "#a6adc9", marginTop: 14 }}>
          Toque no retrato de Aristóteles ou de Galileu (no alto da cena) para ver a queda como cada um a explicava. As
          marcas transparentes são “fotos” tiradas em intervalos de tempo iguais: espaçadas igualmente para Aristóteles
          (velocidade constante) e cada vez mais afastadas para Galileu (aceleração g). Cenário: Piazza dei Miracoli por
          volta de 1590, com a Catedral, o Batistério, o Camposanto e a muralha da cidade.
        </p>
      </div>
    </div>
  );
}
