import { useMemo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { Line } from "@react-three/drei";
import SceneShell from "./SceneShell.jsx";
import { Panel, Note, Choice, Check, Tag, Sun, Earth, Planet, OrbitRing } from "./space.jsx";
import { Readout, Slider } from "../components/ui.jsx";
import { QuantityTag, QuantityToggles } from "./quantities.jsx";

// Conceitos mostrados dentro da cena (tocar na etiqueta oculta)
const Q = {
  centro: { id: "centro", symbol: "Centro", name: "astro no centro do modelo", color: "#facc15" },
  orbita: { id: "orbita", symbol: "Órbita", name: "caminho em volta do centro", color: "#60a5fa" },
  retro: { id: "retro", symbol: "Movimento retrógrado", name: "Marte parece andar para trás", color: "#f87171" },
  epi: { id: "epi", symbol: "Epiciclo", name: "laçada que Ptolomeu usava para explicar", color: "#fb923c" },
};
const Q_LIST = Object.values(Q);

const R_EARTH = 3; // raio da órbita da Terra (unidades de cena)
const R_MARS = R_EARTH * 1.52; // Marte fica ~1,52 vez mais longe do Sol
const T_MARS = 1.88; // período de Marte em anos terrestres

// Posições no modelo heliocêntrico (Sol na origem), com t em anos.
const earthAt = (t) => [Math.cos(t * 2 * Math.PI) * R_EARTH, Math.sin(t * 2 * Math.PI) * R_EARTH];
const marsAt = (t) => [
  Math.cos((t / T_MARS) * 2 * Math.PI) * R_MARS,
  Math.sin((t / T_MARS) * 2 * Math.PI) * R_MARS,
];

function System({ model, playing, speed, resetKey, onRetro, retro: retroNow }) {
  const sun = useRef();
  const earth = useRef();
  const mars = useRef();
  const t = useRef(0);
  const lastAngle = useRef(null);
  const retro = useRef(false);
  const lastReset = useRef(resetKey);

  useFrame((_, delta) => {
    if (lastReset.current !== resetKey) {
      lastReset.current = resetKey;
      t.current = 0;
      lastAngle.current = null;
    }
    if (playing) t.current += delta * speed * 0.12;
    const [ex, ez] = earthAt(t.current);
    const [mx, mz] = marsAt(t.current);
    const geo = model === "geo";
    // No geocêntrico tudo é desenhado em relação à Terra (referencial da Terra).
    const ox = geo ? ex : 0;
    const oz = geo ? ez : 0;
    sun.current?.position.set(-ox, 0, -oz);
    earth.current?.position.set(ex - ox, 0, ez - oz);
    mars.current?.position.set(mx - ox, 0, mz - oz);

    // Direção em que Marte é visto da Terra: se o ângulo "anda para trás", é o
    // movimento retrógrado aparente.
    const angle = Math.atan2(mz - ez, mx - ex);
    if (lastAngle.current !== null && playing) {
      let d = angle - lastAngle.current;
      if (d > Math.PI) d -= 2 * Math.PI;
      if (d < -Math.PI) d += 2 * Math.PI;
      const isRetro = d < 0;
      if (isRetro !== retro.current) {
        retro.current = isRetro;
        onRetro(isRetro);
      }
    }
    lastAngle.current = angle;
  });

  return (
    <>
      <group ref={sun}>
        <Sun radius={0.55} />
        <Tag position={[0, 0.95, 0]} color="#ffc94d">
          Sol
        </Tag>
        {model === "helio" && (
          <QuantityTag q={Q.centro} position={[0, 1.7, 0]} value="Sol" name="heliocentrismo (Copérnico)" />
        )}
      </group>
      <group ref={earth}>
        <Earth radius={0.28} />
        <Tag position={[0, 0.6, 0]} color="#7dd3fc">
          Terra
        </Tag>
        {model === "geo" && (
          <QuantityTag q={Q.centro} position={[0, 1.3, 0]} value="Terra" name="geocentrismo (Ptolomeu)" />
        )}
      </group>
      <group ref={mars}>
        <Planet radius={0.2} color="#d1603d" />
        <Tag position={[0, 0.5, 0]} color="#f8a17f">
          Marte
        </Tag>
        <QuantityTag
          q={Q.retro}
          position={[0, 1.2, 0]}
          symbol={retroNow ? "Movimento retrógrado" : "Movimento direto"}
          name={retroNow ? "visto da Terra, Marte parece recuar" : "visto da Terra, Marte avança"}
        />
      </group>
    </>
  );
}

export default function Lesson10GeoHelio() {
  const [model, setModel] = useState("helio");
  const [playing, setPlaying] = useState(true);
  const [speed, setSpeed] = useState(3);
  const [showPaths, setShowPaths] = useState(true);
  const [retro, setRetro] = useState(false);
  const [resetKey, setResetKey] = useState(0);

  // Caminho de Marte visto da Terra: forma "laçadas" (o que Ptolomeu explicava
  // com epiciclos).
  const marsLoops = useMemo(() => {
    const pts = [];
    for (let i = 0; i <= 900; i++) {
      const t = (i / 900) * 6.4;
      const [ex, ez] = earthAt(t);
      const [mx, mz] = marsAt(t);
      pts.push([mx - ex, 0, mz - ez]);
    }
    return pts;
  }, []);

  return (
    <div className="lesson__canvas">
      <SceneShell space cameraPosition={[0, 13, 11]} controlsTarget={[0, 0, 0]}>
        <System model={model} playing={playing} speed={speed} resetKey={resetKey} onRetro={setRetro} retro={retro} />
        {showPaths && (
          <QuantityTag
            q={Q.orbita}
            position={[R_EARTH * 0.72, 0.4, R_EARTH * 0.72]}
            value={model === "helio" ? "da Terra em volta do Sol" : "aparente do Sol em volta da Terra"}
          />
        )}
        {showPaths && model === "geo" && (
          <QuantityTag q={Q.epi} position={[marsLoops[300][0], 0.6, marsLoops[300][2]]} />
        )}
        {showPaths && model === "helio" && (
          <>
            <OrbitRing radius={R_EARTH} color="#3b82f6" />
            <OrbitRing radius={R_MARS} color="#d1603d" />
          </>
        )}
        {showPaths && model === "geo" && (
          <>
            <OrbitRing radius={R_EARTH} color="#ffc94d" />
            <Line points={marsLoops} color="#d1603d" lineWidth={1.2} />
          </>
        )}
      </SceneShell>

      <Panel eyebrow="Aula 10 · Modelos de Universo" title="Geocentrismo x Heliocentrismo">
        <div className="controls">
          <Choice
            value={model}
            onChange={setModel}
            options={[
              { value: "geo", label: "Geocêntrico (Terra no centro)" },
              { value: "helio", label: "Heliocêntrico (Sol no centro)" },
            ]}
          />
          <Slider label="Velocidade" value={speed} onChange={setSpeed} min={1} max={10} step={1} unit="x" />
          <Check label="Mostrar trajetórias" checked={showPaths} onChange={setShowPaths} />
          <div className="btnRow">
            <button className="btn btn--primary" onClick={() => setPlaying((p) => !p)}>
              {playing ? "⏸ Pausar" : "▶ Continuar"}
            </button>
            <button className="btn btn--ghost" onClick={() => setResetKey((k) => k + 1)}>
              ↺ Reiniciar
            </button>
          </div>
          <Readout
            items={[
              { label: "Centro do modelo", value: model === "geo" ? "Terra" : "Sol" },
              { label: "Marte visto da Terra", value: retro ? "Recuando" : "Avançando" },
            ]}
          />
        </div>
        <QuantityToggles items={Q_LIST} />
        <Note>
          Os dois modelos mostram <b>o mesmo movimento</b>, visto de referenciais diferentes. Com a
          Terra no centro, Marte parece dar "laçadas" no céu (movimento retrógrado) — Ptolomeu
          explicava isso com os epiciclos. Com o Sol no centro (Copérnico), a explicação fica mais
          simples: a Terra, mais rápida, ultrapassa Marte. Kepler mostrou que as órbitas são elipses
          e as observações de Galileu com a luneta (luas de Júpiter) deram as evidências que
          faltavam.
        </Note>
      </Panel>
    </div>
  );
}
