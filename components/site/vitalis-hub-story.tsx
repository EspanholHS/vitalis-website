"use client";

import Link from "next/link";
import { useEffect, useRef, type CSSProperties } from "react";
import { clamp } from "@/components/site/continuity-motion-timeline";
import { getHubMotionState } from "@/components/site/hub-motion-timeline";
import {
  advanceVisualProgress,
  isNarrativeRootInFocus,
  publishVitalisChapter,
} from "@/components/site/narrative-motion";

const actions = [
  "Consultar medicamento",
  "Cadastrar medicamento",
  "Registrar horários e frequência",
  "Confirmar uma tomada",
  "Visualizar próximas tomadas",
  "Listar pendências",
  "Acompanhar medicamentos cadastrados",
  "Consultar histórico de confirmações",
  "Receber lembretes",
  "Acessar a rotina organizada",
];

const format = (value: number) => value.toFixed(4);

export function VitalisHubStory() {
  const rootRef = useRef<HTMLElement>(null);
  const progressRef = useRef<HTMLSpanElement>(null);
  const phaseRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    const progressBar = progressRef.current;
    const phase = phaseRef.current;

    if (!root || !progressBar || !phase) {
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
    let lastTime = performance.now();
    let viewportWidth = window.innerWidth;
    let viewportHeight = window.innerHeight;
    let activePhase = "";

    const isEnhanced = () =>
      !reducedMotionQuery.matches && !compactViewportQuery.matches;

    const readProgress = () => {
      const rect = root.getBoundingClientRect();
      const scrollDistance = Math.max(root.offsetHeight - viewportHeight, 1);
      targetProgress = clamp(-rect.top / scrollDistance);
      needsProgressRead = false;
    };

    const updateChapter = (progress: number) => {
      const nextPhase =
        progress < 0.36
          ? "01 / PASSAGEM"
          : progress < 0.76
            ? "02 / CONVERGÊNCIA"
            : "03 / HUB VITALIS";
      const tone = progress < 0.16 ? "light" : "dark";
      const phaseChanged = nextPhase !== activePhase;

      if (phaseChanged) {
        activePhase = nextPhase;
        phase.textContent = nextPhase;
      }

      if (
        isNarrativeRootInFocus(root) &&
        (phaseChanged ||
          document.documentElement.dataset.vitalisChapter !== "hub" ||
          document.documentElement.dataset.vitalisTone !== tone)
      ) {
        publishVitalisChapter({
          activeHref: "#hub",
          id: "hub",
          label: "HUB",
          tone,
        });
      }
    };

    const applyProgress = (progress: number) => {
      const mobile = viewportWidth < 768;
      const state = getHubMotionState(progress, mobile);
      root.style.cssText = [
        "--hub-progress: " + format(state.progress),
        "--hub-handoff: " + format(state.handoff),
        "--hub-aperture: " + format(state.aperture),
        "--hub-travel: " + format(state.travel),
        "--hub-environment: " + format(state.environment),
        "--hub-content: " + format(state.content),
        "--hub-heading: " + format(state.heading),
        "--hub-assembly: " + format(state.assembly),
        "--hub-core: " + format(state.core),
        "--hub-layout: " + format(state.layout),
        "--hub-stream: " + format(state.stream),
        "--hub-wordmark: " + format(state.wordmark),
        "--hub-settle: " + format(state.settle),
        "--hub-pulse: " + format(state.pulse),
        "--hub-depth-z: " + (-1080 + state.travel * 1110).toFixed(2) + "px",
        "--hub-depth-scale: " + (0.5 + state.travel * 0.5).toFixed(4),
        "--hub-handoff-scale: " + (1 - state.travel * 0.44).toFixed(4),
        "--hub-handoff-y: " + (-state.travel * 6.5).toFixed(3) + "vh",
        "--hub-heading-y: " + (30 - state.heading * 30).toFixed(3) + "px",
        "--hub-heading-left: " + (50 - state.layout * 43).toFixed(3) + "%",
        "--hub-heading-x: " + (-50 + state.layout * 50).toFixed(3) + "%",
        "--hub-stack-left: " + (50 + state.layout * 20).toFixed(3) + "%",
        ...state.interfaces.map(
          (value, index) => "--hub-interface-" + (index + 1) + ": " + format(value),
        ),
      ].join("; ");

      progressBar.style.transform = "scaleX(" + format(progress) + ")";
      updateChapter(progress);
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
        maxRate: viewportWidth < 768 ? 0.43 : 0.49,
        smoothing: viewportWidth < 768 ? 4.7 : 5,
      });

      if (Math.abs(currentProgress - targetProgress) < 0.00008) {
        currentProgress = targetProgress;
      }

      applyProgress(currentProgress);

      if (
        needsProgressRead ||
        currentProgress !== targetProgress
      ) {
        animationFrame = window.requestAnimationFrame(tick);
      }
    }

    const syncExperienceMode = () => {
      const enhanced = isEnhanced();
      root.dataset.enhanced = enhanced ? "true" : "false";
      root.dataset.reducedMotion = reducedMotionQuery.matches ? "true" : "false";
      window.cancelAnimationFrame(animationFrame);
      animationFrame = 0;

      if (!enhanced) {
        root.removeAttribute("style");
        progressBar.removeAttribute("style");
        publishVitalisChapter({
          activeHref: "#hub",
          id: "hub",
          label: "HUB",
          tone: "dark",
        });
        return;
      }

      needsProgressRead = true;
      readProgress();
      currentProgress = targetProgress;
      applyProgress(currentProgress);
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
      id="hub"
      className="hub-story"
      data-atmosphere-owner
      data-header-section="hub"
      data-header-label="HUB"
      data-header-tone="dark"
      data-header-href="#hub"
      aria-labelledby="hub-story-title"
    >
      <div className="hub-story__stage">
        <div className="hub-story__environment" aria-hidden="true">
          <span className="hub-story__darkness" />
          <span className="hub-story__aurora hub-story__aurora--blue" />
          <span className="hub-story__aurora hub-story__aurora--mint" />
          <span className="hub-story__wordmark">HUB</span>
          <span className="hub-story__light-beam hub-story__light-beam--one" />
          <span className="hub-story__light-beam hub-story__light-beam--two" />
          <span className="hub-story__vignette" />
          <span className="hub-story__grain" />
        </div>

        <div className="hub-story__handoff" aria-hidden="true">
          <span className="hub-story__handoff-plane hub-story__handoff-plane--one" />
          <span className="hub-story__handoff-plane hub-story__handoff-plane--two" />
          <span className="hub-story__handoff-line" />
          <span className="hub-story__handoff-capsule">
            <i />
          </span>
          <span className="hub-story__handoff-label">continuidade / 03</span>
        </div>

        <div className="hub-story__fog" aria-hidden="true">
          <span className="hub-story__fog-plane hub-story__fog-plane--one" />
          <span className="hub-story__fog-plane hub-story__fog-plane--two" />
          <span className="hub-story__fog-plane hub-story__fog-plane--three" />
        </div>

        <div className="hub-story__space" aria-hidden="true">
          <span className="hub-story__gate hub-story__gate--far" />
          <span className="hub-story__gate hub-story__gate--middle" />
          <span className="hub-story__gate hub-story__gate--near" />
          <svg
            className="hub-story__perspective-lines"
            viewBox="0 0 1000 1000"
            preserveAspectRatio="none"
          >
            <path d="M60 0 L500 500 L940 0" />
            <path d="M0 220 L500 500 L1000 220" />
            <path d="M0 820 L500 500 L1000 820" />
            <path d="M170 1000 L500 500 L830 1000" />
          </svg>
        </div>

        <div className="hub-story__interface">
          <header className="hub-story__heading">
            <p className="hub-story__eyebrow">
              HUB VITALIS / ECOSSISTEMA CONECTADO
            </p>
            <h2 id="hub-story-title" className="vitalis-display">
              Tudo converge. O cuidado continua.
            </h2>
            <p className="hub-story__intro">
              Web App, Mobile App e WhatsApp compartilham a mesma rotina,
              sem perder contexto entre um momento e outro.
            </p>
          </header>

          <div className="hub-story__system">
            <svg
              className="hub-story__data-field"
              viewBox="0 0 1200 720"
              preserveAspectRatio="none"
              aria-hidden="true"
            >
              <path pathLength="1" d="M36 512 C250 210 448 650 644 354 S940 88 1164 244" />
              <path pathLength="1" d="M70 628 C302 398 438 170 690 338 S980 614 1150 458" />
              <path pathLength="1" d="M110 292 C312 472 476 252 650 350 S940 472 1100 180" />
              <circle cx="650" cy="350" r="170" />
              <circle cx="650" cy="350" r="270" />
            </svg>

            <div className="hub-story__product-stack">
              <article className="hub-story__web-plane">
                <header>
                  <span className="hub-story__plane-mark" aria-hidden="true">V</span>
                  <div>
                    <p>Web App</p>
                    <h3>Painel da rotina</h3>
                  </div>
                  <span className="hub-story__live-status">SINCRONIZADO</span>
                </header>
                <div className="hub-story__web-content" aria-hidden="true">
                  <div className="hub-story__schedule">
                    <span>PRÓXIMAS TOMADAS</span>
                    <div><i>08:00</i><b>Losartana</b><em>Confirmada</em></div>
                    <div><i>12:30</i><b>Metformina</b><em>Pendente</em></div>
                    <div><i>20:00</i><b>Sinvastatina</b><em>Programada</em></div>
                  </div>
                  <div className="hub-story__adherence">
                    <span>ADESÃO / 7 DIAS</span>
                    <strong>92<small>%</small></strong>
                    <div>{Array.from({ length: 7 }, (_, index) => <i key={index} />)}</div>
                  </div>
                </div>
              </article>

              <article className="hub-story__mobile-plane">
                <div className="hub-story__phone-sensor" aria-hidden="true" />
                <header>
                  <span>Mobile App</span>
                  <i aria-hidden="true" />
                </header>
                <p>PRÓXIMA TOMADA</p>
                <strong>08:00</strong>
                <h3>Losartana</h3>
                <span className="hub-story__dose">50 mg · 1 comprimido</span>
                <div className="hub-story__confirm">Confirmar tomada</div>
                <div className="hub-story__phone-progress" aria-hidden="true">
                  <span /><span /><span />
                </div>
              </article>

              <article className="hub-story__whatsapp-plane">
                <header>
                  <span aria-hidden="true">WA</span>
                  <div>
                    <p>WhatsApp</p>
                    <h3>Acesso rápido à rotina</h3>
                  </div>
                </header>
                <div className="hub-story__wa-actions" aria-hidden="true">
                  <span>Próximas tomadas</span>
                  <span>Confirmar agora</span>
                  <span>Ver pendências</span>
                </div>
              </article>

              <div className="hub-story__core" aria-hidden="true">
                <span className="hub-story__core-orbit hub-story__core-orbit--one" />
                <span className="hub-story__core-orbit hub-story__core-orbit--two" />
                <span className="hub-story__core-capsule"><i /></span>
                <span className="hub-story__core-label">VITALIS / CORE</span>
              </div>
            </div>

            <div className="hub-story__capability-belt" aria-label="Funcionalidades do HUB">
              <p>Uma rotina, dez ações conectadas</p>
              <ol>
                {actions.map((action, index) => (
                  <li
                    key={action}
                    style={{ "--action-index": index + 1 } as CSSProperties}
                  >
                    <span aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
                    <b>{action}</b>
                  </li>
                ))}
              </ol>
            </div>
          </div>

          <div className="hub-story__cta-wrap">
            <p>Três acessos. Um histórico. A mesma continuidade.</p>
            <Link href="/hub" className="hub-story__cta">
              <span>Entrar no HUB</span>
              <span aria-hidden="true">↗</span>
            </Link>
          </div>
        </div>

        <div className="hub-story__status" aria-hidden="true">
          <span ref={phaseRef}>01 / PASSAGEM</span>
          <span>AMBIENTE VITALIS / HUB</span>
        </div>
        <div className="hub-story__progress" aria-hidden="true">
          <span ref={progressRef} />
        </div>
      </div>
    </section>
  );
}
