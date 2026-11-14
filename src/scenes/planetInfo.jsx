import { Html } from "@react-three/drei";
import { CLASSES, PLANET_INFO, fmtDist } from "../data/planets.js";
import "./planetInfo.css";

// Pop-up com as características de um planeta, preso ao lado dele na cena.
export function PlanetPopup({ name, offset = 0.6, onClose }) {
  const p = PLANET_INFO[name];
  if (!p) return null;
  return (
    <Html position={[0, 0, 0]} zIndexRange={[6, 5]} style={{ pointerEvents: "none" }}>
      <div className="ppop" style={{ "--off": `${Math.round(offset * 40) + 18}px` }} onPointerDown={(e) => e.stopPropagation()}>
        <div className="ppop__head">
          <b>{name}</b>
          <span className={`ppop__class ppop__class--${p.type === "Rochoso" ? "rock" : "gas"}`}>{p.type}</span>
          <button type="button" className="ppop__close" onClick={onClose} aria-label="Fechar">
            ×
          </button>
        </div>
        <p className="ppop__classText">{CLASSES[p.type]}</p>
        <dl className="ppop__list">
          <dt>🌡️ Temperatura</dt>
          <dd>{p.temp}</dd>
          <dt>☀️ Translação</dt>
          <dd>{p.translation} (uma volta ao redor do Sol)</dd>
          <dt>🔄 Rotação</dt>
          <dd>{p.rotation} (uma volta em torno de si)</dd>
          <dt>🌙 Satélites naturais</dt>
          <dd>{p.moons}</dd>
          <dt>📏 Distância ao Sol</dt>
          <dd>{fmtDist(p)}</dd>
        </dl>
        <p className="ppop__foot">Seta na cena: distância Sol → {name}. Valores médios; cena fora de escala.</p>
      </div>
    </Html>
  );
}

// Seta do Sol até o planeta, ao longo do eixo +X do grupo onde é colocada
// (o grupo é girado para apontar para o planeta). Começa na borda do Sol e
// termina na borda do planeta, com o rótulo da distância no meio.
export function SunDistanceArrow({ name, from, to, color = "#fbbf24" }) {
  const p = PLANET_INFO[name];
  const len = Math.max(0.2, to - from);
  const head = Math.min(0.35, len * 0.4);
  return (
    <group>
      <mesh position={[from + (len - head) / 2, 0, 0]} rotation={[0, 0, -Math.PI / 2]}>
        <cylinderGeometry args={[0.035, 0.035, len - head, 10]} />
        <meshBasicMaterial color={color} toneMapped={false} />
      </mesh>
      <mesh position={[to - head / 2, 0, 0]} rotation={[0, 0, -Math.PI / 2]}>
        <coneGeometry args={[0.12, head, 16]} />
        <meshBasicMaterial color={color} toneMapped={false} />
      </mesh>
      <mesh position={[from + head / 2, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <coneGeometry args={[0.12, head, 16]} />
        <meshBasicMaterial color={color} toneMapped={false} />
      </mesh>
      {p && (
        <Html position={[from + len / 2, 0.25, 0]} center zIndexRange={[2, 0]} style={{ pointerEvents: "none" }}>
          <div className="pdist" style={{ "--c": color }}>
            <b>d</b> = {fmtDist(p)}
          </div>
        </Html>
      )}
    </group>
  );
}
