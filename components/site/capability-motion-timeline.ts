import { clamp, smoothstep } from "@/components/site/continuity-motion-timeline";

export type CapabilityMotionState = {
  backgroundShift: number;
  capsule: {
    angle: number;
    depth: number;
    opacity: number;
    scale: number;
    x: number;
    y: number;
  };
  dock: number;
  functions: number[];
  functionsOpacity: number;
  functionsProgress: number;
  humanField: number;
  personas: number[];
  personasOpacity: number;
  personasProgress: number;
  progress: number;
  pulse: number;
  release: number;
  scan: number;
  systemConverge: number;
  travelWindow: number;
};

type CapsulePathPoint = {
  at: number;
  depth: number;
  scale: number;
  x: number;
  y: number;
};

function presence(
  progress: number,
  start: number,
  end: number,
  enter = 0.028,
  exit = 0.032,
) {
  return (
    smoothstep(start, start + enter, progress) *
    (1 - smoothstep(end - exit, end, progress))
  );
}

function pulseAt(progress: number, center: number, radius: number) {
  return 1 - smoothstep(0, radius, Math.abs(progress - center));
}

const desktopPath: CapsulePathPoint[] = [
  { at: 0, depth: 0.24, scale: 0.68, x: 86, y: 13 },
  { at: 0.09, depth: 0.5, scale: 0.86, x: 72, y: 22 },
  { at: 0.18, depth: 0.92, scale: 1.08, x: 37, y: 31 },
  { at: 0.29, depth: 0.43, scale: 0.84, x: 67, y: 42 },
  { at: 0.4, depth: 0.96, scale: 1.12, x: 31, y: 55 },
  { at: 0.5, depth: 0.56, scale: 0.91, x: 70, y: 70 },
  { at: 0.58, depth: 0.74, scale: 1.01, x: 52, y: 77 },
  { at: 0.65, depth: 0.45, scale: 0.84, x: 18, y: 66 },
  { at: 0.72, depth: 0.82, scale: 1.03, x: 21, y: 48 },
  { at: 0.8, depth: 0.52, scale: 0.9, x: 51, y: 64 },
  { at: 0.88, depth: 0.9, scale: 1.08, x: 80, y: 60 },
  { at: 0.94, depth: 0.62, scale: 0.94, x: 52, y: 77 },
  { at: 1, depth: 0.28, scale: 0.7, x: 50, y: 112 },
];

const mobilePath: CapsulePathPoint[] = [
  { at: 0, depth: 0.28, scale: 0.7, x: 88, y: 13 },
  { at: 0.1, depth: 0.54, scale: 0.84, x: 76, y: 23 },
  { at: 0.2, depth: 0.88, scale: 0.98, x: 87, y: 35 },
  { at: 0.31, depth: 0.46, scale: 0.79, x: 70, y: 47 },
  { at: 0.42, depth: 0.9, scale: 0.98, x: 87, y: 59 },
  { at: 0.51, depth: 0.5, scale: 0.82, x: 71, y: 71 },
  { at: 0.59, depth: 0.72, scale: 0.92, x: 86, y: 82 },
  { at: 0.67, depth: 0.48, scale: 0.8, x: 71, y: 69 },
  { at: 0.75, depth: 0.84, scale: 0.96, x: 86, y: 46 },
  { at: 0.84, depth: 0.5, scale: 0.82, x: 69, y: 62 },
  { at: 0.92, depth: 0.88, scale: 0.98, x: 84, y: 78 },
  { at: 1, depth: 0.26, scale: 0.68, x: 50, y: 112 },
];

function catmullRom(
  previous: number,
  start: number,
  end: number,
  next: number,
  progress: number,
) {
  const progressSquared = progress * progress;
  const progressCubed = progressSquared * progress;

  return (
    0.5 *
    (2 * start +
      (-previous + end) * progress +
      (2 * previous - 5 * start + 4 * end - next) * progressSquared +
      (-previous + 3 * start - 3 * end + next) * progressCubed)
  );
}

function samplePath(points: CapsulePathPoint[], progress: number) {
  const normalizedProgress = clamp(progress);
  let index = points.findIndex((point) => normalizedProgress <= point.at);

  if (index <= 0) {
    index = 1;
  }

  const startIndex = Math.min(index - 1, points.length - 2);
  const endIndex = startIndex + 1;
  const previous = points[Math.max(0, startIndex - 1)];
  const start = points[startIndex];
  const end = points[endIndex];
  const next = points[Math.min(points.length - 1, endIndex + 1)];
  const localProgress = clamp(
    (normalizedProgress - start.at) / Math.max(end.at - start.at, 0.0001),
  );

  const sample = (key: "depth" | "scale" | "x" | "y") =>
    catmullRom(
      previous[key],
      start[key],
      end[key],
      next[key],
      localProgress,
    );

  return {
    depth: clamp(sample("depth")),
    scale: sample("scale"),
    x: sample("x"),
    y: sample("y"),
  };
}

export function getCapabilityMotionState(
  progress: number,
  mobile: boolean,
): CapabilityMotionState {
  const normalizedProgress = clamp(progress);
  const dock = smoothstep(0.005, 0.055, normalizedProgress);
  const release = smoothstep(0.93, 1, normalizedProgress);
  const path = mobile ? mobilePath : desktopPath;
  const capsule = samplePath(path, normalizedProgress);
  const tangentStart = samplePath(path, Math.max(0, normalizedProgress - 0.0025));
  const tangentEnd = samplePath(path, Math.min(1, normalizedProgress + 0.0025));
  const capsuleAngle =
    (Math.atan2(tangentEnd.y - tangentStart.y, tangentEnd.x - tangentStart.x) *
      180) /
    Math.PI;

  const functionStarts = [0.075, 0.17, 0.275, 0.38, 0.485];
  const functions = functionStarts.map((start) =>
    smoothstep(start, start + 0.055, normalizedProgress),
  );

  const personaStarts = [0.64, 0.745, 0.845];
  const personas = personaStarts.map((start) =>
    smoothstep(start, start + 0.07, normalizedProgress),
  );

  const transitionPulses = [0.17, 0.275, 0.38, 0.485, 0.59, 0.745, 0.845, 0.94];
  const pulse = Math.max(
    pulseAt(normalizedProgress, 0.075, 0.055),
    ...transitionPulses.map((center) =>
      pulseAt(normalizedProgress, center, center < 0.6 ? 0.034 : 0.045),
    ),
  );

  return {
    backgroundShift: smoothstep(0.55, 0.86, normalizedProgress),
    capsule: {
      angle: capsuleAngle,
      depth: capsule.depth,
      opacity: smoothstep(0.005, 0.035, normalizedProgress) *
        (1 - smoothstep(0.985, 1, normalizedProgress)),
      scale: capsule.scale,
      x: capsule.x,
      y: capsule.y,
    },
    dock,
    functions,
    functionsOpacity:
      smoothstep(0.018, 0.07, normalizedProgress) *
      (1 - smoothstep(0.555, 0.625, normalizedProgress)),
    functionsProgress: clamp((normalizedProgress - 0.065) / 0.525),
    humanField: smoothstep(0.57, 0.78, normalizedProgress),
    personas,
    personasOpacity: smoothstep(0.57, 0.635, normalizedProgress),
    personasProgress: clamp((normalizedProgress - 0.6) / 0.36),
    progress: normalizedProgress,
    pulse,
    release,
    scan: smoothstep(0.035, 0.94, normalizedProgress),
    systemConverge:
      smoothstep(0.485, 0.575, normalizedProgress) *
      (1 - smoothstep(0.625, 0.69, normalizedProgress)),
    travelWindow: presence(normalizedProgress, 0.005, 0.99, 0.02, 0.025),
  };
}
