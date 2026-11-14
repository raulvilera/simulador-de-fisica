import { useRef, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import SceneShell from "./SceneShell.jsx";
import { Vehicle, RulerTrack, Label3D } from "./primitives.jsx";
import { Readout } from "../components/ui.jsx";

const V_JOAO = 3; // m/s (velocidade do carro de João, no referencial do solo)
const V_OUTRO = 5; // m/s (velocidade do outro carro)

function Road({ playing, frame }) {
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
      <SceneShell fov={46} cameraPosition={[-1.5, 2.7, 10.5]} controlsTarget={[0, 0.3, 0]}>
        <Road playing={playing} frame={frame} />
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
