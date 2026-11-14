import { Suspense, useMemo, useState } from "react";
import * as THREE from "three";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Environment, PerformanceMonitor, useProgress, useTexture } from "@react-three/drei";
import { SkyDome, PeriodSky, TrackSetting, PisaSetting, YardSetting, LabSetting } from "./settings.jsx";

// Luz HDR do autódromo (céu limpo de dia): serve de iluminação ambiente para
// todos os cenários ao ar livre. O céu e o chão de cada aula ficam em settings.jsx.
const TRACK_HDR = "/assets/env/track_1k.hdr";
const SPACE_PHOTO = "/assets/planets/4k_stars_milky_way.jpg";
// Luz do Sol das cenas 3D: mesma altura do Sol da foto, mas vinda do lado da
// câmera, para os objetos aparecerem bem iluminados de frente.
const SUN_DIR = new THREE.Vector3(0.38, 0.8, 0.46);

const SETTINGS = { track: TrackSetting, pisa: PisaSetting, yard: YardSetting, lab: LabSetting };

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
// - Aulas 1-9: cenário 3D do tema da aula (prop `setting`) + luz HDR + sombra do Sol.
// - Aulas 10-20 (space): Via Láctea real ao fundo; a própria cena posiciona o Sol.
// A resolução se ajusta sozinha (PerformanceMonitor) para manter a animação
// fluida mesmo em placas de vídeo integradas antigas.
export default function SceneShell({
  children,
  cameraPosition = [6, 4, 8],
  setting = "track",
  controlsTarget = [0, 0.5, 0],
  space = false,
  skyBrightness = 1,
  minDistance = 0.6,
  fov = 42,
  maxDistance,
}) {
  // No autódromo a câmera fica mais perto do centro da foto (onde a projeção é fiel).
  if (maxDistance == null) maxDistance = space ? 30 : 20;
  // Começa na resolução nativa da tela; só reduz se a placa de vídeo não der conta.
  // No celular a tela é pequena e a GPU é mais fraca: limita a resolução para manter
  // a animação fluida e economizar bateria.
  // Para a imagem continuar nítida ao aproximar (zoom), a resolução nunca fica
  // abaixo da nativa da tela (mínimo 1) e pode ir até 2× nas telas de alta densidade.
  const isSmall = window.matchMedia?.("(max-width: 820px), (max-height: 520px)").matches;
  const maxDpr = Math.max(1, Math.min(window.devicePixelRatio || 1, isSmall ? 1.75 : 2));
  const [dpr, setDpr] = useState(maxDpr);
  // Posição inicial da câmera e alvo: usados SÓ na montagem. Antes, cada
  // atualização dos valores da cena (várias por segundo) reaplicava a posição
  // inicial e desfazia o zoom do professor.
  const cameraOpts = useMemo(
    () => ({ position: cameraPosition, fov, near: 0.02, far: 1200 }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );
  const initialTarget = useMemo(
    () => controlsTarget,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );
  const Setting = SETTINGS[setting] ?? TrackSetting;

  // A área da cena 3D é definida em LessonLayout.css (.scene-frame):
  // - computador/tablet deitado: painel lateral à direita; nas cenas de astronomia a
  //   tela 3D é deslocada meia largura do painel para a esquerda, para o centro da
  //   cena ficar no meio da área livre;
  // - celular em pé: cena em cima e painel como gaveta embaixo.
  return (
    <div className={`scene-frame${space ? " scene-frame--space" : ""}`}>
      <Loading />
      <Canvas
        shadows={!space}
        dpr={dpr}
        camera={cameraOpts}
        gl={{
          antialias: true,
          powerPreference: "high-performance",
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: space ? 1.1 : 0.95,
        }}
      >
        <PerformanceMonitor
          onDecline={() => setDpr((d) => Math.max(1, d - 0.1))}
          onIncline={() => setDpr((d) => Math.min(maxDpr, d + 0.1))}
        />
        <color attach="background" args={[space ? "#02030a" : setting === "lab" ? "#e9e4d6" : "#8fb4dd"]} />

        {space ? (
          <ambientLight intensity={0.14} />
        ) : (
          <directionalLight
            castShadow
            position={SUN_DIR.clone().multiplyScalar(30).toArray()}
            intensity={2.4}
            color="#fff1d8"
            shadow-mapSize={[2048, 2048]}
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
              {setting === "pisa" ? <PeriodSky /> : setting !== "lab" && <SkyDome />}
              <Setting />
              <Environment files={TRACK_HDR} environmentIntensity={0.8} />
              {/* sombra do Sol sobre o chão do cenário */}
              <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.004, 0]} receiveShadow renderOrder={-5}>
                <planeGeometry args={[120, 120]} />
                <shadowMaterial transparent opacity={0.45} depthWrite={false} polygonOffset polygonOffsetFactor={-4} polygonOffsetUnits={-4} />
              </mesh>
            </>
          )}
          {children}
        </Suspense>

        <OrbitControls
          makeDefault
          target={initialTarget}
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
