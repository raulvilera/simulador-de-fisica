import { useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import SceneShell from "./SceneShell.jsx";
import { Arrow3D, Crate, Pusher } from "./primitives.jsx";
import { Readout, Slider } from "../components/ui.jsx";

export default function Lesson6NewtonForces() {
  const [mass, setMass] = useState(40); // kg
  const [f1, setF1] = useState(15); // N (sentido +)
  const [f2, setF2] = useState(25); // N (sentido +, ou negativo se oposto)
  const [opposite, setOpposite] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [resetKey, setResetKey] = useState(0);

  const fRes = opposite ? f1 - f2 : f1 + f2;
  const accel = mass > 0 ? fRes / mass : 0;

  return (
    <div className="lesson__canvas">
      <SceneShell setting="yard" fov={50} cameraPosition={[2.2, 2.3, 8.2]} controlsTarget={[0.4, 0.9, 0]}>
        <PushedBox key={resetKey} playing={playing} accel={accel} f1={f1} f2={f2} fRes={fRes} opposite={opposite} />
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
const arrowLen = (f) => Math.max(Math.abs(f) * SCALE, 0.45);

function PushedBox({ playing, accel, f1, f2, fRes, opposite }) {
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
        <Arrow3D from={[HALF + 0.08, 0.75, 0.64]} length={arrowLen(f1)} color="#3b82f6" label={`F1 = ${f1} N`} />
      )}
      {f2 > 0 && (
        <Arrow3D
          from={opposite ? [-HALF - 0.08, 0.75, 0.64] : [HALF + 0.08, 1.3, 0]}
          dir={opposite ? -1 : 1}
          length={arrowLen(f2)}
          color="#f87171"
          label={`F2 = ${f2} N`}
        />
      )}
      {fRes !== 0 && (
        <Arrow3D
          from={[0, 2.3, 0]}
          dir={Math.sign(fRes)}
          length={arrowLen(fRes)}
          thickness={1.5}
          color="#fbbf24"
          label={`FRes = ${Math.abs(fRes)} N`}
        />
      )}
    </group>
  );
}
