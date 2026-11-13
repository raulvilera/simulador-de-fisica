import { useRef, useState } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import SceneShell from "./SceneShell.jsx";
import { Panel, Note, Check, Tag, Sun, OrbitRing } from "./space.jsx";
import { Readout, Slider } from "../components/ui.jsx";

const UA = 5; // 1 unidade astronômica (distância Terra-Sol) em unidades de cena
const VENUS = 0.72;
const MARS = 1.52;

// Modelo simplificado: sem efeito estufa, a Terra (1 UA) teria média de −18 °C;
// o efeito estufa natural acrescenta cerca de 33 °C (média real ≈ 15 °C).
function temperature(dist, greenhouse) {
  return 255 / Math.sqrt(dist) - 273 + (greenhouse ? 33 : 0);
}

function waterState(t) {
  if (t < 0) return { label: "Gelo (sólida)", color: "#e8f1ff" };
  if (t > 100) return { label: "Vapor (gasosa)", color: "#c2703d" };
  return { label: "Líquida", color: "#2f7de0" };
}

function OrbitingPlanet({ dist, color, greenhouse }) {
  const ref = useRef();
  const angle = useRef(0.6);
  useFrame((_, delta) => {
    angle.current += (delta * 0.35) / Math.pow(dist, 1.5);
    ref.current?.position.set(Math.cos(angle.current) * dist * UA, 0, Math.sin(angle.current) * dist * UA);
  });
  return (
    <group ref={ref}>
      <mesh>
        <sphereGeometry args={[0.38, 40, 40]} />
        <meshStandardMaterial color={color} roughness={0.6} />
      </mesh>
      {greenhouse && (
        <mesh>
          <sphereGeometry args={[0.46, 32, 32]} />
          <meshBasicMaterial color="#9bd4ff" transparent opacity={0.22} depthWrite={false} />
        </mesh>
      )}
      <Tag position={[0, 0.8, 0]}>planeta</Tag>
    </group>
  );
}

export default function Lesson19HabitableZone() {
  const [dist, setDist] = useState(1);
  const [greenhouse, setGreenhouse] = useState(true);
  const [refs, setRefs] = useState(true);

  const t = temperature(dist, greenhouse);
  const water = waterState(t);
  const inZone = dist >= VENUS && dist <= MARS;

  return (
    <div className="lesson__canvas">
      <SceneShell space cameraPosition={[0, 13, 14]} controlsTarget={[0, 0, 0]} maxDistance={40}>
        <Sun radius={0.9} />
        {/* zona habitável: faixa entre as órbitas de Vênus e de Marte */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]}>
          <ringGeometry args={[VENUS * UA, MARS * UA, 96]} />
          <meshBasicMaterial color="#22c55e" transparent opacity={0.16} side={THREE.DoubleSide} depthWrite={false} />
        </mesh>
        <Tag position={[0, 0.3, -((VENUS + MARS) / 2) * UA]} color="#86efac" size={0.34}>
          zona habitável
        </Tag>
        {refs && (
          <>
            <OrbitRing radius={VENUS * UA} color="#e0b672" />
            <OrbitRing radius={1 * UA} color="#3b82f6" />
            <OrbitRing radius={MARS * UA} color="#d1603d" />
            <Tag position={[VENUS * UA, 0.3, 0]} color="#e0b672" size={0.22}>órbita de Vênus</Tag>
            <Tag position={[UA, 0.3, 0.9]} color="#7dd3fc" size={0.22}>órbita da Terra</Tag>
            <Tag position={[MARS * UA, 0.3, 0]} color="#f8a17f" size={0.22}>órbita de Marte</Tag>
          </>
        )}
        <OrbitRing radius={dist * UA} color="#ffffff" lineWidth={1.5} />
        <OrbitingPlanet dist={dist} color={water.color} greenhouse={greenhouse} />
      </SceneShell>

      <Panel eyebrow="Aula 19 · Astrobiologia" title="Vida fora da Terra: a zona habitável">
        <div className="controls">
          <Slider label="Distância" value={dist} onChange={setDist} min={0.3} max={2.5} step={0.02} unit=" UA" />
          <Check label="Atmosfera com efeito estufa" checked={greenhouse} onChange={setGreenhouse} />
          <Check label="Órbitas de referência" checked={refs} onChange={setRefs} />
          <Readout
            items={[
              { label: "Temperatura média", value: `${t.toFixed(0)} °C` },
              { label: "Água", value: water.label },
              { label: "Na zona habitável?", value: inZone ? "Sim" : "Não" },
              { label: "Radiação da estrela", value: `${(100 / (dist * dist)).toFixed(0)} %` },
            ]}
          />
        </div>
        <Note>
          A temperatura de um planeta depende da distância até sua estrela. Na{" "}
          <b>zona habitável</b> (no Sistema Solar, entre Vênus e Marte) a radiação recebida permite
          água líquida. Sem o efeito estufa natural, a Terra teria média de −18 °C; com ele, cerca de
          15 °C. Condições para a vida como a conhecemos: gravidade, atmosfera, proteção contra
          radiação, água líquida e temperatura adequada.
        </Note>
        <Note>
          A Astrobiologia procura essas condições e <b>assinaturas biológicas</b> (oxigênio, gás
          carbônico, metano) em Marte, nas luas Europa e Encélado e em exoplanetas como os sete do
          sistema TRAPPIST-1, a cerca de 40 anos-luz. Modelo simplificado; 1 UA = distância
          Terra-Sol.
        </Note>
      </Panel>
    </div>
  );
}
