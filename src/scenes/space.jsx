import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { Billboard, Line } from "@react-three/drei";
import { Label3D } from "./primitives.jsx";

// Peças reutilizáveis das cenas de Astronomia (Aulas 10 a 20). Tudo é gerado
// por código (sem fotos/texturas baixadas), então funciona offline como as
// cenas de Cinemática.

// Painel lateral — mesmo visual/medidas do painel usado nas Aulas 1 a 9.
export function Panel({ eyebrow, title, children }) {
  return (
    <div
      className="panel"
      style={{
        position: "absolute",
        top: 0,
        right: 0,
        width: 340,
        height: "100%",
        background: "rgba(10,14,26,0.72)",
        backdropFilter: "blur(8px)",
        borderLeft: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      <p className="panel__eyebrow">{eyebrow}</p>
      <h1>{title}</h1>
      {children}
    </div>
  );
}

// Texto explicativo no rodapé do painel (mesmo estilo das Aulas 1 a 9).
export function Note({ children }) {
  return <p style={{ fontSize: "0.82rem", color: "#a6adc9", marginTop: 14 }}>{children}</p>;
}

// Linha de botões de escolha (um ativo por vez).
export function Choice({ options, value, onChange }) {
  return (
    <div className="btnRow" style={{ flexWrap: "wrap", marginBottom: 12, marginTop: 0 }}>
      {options.map((o) => (
        <button
          key={o.value}
          className={`btn ${o.value === value ? "btn--primary" : "btn--ghost"}`}
          style={{ padding: "8px 10px", fontSize: "0.78rem" }}
          onClick={() => onChange(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

// Caixa de seleção no mesmo formato das linhas de controle das Aulas 1 a 9.
export function Check({ label, checked, onChange }) {
  return (
    <label className="controls__row" style={{ cursor: "pointer" }}>
      <span style={{ maxWidth: "none" }}>{label}</span>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
    </label>
  );
}

// Rótulo 3D que sempre fica de frente para a câmera.
export function Tag({ position = [0, 0, 0], children, color = "#e5e9f5", size = 0.26 }) {
  return (
    <Billboard position={position}>
      <Label3D fontSize={size} color={color} anchorX="center" anchorY="middle">
        {children}
      </Label3D>
    </Billboard>
  );
}

// Estrela/Sol: esfera luminosa (entra no bloom) + luz pontual que ilumina a cena.
export function Sun({ position = [0, 0, 0], radius = 1, color = "#ffc94d", intensity = 2.6, light = true }) {
  return (
    <group position={position}>
      <mesh>
        <sphereGeometry args={[radius, 48, 48]} />
        <meshBasicMaterial color={color} toneMapped={false} />
      </mesh>
      <mesh>
        <sphereGeometry args={[radius * 1.18, 32, 32]} />
        <meshBasicMaterial color={color} transparent opacity={0.12} depthWrite={false} blending={THREE.AdditiveBlending} />
      </mesh>
      {light && <pointLight intensity={intensity} decay={0} color="#fff3d6" />}
    </group>
  );
}

function makeTexture(draw, w = 256, h = 128) {
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  draw(canvas.getContext("2d"), w, h);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function seeded(seed) {
  let a = seed;
  return () => {
    a = (a * 1664525 + 1013904223) % 4294967296;
    return a / 4294967296;
  };
}

// Faixas horizontais (planetas gasosos).
export function useBandTexture(colors) {
  const key = colors ? colors.join(",") : "";
  return useMemo(() => {
    if (!key) return null;
    const list = key.split(",");
    return makeTexture((ctx, w, h) => {
      const rand = seeded(7);
      const n = 14;
      for (let i = 0; i < n; i++) {
        ctx.fillStyle = list[Math.floor(rand() * list.length)];
        ctx.fillRect(0, (i * h) / n, w, h / n + 1);
      }
    });
  }, [key]);
}

// Terra estilizada: oceano azul + manchas de continente + calotas polares.
export function useEarthTexture() {
  return useMemo(
    () =>
      makeTexture((ctx, w, h) => {
        const rand = seeded(42);
        ctx.fillStyle = "#1d5fbf";
        ctx.fillRect(0, 0, w, h);
        for (let i = 0; i < 26; i++) {
          ctx.fillStyle = rand() > 0.4 ? "#3f9b4b" : "#8a8f4a";
          ctx.beginPath();
          ctx.ellipse(rand() * w, h * (0.2 + rand() * 0.6), 8 + rand() * 22, 5 + rand() * 13, rand() * 3, 0, 7);
          ctx.fill();
        }
        ctx.fillStyle = "#f1f5ff";
        ctx.fillRect(0, 0, w, 7);
        ctx.fillRect(0, h - 8, w, 8);
      }),
    []
  );
}

export function Earth({ radius = 0.5, ...props }) {
  const map = useEarthTexture();
  return (
    <mesh {...props}>
      <sphereGeometry args={[radius, 48, 48]} />
      <meshStandardMaterial map={map} roughness={0.75} metalness={0.05} />
    </mesh>
  );
}

// Planeta genérico. `bands` cria faixas (gasosos); `ring` desenha anéis.
export function Planet({ radius = 0.3, color = "#9aa3b8", bands, ring, emissive = 0, onClick, children }) {
  const map = useBandTexture(bands);
  return (
    <group>
      <mesh onClick={onClick}>
        <sphereGeometry args={[radius, 40, 40]} />
        <meshStandardMaterial
          color={map ? "#ffffff" : color}
          map={map}
          roughness={0.8}
          emissive={color}
          emissiveIntensity={emissive}
        />
      </mesh>
      {ring && (
        <mesh rotation={[Math.PI / 2 - 0.35, 0, 0]}>
          <ringGeometry args={[radius * 1.35, radius * 2.1, 64]} />
          <meshBasicMaterial color={ring} side={THREE.DoubleSide} transparent opacity={0.7} />
        </mesh>
      )}
      {children}
    </group>
  );
}

// Circunferência no plano horizontal (órbitas).
export function OrbitRing({ radius, color = "#3b4a7a", center = [0, 0, 0], lineWidth = 1 }) {
  const points = useMemo(() => {
    const pts = [];
    for (let i = 0; i <= 128; i++) {
      const a = (i / 128) * Math.PI * 2;
      pts.push([Math.cos(a) * radius, 0, Math.sin(a) * radius]);
    }
    return pts;
  }, [radius]);
  return <Line points={points} color={color} lineWidth={lineWidth} position={center} />;
}

// Seta entre dois pontos quaisquer do espaço (vetores de força, direções).
export function ArrowBetween({ from, to, color = "#f59e0b", thickness = 0.05 }) {
  const { position, quaternion, length } = useMemo(() => {
    const a = new THREE.Vector3(...from);
    const b = new THREE.Vector3(...to);
    const dir = b.clone().sub(a);
    const len = Math.max(dir.length(), 0.001);
    const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize());
    return { position: a.toArray(), quaternion: q, length: len };
  }, [from, to]);
  const head = Math.min(0.3, length * 0.4);
  return (
    <group position={position} quaternion={quaternion}>
      <mesh position={[0, (length - head) / 2, 0]}>
        <cylinderGeometry args={[thickness, thickness, Math.max(length - head, 0.001), 12]} />
        <meshBasicMaterial color={color} />
      </mesh>
      <mesh position={[0, length - head / 2, 0]}>
        <coneGeometry args={[thickness * 2.8, head, 16]} />
        <meshBasicMaterial color={color} />
      </mesh>
    </group>
  );
}

// Leva a câmera suavemente até uma posição quando `trigger` muda; depois o
// usuário continua livre para girar/aproximar com o mouse.
export function CameraRig({ position, trigger }) {
  const camera = useThree((s) => s.camera);
  const controls = useThree((s) => s.controls);
  const remaining = useRef(0);
  const goal = useRef(new THREE.Vector3());

  useEffect(() => {
    goal.current.set(...position);
    remaining.current = 1.4;
  }, [trigger]);

  useFrame((_, delta) => {
    if (remaining.current <= 0) return;
    remaining.current -= delta;
    camera.position.lerp(goal.current, Math.min(1, delta * 4));
    controls?.update?.();
  });
  return null;
}
