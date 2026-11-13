import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { Text, useGLTF, useTexture } from "@react-three/drei";

// Wrapper em torno do <Text> do drei que sempre usa uma fonte local (em /public/fonts),
// em vez de deixar a biblioteca buscar dados de glifos num CDN externo. Isso faz os
// rótulos 3D funcionarem também offline/em redes restritas de escola.
// O contorno escuro mantém o texto legível sobre o cenário fotográfico.
export function Label3D(props) {
  return <Text font="/fonts/label.ttf" outlineWidth="7%" outlineColor="#05070d" outlineOpacity={0.9} {...props} />;
}

// Pista de medição pintada no asfalto: faixa escura, bordas brancas e uma marca
// a cada metro. Usada em quase todas as aulas de cinemática.
export function RulerTrack({ length = 20, start = 0, step = 1, z = 0, highlight = [] }) {
  const marks = useMemo(() => {
    const arr = [];
    for (let i = 0; i <= length; i += step) arr.push(start + i);
    return arr;
  }, [length, start, step]);
  const isHi = (m) => highlight.some((h) => Math.abs(h - m) < 1e-6);
  const W = 2.4; // largura da faixa

  return (
    <group position={[start, 0.006, z]}>
      {/* asfalto novo da faixa */}
      <mesh position={[length / 2, 0, 0]} rotation={[-Math.PI / 2, 0, 0]} renderOrder={-4}>
        <planeGeometry args={[length + 1.6, W]} />
        <meshBasicMaterial color="#0c0d10" transparent opacity={0.4} depthWrite={false} />
      </mesh>
      {/* bordas contínuas */}
      {[-1, 1].map((s) => (
        <mesh key={s} position={[length / 2, 0.001, (s * W) / 2]} rotation={[-Math.PI / 2, 0, 0]} renderOrder={-3}>
          <planeGeometry args={[length + 1.6, 0.06]} />
          <meshBasicMaterial color="#f4f4f0" transparent opacity={0.9} depthWrite={false} />
        </mesh>
      ))}
      {/* destaques fora das marcas inteiras (ex.: ponto de troca de trecho) */}
      {highlight
        .filter((h) => h >= start && h <= start + length && !marks.some((m) => Math.abs(m - h) < 1e-6))
        .map((h, i) => (
          <mesh key={"h" + i} rotation={[-Math.PI / 2, 0, 0]} position={[h - start, 0.003, 0]} renderOrder={-3}>
            <planeGeometry args={[0.09, W]} />
            <meshBasicMaterial color="#fbbf24" transparent opacity={0.95} depthWrite={false} toneMapped={false} />
          </mesh>
        ))}
      {marks.map((m, i) => {
        const hi = isHi(m);
        return (
          <group key={i} position={[i * step, 0.002, 0]}>
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, W / 2 - 0.22]} renderOrder={-3}>
              <planeGeometry args={[hi ? 0.09 : 0.05, hi ? 0.5 : 0.36]} />
              <meshBasicMaterial color={hi ? "#fbbf24" : "#f4f4f0"} transparent opacity={0.95} depthWrite={false} toneMapped={false} />
            </mesh>
            <Label3D
              position={[0, 0.02, W / 2 + 0.34]}
              rotation={[-Math.PI / 2.6, 0, 0]}
              fontSize={hi ? 0.34 : 0.28}
              color={hi ? "#fbbf24" : "#ffffff"}
              anchorX="center"
              anchorY="middle"
            >
              {m}
            </Label3D>
          </group>
        );
      })}
    </group>
  );
}

// ---------------------------------------------------------------------------
// Carro: modelo 3D detalhado (carroceria, rodas, vidros, interior) em vez de
// caixas. A cor da pintura vem da prop `color`; as rodas giram de acordo com o
// quanto o carro realmente andou na cena.
// Modelo: "Ferrari 458 Italia" por vicent091036 (CC BY 4.0), via exemplos do three.js.
const CAR_URL = "/assets/models/car.glb";
const CAR_SCALE = 0.44; // ~2 unidades de comprimento
const WHEEL_RADIUS = 0.34; // no espaço do modelo
const WHEELS = ["wheel_fl", "wheel_fr", "wheel_rl", "wheel_rr"];
const tmpPos = new THREE.Vector3();
const tmpScale = new THREE.Vector3();

export function Vehicle({ position = [0, 0, 0], color = "#3b82f6", scale = 1, rotationY = 0 }) {
  const gltf = useGLTF(CAR_URL, false);
  const ao = useTexture("/assets/models/ferrari_ao.png");
  const outer = useRef();
  const last = useRef(null);

  const { model, wheels, body } = useMemo(() => {
    const model = gltf.scene.clone(true);
    const body = new THREE.MeshPhysicalMaterial({
      color,
      metalness: 0.8,
      roughness: 0.3,
      clearcoat: 1,
      clearcoatRoughness: 0.04,
    });
    const details = new THREE.MeshStandardMaterial({ color: "#ffffff", metalness: 1, roughness: 0.35 });
    // Vidro escuro e reflexivo (sem "transmission", que exige renderizar a cena duas vezes).
    const glass = new THREE.MeshStandardMaterial({
      color: "#0a0d12",
      metalness: 0.95,
      roughness: 0.06,
      transparent: true,
      opacity: 0.86,
    });
    model.traverse((o) => {
      if (!o.isMesh) return;
      o.castShadow = o.name === "body"; // só a carroceria entra no mapa de sombras
      if (o.name === "body") o.material = body;
      else if (o.name === "glass") o.material = glass;
      else if (o.name === "trim" || o.name.startsWith("rim_")) o.material = details;
    });
    const wheels = WHEELS.map((n) => model.getObjectByName(n)).filter(Boolean);
    return { model, wheels, body };
  }, [gltf]);

  useLayoutEffect(() => {
    body.color.set(color);
  }, [body, color]);

  useFrame(() => {
    const g = outer.current;
    if (!g) return;
    // Mantém as rodas no chão (y = 0) independentemente da altura do grupo-pai.
    g.parent.getWorldPosition(tmpPos);
    g.parent.getWorldScale(tmpScale);
    g.position.y = -tmpPos.y / (tmpScale.y || 1);
    // Gira as rodas conforme o deslocamento real ao longo do eixo X.
    g.getWorldPosition(tmpPos);
    g.getWorldScale(tmpScale);
    if (last.current != null) {
      const d = tmpPos.x - last.current;
      if (Math.abs(d) < 3) {
        const angle = d / (WHEEL_RADIUS * (tmpScale.x || 1));
        for (const w of wheels) w.rotation.x += angle * Math.cos(rotationY);
      }
    }
    last.current = tmpPos.x;
  });

  return (
    <group ref={outer} position={[position[0], 0, position[2]]} scale={scale * CAR_SCALE} rotation={[0, rotationY, 0]}>
      {/* o modelo "olha" para +Z; giramos para andar no sentido +X */}
      <group rotation={[0, Math.PI / 2, 0]}>
        <primitive object={model} />
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.012, 0]} renderOrder={2}>
          <planeGeometry args={[0.655 * 4, 1.3 * 4]} />
          <meshBasicMaterial map={ao} blending={THREE.MultiplyBlending} toneMapped={false} transparent premultipliedAlpha depthWrite={false} />
        </mesh>
      </group>
    </group>
  );
}
useGLTF.preload(CAR_URL, false);

// Esfera para experimentos de queda livre / colisões (metal polido, reflete o cenário).
export function Ball({ position = [0, 1, 0], color = "#f87171", radius = 0.3 }) {
  return (
    <mesh position={position} castShadow>
      <sphereGeometry args={[radius, 48, 32]} />
      <meshPhysicalMaterial color={color} metalness={0.9} roughness={0.22} clearcoat={1} clearcoatRoughness={0.08} />
    </mesh>
  );
}

// Seta 3D para representar vetores de força / velocidade / aceleração
export function Arrow3D({ from = [0, 0.5, 0], length = 1, color = "#f59e0b", label }) {
  return (
    <group position={from}>
      <mesh position={[(length - 0.3) / 2, 0, 0]} rotation={[0, 0, -Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.055, 0.055, Math.max(length - 0.3, 0.01), 16]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.55} metalness={0.3} roughness={0.35} />
      </mesh>
      <mesh position={[length - 0.15, 0, 0]} rotation={[0, 0, -Math.PI / 2]} castShadow>
        <coneGeometry args={[0.15, 0.3, 20]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.55} metalness={0.3} roughness={0.35} />
      </mesh>
      {label && (
        <Label3D position={[length / 2, 0.42, 0]} fontSize={0.27} color={color} anchorX="center">
          {label}
        </Label3D>
      )}
    </group>
  );
}

// Caixote de madeira (corpo empurrado nas aulas de força). Textura desenhada
// por código: tábuas, moldura e travessa diagonal.
function useCrateTexture() {
  return useMemo(() => {
    const size = 512;
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = size;
    const ctx = canvas.getContext("2d");
    let a = 99;
    const rand = () => ((a = (a * 1664525 + 1013904223) >>> 0) / 4294967296);
    const plank = (x, y, w, h, base) => {
      ctx.fillStyle = `hsl(30, 45%, ${base + rand() * 6}%)`;
      ctx.fillRect(x, y, w, h);
      for (let i = 0; i < 40; i++) {
        ctx.strokeStyle = `rgba(60, 35, 10, ${0.05 + rand() * 0.12})`;
        ctx.beginPath();
        const along = w > h;
        const p = rand() * (along ? h : w);
        if (along) { ctx.moveTo(x, y + p); ctx.lineTo(x + w, y + p + (rand() - 0.5) * 6); }
        else { ctx.moveTo(x + p, y); ctx.lineTo(x + p + (rand() - 0.5) * 6, y + h); }
        ctx.stroke();
      }
      ctx.strokeStyle = "rgba(30, 15, 5, 0.75)";
      ctx.lineWidth = 3;
      ctx.strokeRect(x + 1.5, y + 1.5, w - 3, h - 3);
    };
    for (let i = 0; i < 6; i++) plank((i * size) / 6, 0, size / 6, size, 36);
    ctx.save();
    ctx.translate(size / 2, size / 2);
    ctx.rotate(Math.PI / 4);
    plank(-size * 0.62, -34, size * 1.24, 68, 42);
    ctx.restore();
    const b = 62;
    plank(0, 0, size, b, 46);
    plank(0, size - b, size, b, 46);
    plank(0, 0, b, size, 46);
    plank(size - b, 0, b, size, 46);
    ctx.fillStyle = "#2b2b2b";
    for (const [x, y] of [[31, 31], [size - 31, 31], [31, size - 31], [size - 31, size - 31]]) {
      ctx.beginPath();
      ctx.arc(x, y, 7, 0, Math.PI * 2);
      ctx.fill();
    }
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 4;
    return tex;
  }, []);
}

export function Crate({ size = 0.8 }) {
  const map = useCrateTexture();
  return (
    <mesh position={[0, size / 2, 0]} castShadow>
      <boxGeometry args={[size, size, size]} />
      <meshStandardMaterial map={map} roughness={0.8} metalness={0} />
    </mesh>
  );
}
