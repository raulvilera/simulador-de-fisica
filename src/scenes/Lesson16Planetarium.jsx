import { useMemo, useState } from "react";
import * as THREE from "three";
import { Line } from "@react-three/drei";
import SceneShell from "./SceneShell.jsx";
import { Panel, Note, Check, Tag } from "./space.jsx";
import { Readout, Slider } from "../components/ui.jsx";
import { QuantityTag, QuantityToggles } from "./quantities.jsx";

// Conceitos mostrados dentro da cena (tocar na etiqueta oculta)
const Q = {
  horizonte: { id: "horizonte", symbol: "Horizonte", name: "limite entre o céu e o solo", color: "#86efac" },
  zenite: { id: "zenite", symbol: "Zênite", name: "ponto bem acima da cabeça", color: "#facc15" },
  polo: { id: "polo", symbol: "Polo Sul celeste", name: "o céu parece girar em volta dele", color: "#60a5fa" },
  ecliptica: { id: "ecliptica", symbol: "Eclíptica", name: "caminho aparente do Sol no céu", color: "#fb923c" },
};
const Q_LIST = Object.values(Q);

const MONTHS = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
const LAT = (-23.5 * Math.PI) / 180; // latitude aproximada de São Paulo
const R = 30; // raio da esfera celeste na cena
const RAD = Math.PI / 180;

// Estrelas reais: [nome, ascensão reta (h), declinação (°)].
const CONSTELLATIONS = [
  {
    name: "Cruzeiro do Sul", color: "#7dd3fc",
    stars: [["Acrux", 12.44, -63.1], ["Mimosa", 12.8, -59.7], ["Gacrux", 12.52, -57.1], ["", 12.25, -58.75], ["", 12.36, -60.4]],
    seg: [[2, 0], [1, 3]],
  },
  {
    name: "Centauro", color: "#fde68a",
    stars: [["Alfa Centauri", 14.66, -60.8], ["Hadar", 14.06, -60.4], ["", 13.66, -53.5], ["", 13.93, -47.3], ["", 14.11, -36.4], ["", 12.69, -48.96], ["", 14.59, -42.2]],
    seg: [[0, 1], [1, 2], [2, 3], [3, 4], [2, 5], [3, 6]],
  },
  {
    name: "Órion", color: "#fca5a5",
    stars: [["Betelgeuse", 5.92, 7.4], ["Rigel", 5.24, -8.2], ["", 5.42, 6.35], ["", 5.8, -9.67], ["", 5.68, -1.94], ["Três Marias", 5.6, -1.2], ["", 5.53, -0.3]],
    seg: [[0, 4], [2, 6], [4, 5], [5, 6], [4, 3], [6, 1], [0, 2], [3, 1]],
  },
  {
    name: "Escorpião", color: "#f0abfc",
    stars: [["", 16.09, -19.8], ["", 16.01, -22.6], ["", 15.98, -26.1], ["Antares", 16.49, -26.4], ["", 16.6, -28.2], ["", 16.84, -34.3], ["", 16.86, -38.0], ["", 16.9, -42.4], ["", 17.2, -43.2], ["", 17.62, -43.0], ["", 17.79, -40.1], ["", 17.56, -37.1]],
    seg: [[0, 1], [1, 2], [1, 3], [3, 4], [4, 5], [5, 6], [6, 7], [7, 8], [8, 9], [9, 10], [10, 11]],
  },
  { name: "", color: "#ffffff", stars: [["Sirius", 6.75, -16.7], ["Canopus", 6.4, -52.7]], seg: [] },
];

// Constelações do zodíaco ao longo da eclíptica (posições aproximadas).
const ZODIAC = ["Peixes", "Áries", "Touro", "Gêmeos", "Câncer", "Leão", "Virgem", "Libra", "Escorpião", "Sagitário", "Capricórnio", "Aquário"];

// Longitude na eclíptica → ascensão reta (h) e declinação (°).
function eclipticToEquatorial(lonDeg) {
  const l = lonDeg * RAD;
  const e = 23.44 * RAD;
  const ra = Math.atan2(Math.sin(l) * Math.cos(e), Math.cos(l));
  const dec = Math.asin(Math.sin(l) * Math.sin(e));
  return [((ra / RAD / 15) + 24) % 24, dec / RAD];
}

// Coordenadas equatoriais → posição no céu do observador (x = leste, y = para
// cima, z = sul), para um dado tempo sideral local (em horas).
function toSky(raH, decDeg, lst, r = R) {
  const H = (lst - raH) * 15 * RAD;
  const d = decDeg * RAD;
  const east = -Math.cos(d) * Math.sin(H);
  const north = Math.cos(LAT) * Math.sin(d) - Math.sin(LAT) * Math.cos(d) * Math.cos(H);
  const up = Math.sin(LAT) * Math.sin(d) + Math.cos(LAT) * Math.cos(d) * Math.cos(H);
  return [east * r, up * r, -north * r];
}

const fmtHour = (h) => `${String(Math.floor(h % 24)).padStart(2, "0")}h`;

export default function Lesson16Planetarium() {
  const [month, setMonth] = useState(7);
  const [hour, setHour] = useState(21); // 18 a 30 (30 = 6h da manhã seguinte)
  const [lines, setLines] = useState(true);
  const [names, setNames] = useState(true);
  const [zodiac, setZodiac] = useState(false);
  const [ground, setGround] = useState(true);

  // Sol: longitude na eclíptica para o dia 15 do mês escolhido.
  const day = (month - 1) * 30.4 + 15;
  const sunLon = (((day - 80) / 365.25) * 360 + 360) % 360;
  const [sunRa, sunDec] = eclipticToEquatorial(sunLon);
  const lst = (sunRa + 12 + (hour - 24) + 48) % 24;
  const sunZodiac = ZODIAC[Math.floor(sunLon / 30) % 12];

  const backdrop = useMemo(() => {
    let a = 99;
    const rand = () => ((a = (a * 1664525 + 1013904223) % 4294967296) / 4294967296);
    return Array.from({ length: 700 }, () => [rand() * 24, Math.asin(rand() * 2 - 1) / RAD]);
  }, []);
  const backdropPositions = useMemo(() => {
    const arr = new Float32Array(backdrop.length * 3);
    backdrop.forEach(([ra, dec], i) => arr.set(toSky(ra, dec, lst, R * 1.02), i * 3));
    return new THREE.BufferAttribute(arr, 3);
  }, [backdrop, lst]);

  const ecliptic = useMemo(() => {
    const pts = [];
    for (let l = 0; l <= 360; l += 5) pts.push(toSky(...eclipticToEquatorial(l), lst));
    return pts;
  }, [lst]);

  const cross = toSky(12.5, -60, lst);
  const crossUp = cross[1] > 0;

  return (
    <div className="lesson__canvas">
      <SceneShell space skyBrightness={0.4} fov={78} cameraPosition={[0, 1.42, -0.3]} controlsTarget={[0, 1.6, 0]} minDistance={0.1} maxDistance={0.6}>
        <points>
          <bufferGeometry>
            <primitive object={backdropPositions} attach="attributes-position" />
          </bufferGeometry>
          <pointsMaterial size={0.22} color="#aab8e6" sizeAttenuation />
        </points>

        {CONSTELLATIONS.map((c) => {
          const pos = c.stars.map(([, ra, dec]) => toSky(ra, dec, lst));
          const center = pos.reduce((acc, p) => [acc[0] + p[0] / pos.length, acc[1] + p[1] / pos.length, acc[2] + p[2] / pos.length], [0, 0, 0]);
          return (
            <group key={c.name || "soltas"}>
              {pos.map((p, i) => (
                <group key={i} position={p}>
                  <mesh>
                    <sphereGeometry args={[c.stars[i][0] ? 0.3 : 0.2, 12, 12]} />
                    <meshBasicMaterial color="#ffffff" toneMapped={false} />
                  </mesh>
                  {names && c.stars[i][0] && (
                    <Tag position={[0, -0.9, 0]} size={0.6} color="#d4d8ea">
                      {c.stars[i][0]}
                    </Tag>
                  )}
                </group>
              ))}
              {lines && c.seg.map(([a, b], i) => <Line key={i} points={[pos[a], pos[b]]} color={c.color} lineWidth={1.5} />)}
              {names && c.name && (
                <Tag position={[center[0], center[1] + 2.4, center[2]]} size={1} color={c.color}>
                  {c.name}
                </Tag>
              )}
            </group>
          );
        })}

        {zodiac && (
          <>
            <Line points={ecliptic} color="#f59e0b" lineWidth={1} />
            {ZODIAC.map((z, i) => (
              <Tag key={z} position={toSky(...eclipticToEquatorial(i * 30 + 15), lst)} size={0.9} color="#fbbf24">
                {z}
              </Tag>
            ))}
            <group position={toSky(sunRa, sunDec, lst, R * 0.98)}>
              <mesh>
                <sphereGeometry args={[1, 24, 24]} />
                <meshBasicMaterial color="#ffc94d" toneMapped={false} />
              </mesh>
              <Tag position={[0, 1.8, 0]} size={0.9} color="#ffc94d">
                Sol
              </Tag>
            </group>
          </>
        )}

        {ground && (
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <circleGeometry args={[R * 1.1, 64]} />
            <meshBasicMaterial color="#0a1a10" side={THREE.DoubleSide} />
          </mesh>
        )}
        <QuantityTag q={Q.horizonte} position={[4, 3.2, R * 0.85]} />
        <QuantityTag q={Q.zenite} position={[0, R * 0.95, 0]} />
        <QuantityTag q={Q.polo} position={toSky(0, -89.9, lst, R * 0.95)} name="o Cruzeiro do Sul aponta para ele" />
        {zodiac && <QuantityTag q={Q.ecliptica} position={toSky(...eclipticToEquatorial(sunLon + 40), lst, R * 0.95)} />}
        {[["N", 0, -1], ["S", 0, 1], ["L", 1, 0], ["O", -1, 0]].map(([l, x, z]) => (
          <Tag key={l} position={[x * R * 0.9, 1.5, z * R * 0.9]} size={1.6} color="#86efac">
            {l}
          </Tag>
        ))}
      </SceneShell>

      <Panel eyebrow="Aula 16 · Planetário virtual" title="O céu de São Paulo, noite a noite">
        <div className="controls">
          <Slider label="Mês" value={month} onChange={setMonth} min={1} max={12} step={1} />
          <Slider label="Hora" value={hour} onChange={setHour} min={18} max={30} step={0.5} />
          <Check label="Linhas das constelações" checked={lines} onChange={setLines} />
          <Check label="Nomes" checked={names} onChange={setNames} />
          <Check label="Zodíaco, eclíptica e Sol" checked={zodiac} onChange={setZodiac} />
          <Check label="Mostrar o solo" checked={ground} onChange={setGround} />
          <Readout
            items={[
              { label: "Data e hora", value: `15/${String(month).padStart(2, "0")} · ${fmtHour(hour)}` },
              { label: "Mês", value: MONTHS[month - 1] },
              { label: "Cruzeiro do Sul", value: crossUp ? "Acima do horizonte" : "Abaixo do horizonte" },
              { label: "Sol na direção de", value: sunZodiac },
            ]}
          />
        </div>
        <QuantityToggles items={Q_LIST} />
        <Note>
          Arraste a tela para olhar ao redor (a vista começa voltada para o <b>Sul</b>). Compare
          julho com outro mês: Centauro e Cruzeiro do Sul mudam de posição no céu ao longo do ano —
          por isso o céu serviu de calendário para tantos povos. Tire o solo e ligue o zodíaco para
          ver sobre qual constelação o Sol está: as 12 constelações do zodíaco ficam ao longo da
          <b> eclíptica</b>, o caminho aparente do Sol.
        </Note>
        <Note>
          Planetários virtuais (como o Stellarium) mostram o céu mesmo com nuvens, dão o nome dos
          astros e as linhas das constelações. Aqui, posições aproximadas.
        </Note>
      </Panel>
    </div>
  );
}
