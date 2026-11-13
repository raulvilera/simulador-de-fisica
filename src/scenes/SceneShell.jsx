import { Suspense, useMemo, useState } from "react";
import * as THREE from "three";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Environment, PerformanceMonitor, useProgress, useTexture } from "@react-three/drei";
import { GroundedSkybox } from "three/addons/objects/GroundedSkybox.js";

// Cenário das aulas de Cinemática: a reta de um autódromo real fotografada em
// 360° (Poly Haven, CC0). A foto é projetada no chão e no horizonte, então os
// objetos 3D ficam "dentro" de um lugar de verdade — custo de GPU quase zero,
// ao contrário dos efeitos de pós-processamento usados antes. A foto já vem
// girada para a reta ficar alinhada com a pista das aulas (eixo X).
const TRACK_PHOTO = "/assets/env/track_4k.jpg";
const TRACK_HDR = "/assets/env/track_1k.hdr";
const SPACE_PHOTO = "/assets/planets/4k_stars_milky_way.jpg";
const SKY_H = 1.1; // altura da câmera da foto, na escala da cena
// Luz do Sol das cenas 3D: mesma altura do Sol da foto, mas vinda do lado da
// câmera, para os objetos aparecerem bem iluminados de frente.
const SUN_DIR = new THREE.Vector3(0.38, 0.8, 0.46);

function TrackBackdrop() {
  const map = useTexture(TRACK_PHOTO);
  const sky = useMemo(() => {
    map.colorSpace = THREE.SRGBColorSpace;
    map.anisotropy = 4;
    const mesh = new GroundedSkybox(map, SKY_H, 160, 96);
    mesh.material.toneMapped = false;
    mesh.material.fog = false;
    mesh.position.y = SKY_H - 0.01;
    mesh.renderOrder = -10;
    return mesh;
  }, [map]);
  return <primitive object={sky} />;
}

// Grão fino de asfalto multiplicado sobre o chão da foto: devolve a nitidez
// que a foto perde quando a câmera chega perto do piso.
function AsphaltGrain() {
  const map = useMemo(() => {
    const size = 256;
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = size;
    const ctx = canvas.getContext("2d");
    const img = ctx.createImageData(size, size);
    let a = 1337;
    const rand = () => ((a = (a * 1664525 + 1013904223) >>> 0) / 4294967296);
    for (let i = 0; i < size * size; i++) {
      const r = rand();
      const v = r < 0.06 ? 150 + rand() * 40 : r > 0.95 ? 255 : 205 + rand() * 50;
      img.data[i * 4] = img.data[i * 4 + 1] = img.data[i * 4 + 2] = v;
      img.data[i * 4 + 3] = 255;
    }
    ctx.putImageData(img, 0, 0);
    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(70, 70);
    tex.anisotropy = 4;
    return tex;
  }, []);
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.002, 0]} renderOrder={-6}>
      <planeGeometry args={[70, 70]} />
      <meshBasicMaterial map={map} blending={THREE.MultiplyBlending} transparent premultipliedAlpha depthWrite={false} toneMapped={false} />
    </mesh>
  );
}

function SpaceBackdrop({ brightness = 1 }) {
  const map = useTexture(SPACE_PHOTO);
  map.colorSpace = THREE.SRGBColorSpace;
  return (
    <mesh rotation={[1.05, 0, 0.4]} renderOrder={-10}>
      <sphereGeometry args={[400, 48, 24]} />
      <meshBasicMaterial
        map={map}
        side={THREE.BackSide}
        depthWrite={false}
        toneMapped={false}
        color={new THREE.Color(brightness, brightness, brightness)}
      />
    </mesh>
  );
}

function Loading() {
  const { active, progress } = useProgress();
  if (!active) return null;
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "grid",
        placeItems: "center",
        color: "#dbe3ff",
        fontSize: "1rem",
        background: "#05070d",
        zIndex: 2,
      }}
    >
      Carregando cenário… {Math.round(progress)}%
    </div>
  );
}

// Casca comum para todas as cenas 3D.
// - Aulas 1-9: autódromo fotográfico + luz HDR do mesmo lugar + sombra do Sol.
// - Aulas 10-20 (space): Via Láctea real ao fundo; a própria cena posiciona o Sol.
// A resolução se ajusta sozinha (PerformanceMonitor) para manter a animação
// fluida mesmo em placas de vídeo integradas antigas.
export default function SceneShell({
  children,
  cameraPosition = [6, 4, 8],
  ground = true,
  controlsTarget = [0, 0.5, 0],
  space = false,
  skyBrightness = 1,
  minDistance = 2,
  fov = 42,
  maxDistance,
}) {
  // No autódromo a câmera fica mais perto do centro da foto (onde a projeção é fiel).
  if (maxDistance == null) maxDistance = space ? 30 : 20;
  const [dpr, setDpr] = useState(1);

  // O painel lateral (340 px) cobre a direita da tela. Nas cenas de astronomia a
  // tela 3D é deslocada meia largura do painel para a esquerda, para o centro
  // da cena ficar no meio da área livre.
  const frame = space
    ? { position: "absolute", top: 0, bottom: 0, left: -170, right: 170 }
    : { position: "absolute", top: 0, bottom: 0, left: 0, right: 340 };

  return (
    <div style={frame}>
      <Loading />
      <Canvas
        shadows={!space}
        dpr={dpr}
        camera={{ position: cameraPosition, fov, near: 0.05, far: 1200 }}
        gl={{
          antialias: true,
          powerPreference: "high-performance",
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: space ? 1.1 : 0.95,
        }}
      >
        <PerformanceMonitor
          onDecline={() => setDpr((d) => Math.max(0.6, d - 0.2))}
          onIncline={() => setDpr((d) => Math.min(window.devicePixelRatio || 1, 1.5, d + 0.2))}
        />
        <color attach="background" args={[space ? "#02030a" : "#8fb4dd"]} />

        {space ? (
          <ambientLight intensity={0.14} />
        ) : (
          <directionalLight
            castShadow
            position={SUN_DIR.clone().multiplyScalar(30).toArray()}
            intensity={2.4}
            color="#fff1d8"
            shadow-mapSize={[1024, 1024]}
            shadow-camera-left={-19}
            shadow-camera-right={19}
            shadow-camera-top={14}
            shadow-camera-bottom={-10}
            shadow-camera-near={1}
            shadow-camera-far={70}
            shadow-bias={-0.0006}
            shadow-normalBias={0.03}
          />
        )}

        <Suspense fallback={null}>
          {space ? (
            <SpaceBackdrop brightness={skyBrightness} />
          ) : (
            <>
              <TrackBackdrop />
              <AsphaltGrain />
              <Environment files={TRACK_HDR} environmentIntensity={0.9} />
              {ground && (
                <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.004, 0]} receiveShadow renderOrder={-5}>
                  <planeGeometry args={[120, 120]} />
                  <shadowMaterial transparent opacity={0.42} depthWrite={false} />
                </mesh>
              )}
            </>
          )}
          {children}
        </Suspense>

        <OrbitControls
          makeDefault
          target={controlsTarget}
          enableDamping
          dampingFactor={0.08}
          minDistance={minDistance}
          maxDistance={maxDistance}
          maxPolarAngle={space ? Math.PI : Math.PI / 2 - 0.06}
        />
      </Canvas>
    </div>
  );
}
