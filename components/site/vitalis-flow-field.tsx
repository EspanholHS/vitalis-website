"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { getCapsuleMotionStage } from "@/components/site/capsule-motion-timeline";

type ScalarRef = { current: number };
type PointerRef = { current: { x: number; y: number } };

const FULLSCREEN_VERTEX_SHADER = `
  varying vec2 vUv;

  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.999, 1.0);
  }
`;

const FLOW_FIELD_FRAGMENT_SHADER = `
  precision highp float;

  varying vec2 vUv;

  uniform float uAspect;
  uniform float uProgress;
  uniform float uTime;
  uniform float uVelocity;
  uniform vec2 uCapsuleAnchor;
  uniform vec2 uPointer;

  float hash21(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
  }

  float noise21(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);

    float a = hash21(i);
    float b = hash21(i + vec2(1.0, 0.0));
    float c = hash21(i + vec2(0.0, 1.0));
    float d = hash21(i + vec2(1.0, 1.0));

    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
  }

  float fbm(vec2 p) {
    float value = 0.0;
    float amplitude = 0.5;

    for (int octave = 0; octave < 3; octave++) {
      value += amplitude * noise21(p);
      p = p * 2.03 + vec2(17.13, 9.27);
      amplitude *= 0.5;
    }

    return value;
  }

  float ribbon(float y, float curve, float width) {
    float distanceToCurve = abs(y - curve) / max(width, 0.001);
    return exp(-distanceToCurve * distanceToCurve);
  }

  float softBlob(vec2 p, vec2 center, float radius, float softness) {
    return 1.0 - smoothstep(radius, radius + softness, length(p - center));
  }

  void main() {
    vec2 uv = vUv;
    vec2 p = (uv - 0.5) * vec2(uAspect, 1.0);
    float progress = clamp(uProgress, 0.0, 1.0);
    float speed = min(abs(uVelocity), 1.0);
    float time = uTime * 0.07;

    vec2 pointer = uPointer * vec2(uAspect * 0.13, 0.13);
    float pointerInfluence = exp(-length(p - pointer) * 2.4) * 0.035;
    p += normalize(pointer - p + vec2(0.0001)) * pointerInfluence;

    float noiseA = fbm(p * 1.12 + vec2(time + progress * 0.42, -time * 0.58));
    vec2 noiseBPoint =
      p * 1.86 +
      vec2(-time * 0.42, time * 0.76) +
      vec2(noiseA * 1.18, -noiseA * 0.72);
    float noiseB =
      noise21(noiseBPoint) * 0.68 +
      noise21(noiseBPoint * 2.03 + vec2(11.7, 5.3)) * 0.32;
    vec2 warped = p + vec2(noiseA - 0.5, noiseB - 0.5) * (0.32 + speed * 0.09);

    float phase = progress * 4.2 + time * 1.55;
    float upperCurve =
      0.26 +
      sin(warped.x * 1.28 + phase) * 0.18 +
      sin(warped.x * 3.25 - phase * 0.43) * 0.055;
    float lowerCurve =
      -0.24 +
      sin(warped.x * 1.05 - phase * 0.73) * 0.19 +
      cos(warped.x * 2.65 + phase * 0.52) * 0.05;
    float centralCurve =
      sin(warped.x * 1.7 + phase * 0.34) * 0.115 +
      sin(warped.x * 4.4 - phase * 0.2) * 0.028;

    float upperRibbon = ribbon(
      warped.y,
      upperCurve,
      0.068 + speed * 0.036
    );
    float lowerRibbon = ribbon(warped.y, lowerCurve, 0.09);
    float centralThread = ribbon(warped.y, centralCurve, 0.026 + speed * 0.012);

    float contourSource = noiseA * 0.58 + noiseB * 0.42;
    float contourDistance = abs(fract(contourSource * 6.2 + progress * 0.7) - 0.5);
    float contours = 1.0 - smoothstep(0.035, 0.105, contourDistance);

    float showcaseProgress = smoothstep(0.72, 0.97, progress);
    float wakeEnergy =
      showcaseProgress *
      (1.0 - smoothstep(0.94, 1.0, progress)) *
      (0.12 + speed * 0.88);
    vec2 capsuleAnchor = uCapsuleAnchor;

    float halo = softBlob(
      warped,
      capsuleAnchor,
      0.16 + speed * 0.06,
      0.42
    );
    float focusWindow =
      smoothstep(0.46, 0.68, progress) *
      (1.0 - smoothstep(0.8, 0.98, progress));

    vec2 wakePosition = warped - capsuleAnchor;
    float travelDirection = uVelocity < -0.02 ? -1.0 : 1.0;
    float wakeAxis = wakePosition.x * travelDirection;
    float wakeSide = smoothstep(-0.12, 0.92, wakeAxis);
    float wakeCurve = sin(wakeAxis * 4.6 + phase) * 0.055;
    float wake =
      ribbon(wakePosition.y, wakeCurve, 0.055 + speed * 0.055) *
      wakeSide *
      wakeEnergy;

    float leftBloom = softBlob(warped, vec2(-0.78, 0.28), 0.08, 0.34);
    float rightBloom = softBlob(warped, vec2(0.76, -0.3), 0.1, 0.38);
    float distributedBloom = leftBloom * (0.42 + progress * 0.3) + rightBloom * 0.5;

    float edgeMask =
      smoothstep(0.0, 0.08, uv.x) *
      smoothstep(0.0, 0.08, 1.0 - uv.x) *
      smoothstep(0.0, 0.06, uv.y) *
      smoothstep(0.0, 0.06, 1.0 - uv.y);

    vec3 base = vec3(0.929, 0.945, 0.938);
    vec3 mineralBlue = vec3(0.055, 0.23, 0.57);
    vec3 clearBlue = vec3(0.20, 0.48, 0.82);
    vec3 sage = vec3(0.31, 0.56, 0.47);
    vec3 aqua = vec3(0.42, 0.72, 0.68);
    vec3 pearl = vec3(0.955, 0.985, 0.973);

    float blueField =
      upperRibbon * 0.205 +
      centralThread * 0.14 +
      contours * (0.032 + progress * 0.022) +
      wake * (0.1 + speed * 0.13);
    float sageField =
      lowerRibbon * 0.155 +
      distributedBloom * 0.11 +
      contours * 0.02;
    float luminousField =
      upperRibbon * upperRibbon * upperRibbon * 0.055 +
      centralThread * 0.085 +
      halo * (0.03 + focusWindow * 0.065) +
      wake * 0.052;

    vec3 color = base;
    color = mix(color, mineralBlue, clamp(blueField * edgeMask, 0.0, 0.3));
    color = mix(color, sage, clamp(sageField * edgeMask, 0.0, 0.23));
    color = mix(color, clearBlue, clamp(wake * 0.085, 0.0, 0.1));
    color = mix(color, aqua, clamp(halo * focusWindow * 0.05, 0.0, 0.065));
    color = mix(
      color,
      pearl,
      clamp(luminousField * edgeMask * 0.82, 0.0, 0.18)
    );

    float grain = hash21(gl_FragCoord.xy);
    color += (grain - 0.5) * 0.006;

    gl_FragColor = vec4(color, 1.0);
  }
`;

const WORLD_VERTEX_SHADER = `
  varying vec2 vUv;

  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const HALO_FRAGMENT_SHADER = `
  precision highp float;

  varying vec2 vUv;

  uniform float uProgress;
  uniform float uStrength;
  uniform float uTime;
  uniform float uVelocity;

  void main() {
    vec2 p = (vUv - 0.5) * 2.0;
    float speed = min(abs(uVelocity), 1.0);
    p.x /= 1.0 + speed * 0.28;

    float radius = length(p);
    float glow = exp(-radius * radius * 3.0);
    float breathing = sin(uTime * 0.72 + uProgress * 8.0) * 0.018;
    float ringADistance = (radius - 0.44 - breathing) * 18.0;
    float ringBDistance = (radius - 0.66 + breathing * 0.5) * 24.0;
    float ringA = exp(-ringADistance * ringADistance);
    float ringB = exp(-ringBDistance * ringBDistance);
    float wakeDistance =
      (p.y + sin(p.x * 4.0 + uTime) * 0.045) * 8.0;
    float wake =
      exp(-wakeDistance * wakeDistance) *
      smoothstep(-0.2, 0.9, p.x) *
      speed;

    vec3 blue = vec3(0.18, 0.48, 0.83);
    vec3 sage = vec3(0.36, 0.67, 0.57);
    vec3 pearl = vec3(0.88, 0.98, 0.95);
    vec3 color = mix(blue, sage, clamp(vUv.y + uProgress * 0.12, 0.0, 1.0));
    color = mix(color, pearl, ringA * 0.42 + ringB * 0.22);

    float alpha =
      (glow * 0.11 + ringA * 0.13 + ringB * 0.065 + wake * 0.11) *
      uStrength;
    gl_FragColor = vec4(color, alpha);
  }
`;

const SURFACE_SWEEP_FRAGMENT_SHADER = `
  precision highp float;

  varying vec2 vUv;

  uniform float uIntensity;
  uniform float uSweep;

  void main() {
    vec2 capsulePoint = vec2(
      (vUv.x - 0.5) * 1.8,
      (vUv.y - 0.5) * 3.2
    );
    vec2 capsuleDistance = vec2(
      capsulePoint.x,
      max(abs(capsulePoint.y) - 0.68, 0.0)
    );
    float silhouette = 1.0 - smoothstep(0.84, 0.9, length(capsuleDistance));
    float sweepDistance = capsulePoint.x - uSweep + capsulePoint.y * 0.14;
    float coreDistance = sweepDistance * 11.0;
    float shoulderDistance = (sweepDistance - 0.09) * 5.5;
    float core = exp(-coreDistance * coreDistance);
    float shoulder = exp(-shoulderDistance * shoulderDistance);
    float verticalFade = 1.0 - smoothstep(1.2, 1.56, abs(capsulePoint.y));
    float alpha = (core * 0.72 + shoulder * 0.18) * silhouette * verticalFade * uIntensity;

    vec3 color = mix(
      vec3(0.48, 0.8, 0.94),
      vec3(0.9, 0.99, 0.96),
      core
    );
    gl_FragColor = vec4(color, alpha);
  }
`;

function clamp(value: number, minimum = 0, maximum = 1) {
  return Math.min(Math.max(value, minimum), maximum);
}

function smoothstep(start: number, end: number, value: number) {
  const progress = clamp((value - start) / (end - start));
  return progress * progress * (3 - 2 * progress);
}

function lerp(start: number, end: number, progress: number) {
  return start + (end - start) * progress;
}

export function VitalisFlowField({
  pointerRef,
  progressRef,
  reducedMotion,
  velocityRef,
}: {
  pointerRef: PointerRef;
  progressRef: ScalarRef;
  reducedMotion: boolean;
  velocityRef: ScalarRef;
}) {
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const capsuleProjectionRef = useRef(new THREE.Vector3());
  const { camera, size } = useThree();
  const uniforms = useMemo(
    () => ({
      uAspect: { value: 1 },
      uCapsuleAnchor: { value: new THREE.Vector2() },
      uPointer: { value: new THREE.Vector2() },
      uProgress: { value: reducedMotion ? 1 : 0 },
      uTime: { value: 0 },
      uVelocity: { value: 0 },
    }),
    [reducedMotion],
  );

  useFrame((state, delta) => {
    const material = materialRef.current;

    if (!material) {
      return;
    }

    const progress = reducedMotion ? 1 : progressRef.current;
    const aspect = size.width / Math.max(size.height, 1);
    const mobile = size.width < 768;
    const stage = getCapsuleMotionStage(progress, mobile);
    const capsuleProjection = capsuleProjectionRef.current
      .set(stage.x, stage.y, 0)
      .project(camera);

    material.uniforms.uAspect.value = aspect;
    material.uniforms.uCapsuleAnchor.value.set(
      capsuleProjection.x * aspect * 0.5,
      capsuleProjection.y * 0.5,
    );
    material.uniforms.uTime.value = reducedMotion ? 0 : state.clock.elapsedTime;
    material.uniforms.uProgress.value = progress;
    material.uniforms.uVelocity.value = THREE.MathUtils.damp(
      material.uniforms.uVelocity.value,
      reducedMotion ? 0 : velocityRef.current,
      5.5,
      delta,
    );
    material.uniforms.uPointer.value.x = THREE.MathUtils.damp(
      material.uniforms.uPointer.value.x,
      reducedMotion ? 0 : pointerRef.current.x,
      3.8,
      delta,
    );
    material.uniforms.uPointer.value.y = THREE.MathUtils.damp(
      material.uniforms.uPointer.value.y,
      reducedMotion ? 0 : pointerRef.current.y,
      3.8,
      delta,
    );
  });

  return (
    <mesh frustumCulled={false} renderOrder={-100}>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial
        ref={materialRef}
        uniforms={uniforms}
        vertexShader={FULLSCREEN_VERTEX_SHADER}
        fragmentShader={FLOW_FIELD_FRAGMENT_SHADER}
        depthTest={false}
        depthWrite={false}
        toneMapped={false}
      />
    </mesh>
  );
}

export function CapsuleFieldHalo({
  progressRef,
  reducedMotion,
  velocityRef,
}: {
  progressRef: ScalarRef;
  reducedMotion: boolean;
  velocityRef: ScalarRef;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const { size } = useThree();
  const uniforms = useMemo(
    () => ({
      uProgress: { value: reducedMotion ? 1 : 0 },
      uStrength: { value: 0 },
      uTime: { value: 0 },
      uVelocity: { value: 0 },
    }),
    [reducedMotion],
  );

  useFrame((state, delta) => {
    const mesh = meshRef.current;
    const material = materialRef.current;

    if (!mesh || !material) {
      return;
    }

    const progress = reducedMotion ? 1 : progressRef.current;
    const mobile = size.width < 768;
    const stage = getCapsuleMotionStage(progress, mobile);
    const showcaseEnergy =
      stage.showcase * (1 - smoothstep(0.95, 1, progress));
    const closePulse =
      smoothstep(0.42, 0.64, progress) *
      (1 - smoothstep(0.72, 0.84, progress));
    const speed = reducedMotion ? 0 : Math.min(Math.abs(velocityRef.current), 1);
    const targetStrength = reducedMotion
      ? 0.18
      : 0.18 + closePulse * 0.62 + showcaseEnergy * 0.18 + speed * 0.35;

    material.uniforms.uProgress.value = progress;
    material.uniforms.uTime.value = reducedMotion ? 0 : state.clock.elapsedTime;

    if (reducedMotion) {
      mesh.position.set(stage.x, stage.y, -1.1);
      mesh.rotation.z = 0;
      mesh.scale.set(mobile ? 0.76 : 1, mobile ? 0.76 : 1, 1);
      material.uniforms.uStrength.value = targetStrength;
      material.uniforms.uVelocity.value = 0;
      return;
    }

    mesh.position.x = THREE.MathUtils.damp(mesh.position.x, stage.x, 9, delta);
    mesh.position.y = THREE.MathUtils.damp(mesh.position.y, stage.y, 9, delta);
    mesh.rotation.z = THREE.MathUtils.damp(
      mesh.rotation.z,
      velocityRef.current * -0.055,
      5,
      delta,
    );
    mesh.scale.x = THREE.MathUtils.damp(
      mesh.scale.x,
      (mobile ? 0.76 : 1) * (1 + speed * 0.18),
      6,
      delta,
    );
    mesh.scale.y = THREE.MathUtils.damp(
      mesh.scale.y,
      (mobile ? 0.76 : 1) * (1 - speed * 0.05),
      6,
      delta,
    );
    material.uniforms.uStrength.value = THREE.MathUtils.damp(
      material.uniforms.uStrength.value,
      targetStrength,
      5,
      delta,
    );
    material.uniforms.uVelocity.value = THREE.MathUtils.damp(
      material.uniforms.uVelocity.value,
      velocityRef.current,
      5,
      delta,
    );
  });

  return (
    <mesh
      ref={meshRef}
      position={[size.width < 768 ? 0 : 2.05, size.width < 768 ? -1.2 : -0.02, -1.1]}
      renderOrder={-10}
    >
      <planeGeometry args={[5.2, 5.2]} />
      <shaderMaterial
        ref={materialRef}
        uniforms={uniforms}
        vertexShader={WORLD_VERTEX_SHADER}
        fragmentShader={HALO_FRAGMENT_SHADER}
        transparent
        depthTest
        depthWrite={false}
        toneMapped={false}
      />
    </mesh>
  );
}

export function CapsuleSurfaceEffects({
  progressRef,
  reducedMotion,
  velocityRef,
}: {
  progressRef: ScalarRef;
  reducedMotion: boolean;
  velocityRef: ScalarRef;
}) {
  const ringRef = useRef<THREE.Mesh>(null);
  const sweepRef = useRef<THREE.Mesh>(null);
  const sweepMaterialRef = useRef<THREE.ShaderMaterial>(null);
  const uniforms = useMemo(
    () => ({
      uIntensity: { value: 0 },
      uSweep: { value: -1.2 },
    }),
    [],
  );

  useFrame((_, delta) => {
    const ring = ringRef.current;
    const sweepMesh = sweepRef.current;
    const sweepMaterial = sweepMaterialRef.current;

    if (!ring || !sweepMesh || !sweepMaterial) {
      return;
    }

    const progress = reducedMotion ? 1 : progressRef.current;
    const closePhase = smoothstep(0.45, 0.73, progress);
    const closePulse = Math.sin(closePhase * Math.PI) ** 2;
    const showcasePhase = smoothstep(0.76, 0.98, progress);
    const showcasePulse = Math.sin(showcasePhase * Math.PI) ** 2;
    const speed = reducedMotion ? 0 : Math.min(Math.abs(velocityRef.current), 1);
    const targetIntensity = reducedMotion
      ? 0.08
      : closePulse * 0.56 + showcasePulse * 0.28 + speed * 0.18;
    const sweep =
      closePulse > showcasePulse
        ? lerp(-1.12, 1.12, closePhase)
        : lerp(-0.86, 1.18, showcasePhase);

    sweepMaterial.uniforms.uIntensity.value = THREE.MathUtils.damp(
      sweepMaterial.uniforms.uIntensity.value,
      targetIntensity,
      8,
      delta,
    );
    sweepMaterial.uniforms.uSweep.value = THREE.MathUtils.damp(
      sweepMaterial.uniforms.uSweep.value,
      sweep,
      10,
      delta,
    );

    const ringMaterial = ring.material as THREE.MeshBasicMaterial;
    const targetRingOpacity = reducedMotion
      ? 0.08
      : closePulse * 0.42 + speed * 0.1;
    ringMaterial.opacity = THREE.MathUtils.damp(
      ringMaterial.opacity,
      targetRingOpacity,
      9,
      delta,
    );
    ring.visible = targetRingOpacity > 0.004 || ringMaterial.opacity > 0.004;
    sweepMesh.visible =
      targetIntensity > 0.004 ||
      sweepMaterial.uniforms.uIntensity.value > 0.004;
    const ringScale = 1 + closePulse * 0.065 + speed * 0.03;
    ring.scale.setScalar(ringScale);
  });

  return (
    <>
      <mesh
        ref={ringRef}
        position={[0, 0.058, 0]}
        rotation={[Math.PI / 2, 0, 0]}
        renderOrder={11}
        visible={false}
      >
        <torusGeometry args={[0.885, 0.015, 16, 96]} />
        <meshBasicMaterial
          color="#c8eee6"
          transparent
          opacity={0}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>

      <mesh
        ref={sweepRef}
        position={[0, 0, 0.94]}
        renderOrder={12}
        visible={false}
      >
        <planeGeometry args={[2.2, 3.5]} />
        <shaderMaterial
          ref={sweepMaterialRef}
          uniforms={uniforms}
          vertexShader={WORLD_VERTEX_SHADER}
          fragmentShader={SURFACE_SWEEP_FRAGMENT_SHADER}
          transparent
          blending={THREE.AdditiveBlending}
          depthTest={false}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>
    </>
  );
}
