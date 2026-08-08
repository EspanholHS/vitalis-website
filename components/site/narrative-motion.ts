export type VitalisHeaderTone = "light" | "dark";

export type VitalisChapterSignal = {
  activeHref: string | null;
  id: string;
  label: string;
  tone: VitalisHeaderTone;
};

export const VITALIS_CHAPTER_EVENT = "vitalis:chapterchange";

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(Math.max(value, minimum), maximum);
}

/**
 * Lets the visual playhead pursue native scroll without crossing a complete
 * reveal window in a single frame after a large wheel/trackpad impulse.
 */
export function advanceVisualProgress(
  current: number,
  target: number,
  delta: number,
  options: { maxRate?: number; smoothing?: number } = {},
) {
  const smoothing = options.smoothing ?? 5.4;
  const maxRate = options.maxRate ?? 0.58;
  const safeDelta = clamp(delta, 0, 1 / 30);
  const exponentialStep =
    (target - current) * (1 - Math.exp(-smoothing * safeDelta));
  const recovery = 1 + Math.min(Math.abs(target - current) * 0.28, 0.14);
  const maximumStep = maxRate * recovery * safeDelta;

  return current + clamp(exponentialStep, -maximumStep, maximumStep);
}

export function isNarrativeRootInFocus(root: HTMLElement) {
  const rect = root.getBoundingClientRect();
  const focusLine = window.innerHeight * 0.46;

  return rect.top <= focusLine && rect.bottom >= focusLine;
}

export function publishVitalisChapter(signal: VitalisChapterSignal) {
  if (typeof window === "undefined") {
    return;
  }

  const documentRoot = document.documentElement;
  const currentHref = documentRoot.dataset.vitalisActiveHref ?? "";
  const nextHref = signal.activeHref ?? "";

  if (
    documentRoot.dataset.vitalisChapter === signal.id &&
    documentRoot.dataset.vitalisTone === signal.tone &&
    currentHref === nextHref
  ) {
    return;
  }

  documentRoot.dataset.vitalisChapter = signal.id;
  documentRoot.dataset.vitalisTone = signal.tone;

  if (signal.activeHref) {
    documentRoot.dataset.vitalisActiveHref = signal.activeHref;
  } else {
    delete documentRoot.dataset.vitalisActiveHref;
  }

  window.dispatchEvent(
    new CustomEvent<VitalisChapterSignal>(VITALIS_CHAPTER_EVENT, {
      detail: signal,
    }),
  );
}
