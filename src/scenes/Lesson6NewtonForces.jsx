import { useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import SceneShell from "./SceneShell.jsx";
import { Arrow3D, Crate } from "./primitives.jsx";
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
      <SceneShell fov={50} cameraPosition={[0.5, 2.8, 12.5]} controlsTarget={[1.5, 0.6, 0]}>
        <PushedBox key={resetKey} playing={playing} accel={accel} />
        <Arrow3D from={[-2.2, 0.8, 0.4]} length={Math.max(f1 / 12, 0.3)} color="#3b82f6" label={`F1 = ${f1} N`} />
        <Arrow3D
          from={opposite ? [2.2, 0.8, -0.4] : [-2.2, 0.8, -0.4]}
          length={Math.max(f2 / 12, 0.3)}
          color="#f87171"
          label={`F2 = ${f2} N`}
        />
      </SceneShell>

      <div className="panel" style={panelOverlayStyle}>
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
          de quem empurra o corpo: ao empurrar o chão para trás, o chão empurra a pessoa para frente —
          mas essas forças atuam em corpos diferentes, por isso não se anulam.
        </p>
      </div>
    </div>
  );
}

function PushedBox({ playing, accel }) {
  const ref = useRef();
  const state = useRef({ x: -4, v: 0 });

  useFrame((_, delta) => {
    if (!playing) return;
    const s = state.current;
    s.v += accel * delta;
    s.x += s.v * delta;
    if (s.x > 10) {
      s.x = 10;
      s.v = 0;
    }
    if (ref.current) ref.current.position.x = s.x;
  });

  return (
    <group ref={ref} position={[-4, 0, 0]}>
      <Crate size={0.9} />
    </group>
  );
}

const panelOverlayStyle = {
  position: "absolute",
  top: 0,
  right: 0,
  width: 340,
  height: "100%",
  background: "rgba(10,14,26,0.72)",
  backdropFilter: "blur(8px)",
  borderLeft: "1px solid rgba(255,255,255,0.08)",
};
