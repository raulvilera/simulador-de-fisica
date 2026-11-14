import { useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import SceneShell from "./SceneShell.jsx";
import { Panel, Note, Check, Tag, Sun, Planet, Earth, OrbitRing } from "./space.jsx";
import { Readout, Slider } from "../components/ui.jsx";
import { QuantityTag, QuantityToggles } from "./quantities.jsx";
import { PlanetPopup, SunDistanceArrow } from "./planetInfo.jsx";
import { PLANET_INFO, fmtDist } from "../data/planets.js";

// Conceitos mostrados dentro da cena (tocar na etiqueta oculta)
const Q = {
  estrela: { id: "estrela", symbol: "Estrela", name: "o Sol, no centro do sistema", color: "#fde047" },
  tipo: { id: "tipo", symbol: "Tipo", name: "rochoso ou gasoso", color: "#fb923c" },
  translacao: { id: "translacao", symbol: "Translação", name: "uma volta ao redor do Sol", color: "#60a5fa" },
  cinturao: { id: "cinturao", symbol: "Cinturão de asteroides", name: "separa rochosos (dentro) e gasosos (fora)", color: "#a8a29e" },
};
const Q_LIST = Object.values(Q);

// Dados do material da aula (períodos em anos terrestres, distância média em
// milhões de km). Tamanhos e distâncias na cena NÃO estão em escala real.
const PLANETS = [
  { name: "Mercúrio", type: "Rochoso", orbit: 2.0, size: 0.13, color: "#9c9c9c", years: 0.24, period: "88 dias", moons: "0", dist: 58,
    fact: "Mais próximo do Sol e com a translação mais curta. Temperaturas de −183 °C a 426 °C; atmosfera muito tênue." },
  { name: "Vênus", type: "Rochoso", orbit: 2.8, size: 0.2, color: "#e0b672", years: 0.62, period: "225 dias", moons: "0", dist: 108,
    fact: "A \"Estrela d'Alva\". Atmosfera muito densa (pressão cerca de 90 vezes a da Terra): é o planeta mais quente." },
  { name: "Terra", type: "Rochoso", orbit: 3.7, size: 0.22, color: "#3b82f6", years: 1, period: "365 dias", moons: "1", dist: 150,
    fact: "Único planeta conhecido com água líquida estável na superfície. A atmosfera mantém a temperatura e protege de meteoritos." },
  { name: "Marte", type: "Rochoso", orbit: 4.6, size: 0.16, color: "#d1603d", years: 1.88, period: "687 dias", moons: "2", dist: 228,
    fact: "Vermelho por causa do óxido de ferro. Atmosfera fina de dióxido de carbono; luas Fobos e Deimos." },
  { name: "Júpiter", type: "Gasoso", orbit: 6.4, size: 0.62, color: "#d9a066", bands: ["#d9a066", "#f0d9b5", "#b9783f", "#e8c79a"], years: 12, period: "12 anos", moons: "95", dist: 778,
    fact: "O maior planeta, com gravidade quase 2,5 vezes a da Terra. Gira em cerca de 10 horas e tem a Grande Mancha Vermelha." },
  { name: "Saturno", type: "Gasoso", orbit: 8.3, size: 0.52, color: "#e8d28a", bands: ["#e8d28a", "#d6bb6e", "#f3e3ae"], ring: "#cdb98a", years: 30, period: "30 anos", moons: "146", dist: 1430,
    fact: "Famoso pelos anéis, formados por fragmentos de gelo e rocha. Rotação de aproximadamente 10,7 horas." },
  { name: "Urano", type: "Gasoso", orbit: 9.9, size: 0.36, color: "#8fd3dc", years: 84, period: "84 anos", moons: "28", dist: 2870,
    fact: "Gigante gelado azulado (metano na atmosfera). Gira praticamente \"de lado\": eixo inclinado cerca de 98°." },
  { name: "Netuno", type: "Gasoso", orbit: 11.3, size: 0.35, color: "#4f6fe0", years: 165, period: "165 anos", moons: "16", dist: 4500,
    fact: "O mais distante do Sol. Gigante gelado com ventos de até 2 000 km/h, entre os mais rápidos do Sistema Solar." },
];

const SUN_R = 0.9;

// O planeta gira num "pivô" no centro do Sol: assim a seta Sol → planeta
// (presa ao pivô) acompanha o planeta sozinha.
function Orbiting({ planet, index, speed, selected, popup, onSelect, onClose }) {
  const pivot = useRef();
  const body = useRef();
  const angle = useRef(index * 0.9);
  useFrame((_, delta) => {
    angle.current += (delta * speed * 0.25) / planet.years;
    if (pivot.current) pivot.current.rotation.y = -angle.current;
    if (body.current) body.current.rotation.y = angle.current; // o planeta não gira junto com o pivô
  });
  const click = (e) => {
    if (e.delta > 6) return; // arrasto da câmera
    e.stopPropagation();
    onSelect();
  };
  return (
    <group ref={pivot}>
      <group position={[planet.orbit, 0, 0]}>
        <group ref={body}>
          {/* área de toque maior que o planeta (os pequenos ficam fáceis de clicar) */}
          <mesh
            onClick={click}
            onPointerOver={() => (document.body.style.cursor = "pointer")}
            onPointerOut={() => (document.body.style.cursor = "")}
          >
            <sphereGeometry args={[Math.max(planet.size * 1.5, 0.4), 16, 12]} />
            <meshBasicMaterial transparent opacity={0} depthWrite={false} />
          </mesh>
          {planet.name === "Terra" ? (
            <Earth radius={planet.size} onClick={click} />
          ) : (
            <Planet radius={planet.size} color={planet.color} bands={planet.bands} ring={planet.ring} onClick={click} />
          )}
          <Tag
            id={`nome:${planet.name}`}
            position={[0, planet.size + 0.35, 0]}
            color={selected ? "#fde68a" : "#e5e9f5"}
            size={selected ? 0.36 : 0.28}
          >
            {planet.name}
          </Tag>
          {selected && !popup && (
            <>
              <QuantityTag q={Q.tipo} position={[0, planet.size + 1.25, 0]} value={planet.type} />
              <QuantityTag q={Q.translacao} position={[0, -planet.size - 0.7, 0]} value={PLANET_INFO[planet.name].translation} />
            </>
          )}
          {selected && popup && <PlanetPopup name={planet.name} offset={planet.size} onClose={onClose} />}
        </group>
      </group>
      {selected && popup && (
        <SunDistanceArrow name={planet.name} from={SUN_R + 0.08} to={planet.orbit - planet.size - 0.08} />
      )}
    </group>
  );
}

export default function Lesson12Planets() {
  const [sel, setSel] = useState(2);
  const [popup, setPopup] = useState(false);
  const open = (i) => {
    setSel(i);
    setPopup(true);
  };
  const [speed, setSpeed] = useState(2);
  const [orbits, setOrbits] = useState(true);
  const p = PLANETS[sel];

  return (
    <div className="lesson__canvas">
      <SceneShell space cameraPosition={[0, 14, 24]} controlsTarget={[0, 0, 0]} maxDistance={40}>
        <Sun radius={0.9} />
        {!popup && <QuantityTag q={Q.estrela} position={[0, 1.7, 0]} />}
        <QuantityTag q={Q.cinturao} position={[0, 0.3, 5.45]} />
        {PLANETS.map((pl, i) => (
          <group key={pl.name}>
            {orbits && (
              <OrbitRing
                radius={pl.orbit}
                color={i === sel ? "#fde68a" : pl.type === "Rochoso" ? "#7a5a48" : "#3b4a7a"}
                lineWidth={i === sel ? 2 : 1}
              />
            )}
            <Orbiting planet={pl} index={i} speed={speed} selected={i === sel} popup={popup} onSelect={() => open(i)} onClose={() => setPopup(false)} />
          </group>
        ))}
      </SceneShell>

      <Panel eyebrow="Aula 12 · Sistema Solar" title="Planetas rochosos e gasosos">
        <div className="controls">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 12 }}>
            {PLANETS.map((pl, i) => (
              <button
                key={pl.name}
                className={`btn ${i === sel ? "btn--primary" : "btn--ghost"}`}
                style={{ padding: "8px 6px", fontSize: "0.78rem" }}
                onClick={() => open(i)}
              >
                {pl.name}
              </button>
            ))}
          </div>
          <Slider label="Velocidade" value={speed} onChange={setSpeed} min={0} max={10} step={1} unit="x" />
          <Check label="Mostrar órbitas" checked={orbits} onChange={setOrbits} />
          <Readout
            items={[
              { label: "Tipo", value: p.type },
              { label: "Temperatura", value: PLANET_INFO[p.name].temp },
              { label: "Translação", value: PLANET_INFO[p.name].translation },
              { label: "Rotação", value: PLANET_INFO[p.name].rotation },
              { label: "Satélites naturais", value: PLANET_INFO[p.name].moons },
              { label: "Distância do Sol", value: fmtDist(PLANET_INFO[p.name]) },
            ]}
          />
        </div>
        <QuantityToggles items={Q_LIST} />
        <Note>
          <b>{p.name}:</b> {p.fact}
        </Note>
        <Note>
          Rochosos (Mercúrio, Vênus, Terra e Marte) são formados principalmente por material sólido
          e ficam mais perto do Sol. Gasosos (Júpiter, Saturno, Urano e Netuno) são muito maiores e
          ficam além de Marte e do cinturão de asteroides. Clique em um planeta para ver as características dele e a
          distância até o Sol.
          Tamanhos e distâncias fora de escala.
        </Note>
      </Panel>
    </div>
  );
}
