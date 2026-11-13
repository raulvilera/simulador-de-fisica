import { useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import SceneShell from "./SceneShell.jsx";
import { Vehicle, RulerTrack, Label3D } from "./primitives.jsx";
import { Readout } from "../components/ui.jsx";

const V_JOAO = 3; // m/s (velocidade do carro de João, no referencial do solo)
const V_OUTRO = 5; // m/s (velocidade do outro carro)

function Road({ playing, frame }) {
  const joaoRef = useRef();
  const outroRef = useRef();
  const x = useRef({ joao: 0, outro: -4 });

  useFrame((_, delta) => {
    if (playing) {
      x.current.joao += V_JOAO * delta;
      x.current.outro += V_OUTRO * delta;
      if (x.current.joao > 16) x.current.joao = -16;
      if (x.current.outro > 16) x.current.outro = -16;
    }

    // Referencial do solo: posições absolutas.
    // Referencial do carro de João: tudo se desloca relativo à posição de João,
    // e o próprio carro de João fica parado no centro da cena.
    const offset = frame === "joao" ? x.current.joao : 0;

    if (joaoRef.current) joaoRef.current.position.x = x.current.joao - offset;
    if (outroRef.current) outroRef.current.position.x = x.current.outro - offset;
  });

  return (
    <>
      <RulerTrack length={32} start={-16} z={0} />
      <group ref={joaoRef} position={[0, 0.3, -0.62]}>
        <Vehicle color="#3b82f6" />
        <Label3D position={[0, 1.3, 0]} fontSize={0.26} color="#93c5fd">
          João
        </Label3D>
      </group>
      <group ref={outroRef} position={[-4, 0.3, 0.62]}>
        <Vehicle color="#f87171" />
        <Label3D position={[0, 1.3, 0]} fontSize={0.26} color="#fca5a5">
          outro carro
        </Label3D>
      </group>
    </>
  );
}

export default function Lesson2ReferenceFrame() {
  const [playing, setPlaying] = useState(false);
  const [frame, setFrame] = useState("solo");

  const relativeSpeed =
    frame === "solo" ? V_OUTRO : (V_OUTRO - V_JOAO).toFixed(1);

  return (
    <div className="lesson__canvas">
      <SceneShell fov={54} cameraPosition={[-1.5, 3.4, 12.5]} controlsTarget={[0, 0, 0]}>
        <Road playing={playing} frame={frame} />
      </SceneShell>

      <div className="panel" style={panelOverlayStyle}>
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
              { label: "Velocidade de João (solo)", value: `${V_JOAO} m/s` },
              { label: "Vel. do outro carro (solo)", value: `${V_OUTRO} m/s` },
              {
                label: "Vel. do outro carro vista por João",
                value: `${relativeSpeed} m/s`,
              },
              { label: "Referencial atual", value: frame === "solo" ? "Rua" : "Carro do João" },
            ]}
          />
        </div>
        <p style={{ fontSize: "0.82rem", color: "#a6adc9", marginTop: 14 }}>
          Mude o referencial para "Carro do João": repare que o carro dele passa a ficar parado no
          centro da cena, e a velocidade do outro carro muda — porque a descrição do movimento
          depende do referencial escolhido.
        </p>
      </div>
    </div>
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
