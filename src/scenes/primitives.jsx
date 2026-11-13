import { useMemo } from "react";
import { Text } from "@react-three/drei";

// Wrapper em torno do <Text> do drei que sempre usa uma fonte local (em /public/fonts),
// em vez de deixar a biblioteca buscar dados de glifos num CDN externo. Isso faz os
// rótulos 3D funcionarem também offline/em redes restritas de escola.
export function Label3D(props) {
  return <Text font="/fonts/label.ttf" {...props} />;
}

// Régua/linha de posição 3D: desenha uma reta com marcações de metro em metro,
// usada em quase todas as aulas de cinemática (posição, deslocamento, velocidade).
export function RulerTrack({ length = 20, start = 0, step = 1, z = 0, highlight = [] }) {
  const marks = useMemo(() => {
    const arr = [];
    for (let i = 0; i <= length; i += step) arr.push(start + i);
    return arr;
  }, [length, start, step]);

  return (
    <group position={[0, 0.01, z]}>
      <mesh position={[length / 2, 0, 0]} receiveShadow>
        <boxGeometry args={[length + 0.4, 0.04, 0.9]} />
        <meshStandardMaterial color="#1f2a4d" metalness={0.3} roughness={0.5} />
      </mesh>
      {marks.map((m, i) => (
        <group key={i} position={[i * step, 0.05, 0]}>
          <mesh>
            <boxGeometry args={[0.04, 0.12, 0.9]} />
            <meshStandardMaterial
              color={highlight.includes(m) ? "#f59e0b" : "#5b6fa8"}
              emissive={highlight.includes(m) ? "#f59e0b" : "#000000"}
              emissiveIntensity={highlight.includes(m) ? 0.6 : 0}
            />
          </mesh>
          <Label3D
            position={[0, 0.3, 0.6]}
            fontSize={0.28}
            color={highlight.includes(m) ? "#f59e0b" : "#aab3cf"}
            anchorX="center"
          >
            {m}
          </Label3D>
        </group>
      ))}
    </group>
  );
}

// Carrinho estilizado (usado em quase todas as cenas de movimento retilíneo).
// Pintura em meshPhysicalMaterial com clearcoat (verniz automotivo), faróis e
// lanternas com emissive para dar um toque "foto-realista" mesmo em geometria simples.
export function Vehicle({ position = [0, 0.4, 0], color = "#3b82f6", scale = 1, rotationY = 0 }) {
  return (
    <group position={position} scale={scale} rotation={[0, rotationY, 0]} castShadow>
      <mesh castShadow position={[0, 0.22, 0]}>
        <boxGeometry args={[1.1, 0.42, 0.62]} />
        <meshPhysicalMaterial
          color={color}
          metalness={0.55}
          roughness={0.32}
          clearcoat={1}
          clearcoatRoughness={0.1}
        />
      </mesh>
      <mesh castShadow position={[-0.08, 0.5, 0]}>
        <boxGeometry args={[0.55, 0.3, 0.56]} />
        <meshPhysicalMaterial
          color={color}
          metalness={0.55}
          roughness={0.28}
          clearcoat={1}
          clearcoatRoughness={0.12}
        />
      </mesh>
      <mesh castShadow position={[-0.08, 0.5, 0]}>
        <boxGeometry args={[0.56, 0.22, 0.42]} />
        <meshPhysicalMaterial
          color="#0b1020"
          metalness={0.1}
          roughness={0.05}
          transmission={0.6}
          thickness={0.2}
        />
      </mesh>
      {/* faróis dianteiros */}
      {[0.22, -0.22].map((zz, i) => (
        <mesh key={`headlight-${i}`} position={[0.54, 0.24, zz]}>
          <boxGeometry args={[0.03, 0.1, 0.14]} />
          <meshStandardMaterial color="#fff8e1" emissive="#ffe9a8" emissiveIntensity={1.4} />
        </mesh>
      ))}
      {/* lanternas traseiras */}
      {[0.22, -0.22].map((zz, i) => (
        <mesh key={`taillight-${i}`} position={[-0.54, 0.24, zz]}>
          <boxGeometry args={[0.03, 0.1, 0.14]} />
          <meshStandardMaterial color="#ff4d4d" emissive="#ff1f1f" emissiveIntensity={1.2} />
        </mesh>
      ))}
      {[
        [0.38, 0.08, 0.33],
        [0.38, 0.08, -0.33],
        [-0.38, 0.08, 0.33],
        [-0.38, 0.08, -0.33],
      ].map((p, i) => (
        <group key={i} position={p}>
          <mesh castShadow rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.16, 0.16, 0.14, 24]} />
            <meshStandardMaterial color="#0a0a0a" roughness={0.75} />
          </mesh>
          <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, p[2] > 0 ? 0.071 : -0.071, 0]}>
            <cylinderGeometry args={[0.09, 0.09, 0.002, 20]} />
            <meshStandardMaterial color="#c6c9d4" metalness={0.9} roughness={0.3} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

// Esfera para experimentos de queda livre / colisões
export function Ball({ position = [0, 1, 0], color = "#f87171", radius = 0.3 }) {
  return (
    <mesh position={position} castShadow receiveShadow>
      <sphereGeometry args={[radius, 48, 48]} />
      <meshPhysicalMaterial color={color} metalness={0.35} roughness={0.25} clearcoat={0.6} clearcoatRoughness={0.25} />
    </mesh>
  );
}

// Seta 3D para representar vetores de força / velocidade / aceleração
export function Arrow3D({ from = [0, 0.5, 0], length = 1, color = "#f59e0b", label }) {
  return (
    <group position={from}>
      <mesh position={[length / 2, 0, 0]} rotation={[0, 0, -Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.05, 0.05, Math.max(length - 0.3, 0.01), 12]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.4} />
      </mesh>
      <mesh position={[length - 0.15, 0, 0]} rotation={[0, 0, -Math.PI / 2]} castShadow>
        <coneGeometry args={[0.14, 0.3, 16]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.4} />
      </mesh>
      {label && (
        <Label3D position={[length / 2, 0.4, 0]} fontSize={0.26} color={color} anchorX="center">
          {label}
        </Label3D>
      )}
    </group>
  );
}
