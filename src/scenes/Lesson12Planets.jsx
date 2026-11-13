import { useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import SceneShell from "./SceneShell.jsx";
import { Panel, Note, Check, Tag, Sun, Planet, Earth, OrbitRing } from "./space.jsx";
import { Readout, Slider } from "../components/ui.jsx";

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

function Orbiting({ planet, index, speed, selected, onSelect }) {
  const ref = useRef();
  const angle = useRef(index * 0.9);
  useFrame((_, delta) => {
    angle.current += (delta * speed * 0.25) / planet.years;
    ref.current?.position.set(Math.cos(angle.current) * planet.orbit, 0, Math.sin(angle.current) * planet.orbit);
  });
  return (
    <group ref={ref}>
      {planet.name === "Terra" ? (
        <Earth radius={planet.size} onClick={onSelect} />
      ) : (
        <Planet radius={planet.size} color={planet.color} bands={planet.bands} ring={planet.ring} onClick={onSelect} />
      )}
      <Tag position={[0, planet.size + 0.35, 0]} color={selected ? "#fde68a" : "#aab3cf"} size={selected ? 0.34 : 0.24}>
        {planet.name}
      </Tag>
    </group>
  );
}

export default function Lesson12Planets() {
  const [sel, setSel] = useState(2);
  const [speed, setSpeed] = useState(2);
  const [orbits, setOrbits] = useState(true);
  const p = PLANETS[sel];

  return (
    <div className="lesson__canvas">
      <SceneShell space cameraPosition={[0, 14, 24]} controlsTarget={[0, 0, 0]} maxDistance={40}>
        <Sun radius={0.9} />
        {PLANETS.map((pl, i) => (
          <group key={pl.name}>
            {orbits && (
              <OrbitRing
                radius={pl.orbit}
                color={i === sel ? "#fde68a" : pl.type === "Rochoso" ? "#7a5a48" : "#3b4a7a"}
                lineWidth={i === sel ? 2 : 1}
              />
            )}
            <Orbiting planet={pl} index={i} speed={speed} selected={i === sel} onSelect={() => setSel(i)} />
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
                onClick={() => setSel(i)}
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
              { label: "Volta ao redor do Sol", value: p.period },
              { label: "Luas", value: p.moons },
              { label: "Distância do Sol (milhões de km)", value: p.dist },
            ]}
          />
        </div>
        <Note>
          <b>{p.name}:</b> {p.fact}
        </Note>
        <Note>
          Rochosos (Mercúrio, Vênus, Terra e Marte) são formados principalmente por material sólido
          e ficam mais perto do Sol. Gasosos (Júpiter, Saturno, Urano e Netuno) são muito maiores e
          ficam além de Marte e do cinturão de asteroides. Clique em um planeta para selecioná-lo.
          Tamanhos e distâncias fora de escala.
        </Note>
      </Panel>
    </div>
  );
}
