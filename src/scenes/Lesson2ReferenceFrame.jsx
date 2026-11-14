import { useRef, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import SceneShell from "./SceneShell.jsx";
import { Vehicle, RulerTrack, Label3D } from "./primitives.jsx";
import { Readout } from "../components/ui.jsx";
import { QuantityTag, QuantityToggles, Pin, Concept, Term } from "./quantities.jsx";
import FormulaCard, { num } from "../components/FormulaCard.jsx";

// Valores do exemplo (podem ser digitados no painel), em m/s no referencial do solo
const EX_JOAO = 3;
const EX_OUTRO = 5;
const f1 = (v) => (Math.round(v * 100) / 100).toLocaleString("pt-BR");

// Conceitos mostrados dentro da cena (tocar na etiqueta oculta)
const Q = {
  ref: { id: "ref", symbol: "Referencial", name: "de onde o movimento é observado", color: "#facc15" },
  vj: { id: "vj", symbol: "v João", name: "velocidade de João", color: "#60a5fa" },
  vo: { id: "vo", symbol: "v outro", name: "velocidade do outro carro", color: "#f87171" },
  traj: { id: "traj", symbol: "Trajetória", name: "caminho seguido pelos carros", color: "#4ade80" },
};
const Q_LIST = Object.values(Q);

function Road({ playing, frame, vJ: V_JOAO, vO: V_OUTRO }) {
  const joaoRef = useRef();
  const outroRef = useRef();
  const x = useRef({ joao: 0, outro: -4 });
  const camera = useThree((s) => s.camera);
  const controls = useThree((s) => s.controls);
  const followed = useRef(0);

  useFrame((_, delta) => {
    if (playing) {
      x.current.joao += V_JOAO * delta;
      x.current.outro += V_OUTRO * delta;
      if (x.current.joao > 16) x.current.joao = -16;
      if (x.current.outro > 16) x.current.outro = -16;
    }

    if (joaoRef.current) joaoRef.current.position.x = x.current.joao;
    if (outroRef.current) outroRef.current.position.x = x.current.outro;

    // Referencial do solo: a câmera fica parada na beira da pista.
    // Referencial do carro de João: a câmera viaja junto com o João. Ele fica
    // parado no centro da tela e é a pista (com as marcas e as zebras) que
    // passa para trás — como quem olha de dentro do carro.
    const follow = frame === "joao" ? x.current.joao : 0;
    const shift = follow - followed.current;
    if (shift !== 0) {
      camera.position.x += shift;
      if (controls) controls.target.x += shift;
      followed.current = follow;
    }
  });

  return (
    <>
      <RulerTrack length={60} start={-30} step={2} z={0} />
      <group ref={joaoRef} position={[0, 0.3, -0.62]}>
        <Vehicle color="#3b82f6" />
        <Label3D position={[0, 1.3, 0]} fontSize={0.26} color="#93c5fd">
          João
        </Label3D>
        <QuantityTag
          q={Q.vj}
          position={[0, 2.05, 0]}
          value={frame === "solo" ? `= ${f1(V_JOAO)} m/s` : "= 0 m/s"}
          name={frame === "solo" ? "em relação à rua" : "em relação a ele mesmo: parado"}
        />
        {frame === "joao" && (
          <QuantityTag q={Q.ref} position={[0, 2.95, 0]} value="carro do João" name="o observador viaja com João" />
        )}
      </group>
      <group ref={outroRef} position={[-4, 0.3, 0.62]}>
        <Vehicle color="#f87171" />
        <Label3D position={[0, 1.3, 0]} fontSize={0.26} color="#fca5a5">
          outro carro
        </Label3D>
        <QuantityTag
          q={Q.vo}
          position={[0, 2.05, 0]}
          value={frame === "solo" ? `= ${f1(V_OUTRO)} m/s` : `= ${f1(V_OUTRO - V_JOAO)} m/s`}
          name={frame === "solo" ? "em relação à rua" : `vista por João (${f1(V_OUTRO)} − ${f1(V_JOAO)})`}
        />
      </group>
      {frame === "solo" && (
        <>
          <Concept id="ref">
            <Pin x={0} z={2.2} height={1.6} color={Q.ref.color} />
          </Concept>
          <QuantityTag q={Q.ref} position={[0, 2.0, 2.2]} value="solo (rua)" name="observador parado na beira da pista" />
        </>
      )}
      <QuantityTag q={Q.traj} position={[-7, 0.45, 1.6]} value="reta" name="caminho seguido pelos carros" />
    </>
  );
}

export default function Lesson2ReferenceFrame() {
  const [playing, setPlaying] = useState(false);
  const [frame, setFrame] = useState("solo");

  const [V_JOAO, setVJ] = useState(EX_JOAO);
  const [V_OUTRO, setVO] = useState(EX_OUTRO);
  const relativeSpeed = frame === "solo" ? f1(V_OUTRO) : f1(V_OUTRO - V_JOAO);

  return (
    <div className="lesson__canvas">
      <SceneShell fov={46} cameraPosition={[-1.5, 2.7, 10.5]} controlsTarget={[0, 0.3, 0]}>
        <Road playing={playing} frame={frame} vJ={V_JOAO} vO={V_OUTRO} />
      </SceneShell>

      <div className="panel">
        <p className="panel__eyebrow">Aula 2 · Referencial</p>
        <h1>De quem é o ponto de vista?</h1>
        <div className="controls">
          <div className="controls__row">
            <span>Referencial</span>
            <div className="btnRow" style={{ marginTop: 0 }}>
              <button
                className={`btn ${frame === "solo" ? "btn--primary" : "btn--ghost"}`}
                onClick={() => setFrame("solo")}
              >
                Solo (rua)
              </button>
              <button
                className={`btn ${frame === "joao" ? "btn--primary" : "btn--ghost"}`}
                onClick={() => setFrame("joao")}
              >
                Carro do João
              </button>
            </div>
          </div>
          <div className="btnRow">
            <button className="btn btn--primary" onClick={() => setPlaying((p) => !p)}>
              {playing ? "⏸ Pausar" : "▶ Iniciar"}
            </button>
          </div>
          <Readout
            items={[
              { label: "Velocidade de João (solo)", value: `${f1(V_JOAO)} m/s` },
              { label: "Vel. do outro carro (solo)", value: `${f1(V_OUTRO)} m/s` },
              {
                label: "Vel. do outro carro vista por João",
                value: `${relativeSpeed} m/s`,
              },
              { label: "Referencial atual", value: frame === "solo" ? "Rua" : "Carro do João" },
            ]}
          />
        </div>
        <FormulaCard
          title="Velocidade relativa"
          formula={
            <>
              v<sub>rel</sub> = <Term q={Q.vo}>v<sub>outro</sub></Term> − <Term q={Q.vj}>v<sub>João</sub></Term>
            </>
          }
          terms={[
            { symbol: "vrel", name: "velocidade do outro carro vista por João (referencial no carro de João)", unit: "m/s", color: Q.ref.color },
            { symbol: "voutro", name: "velocidade do outro carro em relação à rua", unit: "m/s", color: Q.vo.color },
            { symbol: "vJoão", name: "velocidade de João em relação à rua", unit: "m/s", color: Q.vj.color },
          ]}
          inputs={[
            { key: "vj", symbol: "vJoão", unit: "m/s", value: V_JOAO, onChange: setVJ, min: 0, max: 15, color: Q.vj.color },
            { key: "vo", symbol: "voutro", unit: "m/s", value: V_OUTRO, onChange: setVO, min: 0, max: 15, color: Q.vo.color },
          ]}
          steps={
            <>
              v<sub>rel</sub> = {num(V_OUTRO)} − {num(V_JOAO)} = <b>{num(V_OUTRO - V_JOAO)} m/s</b>
              <br />
              {V_OUTRO - V_JOAO > 0
                ? "João vê o outro carro se afastar para frente."
                : V_OUTRO - V_JOAO < 0
                  ? "João vê o outro carro ficar para trás."
                  : "João vê o outro carro parado ao lado dele."}
            </>
          }
          note="Velocidades de 0 a 15 m/s; os carros da cena usam os valores digitados."
          onReset={() => {
            setVJ(EX_JOAO);
            setVO(EX_OUTRO);
          }}
        />

        <QuantityToggles items={Q_LIST} />
        <p style={{ fontSize: "0.82rem", color: "#a6adc9", marginTop: 14 }}>
          Mude o referencial para "Carro do João": repare que o carro dele passa a ficar parado no
          centro da cena, e a velocidade do outro carro muda — porque a descrição do movimento
          depende do referencial escolhido.
        </p>
      </div>
    </div>
  );
}
