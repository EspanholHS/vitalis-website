"use client";

import { useEffect, useRef } from "react";
import {
  VITALIS_CHAPTER_EVENT,
  type VitalisChapterSignal,
} from "@/components/site/narrative-motion";

function clamp(value: number, minimum = 0, maximum = 1) {
  return Math.min(Math.max(value, minimum), maximum);
}

type ScrollAtmosphereProps = {
  variant?: "site" | "dashboard";
};

export function ScrollAtmosphere({ variant = "site" }: ScrollAtmosphereProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const blueRef = useRef<HTMLDivElement>(null);
  const sageRef = useRef<HTMLDivElement>(null);
  const pearlRef = useRef<HTMLDivElement>(null);
  const veilRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    const blue = blueRef.current;
    const sage = sageRef.current;
    const pearl = pearlRef.current;
    const veil = veilRef.current;

    if (!root || !blue || !sage || !pearl || !veil) {
      return;
    }

    const reducedMotionQuery = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    );
    const finePointerQuery = window.matchMedia("(pointer: fine)");
    const opacityMultiplier = variant === "dashboard" ? 1.75 : 1;
    const pointerScale = variant === "dashboard" ? 2.45 : 1;
    const reducedOpacity = variant === "dashboard" ? 0.2 : 0.16;
    let animationFrame = 0;
    let disposed = false;
    let storyOwnsAtmosphere = false;
    const visibleAtmosphereOwners = new Set<Element>();
    let lastTime = performance.now();
    let currentScroll = 0;
    let targetScroll = 0;
    let currentPointerX = 0;
    let currentPointerY = 0;
    let targetPointerX = 0;
    let targetPointerY = 0;
    let currentChapter = 0;
    let targetChapter = 0;

    const getChapterValue = (chapterId?: string) => {
      const values: Record<string, number> = {
        hero: 0,
        evidence: 0.16,
        mechanism: 0.34,
        benefits: 0.52,
        capabilities: 0.76,
        personas: 0.86,
        connection: 0.92,
        hub: 0.9,
        experiences: 0.58,
        faq: 0.34,
        finale: 0.88,
      };

      return chapterId ? (values[chapterId] ?? 0.42) : 0;
    };

    const readScrollProgress = () => {
      const scrollDistance = Math.max(
        document.documentElement.scrollHeight - window.innerHeight,
        1,
      );
      targetScroll = clamp(window.scrollY / scrollDistance);
    };

    const applyFrame = () => {
      const progress = currentScroll;
      const chapter = currentChapter;
      const wave = Math.sin(progress * Math.PI * 1.7);
      const counterWave = Math.sin(progress * Math.PI * 2.1 + 1.2);

      root.style.opacity = ((0.24 + Math.abs(wave) * 0.1 + chapter * 0.045) * opacityMultiplier).toFixed(3);
      blue.style.transform = `translate3d(${(-12 + progress * 28 + currentPointerX * 1.4 * pointerScale + chapter * 4).toFixed(2)}vw, ${(3 + wave * 10 + currentPointerY * pointerScale - chapter * 3).toFixed(2)}vh, 0) rotate(${(-9 + progress * 18 + chapter * 5).toFixed(2)}deg) scale(${(0.96 + progress * 0.08 + chapter * 0.035).toFixed(3)})`;
      sage.style.transform = `translate3d(${(11 - progress * 24 - currentPointerX * pointerScale - chapter * 5).toFixed(2)}vw, ${(-5 + counterWave * 8 - currentPointerY * 0.7 * pointerScale + chapter * 2).toFixed(2)}vh, 0) rotate(${(8 - progress * 15 - chapter * 4).toFixed(2)}deg) scale(${(1.04 - progress * 0.07 + chapter * 0.025).toFixed(3)})`;
      pearl.style.transform = `translate3d(${(-4 + counterWave * 9 + currentPointerX * 0.6 * pointerScale).toFixed(2)}vw, ${(15 - progress * 30 + wave * 4 + currentPointerY * 0.45 * pointerScale).toFixed(2)}vh, 0) rotate(${(14 - progress * 27).toFixed(2)}deg) scale(${(0.92 + Math.abs(counterWave) * 0.12).toFixed(3)})`;
      veil.style.transform = `translate3d(0, ${(progress * 10 - 5).toFixed(2)}vh, 0) rotate(${(-3 + progress * 6).toFixed(2)}deg)`;
      veil.style.opacity = (0.28 + Math.abs(counterWave) * 0.16).toFixed(3);
    };

    const applyReducedFrame = () => {
      currentScroll = targetScroll;
      currentPointerX = 0;
      currentPointerY = 0;
      root.style.opacity = reducedOpacity.toFixed(2);
      blue.style.transform = "translate3d(-4vw, 2vh, 0)";
      sage.style.transform = "translate3d(5vw, -2vh, 0)";
      pearl.style.transform = "translate3d(0, 4vh, 0)";
      veil.style.transform = "none";
      veil.style.opacity = "0.24";
    };

    const tick = (now: number) => {
      animationFrame = 0;

      if (disposed || document.hidden || storyOwnsAtmosphere) {
        return;
      }

      if (reducedMotionQuery.matches) {
        applyReducedFrame();
        return;
      }

      const delta = Math.min(Math.max((now - lastTime) / 1000, 0), 0.08);
      lastTime = now;
      const scrollDamping = 1 - Math.exp(-delta * 5.8);
      const pointerDamping = 1 - Math.exp(-delta * 4.2);

      currentScroll += (targetScroll - currentScroll) * scrollDamping;
      currentPointerX += (targetPointerX - currentPointerX) * pointerDamping;
      currentPointerY += (targetPointerY - currentPointerY) * pointerDamping;
      currentChapter +=
        (targetChapter - currentChapter) * (1 - Math.exp(-delta * 3.8));
      applyFrame();

      const isSettled =
        Math.abs(targetScroll - currentScroll) < 0.0005 &&
        Math.abs(targetPointerX - currentPointerX) < 0.01 &&
        Math.abs(targetPointerY - currentPointerY) < 0.01 &&
        Math.abs(targetChapter - currentChapter) < 0.002;

      if (!isSettled) {
        animationFrame = window.requestAnimationFrame(tick);
      }
    };

    const scheduleFrame = () => {
      if (
        animationFrame === 0 &&
        !document.hidden &&
        !storyOwnsAtmosphere
      ) {
        lastTime = performance.now();
        animationFrame = window.requestAnimationFrame(tick);
      }
    };

    const handleScroll = () => {
      if (storyOwnsAtmosphere) {
        return;
      }

      readScrollProgress();
      scheduleFrame();
    };

    const handlePointerMove = (event: PointerEvent) => {
      if (
        storyOwnsAtmosphere ||
        !finePointerQuery.matches ||
        reducedMotionQuery.matches
      ) {
        return;
      }

      targetPointerX = (event.clientX / window.innerWidth - 0.5) * 2;
      targetPointerY = (event.clientY / window.innerHeight - 0.5) * 2;
      scheduleFrame();
    };

    const handlePointerLeave = () => {
      targetPointerX = 0;
      targetPointerY = 0;
      scheduleFrame();
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        window.cancelAnimationFrame(animationFrame);
        animationFrame = 0;
        return;
      }

      readScrollProgress();
      scheduleFrame();
    };

    const handleMotionPreference = () => {
      readScrollProgress();

      if (storyOwnsAtmosphere) {
        window.cancelAnimationFrame(animationFrame);
        animationFrame = 0;
      } else if (reducedMotionQuery.matches) {
        window.cancelAnimationFrame(animationFrame);
        animationFrame = 0;
        applyReducedFrame();
      } else {
        scheduleFrame();
      }
    };

    const handleChapterChange = (event: Event) => {
      const detail = (event as CustomEvent<VitalisChapterSignal>).detail;
      targetChapter = getChapterValue(detail.id);
      scheduleFrame();
    };

    readScrollProgress();
    currentScroll = targetScroll;
    targetChapter = getChapterValue(
      document.documentElement.dataset.vitalisChapter,
    );
    currentChapter = targetChapter;
    if (reducedMotionQuery.matches) {
      applyReducedFrame();
    } else {
      applyFrame();
    }

    const atmosphereOwners = Array.from(
      document.querySelectorAll<HTMLElement>("[data-atmosphere-owner]"),
    );
    const storyObserver = atmosphereOwners.length
      ? new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              if (entry.isIntersecting) {
                visibleAtmosphereOwners.add(entry.target);
              } else {
                visibleAtmosphereOwners.delete(entry.target);
              }
            });

            const nextStoryOwnership = visibleAtmosphereOwners.size > 0;
            if (nextStoryOwnership === storyOwnsAtmosphere) {
              return;
            }

            storyOwnsAtmosphere = nextStoryOwnership;
            root.dataset.suspended = storyOwnsAtmosphere ? "true" : "false";

            if (storyOwnsAtmosphere) {
              window.cancelAnimationFrame(animationFrame);
              animationFrame = 0;
            } else {
              readScrollProgress();
              scheduleFrame();
            }
          },
          { rootMargin: "80px 0px" },
        )
      : null;

    if (storyObserver) {
      atmosphereOwners.forEach((owner) => storyObserver.observe(owner));
    }

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll);
    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    document.documentElement.addEventListener("pointerleave", handlePointerLeave);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener(VITALIS_CHAPTER_EVENT, handleChapterChange);
    reducedMotionQuery.addEventListener("change", handleMotionPreference);

    return () => {
      disposed = true;
      window.cancelAnimationFrame(animationFrame);
      storyObserver?.disconnect();
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
      window.removeEventListener("pointermove", handlePointerMove);
      document.documentElement.removeEventListener(
        "pointerleave",
        handlePointerLeave,
      );
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener(VITALIS_CHAPTER_EVENT, handleChapterChange);
      reducedMotionQuery.removeEventListener("change", handleMotionPreference);
    };
  }, [variant]);

  return (
    <div
      ref={rootRef}
      className={`site-scroll-atmosphere site-scroll-atmosphere--${variant}`}
      aria-hidden="true"
    >
      <div
        ref={blueRef}
        className="site-scroll-atmosphere__field site-scroll-atmosphere__field--blue"
      />
      <div
        ref={sageRef}
        className="site-scroll-atmosphere__field site-scroll-atmosphere__field--sage"
      />
      <div
        ref={pearlRef}
        className="site-scroll-atmosphere__field site-scroll-atmosphere__field--pearl"
      />
      <div ref={veilRef} className="site-scroll-atmosphere__veil" />
    </div>
  );
}




