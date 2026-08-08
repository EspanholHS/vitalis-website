"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import {
  CapsuleFieldHalo,
  CapsuleSurfaceEffects,
  VitalisFlowField,
} from "@/components/site/vitalis-flow-field";
import {
  getCapsuleMotionStage,
  projectCapsuleToViewport,
} from "@/components/site/capsule-motion-timeline";
import {
  advanceVisualProgress,
  isNarrativeRootInFocus,
  publishVitalisChapter,
} from "@/components/site/narrative-motion";

type ProgressRef = { current: number };
type PointerRef = { current: { x: number; y: number } };
type VelocityRef = { current: number };

type PowderParticle = {
  arrival: number;
  controlX: number;
  controlY: number;
  controlZ: number;
  endX: number;
  endY: number;
  endZ: number;
  phase: number;
  scaleX: number;
  scaleY: number;
  scaleZ: number;
  size: number;
  startX: number;
  startY: number;
  startZ: number;
};

function clamp(value: number, minimum = 0, maximum = 1) {
  return Math.min(Math.max(value, minimum), maximum);
}

function smoothstep(start: number, end: number, value: number) {
  const progress = clamp((value - start) / (end - start));
  return progress * progress * (3 - 2 * progress);
}

function easeOutQuint(value: number) {
  return 1 - (1 - clamp(value)) ** 5;
}

function lerp(start: number, end: number, progress: number) {
  return start + (end - start) * progress;
}

function seededRandom(seed: number) {
  let state = seed >>> 0;

  return () => {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function setSceneVisibility(
  node: HTMLElement | null,
  opacity: number,
  travel: number,
) {
  if (!node) {
    return;
  }

  node.style.opacity = opacity.toFixed(3);
  node.style.transform = `translate3d(0, ${travel.toFixed(2)}px, 0)`;
  node.style.pointerEvents = opacity > 0.45 ? "auto" : "none";
}

function setDetailVisibility(
  node: Element | undefined,
  opacity: number,
  travel: number,
) {
  if (!(node instanceof HTMLElement)) {
    return;
  }

  node.style.opacity = opacity.toFixed(3);
  node.style.transform = `translate3d(0, ${travel.toFixed(2)}px, 0)`;
}

function usePrefersReducedMotion() {
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const motionPreference = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    );
    const compactLandscape = window.matchMedia(
      "(max-height: 620px) and (orientation: landscape)",
    );
    const update = () =>
      setReducedMotion(motionPreference.matches || compactLandscape.matches);

    update();
    motionPreference.addEventListener("change", update);
    compactLandscape.addEventListener("change", update);

    return () => {
      motionPreference.removeEventListener("change", update);
      compactLandscape.removeEventListener("change", update);
    };
  }, []);

  return reducedMotion;
}

function StudioEnvironment({
  pointerRef,
  progressRef,
  velocityRef,
}: {
  pointerRef: PointerRef;
  progressRef: ProgressRef;
  velocityRef: VelocityRef;
}) {
  const { gl } = useThree();
  const keyLightRef = useRef<THREE.RectAreaLight>(null);
  const edgeLightRef = useRef<THREE.RectAreaLight>(null);
  const environment = useMemo(() => {
    const generator = new THREE.PMREMGenerator(gl);
    const studio = new RoomEnvironment();
    const texture = generator.fromScene(studio, 0.035).texture;

    generator.dispose();
    studio.dispose();
    return texture;
  }, [gl]);

  useEffect(() => {
    return () => environment.dispose();
  }, [environment]);

  useFrame((_, delta) => {
    const keyLight = keyLightRef.current;
    const edgeLight = edgeLightRef.current;
    const showcase = smoothstep(0.64, 0.96, progressRef.current);
    const speed = Math.min(Math.abs(velocityRef.current), 1);

    if (keyLight) {
      keyLight.intensity = THREE.MathUtils.damp(
        keyLight.intensity,
        lerp(5.35, 6.15, showcase) + speed * 0.48,
        3.6,
        delta,
      );
      keyLight.position.x = THREE.MathUtils.damp(
        keyLight.position.x,
        -3.5 + showcase * 0.75 + pointerRef.current.x * 0.12,
        3.2,
        delta,
      );
    }

    if (edgeLight) {
      edgeLight.intensity = THREE.MathUtils.damp(
        edgeLight.intensity,
        lerp(2.85, 3.65, showcase) + speed * 0.42,
        3.6,
        delta,
      );
      edgeLight.position.y = THREE.MathUtils.damp(
        edgeLight.position.y,
        1.2 - pointerRef.current.y * 0.1,
        3.2,
        delta,
      );
    }
  });

  return (
    <>
      <primitive attach="environment" object={environment} />
      <hemisphereLight args={["#f8fbf9", "#c8d0d4", 1.85]} />
      <rectAreaLight
        ref={keyLightRef}
        color="#f6fbff"
        intensity={5.35}
        position={[-3.5, 4.5, 4.2]}
        rotation={[-0.55, -0.6, -0.3]}
        width={5.5}
        height={4.5}
      />
      <rectAreaLight
        ref={edgeLightRef}
        color="#6fa8ff"
        intensity={2.85}
        position={[4.2, 1.2, 2.2]}
        rotation={[0, 0.95, 0]}
        width={3.2}
        height={5.2}
      />
      <directionalLight
        color="#d9fff1"
        intensity={1.45}
        position={[-3, -2, 4]}
      />
    </>
  );
}

function CapsuleShell({
  capRef,
  initialCapPosition,
}: {
  capRef: React.RefObject<THREE.Group | null>;
  initialCapPosition: [number, number, number];
}) {
  const lowerProfile = useMemo(() => {
    const points: THREE.Vector2[] = [];
    const radius = 0.88;
    const domeCenter = -0.69;

    for (let index = 0; index <= 28; index += 1) {
      const y = -1.56 + (0.87 * index) / 28;
      const x = Math.sqrt(
        Math.max(0, radius ** 2 - (y - domeCenter) ** 2),
      );
      points.push(new THREE.Vector2(x, y));
    }

    points.push(new THREE.Vector2(radius, 0));
    return points;
  }, []);

  const upperProfile = useMemo(() => {
    const points = [new THREE.Vector2(0.88, 0)];
    const radius = 0.88;
    const domeCenter = 0.69;

    for (let index = 1; index <= 28; index += 1) {
      const y = (1.56 * index) / 28;
      const x =
        y <= domeCenter
          ? radius
          : Math.sqrt(
              Math.max(0, radius ** 2 - (y - domeCenter) ** 2),
            );
      points.push(new THREE.Vector2(x, y));
    }

    return points;
  }, []);

  return (
    <>
      <group>
        <mesh castShadow receiveShadow>
          <latheGeometry args={[lowerProfile, 96]} />
          <meshPhysicalMaterial
            color="#063388"
            roughness={0.24}
            metalness={0.08}
            clearcoat={1}
            clearcoatRoughness={0.12}
            envMapIntensity={1.3}
          />
        </mesh>

        <mesh position={[0, -0.015, 0]}>
          <cylinderGeometry args={[0.895, 0.895, 0.1, 96, 1, true]} />
          <meshPhysicalMaterial
            color="#052b76"
            roughness={0.16}
            metalness={0.12}
            clearcoat={1}
            clearcoatRoughness={0.08}
          />
        </mesh>

        <mesh position={[0, 0.045, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.855, 0.045, 20, 96]} />
          <meshPhysicalMaterial
            color="#0743a7"
            roughness={0.16}
            clearcoat={1}
            clearcoatRoughness={0.08}
          />
        </mesh>

        <mesh position={[0, 0.012, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.82, 96]} />
          <meshStandardMaterial color="#052e76" roughness={0.42} />
        </mesh>
      </group>

      <group
        ref={capRef}
        position={initialCapPosition}
        rotation={[0.18, 0.5, -0.62]}
      >
        <mesh renderOrder={5}>
          <latheGeometry args={[upperProfile, 96]} />
          <meshPhysicalMaterial
            color="#eaf7f1"
            roughness={0.06}
            metalness={0}
            transmission={0.93}
            thickness={0.32}
            ior={1.44}
            clearcoat={1}
            clearcoatRoughness={0.035}
            envMapIntensity={1.35}
            attenuationColor="#d5efe4"
            attenuationDistance={3.5}
            side={THREE.DoubleSide}
            depthWrite={false}
          />
        </mesh>

        <mesh
          position={[0, 0.022, 0]}
          rotation={[Math.PI / 2, 0, 0]}
          renderOrder={6}
        >
          <torusGeometry args={[0.875, 0.028, 20, 96]} />
          <meshPhysicalMaterial
            color="#f2fbf7"
            roughness={0.04}
            transmission={0.82}
            thickness={0.18}
            envMapIntensity={1.7}
            transparent
            opacity={0.72}
            depthWrite={false}
          />
        </mesh>
      </group>
    </>
  );
}

function createParticles(count: number) {
  const random = seededRandom(20260729);
  const particles: PowderParticle[] = [];

  for (let index = 0; index < count; index += 1) {
    const targetY = lerp(-1.26, 0.98, random());
    const normalizedHeight = (targetY + 1.26) / 2.28;
    const bottomNarrowing = clamp((targetY + 1.54) / 0.62, 0.18, 1);
    const radius = Math.sqrt(random()) * 0.68 * bottomNarrowing;
    const angle = random() * Math.PI * 2;
    const startX = lerp(-4.15, -1.55, random());

    particles.push({
      arrival: clamp(normalizedHeight * 0.76 + random() * 0.08),
      controlX: lerp(-1.55, -0.72, random()),
      controlY: lerp(0.95, 1.72, random()),
      controlZ: lerp(-0.72, 0.72, random()),
      endX: Math.cos(angle) * radius,
      endY: targetY,
      endZ: Math.sin(angle) * radius,
      phase: random() * Math.PI * 2,
      scaleX: lerp(0.72, 1.24, random()),
      scaleY: lerp(0.62, 1.42, random()),
      scaleZ: lerp(0.74, 1.28, random()),
      size: lerp(0.0055, 0.0175, random()) * (random() > 0.972 ? 1.24 : 1),
      startX,
      startY:
        0.35 + Math.sin(startX * 1.2) * 0.34 + lerp(-0.72, 0.72, random()),
      startZ: lerp(-0.68, 0.68, random()),
    });
  }

  return particles;
}

function PowderParticles({ progressRef }: { progressRef: ProgressRef }) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const { size: viewportSize } = useThree();
  const isMobile = viewportSize.width < 768;
  const count = isMobile ? 1050 : 3200;
  const particles = useMemo(() => createParticles(count), [count]);
  const matrixObject = useMemo(() => new THREE.Object3D(), []);
  const lastProgressRef = useRef(-1);

  useEffect(() => {
    const mesh = meshRef.current;

    if (!mesh) {
      return;
    }

    mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    lastProgressRef.current = -1;
  }, [count]);

  useFrame(() => {
    const mesh = meshRef.current;

    if (!mesh) {
      return;
    }

    const progress = progressRef.current;

    if (Math.abs(progress - lastProgressRef.current) < 0.00005) {
      return;
    }

    lastProgressRef.current = progress;
    const fillProgress = smoothstep(0.035, 0.64, progress);
    const horizontalCompression = isMobile ? 0.43 : 1;

    particles.forEach((particle, index) => {
      const travel = smoothstep(
        particle.arrival,
        Math.min(1, particle.arrival + 0.2),
        fillProgress,
      );
      const easedTravel = easeOutQuint(travel);
      const inverse = 1 - easedTravel;
      const startX = particle.startX * horizontalCompression;
      const controlX = particle.controlX * horizontalCompression;
      const x =
        inverse * inverse * startX +
        2 * inverse * easedTravel * controlX +
        easedTravel * easedTravel * particle.endX;
      const y =
        inverse * inverse * particle.startY +
        2 * inverse * easedTravel * particle.controlY +
        easedTravel * easedTravel * particle.endY;
      const z =
        inverse * inverse * particle.startZ +
        2 * inverse * easedTravel * particle.controlZ +
        easedTravel * easedTravel * particle.endZ;
      const turbulence = Math.sin(easedTravel * Math.PI) * inverse;

      matrixObject.position.set(
        x + Math.sin(particle.phase + easedTravel * 10) * 0.11 * turbulence,
        y + Math.cos(particle.phase * 1.7 + easedTravel * 8) * 0.085 * turbulence,
        z + Math.sin(particle.phase * 0.8 + easedTravel * 12) * 0.1 * turbulence,
      );
      matrixObject.rotation.set(
        particle.phase + easedTravel * 4,
        particle.phase * 0.7 + easedTravel * 5,
        easedTravel * 3,
      );
      const bloom = 1 + Math.sin(easedTravel * Math.PI) * 0.36;
      matrixObject.scale.set(
        particle.size * particle.scaleX * bloom,
        particle.size * particle.scaleY * bloom,
        particle.size * particle.scaleZ * bloom,
      );
      matrixObject.updateMatrix();
      mesh.setMatrixAt(index, matrixObject.matrix);
    });

    mesh.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh
      ref={meshRef}
      args={[undefined, undefined, count]}
      frustumCulled={false}
      renderOrder={3}
    >
      <tetrahedronGeometry args={[1, 0]} />
      <meshStandardMaterial
        color="#899781"
        roughness={0.84}
        metalness={0}
        emissive="#465140"
        emissiveIntensity={0.015}
      />
    </instancedMesh>
  );
}

function PowderVolume({ progressRef }: { progressRef: ProgressRef }) {
  const volumeRef = useRef<THREE.Mesh>(null);
  const surfaceRef = useRef<THREE.Mesh>(null);

  useFrame(() => {
    const fill = smoothstep(0.16, 0.64, progressRef.current);
    const height = Math.max(0.025, fill * 1.93);
    const baseY = -1.27;

    if (volumeRef.current) {
      volumeRef.current.position.y = baseY + height / 2;
      volumeRef.current.scale.y = height;
      const material = volumeRef.current.material as THREE.MeshStandardMaterial;
      material.opacity = 0.06 + fill * 0.11;
      volumeRef.current.visible = fill > 0.01;
    }

    if (surfaceRef.current) {
      surfaceRef.current.position.y = baseY + height;
      const material = surfaceRef.current.material as THREE.MeshStandardMaterial;
      material.opacity = fill * 0.18;
      surfaceRef.current.visible = fill > 0.03;
    }
  });

  return (
    <>
      <mesh ref={volumeRef} renderOrder={2}>
        <cylinderGeometry args={[0.62, 0.66, 1, 64, 1, true]} />
        <meshStandardMaterial
          color="#e5efe0"
          roughness={0.92}
          transparent
          opacity={0}
          depthWrite={false}
        />
      </mesh>
      <mesh ref={surfaceRef} renderOrder={2}>
        <cylinderGeometry args={[0.62, 0.62, 0.035, 64]} />
        <meshStandardMaterial
          color="#f1f6ed"
          roughness={0.95}
          transparent
          opacity={0}
          depthWrite={false}
        />
      </mesh>
    </>
  );
}

function ProductShadow({
  progressRef,
  velocityRef,
}: {
  progressRef: ProgressRef;
  velocityRef: VelocityRef;
}) {
  const shadowRef = useRef<THREE.Mesh>(null);
  const { size } = useThree();

  useFrame(() => {
    const shadow = shadowRef.current;

    if (!shadow) {
      return;
    }

    const mobile = size.width < 768;
    const stage = getCapsuleMotionStage(progressRef.current, mobile);
    const showcase = smoothstep(0.72, 0.96, progressRef.current);
    const speed = Math.min(Math.abs(velocityRef.current), 1);
    shadow.position.x = stage.x;
    shadow.position.y = mobile ? -2.48 : -1.73;
    const scale = lerp(1, 0.82, showcase);
    shadow.scale.set(scale * (1 + speed * 0.17), scale * (1 - speed * 0.06), 1);
  });

  return (
    <mesh
      ref={shadowRef}
      position={[size.width < 768 ? 0 : 2.05, size.width < 768 ? -2.48 : -1.73, 0]}
      rotation={[-Math.PI / 2, 0, 0]}
    >
      <planeGeometry args={[2.6, 0.82]} />
      <shaderMaterial
        transparent
        depthWrite={false}
        uniforms={{ shadowColor: { value: new THREE.Color("#526967") } }}
        vertexShader={`
          varying vec2 vUv;
          void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `}
        fragmentShader={`
          uniform vec3 shadowColor;
          varying vec2 vUv;
          void main() {
            vec2 centered = (vUv - 0.5) * vec2(1.0, 2.7);
            float fade = 1.0 - smoothstep(0.0, 0.5, length(centered));
            gl_FragColor = vec4(shadowColor, fade * 0.18);
          }
        `}
      />
    </mesh>
  );
}

function CapsuleSculpture({
  pointerRef,
  progressRef,
  reducedMotion,
  velocityRef,
}: {
  pointerRef: PointerRef;
  progressRef: ProgressRef;
  reducedMotion: boolean;
  velocityRef: VelocityRef;
}) {
  const rootRef = useRef<THREE.Group>(null);
  const capRef = useRef<THREE.Group>(null);
  const parallaxRef = useRef(new THREE.Vector2());
  const { size } = useThree();
  const initiallyMobile = size.width < 768;

  useFrame((state, delta) => {
    const root = rootRef.current;
    const cap = capRef.current;

    if (!root || !cap) {
      return;
    }

    parallaxRef.current.x = THREE.MathUtils.damp(
      parallaxRef.current.x,
      reducedMotion ? 0 : pointerRef.current.x,
      4.8,
      delta,
    );
    parallaxRef.current.y = THREE.MathUtils.damp(
      parallaxRef.current.y,
      reducedMotion ? 0 : pointerRef.current.y,
      4.8,
      delta,
    );

    const progress = reducedMotion ? 0.74 : progressRef.current;
    const close = easeOutQuint(smoothstep(0.41, 0.72, progress));
    const mobile = size.width < 768;
    const stage = getCapsuleMotionStage(progress, mobile);
    const showcase = stage.showcase;
    const signedVelocity = reducedMotion
      ? 0
      : clamp(velocityRef.current, -1, 1);
    const speed = Math.abs(signedVelocity);
    const settle = smoothstep(0.955, 1, progress);
    const idle =
      showcase *
      (1 - settle) *
      Math.sin(state.clock.elapsedTime * 0.72) *
      0.026;
    const startCapX = mobile ? 0.82 : 1.08;
    const startCapY = mobile ? 0.62 : 0.78;

    cap.position.set(
      lerp(startCapX, 0, close),
      lerp(startCapY, 0, close),
      lerp(0.24, 0, close),
    );
    cap.rotation.set(
      lerp(0.18, 0, close),
      lerp(0.5, 0, close),
      lerp(-0.62, 0, close),
    );

    root.position.set(
      stage.x,
      stage.y + idle + signedVelocity * 0.045 * (1 - settle),
      0,
    );
    root.rotation.set(
      lerp(0, -0.12, showcase) - parallaxRef.current.y * 0.022 + signedVelocity * 0.018,
      lerp(0, 1.18, showcase) + parallaxRef.current.x * 0.038 - signedVelocity * 0.045,
      lerp(0, -0.1, showcase) + parallaxRef.current.x * 0.009 - signedVelocity * 0.032,
    );
    const handoff = smoothstep(0.94, 1, progress);
    const scale =
      (mobile ? 0.72 : 1) *
      lerp(1, 1.08, showcase) *
      lerp(1, mobile ? 0.38 : 0.31, handoff);
    root.scale.set(
      scale * (1 + speed * 0.014),
      scale * (1 - speed * 0.009),
      scale,
    );
  });

  return (
    <>
      <ProductShadow progressRef={progressRef} velocityRef={velocityRef} />
      <group
        ref={rootRef}
        position={[initiallyMobile ? 0 : 2.05, initiallyMobile ? -1.2 : -0.02, 0]}
        scale={initiallyMobile ? 0.72 : 1}
      >
        <PowderVolume progressRef={progressRef} />
        <PowderParticles progressRef={progressRef} />
        <CapsuleShell
          capRef={capRef}
          initialCapPosition={[
            initiallyMobile ? 0.82 : 1.08,
            initiallyMobile ? 0.62 : 0.78,
            0.24,
          ]}
        />
        <CapsuleSurfaceEffects
          progressRef={progressRef}
          reducedMotion={reducedMotion}
          velocityRef={velocityRef}
        />
      </group>
    </>
  );
}

function CapsuleScene({
  active,
  onReady,
  pointerRef,
  progressRef,
  reducedMotion,
  velocityRef,
}: {
  active: boolean;
  onReady: () => void;
  pointerRef: PointerRef;
  progressRef: ProgressRef;
  reducedMotion: boolean;
  velocityRef: VelocityRef;
}) {
  return (
    <Canvas
      frameloop={active && !reducedMotion ? "always" : "demand"}
      camera={{ position: [0, 0.05, 8.6], fov: 31, near: 0.1, far: 50 }}
      dpr={[0.9, 1.4]}
      gl={{
        alpha: false,
        antialias: true,
        powerPreference: "high-performance",
      }}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 0.92;
        gl.outputColorSpace = THREE.SRGBColorSpace;
        onReady();
      }}
    >
      <color attach="background" args={["#edf1ef"]} />
      <fog attach="fog" args={["#edf1ef", 8.5, 17]} />
      <VitalisFlowField
        pointerRef={pointerRef}
        progressRef={progressRef}
        reducedMotion={reducedMotion}
        velocityRef={velocityRef}
      />
      <CapsuleFieldHalo
        progressRef={progressRef}
        reducedMotion={reducedMotion}
        velocityRef={velocityRef}
      />
      <StudioEnvironment
        pointerRef={pointerRef}
        progressRef={progressRef}
        velocityRef={velocityRef}
      />
      <CapsuleSculpture
        pointerRef={pointerRef}
        progressRef={progressRef}
        reducedMotion={reducedMotion}
        velocityRef={velocityRef}
      />
    </Canvas>
  );
}

export function CapsuleScrollExperience() {
  const sectionRef = useRef<HTMLElement>(null);
  const introRef = useRef<HTMLDivElement>(null);
  const processRef = useRef<HTMLDivElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);
  const progressBarRef = useRef<HTMLSpanElement>(null);
  const phaseRef = useRef<HTMLSpanElement>(null);
  const vignetteRef = useRef<HTMLDivElement>(null);
  const finalVignetteRef = useRef<HTMLDivElement>(null);
  const motionGraphicsRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef(0);
  const pointerRef = useRef({ x: 0, y: 0 });
  const velocityRef = useRef(0);
  const reducedMotion = usePrefersReducedMotion();
  const [sceneReady, setSceneReady] = useState(false);
  const [sceneActive, setSceneActive] = useState(true);

  useEffect(() => {
    const section = sectionRef.current;

    if (!section) {
      return;
    }

    let intersectsViewport = true;
    const updateActivity = () => {
      setSceneActive(intersectsViewport && !document.hidden);
    };
    const observer = new IntersectionObserver(
      ([entry]) => {
        intersectsViewport = entry.isIntersecting;
        updateActivity();
      },
      { rootMargin: "120px 0px" },
    );

    observer.observe(section);
    document.addEventListener("visibilitychange", updateActivity);

    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", updateActivity);
    };
  }, []);

  useEffect(() => {
    const section = sectionRef.current;

    if (!section) {
      return;
    }

    let animationFrame = 0;
    let currentProgress = 0;
    let targetProgress = 0;
    let lastTime = performance.now();
    let lastProgressRead = performance.now();
    let viewportWidth = window.innerWidth;
    let viewportHeight = window.innerHeight;
    let lastRenderedProgress = 0;
    let lastCapsuleX = getCapsuleMotionStage(0, viewportWidth < 768).x;
    let motionEnergy = 0;
    let motionRotation = viewportWidth < 768 ? -90 : 0;
    let intersectsViewport = true;
    let activePhase = "";

    const readProgress = (trackVelocity: boolean) => {
      section.dataset.reducedMotion = reducedMotion ? "true" : "false";

      const rect = section.getBoundingClientRect();
      const scrollDistance = Math.max(
        section.offsetHeight - window.innerHeight,
        1,
      );
      const nextProgress = reducedMotion
        ? 1
        : clamp(-rect.top / scrollDistance);
      const now = performance.now();

      if (trackVelocity && !reducedMotion) {
        const elapsed = Math.max((now - lastProgressRead) / 1000, 1 / 120);
        velocityRef.current = clamp(
          ((nextProgress - targetProgress) / elapsed) * 0.32,
          -1,
          1,
        );
      } else {
        velocityRef.current = 0;
      }

      lastProgressRead = now;
      targetProgress = nextProgress;
    };

    const applyProgress = (progress: number, delta = 0) => {
      progressRef.current = progress;

      const introOpacity = 1 - smoothstep(0.12, 0.22, progress);
      const processOpacity =
        smoothstep(0.17, 0.25, progress) *
        (1 - smoothstep(0.58, 0.68, progress));
      const resultOpacity =
        smoothstep(0.8, 0.9, progress) *
        (1 - smoothstep(0.965, 1, progress) * 0.42);

      setSceneVisibility(
        introRef.current,
        introOpacity,
        -18 * (1 - introOpacity),
      );
      setSceneVisibility(
        processRef.current,
        processOpacity,
        16 * (1 - processOpacity),
      );
      setSceneVisibility(
        resultRef.current,
        resultOpacity,
        18 * (1 - resultOpacity),
      );

      const processChildren = processRef.current?.children;
      const processKicker = smoothstep(0.17, 0.23, progress);
      const processTitle = smoothstep(0.19, 0.27, progress);
      const processBody = smoothstep(0.22, 0.3, progress);
      setDetailVisibility(
        processChildren?.[0],
        processKicker,
        10 * (1 - processKicker),
      );
      setDetailVisibility(
        processChildren?.[1],
        processTitle,
        13 * (1 - processTitle),
      );
      setDetailVisibility(
        processChildren?.[2],
        processBody,
        9 * (1 - processBody),
      );

      const resultChildren = resultRef.current?.children;
      const resultKicker = smoothstep(0.81, 0.88, progress);
      const resultTitle = smoothstep(0.84, 0.93, progress);
      const resultBody = smoothstep(0.88, 0.96, progress);
      setDetailVisibility(
        resultChildren?.[0],
        resultKicker,
        10 * (1 - resultKicker),
      );
      setDetailVisibility(
        resultChildren?.[1],
        resultTitle,
        15 * (1 - resultTitle),
      );
      setDetailVisibility(
        resultChildren?.[2],
        resultBody,
        10 * (1 - resultBody),
      );

      const capsuleProjection = projectCapsuleToViewport(
        progress,
        viewportWidth,
        viewportHeight,
      );
      const safeDelta = delta > 0 ? Math.max(delta, 1 / 120) : 0;
      const progressVelocity = safeDelta
        ? (progress - lastRenderedProgress) / safeDelta
        : 0;
      const capsuleVelocity = safeDelta
        ? (capsuleProjection.stage.x - lastCapsuleX) / safeDelta
        : 0;
      const travelWindow =
        smoothstep(0.52, 0.64, progress) *
        (1 - smoothstep(0.95, 1, progress));
      const targetEnergy = reducedMotion
        ? 0
        : clamp(
            (viewportWidth < 768
              ? Math.abs(progressVelocity) * 0.72
              : Math.abs(capsuleVelocity) * 0.12 +
                Math.abs(progressVelocity) * 0.06) *
              travelWindow,
            0,
            1,
          );

      if (safeDelta) {
        motionEnergy = THREE.MathUtils.damp(
          motionEnergy,
          targetEnergy,
          targetEnergy > motionEnergy ? 13 : 6.5,
          safeDelta,
        );
      } else {
        motionEnergy = 0;
      }

      if (viewportWidth < 768) {
        if (progressVelocity > 0.002) {
          motionRotation = -90;
        } else if (progressVelocity < -0.002) {
          motionRotation = 90;
        }
      } else if (capsuleVelocity < -0.002) {
        motionRotation = 0;
      } else if (capsuleVelocity > 0.002) {
        motionRotation = 180;
      }

      const arrivalProgress = smoothstep(0.86, 0.985, progress);
      const arrivalPulse = Math.sin(arrivalProgress * Math.PI) ** 2;
      const settle = smoothstep(0.935, 0.992, progress);
      const lockOpacity = settle * (1 - motionEnergy * 0.72);
      const handoff = smoothstep(0.965, 1, progress);

      if (motionGraphicsRef.current) {
        motionGraphicsRef.current.style.cssText = [
          `--capsule-x: ${capsuleProjection.x.toFixed(3)}%`,
          `--capsule-y: ${capsuleProjection.y.toFixed(3)}%`,
          `--motion-energy: ${motionEnergy.toFixed(4)}`,
          `--motion-rotation: ${motionRotation.toFixed(2)}deg`,
          `--trail-opacity: ${(motionEnergy * 0.82).toFixed(4)}`,
          `--trail-scale: ${lerp(0.16, 1, motionEnergy).toFixed(4)}`,
          `--dust-opacity: ${(motionEnergy * 0.48).toFixed(4)}`,
          `--field-opacity: ${(motionEnergy * 0.5).toFixed(4)}`,
          `--field-shift: ${clamp(capsuleVelocity * -2.4, -24, 24).toFixed(2)}px`,
          `--arrival-opacity: ${(arrivalPulse * 0.62).toFixed(4)}`,
          `--arrival-scale: ${lerp(0.76, 1.34, arrivalProgress).toFixed(4)}`,
          `--lock-opacity: ${(lockOpacity * 0.72).toFixed(4)}`,
          `--lock-scale: ${lerp(0.9, 1, settle).toFixed(4)}`,
          `--handoff-opacity: ${(handoff * 0.34).toFixed(4)}`,
        ].join("; ");
      }

      lastRenderedProgress = progress;
      lastCapsuleX = capsuleProjection.stage.x;

      if (progressBarRef.current) {
        progressBarRef.current.style.transform = `scaleX(${progress.toFixed(4)})`;
      }

      const nextPhase =
        progress < 0.24
          ? "01 / DISPERSAR"
          : progress < 0.59
            ? "02 / ORGANIZAR"
            : progress < 0.78
              ? "03 / PROTEGER"
              : "04 / CONTINUAR";
      const phaseChanged = nextPhase !== activePhase;

      if (phaseRef.current && phaseChanged) {
        activePhase = nextPhase;
        phaseRef.current.textContent = nextPhase;
      }

      if (
        (phaseChanged ||
          document.documentElement.dataset.vitalisChapter !== "hero") &&
        isNarrativeRootInFocus(section)
      ) {
        publishVitalisChapter({
          activeHref: null,
          id: "hero",
          label: progress < 0.24 ? "Início" : "Cápsula Vitalis",
          tone: "light",
        });
      }

      if (vignetteRef.current) {
        vignetteRef.current.style.opacity = (
          1 - smoothstep(0.64, 0.8, progress)
        ).toFixed(3);
      }

      if (finalVignetteRef.current) {
        finalVignetteRef.current.style.opacity = smoothstep(
          0.7,
          0.86,
          progress,
        ).toFixed(3);
      }
    };

    const tick = (now: number) => {
      animationFrame = 0;

      if (document.hidden) {
        return;
      }

      const delta = Math.min(Math.max((now - lastTime) / 1000, 0), 0.08);
      lastTime = now;
      currentProgress = reducedMotion
        ? targetProgress
        : advanceVisualProgress(currentProgress, targetProgress, delta, {
            maxRate: viewportWidth < 768 ? 0.52 : 0.58,
            smoothing: 5.4,
          });
      velocityRef.current = reducedMotion
        ? 0
        : THREE.MathUtils.damp(velocityRef.current, 0, 6.2, delta);

      if (Math.abs(targetProgress - currentProgress) < 0.00008) {
        currentProgress = targetProgress;
      }

      applyProgress(currentProgress, delta);

      if (
        currentProgress !== targetProgress ||
        Math.abs(velocityRef.current) > 0.0008 ||
        motionEnergy > 0.001
      ) {
        animationFrame = window.requestAnimationFrame(tick);
      }
    };

    const scheduleRender = () => {
      if (animationFrame === 0 && !document.hidden && intersectsViewport) {
        lastTime = performance.now();
        animationFrame = window.requestAnimationFrame(tick);
      }
    };

    const handleScroll = () => {
      if (!intersectsViewport) {
        return;
      }

      readProgress(true);
      scheduleRender();
    };

    const handleResize = () => {
      viewportWidth = window.innerWidth;
      viewportHeight = window.innerHeight;
      readProgress(false);
      scheduleRender();
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        window.cancelAnimationFrame(animationFrame);
        animationFrame = 0;
        return;
      }

      readProgress(false);
      scheduleRender();
    };

    readProgress(false);
    currentProgress = targetProgress;
    lastRenderedProgress = currentProgress;
    lastCapsuleX = getCapsuleMotionStage(
      currentProgress,
      viewportWidth < 768,
    ).x;
    applyProgress(currentProgress);
    const controllerObserver = new IntersectionObserver(
      ([entry]) => {
        intersectsViewport = entry.isIntersecting;

        if (intersectsViewport) {
          readProgress(false);
          scheduleRender();
        } else {
          window.cancelAnimationFrame(animationFrame);
          animationFrame = 0;
          velocityRef.current = 0;
        }
      },
      { rootMargin: "160px 0px" },
    );
    controllerObserver.observe(section);
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleResize);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.cancelAnimationFrame(animationFrame);
      controllerObserver.disconnect();
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleResize);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [reducedMotion]);

  const handlePointerMove = (event: React.PointerEvent<HTMLElement>) => {
    if (reducedMotion || event.pointerType !== "mouse") {
      return;
    }

    pointerRef.current.x = clamp(event.clientX / window.innerWidth, 0, 1) * 2 - 1;
    pointerRef.current.y = clamp(event.clientY / window.innerHeight, 0, 1) * 2 - 1;
  };

  const handlePointerLeave = () => {
    pointerRef.current.x = 0;
    pointerRef.current.y = 0;
  };

  return (
    <section
      ref={sectionRef}
      className="capsule-scroll-section"
      data-atmosphere-owner
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      aria-label="A cápsula Vitalis se forma conforme a página avança"
    >
      <div className="capsule-scroll-sticky">
        <div
          className={`capsule-scroll-webgl ${sceneReady ? "is-ready" : ""}`}
          aria-hidden="true"
        >
          <CapsuleScene
            active={sceneActive}
            onReady={() => setSceneReady(true)}
            pointerRef={pointerRef}
            progressRef={progressRef}
            reducedMotion={reducedMotion}
            velocityRef={velocityRef}
          />
        </div>

        <div className="capsule-scroll-atmosphere" aria-hidden="true" />
        <div
          ref={motionGraphicsRef}
          className="capsule-motion-system"
          aria-hidden="true"
        >
          <div className="capsule-motion-field">
            <span className="capsule-motion-field__rail capsule-motion-field__rail--upper" />
            <span className="capsule-motion-field__rail capsule-motion-field__rail--center" />
            <span className="capsule-motion-field__rail capsule-motion-field__rail--lower" />
          </div>

          <div className="capsule-motion-wake">
            <span className="capsule-motion-wake__line capsule-motion-wake__line--primary" />
            <span className="capsule-motion-wake__line capsule-motion-wake__line--sage" />
            <span className="capsule-motion-wake__line capsule-motion-wake__line--pearl" />
            <i className="capsule-motion-wake__dust" />
          </div>

          <div className="capsule-motion-arrival">
            <span className="capsule-motion-arrival__wave" />
            <span className="capsule-motion-arrival__ring capsule-motion-arrival__ring--outer" />
            <span className="capsule-motion-arrival__ring capsule-motion-arrival__ring--inner" />
            <span className="capsule-motion-arrival__lock">
              <i />
              <i />
              <i />
              <i />
            </span>
          </div>

          <span className="capsule-motion-handoff" />
        </div>
        <div
          ref={vignetteRef}
          className="capsule-scroll-vignette"
          aria-hidden="true"
        />
        <div
          ref={finalVignetteRef}
          className="capsule-scroll-vignette capsule-scroll-vignette-final"
          aria-hidden="true"
        />

        <div ref={introRef} className="capsule-scroll-copy capsule-scroll-intro">
          <p className="capsule-scroll-eyebrow">Vitalis / Adesão medicamentosa</p>
          <h1>O cuidado não pode depender da memória.</h1>
          <p className="capsule-scroll-lead">
            Organize medicamentos, horários e confirmações em uma rotina clara
            para pacientes e cuidadores.
          </p>
          <div className="capsule-scroll-actions">
            <Link href="/entrar" className="vitalis-button-primary">
              Começar agora
            </Link>
            <Link href="/#beneficios" className="capsule-scroll-text-link">
              Conhecer a experiência
              <span aria-hidden="true">↗</span>
            </Link>
          </div>
        </div>

        <div ref={processRef} className="capsule-scroll-copy capsule-scroll-process">
          <p className="capsule-scroll-eyebrow">Uma rotina em movimento</p>
          <h2>Organizar. Lembrar. Confirmar.</h2>
          <p>
            Cada informação encontra seu lugar antes que o esquecimento encontre
            espaço.
          </p>
        </div>

        <div ref={resultRef} className="capsule-scroll-copy capsule-scroll-result">
          <p className="capsule-scroll-eyebrow">Da intenção à constância</p>
          <h2>Cada dose, no momento certo.</h2>
          <p>
            Lembretes, histórico e acompanhamento conectados em uma experiência
            simples e confiável.
          </p>
        </div>

        <div className="capsule-scroll-status" aria-hidden="true">
          <span>Role para acompanhar</span>
          <span ref={phaseRef}>01 / DISPERSAR</span>
        </div>

        <div className="capsule-scroll-progress" aria-hidden="true">
          <span ref={progressBarRef} />
        </div>
      </div>
    </section>
  );
}



