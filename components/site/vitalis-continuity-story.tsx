"use client";

import { useEffect, useRef } from "react";
import { projectCapsuleToViewport } from "@/components/site/capsule-motion-timeline";
import {
  clamp,
  damp,
  getContinuityMotionState,
} from "@/components/site/continuity-motion-timeline";
import {
  advanceVisualProgress,
  isNarrativeRootInFocus,
  publishVitalisChapter,
} from "@/components/site/narrative-motion";

const metrics = [
  { value: "93%", label: "usam medicamentos diariamente" },
  { value: "87%", label: "já esqueceram uma dose" },
  { value: "67%", label: "têm dificuldade de organização" },
  { value: "13%", label: "usam apps específicos" },
];

const steps = [
  {
    title: "Cadastrar medicamentos",
    description:
      "Informe nome, dosagem, horários e observações de cada remédio.",
  },
  {
    title: "Receber lembretes",
    description:
      "Seja avisado no momento certo para evitar atrasos e esquecimentos.",
  },
  {
    title: "Confirmar cada toma",
    description: "Marque com um toque o que já foi tomado em cada horário.",
  },
  {
    title: "Acompanhar adesão",
    description: "Visualize histórico, constância e pendências do tratamento.",
  },
];

const benefits = [
  {
    title: "Redução de esquecimentos",
    description: "Lembretes claros apoiam a rotina no momento certo.",
  },
  {
    title: "Plantão para familiares",
    description: "Cuidadores acompanham a rotina com menos ruído.",
  },
  {
    title: "Suporte para profissionais",
    description: "Relatórios levam mais contexto para cada consulta.",
  },
  {
    title: "Continuidade do tratamento",
    description: "O acompanhamento visual protege a constância diária.",
  },
  {
    title: "Experiência segura",
    description: "Privacidade e comunicação simples para dados sensíveis.",
  },
];

const format = (value: number) => value.toFixed(4);

export function VitalisContinuityStory() {
  const rootRef = useRef<HTMLElement>(null);
  const phaseRef = useRef<HTMLSpanElement>(null);
  const progressRef = useRef<HTMLSpanElement>(null);
  const mechanismRef = useRef<HTMLElement>(null);
  const benefitsRef = useRef<HTMLElement>(null);
  const mechanismAnchorRef = useRef<HTMLSpanElement>(null);
  const benefitsAnchorRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    const phase = phaseRef.current;
    const progressBar = progressRef.current;
    const mechanismChapter = mechanismRef.current;
    const benefitsChapter = benefitsRef.current;
    const mechanismAnchor = mechanismAnchorRef.current;
    const benefitsAnchor = benefitsAnchorRef.current;

    if (
      !root ||
      !phase ||
      !progressBar ||
      !mechanismChapter ||
      !benefitsChapter ||
      !mechanismAnchor ||
      !benefitsAnchor
    ) {
      return;
    }

    const reducedMotionQuery = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    );
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
    let originX = projectCapsuleToViewport(
      1,
      viewportWidth,
      viewportHeight,
    ).x;
    let activePhase = "";
    let travelDirection = 1;
    let initialHashResolved = false;
    let hashResolutionTimer = 0;
    const documentRoot = document.documentElement;
    documentRoot.dataset.vitalisScrollReady = "false";

    const isEnhanced = () =>
      !reducedMotionQuery.matches && !compactViewportQuery.matches;

    const setNavigationTargets = (enhanced: boolean) => {
      if (enhanced) {
        mechanismChapter.removeAttribute("id");
        benefitsChapter.removeAttribute("id");
        mechanismAnchor.id = "como-funciona";
        benefitsAnchor.id = "beneficios";
      } else {
        mechanismAnchor.removeAttribute("id");
        benefitsAnchor.removeAttribute("id");
        mechanismChapter.id = "como-funciona";
        benefitsChapter.id = "beneficios";
      }
    };

    const updateAnchorPositions = () => {
      const scrollDistance = Math.max(root.offsetHeight - viewportHeight, 1);
      mechanismAnchor.style.top = `${scrollDistance * 0.415}px`;
      benefitsAnchor.style.top = `${scrollDistance * 0.77}px`;
    };

    const readProgress = () => {
      const rect = root.getBoundingClientRect();
      const scrollDistance = Math.max(root.offsetHeight - viewportHeight, 1);
      targetProgress = clamp(-rect.top / scrollDistance);
      needsProgressRead = false;
    };

    const updatePhase = (progress: number) => {
      const nextPhase =
        progress < 0.39
          ? "01 / EVIDÊNCIA"
          : progress < 0.75
            ? "02 / MECANISMO"
            : "03 / CONTINUIDADE";
      const phaseChanged = nextPhase !== activePhase;

      if (phaseChanged) {
        activePhase = nextPhase;
        phase.textContent = nextPhase;
      }

      const chapterSignal =
        nextPhase === "02 / MECANISMO"
          ? {
              activeHref: "#como-funciona",
              id: "mechanism",
              label: "Como funciona",
              tone: "light" as const,
            }
          : nextPhase === "03 / CONTINUIDADE"
            ? {
                activeHref: "#beneficios",
                id: "benefits",
                label: "Benefícios",
                tone: "light" as const,
              }
            : {
                activeHref: null,
                id: "evidence",
                label: "Evidências",
                tone: "light" as const,
              };

      if (
        (phaseChanged ||
          documentRoot.dataset.vitalisChapter !== chapterSignal.id) &&
        isNarrativeRootInFocus(root)
      ) {
        publishVitalisChapter(chapterSignal);
      }
    };

    const applyProgress = (progress: number, delta = 0) => {
      const mobile = viewportWidth < 768;
      const state = getContinuityMotionState(progress, mobile, originX);
      const progressVelocity =
        delta > 0 ? (progress - renderedProgress) / Math.max(delta, 1 / 120) : 0;
      if (progressVelocity > 0.002) {
        travelDirection = 1;
      } else if (progressVelocity < -0.002) {
        travelDirection = -1;
      }
      const targetEnergy =
        clamp(Math.abs(progressVelocity) * 3.4, 0, 1) * state.travelWindow;
      motionEnergy =
        delta > 0
          ? damp(
              motionEnergy,
              targetEnergy,
              targetEnergy > motionEnergy ? 13 : 5.5,
              delta,
            )
          : 0;

      const halo = clamp(
        state.climax * 0.92 + state.benefitsOpacity * 0.26,
      );
      const washX = (state.cursor.x - 50) * 0.17;
      const washY = (state.cursor.y - 50) * 0.12;
      const capsuleSize = mobile
        ? 54 + state.handoffMorph * 74
        : 76 + state.handoffMorph * 110;
      const cursorAngle =
        state.cursor.angle + (travelDirection < 0 ? 180 : 0);

      root.style.cssText = [
        `--story-progress: ${format(state.progress)}`,
        `--story-handoff: ${format(state.handoff)}`,
        `--story-handoff-morph: ${format(state.handoffMorph)}`,
        `--story-evidence: ${format(state.evidenceOpacity)}`,
        `--story-mechanism: ${format(state.mechanismOpacity)}`,
        `--story-benefits: ${format(state.benefitsOpacity)}`,
        `--story-reorganize: ${format(state.reorganize)}`,
        `--story-climax: ${format(state.climax)}`,
        `--story-release: ${format(state.release)}`,
        `--story-energy: ${format(motionEnergy)}`,
        `--story-halo: ${format(halo)}`,
        `--story-trace: ${format(state.tracePath)}`,
        `--story-process-path: ${format(state.processPath)}`,
        `--story-benefit-path: ${format(state.benefitPath)}`,
        `--story-cursor-x: ${state.cursor.x.toFixed(3)}%`,
        `--story-cursor-y: ${state.cursor.y.toFixed(3)}%`,
        `--story-cursor-angle: ${cursorAngle.toFixed(2)}deg`,
        `--story-cursor-opacity: ${format(state.cursor.opacity)}`,
        `--story-cursor-scale: ${format(state.cursor.scale)}`,
        `--story-capsule-size: ${capsuleSize.toFixed(2)}px`,
        `--story-origin-x: ${originX.toFixed(3)}%`,
        `--story-wash-x: ${washX.toFixed(3)}vw`,
        `--story-wash-y: ${washY.toFixed(3)}vh`,
        `--story-depth: ${(1 + state.reorganize * 0.035).toFixed(4)}`,
        `--story-evidence-y: ${(18 - state.evidenceOpacity * 18 - state.reorganize * 12).toFixed(3)}px`,
        `--story-mechanism-y: ${(22 - state.mechanismOpacity * 22).toFixed(3)}px`,
        `--story-benefits-y: ${(24 - state.benefitsOpacity * 24 + state.release * 8).toFixed(3)}px`,
        `--story-halo-scale: ${(0.76 + halo * 0.58).toFixed(4)}`,
        `--story-core-scale: ${(0.9 + state.climax * 0.1).toFixed(4)}`,
        `--story-grid-opacity: ${(0.08 + state.reorganize * 0.14).toFixed(4)}`,
        `--story-evidence-clip: ${((1 - state.evidenceOpacity) * 100).toFixed(3)}%`,
        `--story-mechanism-clip: ${((1 - state.mechanismOpacity) * 100).toFixed(3)}%`,
        `--story-benefits-clip: ${((1 - state.benefitsOpacity) * 100).toFixed(3)}%`,
        ...state.metrics.flatMap((value, index) => [
          `--story-metric-${index + 1}: ${format(value)}`,
          `--story-metric-y-${index + 1}: ${(20 - value * 20).toFixed(3)}px`,
        ]),
        ...state.steps.flatMap((value, index) => [
          `--story-step-${index + 1}: ${format(value)}`,
          `--story-step-y-${index + 1}: ${(18 - value * 18).toFixed(3)}px`,
        ]),
        ...state.benefits.flatMap((value, index) => [
          `--story-benefit-${index + 1}: ${format(value)}`,
          `--story-benefit-y-${index + 1}: ${(18 - value * 18).toFixed(3)}px`,
        ]),
      ].join("; ");

      progressBar.style.transform = `scaleX(${format(progress)})`;
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

    const tick = (now: number) => {
      animationFrame = 0;

      if (
        disposed ||
        document.hidden ||
        !intersectsViewport ||
        !isEnhanced()
      ) {
        return;
      }

      if (needsProgressRead) {
        readProgress();
      }

      const delta = Math.min(Math.max((now - lastTime) / 1000, 0), 0.08);
      lastTime = now;
      currentProgress = advanceVisualProgress(
        currentProgress,
        targetProgress,
        delta,
        {
          maxRate: viewportWidth < 768 ? 0.5 : 0.56,
          smoothing: 5.3,
        },
      );

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
    };

    const resolveInitialHash = () => {
      if (!isEnhanced()) {
        return;
      }

      if (initialHashResolved) {
        documentRoot.dataset.vitalisScrollReady = "true";
        return;
      }

      initialHashResolved = true;
      const target =
        window.location.hash === "#como-funciona"
          ? mechanismAnchor
          : window.location.hash === "#beneficios"
            ? benefitsAnchor
            : null;

      if (!target) {
        documentRoot.dataset.vitalisScrollReady = "true";
        return;
      }

      hashResolutionTimer = window.setTimeout(() => {
        if (disposed) {
          return;
        }

        target.scrollIntoView({ block: "start" });
        documentRoot.dataset.vitalisScrollReady = "true";
      }, 120);
    };

    const syncExperienceMode = () => {
      const enhanced = isEnhanced();
      root.dataset.enhanced = enhanced ? "true" : "false";
      root.dataset.reducedMotion = reducedMotionQuery.matches
        ? "true"
        : "false";
      setNavigationTargets(enhanced);
      window.cancelAnimationFrame(animationFrame);
      animationFrame = 0;

      if (!enhanced) {
        documentRoot.dataset.vitalisScrollReady = "false";
        motionEnergy = 0;
        return;
      }

      updateAnchorPositions();
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
      originX = projectCapsuleToViewport(
        1,
        viewportWidth,
        viewportHeight,
      ).x;
      updateAnchorPositions();
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
      { rootMargin: "120px 0px" },
    );

    const initialRect = root.getBoundingClientRect();
    intersectsViewport =
      initialRect.bottom >= -120 && initialRect.top <= viewportHeight + 120;
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
      delete documentRoot.dataset.vitalisScrollReady;
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
      className="continuity-story"
      data-atmosphere-owner
      aria-label="Da evidência à constância do tratamento"
    >
      <span
        ref={mechanismAnchorRef}
        className="continuity-story__anchor continuity-story__anchor--mechanism"
        aria-label="Como funciona"
        tabIndex={-1}
      />
      <span
        ref={benefitsAnchorRef}
        className="continuity-story__anchor continuity-story__anchor--benefits"
        aria-label="Benefícios"
        tabIndex={-1}
      />

      <div className="continuity-story__stage">
        <div className="continuity-story__atmosphere" aria-hidden="true">
          <span className="continuity-story__wash" />
          <span className="continuity-story__grid" />
          <span className="continuity-story__grain" />
        </div>

        <div className="continuity-story__calibration" aria-hidden="true">
          <span className="continuity-story__calibration-rail continuity-story__calibration-rail--left" />
          <span className="continuity-story__calibration-rail continuity-story__calibration-rail--right" />
          <span className="continuity-story__calibration-pulse" />
        </div>

        <svg
          className="continuity-story__map"
          viewBox="0 0 1000 700"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <defs>
            <linearGradient id="continuity-trace" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#2d6db9" stopOpacity="0.16" />
              <stop offset="0.48" stopColor="#1f67bd" stopOpacity="0.78" />
              <stop offset="1" stopColor="#6ca18f" stopOpacity="0.54" />
            </linearGradient>
            <radialGradient id="continuity-node">
              <stop offset="0" stopColor="#f9fffc" />
              <stop offset="0.38" stopColor="#4d86c8" />
              <stop offset="1" stopColor="#2963a8" />
            </radialGradient>
          </defs>

          <g className="continuity-story__map-desktop">
            <path
              className="continuity-story__trace continuity-story__trace--evidence"
              pathLength="1"
              d="M 270 -12 C 270 82 188 120 180 402 C 248 450 482 128 640 238 C 716 292 500 494 430 427 C 360 360 676 258 820 329"
            />
            <path
              className="continuity-story__trace continuity-story__trace--process"
              pathLength="1"
              d="M 820 329 C 864 414 746 498 170 498 C 326 498 602 498 830 498"
            />
            <g className="continuity-story__benefit-paths">
              <path pathLength="1" d="M 500 371 C 386 356 266 334 122 322" />
              <path pathLength="1" d="M 500 371 C 390 446 296 492 170 515" />
              <path pathLength="1" d="M 500 371 C 614 346 744 316 884 302" />
              <path pathLength="1" d="M 500 371 C 618 448 724 492 850 515" />
              <path pathLength="1" d="M 500 371 C 500 478 500 558 500 635" />
            </g>
            <g className="continuity-story__evidence-nodes">
              {[
                [180, 402],
                [640, 238],
                [430, 427],
                [820, 329],
              ].map(([x, y], index) => (
                <circle
                  key={`metric-node-${index}`}
                  className={`continuity-story__node continuity-story__node--metric-${index + 1}`}
                  cx={x}
                  cy={y}
                  r="5"
                  fill="url(#continuity-node)"
                />
              ))}
            </g>
          </g>

          <g className="continuity-story__map-mobile">
            <path
              className="continuity-story__trace continuity-story__trace--evidence"
              pathLength="1"
              d="M 500 -12 C 500 82 168 112 150 260 C 142 344 834 250 820 334 C 808 426 174 346 150 430 C 124 524 810 414 820 504"
            />
            <path
              className="continuity-story__trace continuity-story__trace--process"
              pathLength="1"
              d="M 112 334 C 108 422 110 508 110 596"
            />
            <g className="continuity-story__benefit-paths">
              <path pathLength="1" d="M 840 273 C 690 310 404 314 90 322" />
              <path pathLength="1" d="M 840 273 C 674 368 394 414 90 448" />
              <path pathLength="1" d="M 840 273 C 650 458 360 522 90 566" />
              <path pathLength="1" d="M 840 273 C 740 470 682 548 618 626" />
              <path pathLength="1" d="M 840 273 C 842 430 844 530 844 632" />
            </g>
          </g>
        </svg>

        <div className="continuity-story__signal" aria-hidden="true">
          <span className="continuity-story__wake" />
          <span className="continuity-story__capsule">
            <i className="continuity-story__capsule-shell" />
            <i className="continuity-story__capsule-seam" />
            <i className="continuity-story__capsule-glint" />
          </span>
          <span className="continuity-story__arrival-ring continuity-story__arrival-ring--outer" />
          <span className="continuity-story__arrival-ring continuity-story__arrival-ring--inner" />
        </div>

        <section className="continuity-chapter continuity-evidence">
          <header className="continuity-chapter__header">
            <p className="continuity-chapter__eyebrow">Evidências da rotina</p>
            <h2>Quando o cuidado depende da memória, a constância fica vulnerável.</h2>
            <p>
              A trajetória revela quatro sinais que tornam a organização do
              tratamento uma necessidade diária.
            </p>
          </header>

          <div className="continuity-evidence__data">
            {metrics.map((metric, index) => (
              <article
                key={metric.label}
                className={`continuity-metric continuity-metric--${index + 1}`}
              >
                <span className="continuity-metric__index">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <p className="continuity-metric__value">{metric.value}</p>
                <p className="continuity-metric__label">{metric.label}</p>
              </article>
            ))}
          </div>

          <p className="continuity-evidence__source">
            Dados exploratórios do projeto. Fonte e recorte metodológico em
            validação.
          </p>
        </section>

        <section
          ref={mechanismRef}
          id="como-funciona"
          className="continuity-chapter continuity-mechanism"
        >
          <header className="continuity-chapter__header">
            <p className="continuity-chapter__eyebrow">Como funciona</p>
            <h2>Uma jornada clara em quatro passos.</h2>
            <p>
              A evidência se reorganiza em um fluxo simples, preciso e fácil de
              acompanhar.
            </p>
          </header>

          <ol className="continuity-steps">
            {steps.map((step, index) => (
              <li
                key={step.title}
                className={`continuity-step continuity-step--${index + 1}`}
              >
                <span className="continuity-step__index">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span className="continuity-step__marker" aria-hidden="true" />
                <h3>{step.title}</h3>
                <p>{step.description}</p>
              </li>
            ))}
          </ol>
        </section>

        <section
          ref={benefitsRef}
          id="beneficios"
          className="continuity-chapter continuity-benefits"
        >
          <header className="continuity-chapter__header">
            <p className="continuity-chapter__eyebrow">Benefícios</p>
            <h2>Mais adesão ao tratamento com menos esforço.</h2>
            <p>
              Quando informação, lembrete e confirmação trabalham juntos, o
              cuidado encontra continuidade.
            </p>
          </header>

          <div className="continuity-benefits__core" aria-hidden="true">
            <span>Vitalis</span>
          </div>

          <ul className="continuity-benefits__list">
            {benefits.map((benefit, index) => (
              <li
                key={benefit.title}
                className={`continuity-benefit continuity-benefit--${index + 1}`}
              >
                <span className="continuity-benefit__index">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <div>
                  <h3>{benefit.title}</h3>
                  <p>{benefit.description}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <div className="continuity-story__status" aria-hidden="true">
          <span ref={phaseRef}>01 / EVIDÊNCIA</span>
          <span>Role para conduzir</span>
        </div>

        <div className="continuity-story__progress" aria-hidden="true">
          <span ref={progressRef} />
        </div>
      </div>
    </section>
  );
}
