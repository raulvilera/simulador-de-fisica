import { useMemo } from "react";
import * as THREE from "three";
import { useTexture } from "@react-three/drei";

// Cenários das aulas de Cinemática. Cada aula acontece no lugar que faz sentido
// para o tema: autódromo (carros), Piazza dei Miracoli (Torre de Pisa), pátio de
// um galpão (pessoas empurrando um caixote) e bancada da sala (carrinhos de fricção).
//
// O chão e as construções são geometria 3D de verdade, com texturas desenhadas
// por código — por isso ficam nítidos de perto e não esticam como uma foto
// projetada no piso. A foto 360° é usada só onde ela é fiel: no céu e no horizonte.

const SKY_PHOTO = "/assets/env/track_4k.jpg";
const FAR = 1000;

// ---------------------------------------------------------------------------
// Utilitários de textura
function lcg(seed) {
  let a = seed >>> 0;
  return () => ((a = (a * 1664525 + 1013904223) >>> 0) / 4294967296);
}

function finish(canvas, repeatX = 1, repeatY = 1) {
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeatX, repeatY);
  tex.anisotropy = 8;
  return tex;
}

function makeCanvas(w, h = w) {
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  return [canvas, canvas.getContext("2d")];
}

// Ruído granulado em torno de uma cor base, com manchas suaves por cima.
function grainCanvas({ size = 512, base, spread, seed, speckle = 0, speckleGain = 40, blotches = 0, blotchAlpha = 0.08 }) {
  const [canvas, ctx] = makeCanvas(size);
  const rand = lcg(seed);
  const img = ctx.createImageData(size, size);
  for (let i = 0; i < size * size; i++) {
    const n = (rand() - 0.5) * 2 * spread + (rand() < speckle ? speckleGain : 0);
    img.data[i * 4] = base[0] + n;
    img.data[i * 4 + 1] = base[1] + n;
    img.data[i * 4 + 2] = base[2] + n * 0.9;
    img.data[i * 4 + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
  // manchas (repetidas nas bordas para a textura emendar sem costura)
  for (let i = 0; i < blotches; i++) {
    const x = rand() * size;
    const y = rand() * size;
    const r = size * (0.06 + rand() * 0.14);
    const dark = rand() < 0.5;
    for (const ox of [-size, 0, size]) {
      for (const oy of [-size, 0, size]) {
        const g = ctx.createRadialGradient(x + ox, y + oy, 0, x + ox, y + oy, r);
        g.addColorStop(0, dark ? `rgba(0,0,0,${blotchAlpha})` : `rgba(255,255,255,${blotchAlpha})`);
        g.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = g;
        ctx.fillRect(x + ox - r, y + oy - r, r * 2, r * 2);
      }
    }
  }
  return [canvas, ctx, rand];
}

// Faixa do chão: retângulo horizontal entre z0 e z1, ao longo do eixo X.
// O chão usa material sem iluminação (cor fiel à textura e custo mínimo de GPU);
// a sombra do Sol é desenhada por cima por um plano de sombra na SceneShell.
function Strip({ z0, z1, length = FAR, y = 0, children }) {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, y, (z0 + z1) / 2]}>
      <planeGeometry args={[length, Math.abs(z1 - z0)]} />
      {children}
    </mesh>
  );
}

// ---------------------------------------------------------------------------
// Céu: a foto 360° numa esfera bem distante (sem projeção no chão, então não
// há distorção). O chão 3D de cada cenário cobre a metade de baixo da foto.
export function SkyDome() {
  const map = useTexture(SKY_PHOTO);
  const geometry = useMemo(() => {
    const g = new THREE.SphereGeometry(600, 64, 32);
    g.scale(1, 1, -1);
    return g;
  }, []);
  map.colorSpace = THREE.SRGBColorSpace;
  return (
    <mesh geometry={geometry} renderOrder={-10}>
      <meshBasicMaterial map={map} depthWrite={false} toneMapped={false} fog={false} />
    </mesh>
  );
}

// Céu de Pisa (~1590): desenhado por código — degradê azul e nuvens de verão —
// para não aparecer nada moderno no horizonte (a foto 360° é de um autódromo).
export function PeriodSky() {
  const map = useMemo(() => {
    const [canvas, ctx] = makeCanvas(2048, 1024);
    const g = ctx.createLinearGradient(0, 0, 0, 1024);
    g.addColorStop(0, "#3f78c4");
    g.addColorStop(0.32, "#6fa0db");
    g.addColorStop(0.48, "#b9d3ea");
    g.addColorStop(0.5, "#d8e4ea");
    g.addColorStop(1, "#c9d6d2");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 2048, 1024);
    // nuvens: aglomerados de "bolhas" macias, acima do horizonte
    const rand = lcg(1590);
    for (let c = 0; c < 26; c++) {
      const cx = rand() * 2048;
      const cy = 170 + rand() * 300;
      const w = 90 + rand() * 220;
      for (let i = 0; i < 18; i++) {
        const x = cx + (rand() - 0.5) * w;
        const y = cy + (rand() - 0.5) * w * 0.18;
        const rr = 18 + rand() * w * 0.22;
        for (const ox of [-2048, 0, 2048]) {
          const gr = ctx.createRadialGradient(x + ox, y, 0, x + ox, y, rr);
          gr.addColorStop(0, "rgba(255,255,255,0.55)");
          gr.addColorStop(0.6, "rgba(250,252,255,0.25)");
          gr.addColorStop(1, "rgba(255,255,255,0)");
          ctx.fillStyle = gr;
          ctx.fillRect(x + ox - rr, y - rr, rr * 2, rr * 2);
        }
      }
    }
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.wrapS = THREE.RepeatWrapping;
    return tex;
  }, []);
  const geometry = useMemo(() => {
    const g = new THREE.SphereGeometry(600, 48, 24);
    g.scale(1, 1, -1);
    return g;
  }, []);
  return (
    <mesh geometry={geometry} renderOrder={-10}>
      <meshBasicMaterial map={map} depthWrite={false} toneMapped={false} fog={false} />
    </mesh>
  );
}

// Árvores (copa + tronco) em duas chamadas de desenho, não importa quantas sejam.
function Trees({ spots, cypress = false }) {
  const [trunks, crowns] = useMemo(() => {
    const dummy = new THREE.Object3D();
    const color = new THREE.Color();
    const rand = lcg(7);
    const trunkGeo = new THREE.CylinderGeometry(0.5, 0.6, 1, 6);
    const crownGeo = cypress ? new THREE.ConeGeometry(0.5, 1, 8) : new THREE.IcosahedronGeometry(0.5, 1);
    const trunks = new THREE.InstancedMesh(trunkGeo, new THREE.MeshLambertMaterial({ color: "#5b4632" }), spots.length);
    const crowns = new THREE.InstancedMesh(crownGeo, new THREE.MeshLambertMaterial({ color: "#ffffff" }), spots.length);
    spots.forEach(([x, z, h], i) => {
      const trunkH = cypress ? h * 0.12 : h * 0.4;
      dummy.position.set(x, trunkH / 2, z);
      dummy.scale.set(h * 0.07, trunkH, h * 0.07);
      dummy.rotation.set(0, 0, 0);
      dummy.updateMatrix();
      trunks.setMatrixAt(i, dummy.matrix);
      const crownH = h - trunkH;
      dummy.position.set(x, trunkH + crownH / 2, z);
      dummy.scale.set(cypress ? h * 0.28 : h * 0.8, crownH * (cypress ? 1 : 1.15), cypress ? h * 0.28 : h * 0.8);
      dummy.rotation.set(0, rand() * 6, 0);
      dummy.updateMatrix();
      crowns.setMatrixAt(i, dummy.matrix);
      const tone = 0.75 + rand() * 0.35;
      crowns.setColorAt(i, cypress ? color.setRGB(0.1 * tone, 0.24 * tone, 0.12 * tone) : color.setRGB(0.2 * tone, 0.4 * tone, 0.14 * tone));
    });
    crowns.instanceColor.needsUpdate = true;
    return [trunks, crowns];
  }, [spots, cypress]);
  return (
    <>
      <primitive object={trunks} />
      <primitive object={crowns} />
    </>
  );
}

// ---------------------------------------------------------------------------
// AUTÓDROMO — reta de corrida: asfalto, linhas de borda, zebras, grama,
// guard-rail, barreira de pneus e arquibancada ao fundo.
function useTrackTextures() {
  return useMemo(() => {
    const [asphalt] = grainCanvas({ base: [70, 71, 75], spread: 13, seed: 11, speckle: 0.05, speckleGain: 34, blotches: 26, blotchAlpha: 0.06 });
    const [grass, gctx, rand] = grainCanvas({ base: [84, 116, 52], spread: 15, seed: 23, speckle: 0.12, speckleGain: 22, blotches: 40, blotchAlpha: 0.09 });
    // fios de capim
    for (let i = 0; i < 2600; i++) {
      const x = rand() * 512;
      const y = rand() * 512;
      gctx.strokeStyle = rand() < 0.5 ? "rgba(140,170,70,0.35)" : "rgba(40,70,25,0.35)";
      gctx.beginPath();
      gctx.moveTo(x, y);
      gctx.lineTo(x + (rand() - 0.5) * 5, y - 3 - rand() * 6);
      gctx.stroke();
    }
    // zebra: vermelho / branco
    const [kerb, kctx] = makeCanvas(256, 64);
    kctx.fillStyle = "#e9e7e1";
    kctx.fillRect(0, 0, 256, 64);
    kctx.fillStyle = "#c8261f";
    kctx.fillRect(0, 0, 128, 64);
    const krand = lcg(5);
    for (let i = 0; i < 900; i++) {
      kctx.fillStyle = `rgba(0,0,0,${0.03 + krand() * 0.08})`;
      kctx.fillRect(krand() * 256, krand() * 64, 2 + krand() * 5, 1 + krand() * 2);
    }
    // pilha de pneus
    const [tyres, tctx] = makeCanvas(128, 128);
    tctx.fillStyle = "#17181a";
    tctx.fillRect(0, 0, 128, 128);
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 3; col++) {
        const cx = col * 44 + (row % 2 ? 22 : 0);
        const cy = row * 43 + 21;
        for (const ox of [0, 132]) {
          tctx.fillStyle = "#26282b";
          tctx.beginPath();
          tctx.ellipse(cx + ox - 0, cy, 21, 20, 0, 0, Math.PI * 2);
          tctx.fill();
          tctx.fillStyle = "#0b0b0c";
          tctx.beginPath();
          tctx.ellipse(cx + ox, cy, 10, 9, 0, 0, Math.PI * 2);
          tctx.fill();
        }
      }
    }
    return {
      asphalt: finish(asphalt, FAR / 4, 9 / 4),
      shoulder: finish(asphalt, FAR / 4, 0.1),
      grass: finish(grass, FAR / 5, FAR / 10),
      kerb: finish(kerb, FAR / 3, 1),
      tyres: finish(tyres, 60, 1),
    };
  }, []);
}

function Grandstand({ x, z }) {
  const steps = 7;
  return (
    <group position={[x, 0, z]}>
      {Array.from({ length: steps }, (_, i) => (
        <mesh key={i} position={[0, 0.6 + i * 0.55, -i * 0.9]}>
          <boxGeometry args={[34, 0.5, 0.95]} />
          <meshLambertMaterial color={i % 2 ? "#9aa3ad" : "#7f8994"} />
        </mesh>
      ))}
      <mesh position={[0, 2.2, -steps * 0.9 - 0.2]}>
        <boxGeometry args={[34, 7.4, 0.3]} />
        <meshLambertMaterial color="#5d6670" />
      </mesh>
      <mesh position={[0, 6.2, -3.2]} rotation={[0.12, 0, 0]}>
        <boxGeometry args={[35, 0.18, 7.4]} />
        <meshLambertMaterial color="#d7dbe0" />
      </mesh>
      {[-16.5, -8.2, 0, 8.2, 16.5].map((px) => (
        <mesh key={px} position={[px, 3.1, -6.4]}>
          <boxGeometry args={[0.25, 6.2, 0.25]} />
          <meshLambertMaterial color="#4a525b" />
        </mesh>
      ))}
    </group>
  );
}

const TRACK_TREES = (() => {
  const rand = lcg(31);
  const spots = [];
  for (let i = 0; i < 46; i++) spots.push([-190 + rand() * 380, -34 - rand() * 46, 5 + rand() * 5]);
  for (let i = 0; i < 16; i++) spots.push([-160 + rand() * 320, 34 + rand() * 30, 5 + rand() * 4]);
  return spots;
})();

export function TrackSetting() {
  const tex = useTrackTextures();
  const posts = useMemo(() => {
    const dummy = new THREE.Object3D();
    const mesh = new THREE.InstancedMesh(new THREE.BoxGeometry(0.1, 0.8, 0.1), new THREE.MeshLambertMaterial({ color: "#6f757c" }), 120);
    for (let i = 0; i < 120; i++) {
      dummy.position.set(-238 + i * 4, 0.4, -9.12);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }
    return mesh;
  }, []);
  return (
    <>
      <fog attach="fog" args={["#8e9a86", 70, 520]} />
      {/* pista */}
      <Strip z0={-4.5} z1={4.5}>
        <meshBasicMaterial map={tex.asphalt} toneMapped={false} />
      </Strip>
      {[-1, 1].map((s) => (
        <group key={s}>
          <Strip z0={s * 4.5} z1={s * 4.66}>
            <meshBasicMaterial color="#dcdcd6" toneMapped={false} />
          </Strip>
          <Strip z0={s * 4.66} z1={s * 5}>
            <meshBasicMaterial map={tex.shoulder} toneMapped={false} />
          </Strip>
          <Strip z0={s * 5} z1={s * 5.9}>
            <meshBasicMaterial map={tex.kerb} toneMapped={false} />
          </Strip>
          <Strip z0={s * 5.9} z1={s * FAR * 0.5}>
            <meshBasicMaterial map={tex.grass} toneMapped={false} />
          </Strip>
        </group>
      ))}
      {/* guard-rail do lado de fora */}
      <primitive object={posts} />
      {[0.42, 0.72].map((y) => (
        <mesh key={y} position={[0, y, -9]}>
          <boxGeometry args={[480, 0.2, 0.05]} />
          <meshStandardMaterial color="#aab0b6" metalness={0.75} roughness={0.42} />
        </mesh>
      ))}
      {/* barreira de pneus + muro */}
      <mesh position={[0, 0.5, -13]}>
        <boxGeometry args={[180, 1, 0.9]} />
        <meshLambertMaterial map={tex.tyres} />
      </mesh>
      <mesh position={[0, 0.75, -13.8]}>
        <boxGeometry args={[260, 1.5, 0.3]} />
        <meshLambertMaterial color="#c9ccd0" />
      </mesh>
      <Grandstand x={-24} z={-24} />
      <Grandstand x={22} z={-24} />
      <Trees spots={TRACK_TREES} />
    </>
  );
}

// ---------------------------------------------------------------------------
// PISA — Piazza dei Miracoli: gramado, calçamento de pedra, a Catedral (Duomo),
// o Batistério, a muralha medieval e as casas de telhado de barro da cidade.
export function useMarbleTexture() {
  return useMemo(() => {
    const [canvas, ctx, rand] = grainCanvas({ size: 512, base: [232, 226, 212], spread: 7, seed: 41, blotches: 18, blotchAlpha: 0.04 });
    // faixas horizontais de mármore cinza, típicas do românico pisano
    for (let y = 0; y < 512; y += 32) {
      ctx.fillStyle = "rgba(96,104,112,0.34)";
      ctx.fillRect(0, y, 512, 5);
    }
    // arcadas cegas na parte de baixo e galeria de janelas em cima
    const arch = (cx, top, w, h, fill) => {
      ctx.fillStyle = fill;
      ctx.beginPath();
      ctx.moveTo(cx - w / 2, top + h);
      ctx.lineTo(cx - w / 2, top + w / 2);
      ctx.arc(cx, top + w / 2, w / 2, Math.PI, 0);
      ctx.lineTo(cx + w / 2, top + h);
      ctx.closePath();
      ctx.fill();
    };
    for (let i = 0; i < 8; i++) {
      const cx = 32 + i * 64;
      arch(cx, 300, 46, 200, "rgba(120,112,98,0.42)");
      arch(cx, 310, 34, 190, "rgba(214,207,192,0.9)");
      arch(cx, 120, 16, 60, "rgba(52,48,44,0.8)");
    }
    void rand;
    return finish(canvas);
  }, []);
}

function useHouseTexture() {
  return useMemo(() => {
    const [canvas, ctx, rand] = grainCanvas({ size: 256, base: [226, 212, 186], spread: 9, seed: 53, blotches: 10, blotchAlpha: 0.05 });
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 3; col++) {
        const x = 30 + col * 78;
        const y = 26 + row * 78;
        ctx.fillStyle = "#5a3d26"; // postigos de madeira
        ctx.fillRect(x, y, 40, 54);
        ctx.fillStyle = "rgba(20,24,28,0.85)";
        ctx.fillRect(x + 8, y + 4, 24, 46);
        ctx.fillStyle = "rgba(255,255,255,0.35)";
        ctx.fillRect(x - 3, y + 54, 46, 4);
      }
    }
    void rand;
    return finish(canvas);
  }, []);
}

const PISA_HOUSES = (() => {
  const rand = lcg(77);
  const list = [];
  const row = (x0, x1, z0, z1, n) => {
    for (let i = 0; i < n; i++) {
      const t = (i + rand() * 0.6) / n;
      list.push({
        x: x0 + (x1 - x0) * t,
        z: z0 + (z1 - z0) * t + (rand() - 0.5) * 2,
        w: 2.4 + rand() * 1.8,
        d: 2.4 + rand() * 1.6,
        h: 1.8 + rand() * 1.6,
        rot: (Math.abs(x1 - x0) > Math.abs(z1 - z0) ? 0 : Math.PI / 2) + (rand() - 0.5) * 0.12,
      });
    }
  };
  // sul da praça (atrás da câmera), leste (atrás da torre) e além da muralha, ao norte
  row(-70, 60, 30, 30, 34);
  row(-70, 60, 36, 37, 30);
  row(-70, 60, 43, 44, 26);
  row(27, 27, 28, -40, 20);
  row(33, 34, 30, -44, 18);
  row(40, 41, 34, -48, 16);
  row(-80, 50, -38, -38, 30);
  row(-80, 50, -45, -46, 26);
  row(-66, -66, -30, 28, 14);
  row(-73, -73, -34, 32, 12);
  return list;
})();

function Houses() {
  const wall = useHouseTexture();
  const [walls, roofs] = useMemo(() => {
    const dummy = new THREE.Object3D();
    const color = new THREE.Color();
    const rand = lcg(91);
    const tones = ["#f1dfb6", "#e8c996", "#f3e7cf", "#e2b48a", "#efd3a4", "#f6ead8"];
    const n = PISA_HOUSES.length;
    const walls = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshLambertMaterial({ map: wall }), n);
    const roofGeo = new THREE.ConeGeometry(0.72, 1, 4);
    roofGeo.rotateY(Math.PI / 4);
    const roofs = new THREE.InstancedMesh(roofGeo, new THREE.MeshLambertMaterial({ color: "#ffffff" }), n);
    PISA_HOUSES.forEach((h, i) => {
      dummy.rotation.set(0, h.rot, 0);
      dummy.position.set(h.x, h.h / 2, h.z);
      dummy.scale.set(h.w, h.h, h.d);
      dummy.updateMatrix();
      walls.setMatrixAt(i, dummy.matrix);
      walls.setColorAt(i, color.set(tones[Math.floor(rand() * tones.length)]));
      dummy.position.set(h.x, h.h + 0.3, h.z);
      dummy.scale.set(h.w * 1.08, 0.6, h.d * 1.08);
      dummy.updateMatrix();
      roofs.setMatrixAt(i, dummy.matrix);
      const t = 0.85 + rand() * 0.3;
      roofs.setColorAt(i, color.setRGB(0.66 * t, 0.3 * t, 0.17 * t));
    });
    walls.instanceColor.needsUpdate = true;
    roofs.instanceColor.needsUpdate = true;
    return [walls, roofs];
  }, [wall]);
  return (
    <>
      <primitive object={walls} />
      <primitive object={roofs} />
    </>
  );
}

// Telhado de duas águas ao longo do eixo X.
function GableRoof({ length, width, rise, position, color = "#8d9399" }) {
  const geometry = useMemo(() => {
    const shape = new THREE.Shape();
    shape.moveTo(-width / 2, 0);
    shape.lineTo(width / 2, 0);
    shape.lineTo(0, rise);
    shape.closePath();
    const g = new THREE.ExtrudeGeometry(shape, { depth: length, bevelEnabled: false });
    g.translate(0, 0, -length / 2);
    g.rotateY(Math.PI / 2);
    return g;
  }, [length, width, rise]);
  return (
    <mesh geometry={geometry} position={position}>
      <meshLambertMaterial color={color} />
    </mesh>
  );
}

// Catedral de Pisa (Duomo): nave em cruz latina, cúpula no cruzeiro e abside
// voltada para a torre. Fachada para o oeste (−X).
function Duomo({ marble }) {
  const side = useMemo(() => {
    const t = marble.clone();
    t.repeat.set(4, 1);
    t.needsUpdate = true;
    return t;
  }, [marble]);
  const lead = "#8d9399";
  return (
    <group position={[-17, 0, -7.5]}>
      {/* naves laterais (mais baixas) */}
      <mesh position={[0, 1.5, 0]}>
        <boxGeometry args={[16, 3, 8.4]} />
        <meshLambertMaterial map={side} />
      </mesh>
      {/* nave central */}
      <mesh position={[0, 2.6, 0]}>
        <boxGeometry args={[16.4, 5.2, 4.6]} />
        <meshLambertMaterial map={side} />
      </mesh>
      <GableRoof length={16.6} width={5} rise={1.1} position={[0, 5.2, 0]} color={lead} />
      {/* transepto */}
      <group position={[3.6, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
        <mesh position={[0, 2.3, 0]}>
          <boxGeometry args={[13.2, 4.6, 3.8]} />
          <meshLambertMaterial map={side} />
        </mesh>
        <GableRoof length={13.4} width={4.2} rise={0.95} position={[0, 4.6, 0]} color={lead} />
      </group>
      {/* cúpula */}
      <mesh position={[3.6, 5.9, 0]}>
        <cylinderGeometry args={[1.9, 1.9, 1.4, 24]} />
        <meshLambertMaterial map={marble} />
      </mesh>
      <mesh position={[3.6, 6.6, 0]} scale={[1, 1.25, 1]}>
        <sphereGeometry args={[1.85, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshLambertMaterial color={lead} />
      </mesh>
      <mesh position={[3.6, 9.05, 0]}>
        <sphereGeometry args={[0.16, 10, 8]} />
        <meshStandardMaterial color="#c9a23f" metalness={0.9} roughness={0.3} />
      </mesh>
      {/* abside (lado leste, o mais próximo da torre) */}
      <mesh position={[8.2, 2, 0]}>
        <cylinderGeometry args={[2.2, 2.2, 4, 24, 1, false, 0, Math.PI]} />
        <meshLambertMaterial map={marble} />
      </mesh>
      <mesh position={[8.2, 4, 0]}>
        <sphereGeometry args={[2.2, 24, 10, 0, Math.PI, 0, Math.PI / 2]} />
        <meshLambertMaterial color={lead} />
      </mesh>
      {/* fachada oeste, com o frontão */}
      <mesh position={[-8.25, 2.6, 0]}>
        <boxGeometry args={[0.2, 5.2, 8.6]} />
        <meshLambertMaterial map={marble} />
      </mesh>
    </group>
  );
}

function Baptistery({ marble }) {
  const band = useMemo(() => {
    const t = marble.clone();
    t.repeat.set(3, 1);
    t.needsUpdate = true;
    return t;
  }, [marble]);
  return (
    <group position={[-39, 0, -7.5]}>
      <mesh position={[0, 2.2, 0]}>
        <cylinderGeometry args={[2.9, 2.9, 4.4, 32]} />
        <meshLambertMaterial map={band} />
      </mesh>
      <mesh position={[0, 4.4, 0]} scale={[1, 1.35, 1]}>
        <sphereGeometry args={[2.85, 32, 14, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshLambertMaterial color="#a7573a" />
      </mesh>
      <mesh position={[0, 8.2, 0]}>
        <coneGeometry args={[0.5, 0.9, 12]} />
        <meshLambertMaterial color="#8d9399" />
      </mesh>
    </group>
  );
}

// Camposanto Monumentale: o longo claustro de mármore branco ao norte da praça,
// com arcadas cegas e telhado de chumbo, colado à muralha.
function Camposanto({ marble }) {
  const side = useMemo(() => {
    const t = marble.clone();
    t.repeat.set(9, 1);
    t.needsUpdate = true;
    return t;
  }, [marble]);
  return (
    <group position={[-22, 0, -20.5]}>
      <mesh position={[0, 1.4, 0]}>
        <boxGeometry args={[42, 2.8, 8]} />
        <meshLambertMaterial map={side} />
      </mesh>
      <GableRoof length={42.4} width={8.6} rise={0.9} position={[0, 2.8, 0]} />
      {/* pequena cúpula da capela */}
      <mesh position={[-8, 3.8, 0]}>
        <sphereGeometry args={[1.1, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshLambertMaterial color="#8d9399" />
      </mesh>
    </group>
  );
}

// Muralha medieval de tijolo com ameias, torres quadradas e a Porta Santa Maria.
const WALL_N = { z: -27, x0: -86, x1: 62 };
const WALL_W = { x: -60, z0: -27, z1: 27 };
function CityWalls({ brick, brickLong }) {
  const merlons = useMemo(() => {
    const dummy = new THREE.Object3D();
    const pts = [];
    for (let x = WALL_N.x0; x <= WALL_N.x1; x += 1.4) pts.push([x, WALL_N.z, 0]);
    for (let z = WALL_W.z0; z <= WALL_W.z1; z += 1.4) pts.push([WALL_W.x, z, Math.PI / 2]);
    const m = new THREE.InstancedMesh(new THREE.BoxGeometry(0.7, 0.55, 0.9), new THREE.MeshLambertMaterial({ map: brick }), pts.length);
    pts.forEach(([x, z, ry], i) => {
      dummy.position.set(x, 3.27, z);
      dummy.rotation.set(0, ry, 0);
      dummy.updateMatrix();
      m.setMatrixAt(i, dummy.matrix);
    });
    return m;
  }, [brick]);
  const towers = [
    [-80, WALL_N.z],
    [-45, WALL_N.z],
    [-8, WALL_N.z],
    [30, WALL_N.z],
    [58, WALL_N.z],
    [WALL_W.x, -5],
    [WALL_W.x, 18],
  ];
  return (
    <>
      <mesh position={[(WALL_N.x0 + WALL_N.x1) / 2, 1.5, WALL_N.z]}>
        <boxGeometry args={[WALL_N.x1 - WALL_N.x0, 3, 0.9]} />
        <meshLambertMaterial map={brickLong} />
      </mesh>
      <mesh position={[WALL_W.x, 1.5, 0]} rotation={[0, Math.PI / 2, 0]}>
        <boxGeometry args={[WALL_W.z1 - WALL_W.z0, 3, 0.9]} />
        <meshLambertMaterial map={brickLong} />
      </mesh>
      <primitive object={merlons} />
      {towers.map(([x, z], i) => (
        <group key={i} position={[x, 0, z]}>
          <mesh position={[0, 2.3, 0]}>
            <boxGeometry args={[2.4, 4.6, 2.4]} />
            <meshLambertMaterial map={brick} />
          </mesh>
          {[-0.8, 0, 0.8].map((d) =>
            [
              [d, 1.05],
              [d, -1.05],
              [1.05, d],
              [-1.05, d],
            ].map(([mx, mz], k) => (
              <mesh key={`${d}-${k}`} position={[mx, 4.85, mz]}>
                <boxGeometry args={[0.5, 0.5, 0.5]} />
                <meshLambertMaterial map={brick} />
              </mesh>
            )),
          )}
        </group>
      ))}
      {/* Porta Santa Maria: torre-portão com arco, na muralha oeste */}
      <group position={[WALL_W.x, 0, 8]}>
        <mesh position={[0, 3, 0]}>
          <boxGeometry args={[3.2, 6, 4]} />
          <meshLambertMaterial map={brick} />
        </mesh>
        <mesh position={[1.62, 1.3, 0]} rotation={[0, Math.PI / 2, 0]}>
          <planeGeometry args={[2, 2.6]} />
          <meshBasicMaterial color="#2a2018" />
        </mesh>
        <mesh position={[0, 6.4, 0]} rotation={[0, Math.PI / 4, 0]}>
          <coneGeometry args={[2.7, 1.4, 4]} />
          <meshLambertMaterial color="#9c4a2c" />
        </mesh>
      </group>
    </>
  );
}

// Pessoas do fim do século XVI (escala da torre: 1 unidade ≈ 6 m, então uma
// pessoa tem ~0,3): professores da Universidade de Pisa de toga e barrete
// pretos, estudantes, frades de hábito marrom, mulheres de vestido longo e
// mercadores de capa colorida — muitos olhando para o alto da torre.
const ROBE = ["#1c1c22", "#1c1c22", "#2b2b33", "#5a3a22", "#6b4423", "#7a1f24", "#1f3a5f", "#3d5a2a", "#8a6a3a", "#4a2a4a", "#b5651d"];
const HAT = ["#121216", "#121216", "#6b1a1a", "#1f2a44", "#3a2414"];
const PISA_PEOPLE = (() => {
  const rand = lcg(1589);
  const list = [];
  // roda em volta da base da torre (deixando livre o lado onde as esferas caem)
  for (let i = 0; i < 46; i++) {
    const a = rand() * Math.PI * 2;
    const r = 3.8 + rand() * 3.6;
    const x = Math.cos(a) * r;
    const z = -1.9 + Math.sin(a) * r;
    if (z > 0.8 && Math.abs(x) < 2.2) continue; // frente: área da queda e da câmera
    list.push({ x, z, look: Math.atan2(-x, -1.9 - z), k: rand() });
  }
  // pequenos grupos espalhados pela praça e diante da catedral
  for (let i = 0; i < 40; i++) {
    const x = -34 + rand() * 40;
    const z = -14 + rand() * 24;
    if (Math.hypot(x, z + 1.9) < 7 || (x > -26 && x < -8 && z > -12 && z < -3)) continue;
    list.push({ x, z, look: rand() * Math.PI * 2, k: rand() });
  }
  return list;
})();

function Crowd() {
  const [robes, bodies, heads, hats] = useMemo(() => {
    const dummy = new THREE.Object3D();
    const color = new THREE.Color();
    const rand = lcg(31);
    const n = PISA_PEOPLE.length;
    const robe = new THREE.InstancedMesh(new THREE.ConeGeometry(0.075, 0.2, 8), new THREE.MeshLambertMaterial({ color: "#fff" }), n);
    const body = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.045, 0.06, 0.1, 8), new THREE.MeshLambertMaterial({ color: "#fff" }), n);
    const head = new THREE.InstancedMesh(new THREE.SphereGeometry(0.035, 10, 8), new THREE.MeshLambertMaterial({ color: "#fff" }), n);
    const hat = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.045, 0.042, 0.03, 10), new THREE.MeshLambertMaterial({ color: "#fff" }), n);
    PISA_PEOPLE.forEach((p, i) => {
      const s = 0.9 + p.k * 0.25;
      const c = ROBE[Math.floor(rand() * ROBE.length)];
      dummy.rotation.set(0, p.look, 0);
      dummy.scale.set(s, s, s);
      dummy.position.set(p.x, 0.1 * s, p.z);
      dummy.updateMatrix();
      robe.setMatrixAt(i, dummy.matrix);
      robe.setColorAt(i, color.set(c));
      dummy.position.set(p.x, 0.24 * s, p.z);
      dummy.updateMatrix();
      body.setMatrixAt(i, dummy.matrix);
      body.setColorAt(i, color.set(c).multiplyScalar(0.85));
      // cabeça levemente inclinada para trás: olhando para o alto da torre
      dummy.position.set(p.x, 0.325 * s, p.z);
      dummy.updateMatrix();
      head.setMatrixAt(i, dummy.matrix);
      head.setColorAt(i, color.set(rand() < 0.5 ? "#d9a77f" : "#c58c63"));
      dummy.position.set(p.x, 0.365 * s, p.z);
      dummy.updateMatrix();
      hat.setMatrixAt(i, dummy.matrix);
      hat.setColorAt(i, color.set(HAT[Math.floor(rand() * HAT.length)]));
    });
    for (const m of [robe, body, head, hat]) m.instanceColor.needsUpdate = true;
    return [robe, body, head, hat];
  }, []);
  return (
    <>
      <primitive object={robes} />
      <primitive object={bodies} />
      <primitive object={heads} />
      <primitive object={hats} />
    </>
  );
}

// Carroça de madeira com cavalo, parada na rua ao sul.
function Cart({ position, rotation = 0 }) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <mesh position={[0, 0.16, 0]}>
        <boxGeometry args={[0.7, 0.12, 0.38]} />
        <meshLambertMaterial color="#6b4a2b" />
      </mesh>
      {[-0.22, 0.22].map((z) => (
        <mesh key={z} position={[0, 0.1, z]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.1, 0.018, 6, 14]} />
          <meshLambertMaterial color="#3b2a1a" />
        </mesh>
      ))}
      {/* cavalo */}
      <mesh position={[0.62, 0.2, 0]}>
        <boxGeometry args={[0.42, 0.14, 0.12]} />
        <meshLambertMaterial color="#5a3b24" />
      </mesh>
      <mesh position={[0.86, 0.3, 0]} rotation={[0, 0, 0.6]}>
        <boxGeometry args={[0.18, 0.08, 0.08]} />
        <meshLambertMaterial color="#5a3b24" />
      </mesh>
      {[0.46, 0.78].map((x) =>
        [-0.04, 0.04].map((z) => (
          <mesh key={`${x}${z}`} position={[x, 0.07, z]}>
            <boxGeometry args={[0.03, 0.14, 0.03]} />
            <meshLambertMaterial color="#3d2716" />
          </mesh>
        )),
      )}
    </group>
  );
}

const PISA_CYPRESS = [
  [14, -17, 4.2], [18, -18, 4.8], [22, -16, 4], [-52, -19, 4.6], [-56, -17, 4.1], [-48, -20, 4.4],
  [24, 22, 4.4], [-30, 24, 4.2], [-48, 23, 4.6], [9, 24, 3.8],
];

export function PisaSetting() {
  const marble = useMarbleTexture();
  const tex = useMemo(() => {
    const [grass, gctx, rand] = grainCanvas({ base: [88, 124, 54], spread: 13, seed: 61, speckle: 0.1, speckleGain: 18, blotches: 36, blotchAlpha: 0.07 });
    for (let i = 0; i < 2200; i++) {
      const x = rand() * 512;
      const y = rand() * 512;
      gctx.strokeStyle = rand() < 0.5 ? "rgba(150,185,80,0.3)" : "rgba(45,80,30,0.3)";
      gctx.beginPath();
      gctx.moveTo(x, y);
      gctx.lineTo(x + (rand() - 0.5) * 4, y - 3 - rand() * 5);
      gctx.stroke();
    }
    const [stone, sctx] = grainCanvas({ base: [206, 200, 186], spread: 8, seed: 67, blotches: 14, blotchAlpha: 0.05 });
    sctx.strokeStyle = "rgba(70,66,58,0.5)";
    sctx.lineWidth = 2;
    for (let row = 0; row < 8; row++) {
      sctx.beginPath();
      sctx.moveTo(0, row * 64);
      sctx.lineTo(512, row * 64);
      sctx.stroke();
      for (let col = 0; col < 4; col++) {
        const x = col * 128 + (row % 2 ? 64 : 0);
        sctx.beginPath();
        sctx.moveTo(x, row * 64);
        sctx.lineTo(x, row * 64 + 64);
        sctx.stroke();
      }
    }
    const [brick, bctx] = grainCanvas({ size: 256, base: [186, 160, 128], spread: 12, seed: 71, blotches: 12, blotchAlpha: 0.07 });
    bctx.strokeStyle = "rgba(60,44,34,0.45)";
    for (let row = 0; row < 16; row++) {
      bctx.beginPath();
      bctx.moveTo(0, row * 16);
      bctx.lineTo(256, row * 16);
      bctx.stroke();
      for (let col = 0; col < 8; col++) {
        const x = col * 32 + (row % 2 ? 16 : 0);
        bctx.beginPath();
        bctx.moveTo(x, row * 16);
        bctx.lineTo(x, row * 16 + 16);
        bctx.stroke();
      }
    }
    return {
      grass: finish(grass, FAR / 6, FAR / 6),
      street: finish(stone, 60, 2.5),
      ring: finish(stone, 3, 3),
      wall: finish(brick, 70, 1.5),
      wallTile: finish(brick, 1, 1),
    };
  }, []);
  const overlay = { polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 };
  return (
    <>
      <fog attach="fog" args={["#a9bdc6", 90, 480]} />
      {/* gramado da praça */}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[FAR, FAR]} />
        <meshBasicMaterial map={tex.grass} toneMapped={false} />
      </mesh>
      {/* calçamento em volta da torre e rua de pedra ao sul */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.002, -1.9]}>
        <circleGeometry args={[3.4, 48]} />
        <meshBasicMaterial map={tex.ring} toneMapped={false} {...overlay} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-10, 0.002, 14]}>
        <planeGeometry args={[240, 9]} />
        <meshBasicMaterial map={tex.street} toneMapped={false} {...overlay} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-17, 0.002, -7.5]}>
        <planeGeometry args={[22, 15]} />
        <meshBasicMaterial map={tex.ring} toneMapped={false} {...overlay} />
      </mesh>
      <Duomo marble={marble} />
      <Baptistery marble={marble} />
      <Camposanto marble={marble} />
      {/* muralha medieval com ameias, torres e a Porta Santa Maria */}
      <CityWalls brick={tex.wallTile} brickLong={tex.wall} />
      <Crowd />
      <Cart position={[-6, 0, 12.5]} rotation={0.2} />
      <Cart position={[12, 0, 15]} rotation={Math.PI - 0.1} />
      <Houses />
      <Trees spots={PISA_CYPRESS} cypress />
      {/* Monte Pisano ao fundo */}
      {[[-150, -330, 150, 34], [40, -360, 190, 44], [230, -300, 150, 30], [330, -120, 140, 26]].map(([x, z, r, h], i) => (
        <mesh key={i} position={[x, -2, z]} scale={[r, h, r * 0.6]}>
          <sphereGeometry args={[1, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshLambertMaterial color="#5d7a66" />
        </mesh>
      ))}
    </>
  );
}

// ---------------------------------------------------------------------------
// PÁTIO — piso de concreto em frente a um galpão, onde as pessoas empurram o
// caixote das aulas de força.
export function YardSetting() {
  const tex = useMemo(() => {
    const [concrete, cctx] = grainCanvas({ base: [176, 173, 166], spread: 9, seed: 83, speckle: 0.04, speckleGain: -30, blotches: 30, blotchAlpha: 0.06 });
    cctx.strokeStyle = "rgba(50,50,48,0.55)";
    cctx.lineWidth = 3;
    cctx.strokeRect(0, 0, 512, 512);
    const [sheet, sctx] = makeCanvas(256, 256);
    for (let x = 0; x < 256; x += 16) {
      const g = sctx.createLinearGradient(x, 0, x + 16, 0);
      g.addColorStop(0, "#8d99a3");
      g.addColorStop(0.5, "#c3ccd3");
      g.addColorStop(1, "#8d99a3");
      sctx.fillStyle = g;
      sctx.fillRect(x, 0, 16, 256);
    }
    const [grass] = grainCanvas({ base: [84, 116, 52], spread: 15, seed: 29, speckle: 0.12, speckleGain: 20, blotches: 40, blotchAlpha: 0.09 });
    return {
      concrete: finish(concrete, FAR / 3, 30 / 3),
      sheet: finish(sheet, 12, 1),
      grass: finish(grass, FAR / 5, FAR / 10),
    };
  }, []);
  const trees = useMemo(() => {
    const rand = lcg(17);
    const spots = [];
    for (let i = 0; i < 22; i++) spots.push([-120 + rand() * 240, -30 - rand() * 30, 6 + rand() * 4]);
    for (let i = 0; i < 12; i++) spots.push([-110 + rand() * 220, 26 + rand() * 24, 6 + rand() * 4]);
    return spots;
  }, []);
  return (
    <>
      <fog attach="fog" args={["#9fb0b4", 70, 480]} />
      <Strip z0={-14} z1={16}>
        <meshBasicMaterial map={tex.concrete} toneMapped={false} />
      </Strip>
      <Strip z0={16} z1={FAR * 0.5}>
        <meshBasicMaterial map={tex.grass} toneMapped={false} />
      </Strip>
      <Strip z0={-FAR * 0.5} z1={-14}>
        <meshBasicMaterial map={tex.grass} toneMapped={false} />
      </Strip>
      {/* galpão */}
      <group position={[2, 0, -13]}>
        <mesh position={[0, 3, 0]}>
          <boxGeometry args={[30, 6, 10]} />
          <meshLambertMaterial map={tex.sheet} />
        </mesh>
        <GableRoof length={30.6} width={11} rise={1.8} position={[0, 6, 0]} color="#7b3f33" />
        {/* portão de enrolar aberto e porta lateral */}
        <mesh position={[-4, 2.1, 5.02]}>
          <planeGeometry args={[7, 4.2]} />
          <meshBasicMaterial color="#15181c" />
        </mesh>
        <mesh position={[-4, 4.45, 5.06]}>
          <boxGeometry args={[7.4, 0.5, 0.12]} />
          <meshLambertMaterial color="#d9a521" />
        </mesh>
        <mesh position={[8, 1.1, 5.03]}>
          <planeGeometry args={[1.1, 2.2]} />
          <meshLambertMaterial color="#35506b" />
        </mesh>
      </group>
      {/* paletes e tambores */}
      {[[-9, -6.6], [-10.3, -6.9], [-9.6, -6.7, 0.9], [12.5, -6.8]].map(([x, z, y = 0], i) => (
        <mesh key={i} position={[x, y + 0.45, z]} rotation={[0, i * 0.4, 0]}>
          <boxGeometry args={[0.9, 0.9, 0.9]} />
          <meshLambertMaterial color={i % 2 ? "#a97b45" : "#b98a52"} />
        </mesh>
      ))}
      {[[14.2, -6.4, "#2f6fb3"], [15.1, -6.9, "#c9412b"], [14.8, -5.7, "#2f6fb3"]].map(([x, z, c], i) => (
        <mesh key={i} position={[x, 0.45, z]}>
          <cylinderGeometry args={[0.3, 0.3, 0.9, 16]} />
          <meshStandardMaterial color={c} metalness={0.5} roughness={0.5} />
        </mesh>
      ))}
      <Trees spots={trees} />
    </>
  );
}

// ---------------------------------------------------------------------------
// BANCADA — tampo de mesa da sala de aula, para os carrinhos de fricção das
// aulas-desafio. A pista de 24 cm fica em escala com lápis, borracha e caderno.
export function LabSetting() {
  const tex = useMemo(() => {
    const [wood, wctx, rand] = grainCanvas({ base: [186, 142, 92], spread: 6, seed: 101, blotches: 16, blotchAlpha: 0.05 });
    for (let i = 0; i < 260; i++) {
      const y = rand() * 512;
      wctx.strokeStyle = `rgba(96,62,30,${0.05 + rand() * 0.16})`;
      wctx.lineWidth = 0.6 + rand() * 1.6;
      wctx.beginPath();
      wctx.moveTo(0, y);
      const wobble = (rand() - 0.5) * 10;
      wctx.bezierCurveTo(170, y + wobble, 340, y - wobble, 512, y);
      wctx.stroke();
    }
    const [paper, pctx] = makeCanvas(256, 256);
    pctx.fillStyle = "#f6f4ec";
    pctx.fillRect(0, 0, 256, 256);
    pctx.strokeStyle = "rgba(70,110,170,0.45)";
    for (let y = 22; y < 256; y += 14) {
      pctx.beginPath();
      pctx.moveTo(0, y);
      pctx.lineTo(256, y);
      pctx.stroke();
    }
    pctx.strokeStyle = "rgba(200,60,60,0.6)";
    pctx.beginPath();
    pctx.moveTo(34, 0);
    pctx.lineTo(34, 256);
    pctx.stroke();
    const [floor, fctx] = grainCanvas({ size: 256, base: [150, 144, 132], spread: 8, seed: 107, blotches: 10 });
    fctx.strokeStyle = "rgba(60,58,52,0.5)";
    fctx.lineWidth = 2;
    fctx.strokeRect(0, 0, 256, 256);
    return { wood: finish(wood, 3, 2), paper: finish(paper), floor: finish(floor, 30, 30) };
  }, []);
  const H = 25; // altura da mesa (75 cm) na escala da cena: 1 unidade = 3 cm
  return (
    <>
      {/* tampo da mesa */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[4, 0, 0]}>
        <planeGeometry args={[44, 22]} />
        <meshBasicMaterial map={tex.wood} toneMapped={false} />
      </mesh>
      <mesh position={[4, -0.5, 0]}>
        <boxGeometry args={[44, 0.98, 22]} />
        <meshLambertMaterial color="#8a6238" />
      </mesh>
      {[[-16, -9.5], [24, -9.5], [-16, 9.5], [24, 9.5]].map(([x, z]) => (
        <mesh key={x + "_" + z} position={[x, -H / 2 - 1, z]}>
          <boxGeometry args={[1.2, H - 1, 1.2]} />
          <meshLambertMaterial color="#5f646b" />
        </mesh>
      ))}
      {/* sala: piso, parede do fundo com a lousa, paredes laterais */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -H, 0]}>
        <planeGeometry args={[400, 400]} />
        <meshLambertMaterial map={tex.floor} />
      </mesh>
      <mesh position={[0, 30, -110]}>
        <planeGeometry args={[400, 120]} />
        <meshLambertMaterial color="#e9e4d6" />
      </mesh>
      <mesh position={[-200, 30, 0]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[400, 120]} />
        <meshLambertMaterial color="#e3ddcd" />
      </mesh>
      <mesh position={[200, 30, 0]} rotation={[0, -Math.PI / 2, 0]}>
        <planeGeometry args={[400, 120]} />
        <meshLambertMaterial color="#e3ddcd" />
      </mesh>
      <mesh position={[0, 30, 200]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[400, 120]} />
        <meshLambertMaterial color="#e9e4d6" />
      </mesh>
      <mesh position={[0, 90, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[400, 400]} />
        <meshBasicMaterial color="#f4f2ea" />
      </mesh>
      <mesh position={[4, 28, -109.5]}>
        <boxGeometry args={[124, 46, 0.6]} />
        <meshLambertMaterial color="#b9bcc0" />
      </mesh>
      <mesh position={[4, 28, -109.1]}>
        <planeGeometry args={[118, 40]} />
        <meshLambertMaterial color="#23463a" />
      </mesh>
      {/* material escolar sobre a mesa */}
      <mesh rotation={[-Math.PI / 2, 0, 0.18]} position={[16, 0.002, -5.6]}>
        <planeGeometry args={[7, 9.4]} />
        <meshBasicMaterial map={tex.paper} toneMapped={false} polygonOffset polygonOffsetFactor={-2} polygonOffsetUnits={-2} />
      </mesh>
      <group position={[2.5, 0.13, -4.4]} rotation={[0, 0.5, 0]}>
        <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.13, 0.13, 5.2, 6]} />
          <meshLambertMaterial color="#e2b21c" />
        </mesh>
        <mesh position={[2.85, 0, 0]} rotation={[0, 0, -Math.PI / 2]}>
          <coneGeometry args={[0.13, 0.5, 6]} />
          <meshLambertMaterial color="#d9b98c" />
        </mesh>
        <mesh position={[-2.75, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.135, 0.135, 0.3, 8]} />
          <meshLambertMaterial color="#d7697a" />
        </mesh>
      </group>
      <mesh position={[-3.4, 0.2, -3.6]} rotation={[0, -0.4, 0]} castShadow>
        <boxGeometry args={[1.4, 0.4, 0.7]} />
        <meshLambertMaterial color="#f1efe9" />
      </mesh>
    </>
  );
}
