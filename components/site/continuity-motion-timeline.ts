export type ContinuityPoint = {
  x: number;
  y: number;
};

export type ContinuityMotionState = {
  benefitPath: number;
  benefits: number[];
  benefitsOpacity: number;
  climax: number;
  cursor: ContinuityPoint & {
    angle: number;
    opacity: number;
    scale: number;
  };
  evidenceOpacity: number;
  handoff: number;
  handoffMorph: number;
  mechanismOpacity: number;
  metrics: number[];
  processPath: number;
  progress: number;
  release: number;
  reorganize: number;
  steps: number[];
  tracePath: number;
  travelWindow: number;
};

type MotionKeyframe = ContinuityPoint & {
  progress: number;
};

const DESKTOP_PATH: MotionKeyframe[] = [
  { progress: 0, x: 27, y: -4 },
  { progress: 0.1, x: 18, y: 58 },
  { progress: 0.17, x: 64, y: 34 },
  { progress: 0.24, x: 43, y: 61 },
  { progress: 0.31, x: 82, y: 47 },
  { progress: 0.42, x: 17, y: 71 },
  { progress: 0.48, x: 18, y: 71 },
  { progress: 0.54, x: 40, y: 71 },
  { progress: 0.61, x: 62, y: 71 },
  { progress: 0.69, x: 82, y: 71 },
  { progress: 0.78, x: 50, y: 53 },
  { progress: 0.92, x: 50, y: 53 },
  { progress: 1, x: 50, y: 108 },
];

const MOBILE_PATH: MotionKeyframe[] = [
  { progress: 0, x: 50, y: -4 },
  { progress: 0.1, x: 15, y: 37 },
  { progress: 0.17, x: 82, y: 47 },
  { progress: 0.24, x: 15, y: 61 },
  { progress: 0.31, x: 82, y: 72 },
  { progress: 0.42, x: 11, y: 48 },
  { progress: 0.48, x: 11, y: 51 },
  { progress: 0.54, x: 11, y: 61 },
  { progress: 0.61, x: 11, y: 71 },
  { progress: 0.69, x: 11, y: 81 },
  { progress: 0.78, x: 84, y: 39 },
  { progress: 0.92, x: 84, y: 39 },
  { progress: 1, x: 50, y: 106 },
];

export function clamp(value: number, minimum = 0, maximum = 1) {
  return Math.min(Math.max(value, minimum), maximum);
}

export function smoothstep(start: number, end: number, value: number) {
  const progress = clamp((value - start) / Math.max(end - start, 0.0001));
  return progress * progress * (3 - 2 * progress);
}

export function damp(
  current: number,
  target: number,
  smoothing: number,
  delta: number,
) {
  return current + (target - current) * (1 - Math.exp(-smoothing * delta));
}

function interpolate(start: number, end: number, progress: number) {
  return start + (end - start) * progress;
}

function getPointOnPath(
  progress: number,
  mobile: boolean,
  originX: number,
) {
  const path = mobile ? MOBILE_PATH : DESKTOP_PATH;
  const normalizedProgress = clamp(progress);

  for (let index = 0; index < path.length - 1; index += 1) {
    const current =
      index === 0 && !mobile ? { ...path[index], x: originX } : path[index];
    const next = path[index + 1];

    if (normalizedProgress <= next.progress) {
      const localProgress = smoothstep(
        current.progress,
        next.progress,
        normalizedProgress,
      );

      return {
        x: interpolate(current.x, next.x, localProgress),
        y: interpolate(current.y, next.y, localProgress),
      };
    }
  }

  return path[path.length - 1];
}

function getCursor(progress: number, mobile: boolean, originX: number) {
  const point = getPointOnPath(progress, mobile, originX);
  const nextPoint = getPointOnPath(
    Math.min(progress + 0.0025, 1),
    mobile,
    originX,
  );
  const deltaX = nextPoint.x - point.x;
  const deltaY = nextPoint.y - point.y;
  const pathAngle =
    Math.abs(deltaX) + Math.abs(deltaY) < 0.001
      ? mobile
        ? 90
        : 0
      : (Math.atan2(deltaY, deltaX) * 180) / Math.PI;
  const angle = interpolate(
    90,
    pathAngle,
    smoothstep(0.025, 0.095, progress),
  );
  const arrival = smoothstep(0.7, 0.79, progress);
  const release = smoothstep(0.94, 1, progress);

  return {
    ...point,
    angle,
    opacity:
      (0.72 + smoothstep(0.005, 0.045, progress) * 0.28) *
      (1 - smoothstep(0.988, 1, progress)),
    scale: interpolate(0.82, 1, smoothstep(0.04, 0.12, progress)) -
      arrival * 0.08 +
      release * 0.04,
  };
}

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

export function getContinuityMotionState(
  progress: number,
  mobile: boolean,
  originX = mobile ? 50 : 27,
): ContinuityMotionState {
  const normalizedProgress = clamp(progress);
  const evidenceIn = smoothstep(0.025, 0.095, normalizedProgress);
  const evidenceOut = smoothstep(0.38, 0.44, normalizedProgress);
  const mechanismIn = smoothstep(0.395, 0.455, normalizedProgress);
  const mechanismOut = smoothstep(0.715, 0.78, normalizedProgress);
  const benefitsIn = smoothstep(0.75, 0.81, normalizedProgress);
  const release = smoothstep(0.97, 1, normalizedProgress);

  return {
    benefitPath: smoothstep(0.765, 0.915, normalizedProgress),
    benefits: staggeredValues(5, 0.775, 0.018, 0.052, normalizedProgress),
    benefitsOpacity: benefitsIn * (1 - release),
    climax: smoothstep(0.715, 0.8, normalizedProgress) *
      (1 - smoothstep(0.88, 0.95, normalizedProgress)),
    cursor: getCursor(normalizedProgress, mobile, originX),
    evidenceOpacity: evidenceIn * (1 - evidenceOut),
    handoff:
      (0.18 + 0.82 * smoothstep(0.005, 0.09, normalizedProgress)) *
      (1 - smoothstep(0.38, 0.45, normalizedProgress)),
    handoffMorph: 1 - smoothstep(0.035, 0.13, normalizedProgress),
    mechanismOpacity: mechanismIn * (1 - mechanismOut),
    metrics: staggeredValues(4, 0.07, 0.055, 0.07, normalizedProgress),
    processPath: smoothstep(0.385, 0.7, normalizedProgress),
    progress: normalizedProgress,
    release,
    reorganize: smoothstep(0.36, 0.455, normalizedProgress),
    steps: staggeredValues(4, 0.43, 0.055, 0.07, normalizedProgress),
    tracePath: smoothstep(0.005, 0.325, normalizedProgress),
    travelWindow:
      smoothstep(0.015, 0.08, normalizedProgress) *
      (1 - smoothstep(0.9, 0.985, normalizedProgress)),
  };
}
