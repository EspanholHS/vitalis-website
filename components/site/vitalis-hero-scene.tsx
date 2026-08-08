"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import type { MutableRefObject } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";

type MotionPoint = {
  x: number;
  y: number;
};

type FallingItem = {
  color: string;
  delay: number;
  drift: number;
  kind: "capsule" | "tablet";
  rotation: [number, number, number];
  scale: number;
  speed: number;
  x: number;
  z: number;
};

const itemPalette = ["#f8f6f0", "#d9e9ff", "#dff5ea", "#c7e7ff", "#f4fbf7"];

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(media.matches);

    update();
    media.addEventListener("change", update);

    return () => media.removeEventListener("change", update);
  }, []);

  return reduced;
}

function Capsule({
  color,
  scale,
}: {
  color: string;
  scale: number;
}) {
  return (
    <group scale={scale}>
      <mesh rotation={[0, 0, Math.PI / 2]}>
        <capsuleGeometry args={[0.16, 0.68, 10, 24]} />
        <meshStandardMaterial
          color={color}
          metalness={0.15}
          roughness={0.28}
          emissive="#1f9d67"
          emissiveIntensity={0.05}
        />
      </mesh>
      <mesh position={[0.2, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <capsuleGeometry args={[0.162, 0.31, 10, 24]} />
        <meshStandardMaterial
          color="#1565d8"
          metalness={0.12}
          roughness={0.34}
          emissive="#1565d8"
          emissiveIntensity={0.08}
        />
      </mesh>
    </group>
  );
}

function Tablet({
  color,
  scale,
}: {
  color: string;
  scale: number;
}) {
  return (
    <group scale={scale}>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.34, 0.34, 0.12, 48]} />
        <meshStandardMaterial
          color={color}
          metalness={0.1}
          roughness={0.24}
          emissive="#d9e9ff"
          emissiveIntensity={0.04}
        />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0.064, 0]}>
        <torusGeometry args={[0.2, 0.012, 8, 42]} />
        <meshBasicMaterial color="#1565d8" transparent opacity={0.28} />
      </mesh>
    </group>
  );
}

function PortalRing({
  pulseRef,
}: {
  pulseRef: MutableRefObject<number>;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const glowRef = useRef<THREE.Mesh>(null);

  useFrame((state, delta) => {
    const pulse = THREE.MathUtils.lerp(
      pulseRef.current,
      pulseRef.current > 0.01 ? pulseRef.current : 0,
      1 - Math.exp(-delta * 8),
    );

    if (groupRef.current) {
      groupRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 0.8) * 0.04;
      groupRef.current.scale.setScalar(1 + pulse * 0.08);
    }

    if (glowRef.current) {
      const material = glowRef.current.material as THREE.MeshBasicMaterial;
      material.opacity = 0.32 + pulse * 0.32;
    }
  });

  return (
    <group ref={groupRef} position={[0.4, -0.62, -0.1]} rotation={[1.18, 0, -0.18]}>
      <mesh>
        <torusGeometry args={[1.12, 0.035, 24, 120]} />
        <meshBasicMaterial color="#5db8a6" transparent opacity={0.82} />
      </mesh>
      <mesh ref={glowRef}>
        <torusGeometry args={[1.12, 0.11, 24, 120]} />
        <meshBasicMaterial
          color="#1565d8"
          transparent
          opacity={0.34}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
      <mesh>
        <circleGeometry args={[1.04, 96]} />
        <meshBasicMaterial color="#d9e9ff" transparent opacity={0.06} />
      </mesh>
    </group>
  );
}

function MedicineField({
  motion,
  pulseRef,
  reducedMotion,
  scrollRef,
}: {
  motion: MotionPoint;
  pulseRef: MutableRefObject<number>;
  reducedMotion: boolean;
  scrollRef: MutableRefObject<number>;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const lightRef = useRef<THREE.PointLight>(null);

  const items = useMemo<FallingItem[]>(
    () =>
      Array.from({ length: 14 }, (_, index) => ({
        color: itemPalette[index % itemPalette.length],
        delay: index * 0.52,
        drift: 0.14 + (index % 5) * 0.035,
        kind: index % 3 === 0 ? "tablet" : "capsule",
        rotation: [
          (index * 0.43) % Math.PI,
          (index * 0.61) % Math.PI,
          (index * 0.27) % Math.PI,
        ],
        scale: 0.82 + (index % 4) * 0.08,
        speed: 0.26 + (index % 6) * 0.035,
        x: -1.8 + (index % 7) * 0.58,
        z: -1.2 + (index % 4) * 0.42,
      })),
    [],
  );

  useFrame((state, delta) => {
    const targetPulse =
      typeof window !== "undefined" &&
      window.document.documentElement.dataset.vitalisPulse === "on"
        ? 1
        : 0;

    pulseRef.current = THREE.MathUtils.lerp(
      pulseRef.current,
      targetPulse,
      1 - Math.exp(-delta * 6),
    );

    if (groupRef.current) {
      groupRef.current.rotation.y = THREE.MathUtils.lerp(
        groupRef.current.rotation.y,
        motion.x * 0.18 + scrollRef.current * 0.16,
        1 - Math.exp(-delta * 4),
      );
      groupRef.current.rotation.x = THREE.MathUtils.lerp(
        groupRef.current.rotation.x,
        -motion.y * 0.12 - scrollRef.current * 0.08,
        1 - Math.exp(-delta * 4),
      );
    }

    if (lightRef.current) {
      lightRef.current.intensity = 2.3 + pulseRef.current * 2.4;
    }

    if (reducedMotion) {
      return;
    }

    const elapsed = state.clock.elapsedTime;
    groupRef.current?.children.forEach((child) => {
      if (child.userData.kind !== "medicine") {
        return;
      }

      const index = child.userData.index as number;
      const data = items[index];
      const loop = ((elapsed * data.speed + data.delay) % 4.2) / 4.2;
      const y = 2.25 - loop * 4.7;
      const drift = Math.sin(elapsed * 0.8 + data.delay) * data.drift;

      child.position.set(data.x + drift, y, data.z);
      child.rotation.x += delta * (0.38 + index * 0.015);
      child.rotation.y += delta * (0.46 + index * 0.012 + pulseRef.current * 0.18);
      child.rotation.z += delta * 0.28;
    });
  });

  return (
    <group ref={groupRef}>
      <pointLight ref={lightRef} position={[0.2, -0.5, 2.1]} color="#5db8a6" intensity={2.4} />
      <PortalRing pulseRef={pulseRef} />
      {items.map((item, index) => (
        <group
          key={`${item.kind}-${index}`}
          userData={{ index, kind: "medicine" }}
          position={[item.x, 2.2 - index * 0.32, item.z]}
          rotation={item.rotation}
        >
          {item.kind === "capsule" ? (
            <Capsule color={item.color} scale={item.scale} />
          ) : (
            <Tablet color={item.color} scale={item.scale} />
          )}
        </group>
      ))}
    </group>
  );
}

export function VitalisHeroScene() {
  const reducedMotion = usePrefersReducedMotion();
  const [motion, setMotion] = useState<MotionPoint>({ x: 0, y: 0 });
  const scrollRef = useRef(0);
  const pulseRef = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      scrollRef.current = Math.min(window.scrollY / 760, 1);
    };

    const handlePulse = (event: Event) => {
      const customEvent = event as CustomEvent<{ active: boolean }>;
      document.documentElement.dataset.vitalisPulse = customEvent.detail.active
        ? "on"
        : "off";
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("vitalis:hero-pulse", handlePulse);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("vitalis:hero-pulse", handlePulse);
      delete document.documentElement.dataset.vitalisPulse;
    };
  }, []);

  return (
    <div
      className="hero-3d-stage relative h-[430px] overflow-hidden rounded-[16px] border border-white/10 bg-[radial-gradient(circle_at_50%_42%,rgba(21,101,216,0.34),transparent_32%),linear-gradient(145deg,#081017_0%,#101b22_54%,#081017_100%)] shadow-[0_28px_80px_rgba(8,16,23,0.28)] md:h-[560px]"
      onPointerMove={(event) => {
        const rect = event.currentTarget.getBoundingClientRect();
        const x = ((event.clientX - rect.left) / rect.width - 0.5) * 2;
        const y = ((event.clientY - rect.top) / rect.height - 0.5) * 2;
        setMotion({ x, y });
      }}
      onPointerLeave={() => setMotion({ x: 0, y: 0 })}
    >
      <Canvas
        className="absolute inset-0 h-full w-full"
        camera={{ position: [0, 0.55, 5.2], fov: 42 }}
        dpr={[1, 1.6]}
        gl={{
          alpha: true,
          antialias: true,
          powerPreference: "high-performance",
          preserveDrawingBuffer: true,
        }}
      >
        <color attach="background" args={["#081017"]} />
        <ambientLight intensity={0.9} />
        <directionalLight position={[2.8, 3.2, 3.8]} intensity={2.2} color="#ffffff" />
        <directionalLight position={[-3, -1, 2]} intensity={0.8} color="#1565d8" />
        <MedicineField
          motion={motion}
          pulseRef={pulseRef}
          reducedMotion={reducedMotion}
          scrollRef={scrollRef}
        />
      </Canvas>

      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_64%_38%,rgba(93,184,166,0.22),transparent_28%),linear-gradient(90deg,rgba(8,16,23,0.18),transparent_42%)]" />
      <div className="pointer-events-none absolute bottom-5 left-5 right-5 rounded-[12px] border border-white/10 bg-white/[0.06] px-4 py-3 text-[#d8e8ea] backdrop-blur-md">
        <p className="text-sm font-semibold text-white">Adesão sincronizada</p>
        <p className="mt-1 text-xs leading-5 text-[#b9c8c8]">
          API, lembretes e cuidador alinhados em uma jornada organizada.
        </p>
      </div>
    </div>
  );
}
