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
// `labelOf(x)` (opcional) troca o número escrito em cada marca — usado quando a
// pista representa outra escala (ex.: km, ou metros comprimidos).
export function RulerTrack({ length = 20, start = 0, step = 1, z = 0, highlight = [], labelOf }) {
  const marks = useMemo(() => {
    const arr = [];
    const n = Math.round(length / step);
    for (let i = 0; i <= n; i++) arr.push(start + i * step);
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
              {labelOf ? labelOf(m) : m}
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
const tmpFwd = new THREE.Vector3();
const lastPos = new THREE.Vector3();

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
    // Gira as rodas conforme o deslocamento real, medido na direção para onde
    // o carro aponta (assim a roda gira certo também quando ele dá meia-volta).
    g.getWorldPosition(tmpPos);
    g.getWorldScale(tmpScale);
    if (last.current) {
      tmpFwd.set(1, 0, 0).transformDirection(g.matrixWorld);
      const d = lastPos.copy(tmpPos).sub(last.current).dot(tmpFwd);
      if (Math.abs(d) < 3) {
        // a frente do modelo é −Z: rodar para a frente = ângulo negativo em X
        const angle = d / (WHEEL_RADIUS * (tmpScale.x || 1));
        for (const w of wheels) w.rotation.x -= angle;
      }
      last.current.copy(tmpPos);
    } else {
      last.current = tmpPos.clone();
    }
  });

  return (
    <group ref={outer} position={[position[0], 0, position[2]]} scale={scale * CAR_SCALE} rotation={[0, rotationY, 0]}>
      {/* a frente do modelo aponta para −Z (rodas dianteiras em z < 0);
          giramos −90° para o carro andar de frente no sentido +X */}
      <group rotation={[0, -Math.PI / 2, 0]}>
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

// Seta 3D para representar vetores de força / velocidade / aceleração.
// `dir` = 1 aponta para +X, `dir` = −1 aponta para −X (o rótulo nunca espelha).
export function Arrow3D({ from = [0, 0.5, 0], length = 1, color = "#f59e0b", label, dir = 1, thickness = 1 }) {
  return (
    <group position={from} userData={{ noProtect: true }}>
      <group rotation={[0, dir < 0 ? Math.PI : 0, 0]}>
        <mesh position={[(length - 0.3) / 2, 0, 0]} rotation={[0, 0, -Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.055 * thickness, 0.055 * thickness, Math.max(length - 0.3, 0.01), 16]} />
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.55} metalness={0.3} roughness={0.35} />
        </mesh>
        <mesh position={[length - 0.15, 0, 0]} rotation={[0, 0, -Math.PI / 2]} castShadow>
          <coneGeometry args={[0.15 * thickness, 0.3, 20]} />
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.55} metalness={0.3} roughness={0.35} />
        </mesh>
      </group>
      {label && (
        <Label3D position={[(dir * length) / 2, 0.36, 0]} fontSize={0.27} color={color} anchorX="center">
          {label}
        </Label3D>
      )}
    </group>
  );
}

// Pessoa empurrando algo à sua frente (aulas de força), com proporções de um
// adulto real (~1,75 m — a cena das forças está em metros): cabeça ≈ 1/7,5 da
// altura, pernas com coxa e canela (joelho), braços com cotovelo, mãos, pescoço,
// tronco afunilado, cinto e tênis. O corpo se inclina ~35° para a frente e as
// mãos se apoiam a `reach` m dos quadris, na altura do peito.
// Fica virada para +X (`dir` = 1) ou −X (`dir` = −1); as pernas dão passos de
// acordo com o quanto ela realmente se deslocou na cena.
const HIP_Y = 0.92;
const THIGH = 0.46;
const SHIN = 0.44;
const TORSO = 0.55;
const UPPER_ARM = 0.3;
const FOREARM = 0.28;
const LEAN = 0.6; // rad (~35°)

function limb(from, to) {
  const dx = to[0] - from[0];
  const dy = to[1] - from[1];
  return {
    position: [(from[0] + to[0]) / 2, (from[1] + to[1]) / 2, from[2]],
    rotation: [0, 0, Math.atan2(-dx, dy)],
    length: Math.hypot(dx, dy),
  };
}

// Cotovelo por cinemática inversa de 2 ossos, no plano XY (dobra para baixo).
function elbowOf(sx, sy, hx, hy) {
  const dx = hx - sx;
  const dy = hy - sy;
  const d = Math.min(Math.hypot(dx, dy), UPPER_ARM + FOREARM - 1e-3);
  const base = Math.atan2(dy, dx);
  const a = Math.acos((UPPER_ARM * UPPER_ARM + d * d - FOREARM * FOREARM) / (2 * UPPER_ARM * d));
  return [sx + Math.cos(base - a) * UPPER_ARM, sy + Math.sin(base - a) * UPPER_ARM];
}

function Seg({ from, to, r0, r1 = r0, color, z = 0 }) {
  const l = limb([from[0], from[1], z], [to[0], to[1], z]);
  return (
    <mesh position={l.position} rotation={l.rotation} castShadow>
      <cylinderGeometry args={[r1, r0, l.length, 12]} />
      <meshStandardMaterial color={color} roughness={0.85} />
    </mesh>
  );
}

export function Pusher({
  position = [0, 0, 0],
  dir = 1,
  shirt = "#3b82f6",
  skin = "#c98d63",
  hair = "#2a1d14",
  pants = "#27324a",
  shoes = "#f1f1f1",
  reach = 0.62,
  upright = false, // true = parou de empurrar: fica em pé, braços ao lado do corpo
}) {
  const root = useRef();
  const thighs = useRef([]);
  const shins = useRef([]);
  const last = useRef(null);
  const phase = useRef(0);

  useFrame(() => {
    const g = root.current;
    if (!g) return;
    g.getWorldPosition(tmpPos);
    if (last.current != null) {
      const d = (tmpPos.x - last.current) * dir;
      if (Math.abs(d) < 3) phase.current += d * 4.2;
    }
    last.current = tmpPos.x;
    // passada de quem empurra: pernas para trás, joelho dobra quando a perna avança
    for (let i = 0; i < 2; i++) {
      const s = Math.sin(phase.current + i * Math.PI);
      if (thighs.current[i]) thighs.current[i].rotation.z = upright ? 0 : -0.38 + s * 0.32;
      if (shins.current[i]) shins.current[i].rotation.z = upright ? 0 : -0.12 - Math.max(0, s) * 0.55;
    }
  });

  // tronco inclinado (ou em pé); ombros, pescoço e cabeça seguem a inclinação
  const lean = upright ? 0.06 : LEAN;
  const sx = Math.sin(lean) * TORSO;
  const sy = HIP_Y + Math.cos(lean) * TORSO;
  const neck = [sx + Math.sin(lean) * 0.1, sy + Math.cos(lean) * 0.1];
  const head = [sx + Math.sin(lean) * 0.22, sy + Math.cos(lean) * 0.22];
  const hand = upright ? [sx + 0.06, sy - 0.56] : [reach, 1.02];
  const torso = limb([0, HIP_Y, 0], [sx, sy, 0]);

  return (
    <group ref={root} position={position} rotation={[0, dir < 0 ? Math.PI : 0, 0]}>
      {/* pernas: coxa → joelho → canela → tênis */}
      {[-0.1, 0.1].map((z, i) => (
        <group key={z} ref={(el) => void (thighs.current[i] = el)} position={[0, HIP_Y, z]}>
          <mesh position={[0, -THIGH / 2, 0]} castShadow>
            <cylinderGeometry args={[0.075, 0.062, THIGH, 12]} />
            <meshStandardMaterial color={pants} roughness={0.9} />
          </mesh>
          <group ref={(el) => void (shins.current[i] = el)} position={[0, -THIGH, 0]}>
            <mesh>
              <sphereGeometry args={[0.062, 10, 8]} />
              <meshStandardMaterial color={pants} roughness={0.9} />
            </mesh>
            <mesh position={[0, -SHIN / 2, 0]} castShadow>
              <cylinderGeometry args={[0.058, 0.045, SHIN, 12]} />
              <meshStandardMaterial color={pants} roughness={0.9} />
            </mesh>
            <mesh position={[0.05, -SHIN - 0.035, 0]} castShadow>
              <boxGeometry args={[0.26, 0.08, 0.1]} />
              <meshStandardMaterial color={shoes} roughness={0.6} />
            </mesh>
            <mesh position={[0.05, -SHIN - 0.072, 0]}>
              <boxGeometry args={[0.27, 0.015, 0.105]} />
              <meshStandardMaterial color="#3a3a3a" roughness={0.9} />
            </mesh>
          </group>
        </group>
      ))}
      {/* quadril e cinto */}
      <mesh position={[0, HIP_Y + 0.02, 0]} scale={[0.75, 0.6, 1]} castShadow>
        <sphereGeometry args={[0.17, 14, 10]} />
        <meshStandardMaterial color={pants} roughness={0.9} />
      </mesh>
      <mesh position={[Math.sin(lean) * 0.07, HIP_Y + 0.08, 0]} rotation={torso.rotation}>
        <cylinderGeometry args={[0.15, 0.15, 0.04, 16]} />
        <meshStandardMaterial color="#3b2a1e" roughness={0.6} />
      </mesh>
      {/* tronco afunilado (ombros mais largos que a cintura), achatado na frente */}
      <mesh position={torso.position} rotation={torso.rotation} scale={[0.7, 1, 1]} castShadow>
        <cylinderGeometry args={[0.2, 0.15, TORSO, 16]} />
        <meshStandardMaterial color={shirt} roughness={0.85} />
      </mesh>
      <mesh position={[sx, sy, 0]} scale={[0.7, 0.55, 1]}>
        <sphereGeometry args={[0.2, 16, 10]} />
        <meshStandardMaterial color={shirt} roughness={0.85} />
      </mesh>
      {/* pescoço e cabeça */}
      <Seg from={[sx, sy]} to={neck} r0={0.05} color={skin} />
      <group position={[head[0], head[1], 0]} rotation={[0, 0, -lean * 0.55]}>
        <mesh scale={[0.95, 1.12, 0.88]} castShadow>
          <sphereGeometry args={[0.105, 20, 16]} />
          <meshStandardMaterial color={skin} roughness={0.7} />
        </mesh>
        {/* cabelo */}
        <mesh position={[-0.012, 0.02, 0]} scale={[1.02, 1.1, 0.95]}>
          <sphereGeometry args={[0.108, 20, 12, 0, Math.PI * 2, 0, Math.PI * 0.55]} />
          <meshStandardMaterial color={hair} roughness={0.9} />
        </mesh>
        {/* olhos, nariz e orelhas (o rosto olha para +X) */}
        {[-0.035, 0.035].map((z) => (
          <mesh key={z} position={[0.09, 0.012, z]}>
            <sphereGeometry args={[0.011, 8, 6]} />
            <meshBasicMaterial color="#1a1a1a" />
          </mesh>
        ))}
        <mesh position={[0.103, -0.01, 0]} rotation={[0, 0, -Math.PI / 2]}>
          <coneGeometry args={[0.014, 0.03, 8]} />
          <meshStandardMaterial color={skin} roughness={0.7} />
        </mesh>
        {[-0.095, 0.095].map((z) => (
          <mesh key={z} position={[0, 0, z]} scale={[0.6, 1, 0.4]}>
            <sphereGeometry args={[0.025, 8, 6]} />
            <meshStandardMaterial color={skin} roughness={0.7} />
          </mesh>
        ))}
      </group>
      {/* braços: ombro → cotovelo (manga) → antebraço → mão espalmada no objeto */}
      {[-0.2, 0.2].map((z) => {
        const sh = [sx - 0.02, sy - 0.03];
        const el = elbowOf(sh[0], sh[1], hand[0], hand[1]);
        const sleeve = [sh[0] + (el[0] - sh[0]) * 0.55, sh[1] + (el[1] - sh[1]) * 0.55];
        return (
          <group key={z}>
            <mesh position={[sh[0], sh[1], z]}>
              <sphereGeometry args={[0.065, 10, 8]} />
              <meshStandardMaterial color={shirt} roughness={0.85} />
            </mesh>
            <Seg from={sh} to={sleeve} r0={0.058} r1={0.06} color={shirt} z={z} />
            <Seg from={sleeve} to={el} r0={0.045} r1={0.048} color={skin} z={z} />
            <Seg from={el} to={hand} r0={0.04} r1={0.044} color={skin} z={z} />
            <mesh position={[hand[0] - 0.01, hand[1], z]}>
              <boxGeometry args={[0.035, 0.1, 0.085]} />
              <meshStandardMaterial color={skin} roughness={0.7} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

// Caixote de madeira (corpo empurrado nas aulas de força). Textura desenhada
// por código: tábuas, moldura e travessa diagonal.
function useCrateTexture() {
  return useMemo(() => {
    const size = 512; // desenho em 512, gravado em 1024 px (nítido de perto)
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = size * 2;
    const ctx = canvas.getContext("2d");
    ctx.scale(2, 2);
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
    tex.anisotropy = 16; // a placa de vídeo limita ao máximo que suporta
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
