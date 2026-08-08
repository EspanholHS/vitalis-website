import { clamp, smoothstep } from "@/components/site/continuity-motion-timeline";

export type HubMotionState = {
  actions: number[];
  aperture: number;
  assembly: number;
  content: number;
  core: number;
  environment: number;
  fog: number;
  handoff: number;
  heading: number;
  interfaces: number[];
  layout: number;
  progress: number;
  pulse: number;
  settle: number;
  stream: number;
  travel: number;
  travelWindow: number;
  wordmark: number;
};

function staggeredValues(
  count: number,
  start: number,
  interval: number,
  duration: number,
  progress: number,
) {
  return Array.from({ length: count }, (_, index) =>
    smoothstep(
      start + interval * index,
      start + interval * index + duration,
      progress,
    ),
  );
}

function pulseAt(progress: number, center: number, radius: number) {
  return 1 - smoothstep(0, radius, Math.abs(progress - center));
}

export function getHubMotionState(progress: number, mobile: boolean): HubMotionState {
  const normalizedProgress = clamp(progress);
  const interfaceStart = mobile ? 0.49 : 0.46;
  const actionStart = mobile ? 0.69 : 0.64;
  const fogIn = smoothstep(0.18, 0.35, normalizedProgress);
  const fogOut = smoothstep(0.58, 0.76, normalizedProgress);

  return {
    actions: staggeredValues(
      10,
      actionStart,
      mobile ? 0.012 : 0.01,
      mobile ? 0.08 : 0.065,
      normalizedProgress,
    ),
    aperture: smoothstep(0.075, 0.34, normalizedProgress),
    assembly: smoothstep(0.38, 0.78, normalizedProgress),
    content: smoothstep(0.39, 0.61, normalizedProgress),
    core: smoothstep(0.3, 0.53, normalizedProgress),
    environment: smoothstep(0.08, 0.54, normalizedProgress),
    fog: fogIn * (1 - fogOut),
    handoff: 1 - smoothstep(0.035, 0.28, normalizedProgress),
    heading: smoothstep(0.36, 0.57, normalizedProgress),
    interfaces: staggeredValues(
      3,
      interfaceStart,
      mobile ? 0.065 : 0.052,
      mobile ? 0.15 : 0.13,
      normalizedProgress,
    ),
    layout: smoothstep(0.58, 0.82, normalizedProgress),
    progress: normalizedProgress,
    pulse: Math.max(
      pulseAt(normalizedProgress, 0.35, 0.1) * 0.55,
      pulseAt(normalizedProgress, 0.75, 0.09),
    ),
    settle: smoothstep(0.76, 0.92, normalizedProgress),
    stream: smoothstep(0.55, 0.84, normalizedProgress),
    travel: smoothstep(0.12, 0.65, normalizedProgress),
    travelWindow:
      smoothstep(0.025, 0.12, normalizedProgress) *
      (1 - smoothstep(0.88, 0.99, normalizedProgress)),
    wordmark:
      smoothstep(0.24, 0.5, normalizedProgress) *
      (1 - smoothstep(0.88, 1, normalizedProgress) * 0.28),
  };
}
