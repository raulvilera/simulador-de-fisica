import { Suspense } from "react";
import * as THREE from "three";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Environment, Lightformer, ContactShadows, Sky } from "@react-three/drei";
import { EffectComposer, Bloom, Vignette, SSAO, SMAA } from "@react-three/postprocessing";
import { useAsphaltTextures } from "./textures.js";

function Ground() {
  const { colorMap, roughnessMap } = useAsphaltTextures({ repeat: [16, 16] });
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
      <planeGeometry args={[90, 90]} />
      <meshPhysicalMaterial
        map={colorMap}
        roughnessMap={roughnessMap}
        roughness={1}
        metalness={0.05}
        clearcoat={0.15}
        clearcoatRoughness={0.6}
      />
    </mesh>
  );
}

// Casca comum para todas as cenas 3D: céu, iluminação cinematográfica, piso com
// textura de asfalto gerada por código, sombras de contato e um pacote de
// pós-processamento (SSAO + bloom + anti-serrilhado SMAA) para dar uma aparência
// bem mais "foto-realista" em todas as aulas, sem baixar nenhum asset da
// internet (tudo é gerado proceduralmente, então funciona offline também).
export default function SceneShell({
  children,
  cameraPosition = [6, 4, 8],
  ground = true,
  fog = "#0b1020",
  controlsTarget = [0, 0.5, 0],
  sunPosition = [60, 35, -40],
}) {
  return (
    <Canvas
      shadows="soft"
      dpr={[1, 2]}
      camera={{ position: cameraPosition, fov: 42 }}
      gl={{
        antialias: true,
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: 1.15,
      }}
    >
      <fog attach="fog" args={[fog, 14, 46]} />

      <ambientLight intensity={0.3} />
      <directionalLight
        castShadow
        position={[8, 14, 6]}
        intensity={2.6}
        color="#fff4e0"
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-14}
        shadow-camera-right={14}
        shadow-camera-top={14}
        shadow-camera-bottom={-14}
        shadow-bias={-0.0003}
      />
      <pointLight position={[-8, 5, -6]} intensity={0.5} color="#7dd3fc" />
      <pointLight position={[6, 3, 8]} intensity={0.3} color="#f59e0b" />

      <Suspense fallback={null}>
        {/* Céu procedural (shader do drei, sem textura externa) para dar horizonte
            e atmosfera, em vez de um fundo de cor chapada. */}
        <Sky
          sunPosition={sunPosition}
          turbidity={6}
          rayleigh={1.2}
          mieCoefficient={0.01}
          mieDirectionalG={0.9}
        />

        {/* Ambiente de iluminação gerado proceduralmente (sem depender de HDRs
            externos) para reflexos realistas em metais e vidro, offline. */}
        <Environment resolution={256}>
          <Lightformer intensity={2.2} color="#ffffff" position={[0, 6, -9]} scale={[10, 10, 1]} />
          <Lightformer intensity={1.3} color="#7dd3fc" position={[-6, 3, 4]} scale={[6, 6, 1]} />
          <Lightformer intensity={1.3} color="#f59e0b" position={[6, 2, 4]} scale={[6, 6, 1]} />
          <Lightformer intensity={0.7} color="#ffffff" position={[0, -4, 4]} scale={[14, 4, 1]} />
        </Environment>

        {ground && <Ground />}
        {ground && (
          <ContactShadows position={[0, 0.012, 0]} opacity={0.7} scale={32} blur={1.6} far={10} />
        )}
        {children}
      </Suspense>

      <OrbitControls
        target={controlsTarget}
        enableDamping
        dampingFactor={0.08}
        minDistance={2}
        maxDistance={30}
        maxPolarAngle={Math.PI / 2 - 0.02}
      />

      <EffectComposer multisampling={0} enableNormalPass>
        <SSAO radius={0.12} intensity={10} luminanceInfluence={0.5} bias={0.08} />
        <Bloom intensity={0.4} luminanceThreshold={0.65} luminanceSmoothing={0.2} mipmapBlur />
        <Vignette eskil={false} offset={0.2} darkness={0.55} />
        <SMAA />
      </EffectComposer>
    </Canvas>
  );
}
