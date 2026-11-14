import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { Billboard, Line, useTexture } from "@react-three/drei";
import { Label3D } from "./primitives.jsx";
import { useConcepts } from "./quantities.jsx";

// Peças reutilizáveis das cenas de Astronomia (Aulas 10 a 20). Tudo é gerado
// por código (sem fotos/texturas baixadas), então funciona offline como as
// cenas de Cinemática.

// Painel lateral — mesmo visual/medidas do painel usado nas Aulas 1 a 9.
export function Panel({ eyebrow, title, children }) {
  return (
    <div className="panel">
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
// Rótulo 3D (nome de astro etc.). Tocar nele oculta o rótulo; o botão 👁 da
// barra da caneta ou do painel mostra de novo.
export function Tag({ position = [0, 0, 0], children, color = "#e5e9f5", size = 0.26, id }) {
  const key = id ?? `tag:${String(children)}`;
  const visible = useConcepts((s) => !s.hidden.has(key));
  if (!visible) return null;
  return (
    <Billboard position={position}>
      <Label3D
        fontSize={size}
        color={color}
        anchorX="center"
        anchorY="middle"
        onClick={(e) => {
          if (e.delta > 6) return; // foi um arrasto da câmera, não um toque
          e.stopPropagation();
          document.body.style.cursor = "";
          useConcepts.getState().hide(key);
        }}
        onPointerOver={() => (document.body.style.cursor = "pointer")}
        onPointerOut={() => (document.body.style.cursor = "")}
      >
        {children}
      </Label3D>
    </Billboard>
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

// Texturas reais dos astros (mapas baseados em imagens da NASA, distribuídos
// pelo Solar System Scope sob CC BY 4.0). Ficam em /public, então funcionam offline.
const TEX = (name) => `/assets/planets/2k_${name}`;
// As aulas identificam os astros pela cor; aqui a cor escolhe a textura real.
const TEXTURE_BY_COLOR = {
  "#9c9c9c": "mercury.jpg",
  "#e0b672": "venus_atmosphere.jpg",
  "#d1603d": "mars.jpg",
  "#d9a066": "jupiter.jpg",
  "#e8d28a": "saturn.jpg",
  "#8fd3dc": "uranus.jpg",
  "#4f6fe0": "neptune.jpg",
  "#cbd5e1": "moon.jpg",
  "#b4442b": "moon.jpg", // Lua avermelhada do eclipse lunar
};

function useSrgbTexture(url) {
  const tex = useTexture(url);
  useLayoutEffect(() => {
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 4;
    tex.needsUpdate = true;
  }, [tex]);
  return tex;
}

// Brilho suave em volta do Sol/estrelas (substitui o "bloom" de pós-processamento,
// que era pesado demais para placas de vídeo integradas).
let glowTexture;
function getGlowTexture() {
  if (glowTexture) return glowTexture;
  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d");
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0, "rgba(255,255,255,1)");
  g.addColorStop(0.22, "rgba(255,255,255,0.85)");
  g.addColorStop(0.4, "rgba(255,255,255,0.28)");
  g.addColorStop(0.7, "rgba(255,255,255,0.07)");
  g.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  glowTexture = new THREE.CanvasTexture(canvas);
  return glowTexture;
}

export function Glow({ scale = 1, color = "#ffc94d", opacity = 0.9 }) {
  return (
    <sprite scale={[scale, scale, 1]} renderOrder={-1}>
      <spriteMaterial
        map={getGlowTexture()}
        color={color}
        transparent
        opacity={opacity}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        toneMapped={false}
      />
    </sprite>
  );
}

// Estrela/Sol: superfície real (granulação solar) + halo + luz pontual que ilumina a cena.
export function Sun({ position = [0, 0, 0], radius = 1, color = "#ffc94d", intensity = 2.8, light = true }) {
  const map = useSrgbTexture(TEX("sun.jpg"));
  const ref = useRef();
  const tint = useMemo(() => new THREE.Color(color).lerp(new THREE.Color("#ffffff"), 0.55).multiplyScalar(1.5), [color]);
  useFrame((_, delta) => {
    if (ref.current) ref.current.rotation.y += delta * 0.03;
  });
  return (
    <group position={position}>
      <mesh ref={ref}>
        <sphereGeometry args={[radius, 48, 32]} />
        <meshBasicMaterial map={map} color={tint} toneMapped={false} />
      </mesh>
      <Glow scale={radius * 5.2} color={color} />
      {light && <pointLight intensity={intensity} decay={0} color="#fff3d6" />}
    </group>
  );
}

// Halo azul da atmosfera, mais forte na borda do planeta (efeito Fresnel).
const ATMOSPHERE = {
  vertexShader: `
    varying vec3 vNormal;
    void main() {
      vNormal = normalize(normalMatrix * normal);
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }`,
  fragmentShader: `
    uniform vec3 glowColor;
    varying vec3 vNormal;
    void main() {
      float i = 0.9 * pow(0.5 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 4.0);
      gl_FragColor = vec4(glowColor, 1.0) * clamp(i, 0.0, 1.0);
    }`,
};

export function Atmosphere({ radius = 1, color = "#5aa8ff" }) {
  const uniforms = useMemo(() => ({ glowColor: { value: new THREE.Color(color) } }), [color]);
  return (
    <mesh scale={1.1}>
      <sphereGeometry args={[radius, 40, 24]} />
      <shaderMaterial
        args={[ATMOSPHERE]}
        uniforms={uniforms}
        side={THREE.BackSide}
        blending={THREE.AdditiveBlending}
        transparent
        depthWrite={false}
      />
    </mesh>
  );
}

// Terra: continentes e oceanos reais, camada de nuvens girando e atmosfera.
export function Earth({ radius = 0.5, ...props }) {
  const map = useSrgbTexture(TEX("earth_daymap.jpg"));
  const clouds = useTexture(TEX("earth_clouds.jpg"));
  const cloudRef = useRef();
  useFrame((_, delta) => {
    if (cloudRef.current) cloudRef.current.rotation.y += delta * 0.02;
  });
  return (
    <group {...props}>
      <mesh>
        <sphereGeometry args={[radius, 64, 40]} />
        <meshStandardMaterial map={map} roughness={0.7} metalness={0.05} />
      </mesh>
      <mesh ref={cloudRef} scale={1.012}>
        <sphereGeometry args={[radius, 48, 32]} />
        <meshStandardMaterial color="#ffffff" alphaMap={clouds} transparent opacity={0.9} depthWrite={false} roughness={1} />
      </mesh>
      <Atmosphere radius={radius} />
    </group>
  );
}

function TexturedBody({ file, radius, tint, emissive, onClick }) {
  const map = useSrgbTexture(TEX(file));
  return (
    <mesh onClick={onClick}>
      <sphereGeometry args={[radius, 48, 32]} />
      <meshStandardMaterial
        map={map}
        color={tint}
        roughness={0.9}
        metalness={0}
        emissive="#ffffff"
        emissiveMap={map}
        emissiveIntensity={emissive}
      />
    </mesh>
  );
}

// Anéis de Saturno com a textura real (faixas e falhas), mapeada do raio interno ao externo.
function SaturnRing({ radius }) {
  const map = useSrgbTexture(TEX("saturn_ring_alpha.png"));
  const geometry = useMemo(() => {
    const inner = radius * 1.28;
    const outer = radius * 2.3;
    const geo = new THREE.RingGeometry(inner, outer, 96, 1);
    const pos = geo.attributes.position;
    const uv = geo.attributes.uv;
    const v = new THREE.Vector3();
    for (let i = 0; i < pos.count; i++) {
      v.fromBufferAttribute(pos, i);
      uv.setXY(i, (v.length() - inner) / (outer - inner), 0.5);
    }
    return geo;
  }, [radius]);
  return (
    <mesh geometry={geometry} rotation={[Math.PI / 2 - 0.35, 0, 0]}>
      <meshBasicMaterial map={map} side={THREE.DoubleSide} transparent depthWrite={false} color="#e9dcc0" />
    </mesh>
  );
}

// Planeta genérico. Astros conhecidos (pela cor usada nas aulas) ganham a
// textura real; os demais ficam com cor lisa. `ring` desenha os anéis.
export function Planet({ radius = 0.3, color = "#9aa3b8", bands, ring, emissive = 0, onClick, children }) {
  const file = TEXTURE_BY_COLOR[String(color).toLowerCase()];
  const fallbackMap = useBandTexture(file ? null : bands);
  return (
    <group>
      {file ? (
        <TexturedBody
          file={file}
          radius={radius}
          tint={color === "#b4442b" ? "#ff7a55" : "#ffffff"}
          emissive={emissive * 0.6}
          onClick={onClick}
        />
      ) : (
        <mesh onClick={onClick}>
          <sphereGeometry args={[radius, 48, 32]} />
          <meshStandardMaterial
            color={fallbackMap ? "#ffffff" : color}
            map={fallbackMap}
            roughness={0.55}
            metalness={0.1}
            emissive={color}
            emissiveIntensity={emissive}
          />
        </mesh>
      )}
      {ring && <SaturnRing radius={radius} />}
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
