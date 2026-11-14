import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { useThrottled } from "./useThrottled.js";

// Pessoa em pé (observador), virada para +Z. Altura ≈ 1,7 m; olhos em y ≈ 1,6.
export const EYE_Y = 1.6;
export function StandingPerson({ position = [0, 0, 0], rotationY = 0, shirt = "#facc15", skin = "#c98d63", pants = "#334155", hair = "#2a1d14" }) {
  const mat = (c) => <meshStandardMaterial color={c} roughness={0.7} />;
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      {/* pernas */}
      {[-0.1, 0.1].map((x) => (
        <mesh key={x} position={[x, 0.42, 0]} castShadow>
          <capsuleGeometry args={[0.075, 0.68, 4, 10]} />
          {mat(pants)}
        </mesh>
      ))}
      {/* tronco */}
      <mesh position={[0, 1.13, 0]} castShadow>
        <capsuleGeometry args={[0.19, 0.42, 6, 14]} />
        {mat(shirt)}
      </mesh>
      {/* braços */}
      {[-0.27, 0.27].map((x) => (
        <mesh key={x} position={[x, 1.1, 0]} rotation={[0, 0, x > 0 ? 0.08 : -0.08]} castShadow>
          <capsuleGeometry args={[0.055, 0.5, 4, 10]} />
          {mat(shirt)}
        </mesh>
      ))}
      {/* cabeça e cabelo */}
      <mesh position={[0, 1.58, 0]} castShadow>
        <sphereGeometry args={[0.15, 20, 16]} />
        {mat(skin)}
      </mesh>
      <mesh position={[0, 1.65, -0.03]} scale={[1, 0.7, 1]}>
        <sphereGeometry args={[0.155, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
        {mat(hair)}
      </mesh>
      {/* olhos: mostram para onde a pessoa está olhando (+Z) */}
      {[-0.055, 0.055].map((x) => (
        <mesh key={x} position={[x, 1.6, 0.135]}>
          <sphereGeometry args={[0.022, 8, 8]} />
          <meshBasicMaterial color="#111827" />
        </mesh>
      ))}
    </group>
  );
}

const ARC_N = 40;

// Linha de visada do olho do observador até um carro + arco no chão com o
// ângulo entre essa linha e o sentido do movimento (+x). Tudo é atualizado a
// cada quadro; `onAngle` recebe { deg, mid } ~10x por segundo para as etiquetas.
export function SightAngle({ getEye, getTarget, color, radius = 1.3, onAngle, groundY = 0.03 }) {
  const { sight, arc } = useMemo(() => {
    const sGeo = new THREE.BufferGeometry().setAttribute("position", new THREE.Float32BufferAttribute(new Float32Array(6), 3));
    const sMat = new THREE.LineDashedMaterial({ color, dashSize: 0.25, gapSize: 0.12, transparent: true, opacity: 0.95 });
    const sight = new THREE.Line(sGeo, sMat);
    const aGeo = new THREE.BufferGeometry().setAttribute(
      "position",
      new THREE.Float32BufferAttribute(new Float32Array((ARC_N + 1) * 3), 3),
    );
    const arc = new THREE.Line(aGeo, new THREE.LineBasicMaterial({ color, linewidth: 2 }));
    sight.frustumCulled = false;
    arc.frustumCulled = false;
    return { sight, arc };
  }, [color]);
  const report = useThrottled(onAngle, 100);

  useFrame(() => {
    const e = getEye();
    const t = getTarget();
    const sp = sight.geometry.attributes.position;
    sp.setXYZ(0, e[0], e[1], e[2]);
    sp.setXYZ(1, t[0], t[1], t[2]);
    sp.needsUpdate = true;
    sight.computeLineDistances();

    // ângulo no plano do chão, medido a partir do sentido +x (movimento)
    const phi = Math.atan2(t[2] - e[2], t[0] - e[0]);
    const ap = arc.geometry.attributes.position;
    for (let i = 0; i <= ARC_N; i++) {
      const a = (phi * i) / ARC_N;
      ap.setXYZ(i, e[0] + Math.cos(a) * radius, groundY, e[2] + Math.sin(a) * radius);
    }
    ap.needsUpdate = true;
    const half = phi / 2;
    report({
      deg: Math.abs((phi * 180) / Math.PI),
      dx: t[0] - e[0],
      mid: [e[0] + Math.cos(half) * (radius + 0.75), 0.35, e[2] + Math.sin(half) * (radius + 0.75)],
    });
  });

  return (
    <>
      <primitive object={sight} />
      <primitive object={arc} />
    </>
  );
}

// Eixo de referência no chão, saindo do observador no sentido do movimento (+x).
export function ReferenceAxis({ getOrigin, length = 3, color = "#facc15", groundY = 0.03 }) {
  const ref = useRef();
  useFrame(() => {
    const o = getOrigin();
    ref.current?.position.set(o[0], groundY, o[2]);
  });
  return (
    <group ref={ref}>
      <mesh position={[length / 2, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[length, 0.06]} />
        <meshBasicMaterial color={color} toneMapped={false} />
      </mesh>
      <mesh position={[length + 0.12, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.2, 3]} />
        <meshBasicMaterial color={color} toneMapped={false} />
      </mesh>
      {/* origem do referencial */}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.16, 0.24, 24]} />
        <meshBasicMaterial color={color} toneMapped={false} />
      </mesh>
    </group>
  );
}
