"use client";

import { useEffect, useRef } from "react";
import { clamp, damp } from "@/components/site/continuity-motion-timeline";
import { getCapabilityMotionState } from "@/components/site/capability-motion-timeline";
import {
  advanceVisualProgress,
  isNarrativeRootInFocus,
  publishVitalisChapter,
} from "@/components/site/narrative-motion";

const capabilities = [
  "Cadastro de medicamentos",
  "Alertas visuais e sonoros",
  "Dashboard diário",
  "Histórico de tomas",
  "Perfil do cuidador",
];

const personas = [
  "Pacientes crônicos",
  "Pessoas idosas",
  "Familiares e cuidadores",
];

const format = (value: number) => value.toFixed(4);

function FunctionGraphic({ index }: { index: number }) {
  if (index === 0) {
    return (
      <div className="care-mode-graphic care-mode-graphic--registry" aria-hidden="true">
        <span className="care-registry__code">RX / 0148</span>
        <span className="care-registry__line care-registry__line--wide" />
        <span className="care-registry__line" />
        <span className="care-registry__line care-registry__line--short" />
        <span className="care-registry__seal" />
      </div>
    );
  }

  if (index === 1) {
    return (
      <div className="care-mode-graphic care-mode-graphic--clock" aria-hidden="true">
        <span className="care-clock__ring" />
        <span className="care-clock__hand" />
        <strong>08:00</strong>
        <span className="care-clock__pulse" />
      </div>
    );
  }

  if (index === 2) {
    return (
      <div className="care-mode-graphic care-mode-graphic--day" aria-hidden="true">
        <span className="care-day__label">24H</span>
        <span /><span /><span className="is-active" /><span /><span className="is-active" /><span />
      </div>
    );
  }

  if (index === 3) {
    return (
      <div className="care-mode-graphic care-mode-graphic--history" aria-hidden="true">
        <svg viewBox="0 0 240 92" preserveAspectRatio="none">
          <path pathLength="1" d="M4 72 C35 72 35 40 68 40 S105 58 132 42 S174 17 236 20" />
          <circle cx="68" cy="40" r="3" />
          <circle cx="132" cy="42" r="3" />
          <circle cx="205" cy="21" r="3" />
        </svg>
        <span className="care-history__baseline" />
      </div>
    );
  }

  return (
    <div className="care-mode-graphic care-mode-graphic--care" aria-hidden="true">
      <span className="care-link care-link--patient">P</span>
      <span className="care-link__beam"><i /></span>
      <span className="care-link care-link--caregiver">C</span>
    </div>
  );
}

function PersonaGraphic({ index }: { index: number }) {
  if (index === 0) {
    return (
      <div className="care-persona-visual care-persona-visual--rhythm" aria-hidden="true">
        {Array.from({ length: 7 }, (_, item) => <span key={item} />)}
        <i />
      </div>
    );
  }

  if (index === 1) {
    return (
      <div className="care-persona-visual care-persona-visual--clarity" aria-hidden="true">
        <span className="care-clarity__lens">
          <i /><i /><i />
        </span>
        <span className="care-clarity__focus" />
      </div>
    );
  }

  return (
    <div className="care-persona-visual care-persona-visual--sync" aria-hidden="true">
      <span className="care-sync__plane care-sync__plane--left"><i /></span>
      <span className="care-sync__bridge"><i /></span>
      <span className="care-sync__plane care-sync__plane--right"><i /></span>
    </div>
  );
}

export function VitalisCapabilityStory() {
  const rootRef = useRef<HTMLElement>(null);
  const phaseRef = useRef<HTMLSpanElement>(null);
  const progressRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    const phase = phaseRef.current;
    const progressBar = progressRef.current;

    if (!root || !phase || !progressBar) {
      return;
    }

    const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const compactViewportQuery = window.matchMedia(
      "(max-height: 620px) and (orientation: landscape)",
    );
    let animationFrame = 0;
    let disposed = false;
    let intersectsViewport = false;
    let needsProgressRead = true;
    let currentProgress = 0;
    let targetProgress = 0;
    let renderedProgress = 0;
    let motionEnergy = 0;
    let lastTime = performance.now();
    let viewportWidth = window.innerWidth;
    let viewportHeight = window.innerHeight;
    let activePhase = "";
    let initialHashResolved = false;
    let hashResolutionTimer = 0;
    const documentRoot = document.documentElement;

    const isEnhanced = () =>
      !reducedMotionQuery.matches && !compactViewportQuery.matches;

    const readProgress = () => {
      const rect = root.getBoundingClientRect();
      const scrollDistance = Math.max(root.offsetHeight - viewportHeight, 1);
      targetProgress = clamp(-rect.top / scrollDistance);
      needsProgressRead = false;
    };

    const updatePhase = (progress: number) => {
      const nextPhase =
        progress < 0.59
          ? "01 / FUNCIONALIDADES"
          : progress < 0.945
            ? "02 / PARA QUEM"
            : "03 / CONEXÃO";
      const phaseChanged = nextPhase !== activePhase;

      if (phaseChanged) {
        activePhase = nextPhase;
        phase.textContent = nextPhase;
      }

      const chapterId =
        nextPhase === "01 / FUNCIONALIDADES"
          ? "capabilities"
          : nextPhase === "02 / PARA QUEM"
            ? "personas"
            : "connection";
      const chapterTone = "light";

      if (
        (phaseChanged ||
          documentRoot.dataset.vitalisChapter !== chapterId ||
          documentRoot.dataset.vitalisTone !== chapterTone) &&
        isNarrativeRootInFocus(root)
      ) {
        publishVitalisChapter({
          activeHref: "#funcionalidades",
          id: chapterId,
          label:
            nextPhase === "01 / FUNCIONALIDADES"
              ? "Funcionalidades"
              : nextPhase === "02 / PARA QUEM"
                ? "Para quem"
                : "Conexão",
          tone: chapterTone,
        });
      }
    };

    const applyProgress = (progress: number, delta = 0) => {
      const mobile = viewportWidth < 768;
      const state = getCapabilityMotionState(progress, mobile);
      const progressVelocity =
        delta > 0 ? (progress - renderedProgress) / Math.max(delta, 1 / 120) : 0;
      const targetEnergy =
        clamp(Math.abs(progressVelocity) * 3.4, 0, 1) * state.travelWindow;
      motionEnergy =
        delta > 0
          ? damp(
              motionEnergy,
              targetEnergy,
              targetEnergy > motionEnergy ? 13 : 5,
              delta,
            )
          : 0;

      root.style.cssText = [
        "--care-progress: " + format(state.progress),
        "--care-background: " + format(state.backgroundShift),
        "--care-dock: " + format(state.dock),
        "--care-functions: " + format(state.functionsOpacity),
        "--care-functions-progress: " + format(state.functionsProgress),
        "--care-personas: " + format(state.personasOpacity),
        "--care-personas-progress: " + format(state.personasProgress),
        "--care-human: " + format(state.humanField),
        "--care-system: " + format(state.systemConverge),
        "--care-pulse: " + format(state.pulse),
        "--care-energy: " + format(motionEnergy),
        "--care-scan: " + format(state.scan),
        "--care-release: " + format(state.release),
        "--care-capsule-x: " + state.capsule.x.toFixed(3) + "%",
        "--care-capsule-y: " + state.capsule.y.toFixed(3) + "%",
        "--care-capsule-angle: " + state.capsule.angle.toFixed(2) + "deg",
        "--care-capsule-depth: " + format(state.capsule.depth),
        "--care-capsule-opacity: " + format(state.capsule.opacity),
        "--care-capsule-scale: " + format(state.capsule.scale),
        "--care-grid-y: " + (state.progress * -32).toFixed(3) + "px",
        "--care-scan-x: " + state.capsule.x.toFixed(3) + "%",
        "--care-trace: " + format(state.scan),
        ...state.functions.flatMap((value, index) => [
          "--care-function-" + (index + 1) + ": " + format(value),
          "--care-function-y-" + (index + 1) + ": " + (24 - value * 24).toFixed(3) + "px",
        ]),
        ...state.personas.flatMap((value, index) => [
          "--care-persona-" + (index + 1) + ": " + format(value),
          "--care-persona-y-" + (index + 1) + ": " + (32 - value * 32).toFixed(3) + "px",
        ]),
      ].join("; ");

      progressBar.style.transform = "scaleX(" + format(progress) + ")";
      updatePhase(progress);
      renderedProgress = progress;
    };

    const scheduleFrame = () => {
      if (
        animationFrame === 0 &&
        intersectsViewport &&
        !document.hidden &&
        isEnhanced()
      ) {
        lastTime = performance.now();
        animationFrame = window.requestAnimationFrame(tick);
      }
    };

    function tick(now: number) {
      animationFrame = 0;

      if (disposed || document.hidden || !intersectsViewport || !isEnhanced()) {
        return;
      }

      if (needsProgressRead) {
        readProgress();
      }

      const delta = Math.min(Math.max((now - lastTime) / 1000, 0), 0.08);
      lastTime = now;
      currentProgress = advanceVisualProgress(currentProgress, targetProgress, delta, {
        maxRate: viewportWidth < 768 ? 0.48 : 0.54,
        smoothing: 5.15,
      });

      if (Math.abs(currentProgress - targetProgress) < 0.00008) {
        currentProgress = targetProgress;
      }

      applyProgress(currentProgress, delta);

      if (
        needsProgressRead ||
        currentProgress !== targetProgress ||
        motionEnergy > 0.001
      ) {
        animationFrame = window.requestAnimationFrame(tick);
      }
    }

    const resolveInitialHash = () => {
      if (
        initialHashResolved ||
        !isEnhanced() ||
        window.location.hash !== "#funcionalidades"
      ) {
        return;
      }

      initialHashResolved = true;
      hashResolutionTimer = window.setTimeout(() => {
        if (!disposed) {
          root.scrollIntoView({ block: "start" });
        }
      }, 160);
    };

    const syncExperienceMode = () => {
      const enhanced = isEnhanced();
      root.dataset.enhanced = enhanced ? "true" : "false";
      root.dataset.reducedMotion = reducedMotionQuery.matches ? "true" : "false";
      window.cancelAnimationFrame(animationFrame);
      animationFrame = 0;
      motionEnergy = 0;

      if (!enhanced) {
        root.removeAttribute("style");
        progressBar.removeAttribute("style");
        return;
      }

      needsProgressRead = true;
      readProgress();
      currentProgress = targetProgress;
      renderedProgress = currentProgress;
      applyProgress(currentProgress);
      resolveInitialHash();
      scheduleFrame();
    };

    const handleScroll = () => {
      needsProgressRead = true;
      scheduleFrame();
    };

    const handleResize = () => {
      viewportWidth = window.innerWidth;
      viewportHeight = window.innerHeight;
      needsProgressRead = true;
      scheduleFrame();
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        window.cancelAnimationFrame(animationFrame);
        animationFrame = 0;
        return;
      }

      needsProgressRead = true;
      scheduleFrame();
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        intersectsViewport = entry.isIntersecting;

        if (intersectsViewport) {
          needsProgressRead = true;
          scheduleFrame();
        } else {
          window.cancelAnimationFrame(animationFrame);
          animationFrame = 0;
        }
      },
      { rootMargin: "5% 0px" },
    );

    observer.observe(root);
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleResize);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    reducedMotionQuery.addEventListener("change", syncExperienceMode);
    compactViewportQuery.addEventListener("change", syncExperienceMode);
    syncExperienceMode();

    return () => {
      disposed = true;
      window.cancelAnimationFrame(animationFrame);
      window.clearTimeout(hashResolutionTimer);
      observer.disconnect();
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleResize);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      reducedMotionQuery.removeEventListener("change", syncExperienceMode);
      compactViewportQuery.removeEventListener("change", syncExperienceMode);
    };
  }, []);

  return (
    <section
      ref={rootRef}
      id="funcionalidades"
      className="capability-story care-story"
      data-atmosphere-owner
      aria-label="Funcionalidades e pessoas conectadas pela Vitalis"
    >
      <div className="care-story__stage">
        <div className="care-story__atmosphere" aria-hidden="true">
          <span className="care-story__dark-field" />
          <span className="care-story__human-field" />
          <span className="care-story__wash" />
          <span className="care-story__grid" />
          <span className="care-story__grain" />
          <span className="care-story__scan" />
          <span className="care-story__wave care-story__wave--one" />
          <span className="care-story__wave care-story__wave--two" />
        </div>

        <div className="care-story__trajectory" aria-hidden="true">
          <svg className="care-story__trajectory-desktop" viewBox="0 0 1000 1000" preserveAspectRatio="none">
            <path
              className="care-story__trajectory-guide"
              d="M860 130 C820 170 785 205 720 220 C570 250 455 285 370 310 C420 350 605 370 670 420 C650 480 405 510 310 550 C370 610 610 605 700 640 C700 700 590 742 520 770 C390 745 250 690 180 660 C140 590 180 510 210 480 C310 520 435 605 510 640 C625 610 755 510 800 480 C840 555 665 710 520 770 C500 865 500 975 500 1110"
              pathLength="1"
            />
            <path
              className="care-story__trajectory-trace"
              d="M860 130 C820 170 785 205 720 220 C570 250 455 285 370 310 C420 350 605 370 670 420 C650 480 405 510 310 550 C370 610 610 605 700 640 C700 700 590 742 520 770 C390 745 250 690 180 660 C140 590 180 510 210 480 C310 520 435 605 510 640 C625 610 755 510 800 480 C840 555 665 710 520 770 C500 865 500 975 500 1110"
              pathLength="1"
            />
          </svg>
          <svg className="care-story__trajectory-mobile" viewBox="0 0 1000 1000" preserveAspectRatio="none">
            <path
              className="care-story__trajectory-guide"
              d="M880 130 C805 180 760 205 760 230 C760 275 900 300 870 350 C825 400 700 420 700 470 C710 520 900 545 870 590 C835 640 700 660 710 710 C735 755 875 770 860 820 C820 850 715 770 710 690 C735 610 875 535 860 460 C820 520 705 570 690 620 C695 690 870 735 840 780 C780 850 610 900 500 1110"
              pathLength="1"
            />
            <path
              className="care-story__trajectory-trace"
              d="M880 130 C805 180 760 205 760 230 C760 275 900 300 870 350 C825 400 700 420 700 470 C710 520 900 545 870 590 C835 640 700 660 710 710 C735 755 875 770 860 820 C820 850 715 770 710 690 C735 610 875 535 860 460 C820 520 705 570 690 620 C695 690 870 735 840 780 C780 850 610 900 500 1110"
              pathLength="1"
            />
          </svg>
        </div>

        <div className="care-story__instrument" aria-hidden="true">
          <span className="care-story__instrument-axis care-story__instrument-axis--horizontal" />
          <span className="care-story__instrument-axis care-story__instrument-axis--vertical" />
          <span className="care-story__instrument-lock" />
          <span className="care-story__instrument-pulse" />
        </div>

        <div className="care-story__capsule" aria-hidden="true">
          <span className="care-story__capsule-wake" />
          <span className="care-story__capsule-body">
            <i className="care-story__capsule-shell" />
            <i className="care-story__capsule-seam" />
            <i className="care-story__capsule-glint" />
          </span>
          <span className="care-story__capsule-halo" />
        </div>

        <section className="care-story__chapter care-story__functions" aria-labelledby="capability-title">
          <header className="care-story__chapter-header">
            <span>01 / Sistema</span>
            <h2 id="capability-title">Funcionalidades</h2>
          </header>

          <ol className="care-function-list">
            {capabilities.map((capability, index) => (
              <li key={capability} className={`care-function care-function--${index + 1}`}>
                <div className="care-function__copy">
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <h3>{capability}</h3>
                </div>
                <FunctionGraphic index={index} />
              </li>
            ))}
          </ol>

          <div className="care-function-rail" aria-hidden="true">
            {capabilities.map((capability, index) => (
              <span key={capability}>{String(index + 1).padStart(2, "0")}</span>
            ))}
          </div>
        </section>

        <section className="care-story__chapter care-story__personas" aria-labelledby="personas-title">
          <header className="care-story__chapter-header">
            <span>02 / Presença</span>
            <h2 id="personas-title">Para quem</h2>
          </header>

          <ul className="care-persona-list">
            {personas.map((persona, index) => (
              <li key={persona} className={`care-persona care-persona--${index + 1}`}>
                <span className="care-persona__index">{String(index + 1).padStart(2, "0")}</span>
                <h3>{persona}</h3>
                <PersonaGraphic index={index} />
              </li>
            ))}
          </ul>
        </section>

        <div className="care-story__handoff" aria-hidden="true"><span /></div>

        <div className="care-story__status" aria-hidden="true">
          <span ref={phaseRef}>01 / FUNCIONALIDADES</span>
          <span>Role para conduzir</span>
        </div>

        <div className="care-story__progress" aria-hidden="true"><span ref={progressRef} /></div>
      </div>
    </section>
  );
}
