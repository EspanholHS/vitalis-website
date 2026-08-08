const CAMERA_FOV = 31;
const CAMERA_Y = 0.05;
const CAMERA_Z = 8.6;

function clamp(value: number, minimum = 0, maximum = 1) {
  return Math.min(Math.max(value, minimum), maximum);
}

function smoothstep(start: number, end: number, value: number) {
  const progress = clamp((value - start) / (end - start));
  return progress * progress * (3 - 2 * progress);
}

function cubicHermite(
  start: number,
  end: number,
  startSlope: number,
  endSlope: number,
  progress: number,
  duration: number,
) {
  const t = clamp(progress);
  const t2 = t * t;
  const t3 = t2 * t;
  const startTangent = startSlope * duration;
  const endTangent = endSlope * duration;

  return (
    (2 * t3 - 3 * t2 + 1) * start +
    (t3 - 2 * t2 + t) * startTangent +
    (-2 * t3 + 3 * t2) * end +
    (t3 - t2) * endTangent
  );
}

function getHorizontalPosition(progress: number) {
  const firstStart = 0.58;
  const join = 0.73;
  const final = 0.97;
  const joinSlope = -9.2;

  if (progress <= firstStart) {
    return 2.05;
  }

  if (progress < join) {
    return cubicHermite(
      2.05,
      0.35,
      0,
      joinSlope,
      (progress - firstStart) / (join - firstStart),
      join - firstStart,
    );
  }

  if (progress < final) {
    return cubicHermite(
      0.35,
      -1.55,
      joinSlope,
      0,
      (progress - join) / (final - join),
      final - join,
    );
  }

  return -1.55;
}

export function getCapsuleMotionStage(progress: number, mobile: boolean) {
  const normalizedProgress = clamp(progress);
  const handoff = smoothstep(0.94, 1, normalizedProgress);

  return {
    focus: smoothstep(0.58, 0.73, normalizedProgress),
    showcase: smoothstep(0.73, 0.97, normalizedProgress),
    x: mobile ? 0 : getHorizontalPosition(normalizedProgress),
    y: mobile
      ? -1.2 + (-2.02 + 1.2) * handoff
      : -0.02 + (-1.96 + 0.02) * handoff,
  };
}

export function projectCapsuleToViewport(
  progress: number,
  viewportWidth: number,
  viewportHeight: number,
) {
  const width = Math.max(viewportWidth, 1);
  const height = Math.max(viewportHeight, 1);
  const stage = getCapsuleMotionStage(progress, width < 768);
  const visibleHeight =
    2 * Math.tan((CAMERA_FOV * Math.PI) / 360) * CAMERA_Z;
  const visibleWidth = visibleHeight * (width / height);

  return {
    stage,
    x: clamp(50 + (stage.x / visibleWidth) * 100, -10, 110),
    y: clamp(50 - ((stage.y - CAMERA_Y) / visibleHeight) * 100, -10, 110),
  };
}
