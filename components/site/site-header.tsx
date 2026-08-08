"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  publishVitalisChapter,
  VITALIS_CHAPTER_EVENT,
  type VitalisChapterSignal,
} from "@/components/site/narrative-motion";
import { BrandMark } from "./brand-mark";

const navItems = [
  { hash: "#como-funciona", href: "/#como-funciona", label: "Como funciona" },
  { hash: "#beneficios", href: "/#beneficios", label: "Benefícios" },
  { hash: "#funcionalidades", href: "/#funcionalidades", label: "Funcionalidades" },
  { hash: "#hub", href: "/#hub", label: "HUB" },
  { hash: "#faq", href: "/#faq", label: "FAQ" },
];

const initialChapter: VitalisChapterSignal = {
  activeHref: null,
  id: "hero",
  label: "Início",
  tone: "light",
};

export function SiteHeader() {
  const [isOpen, setIsOpen] = useState(false);
  const [chapter, setChapter] = useState<VitalisChapterSignal>(initialChapter);
  const headerRef = useRef<HTMLElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const handleChapterChange = (event: Event) => {
      setChapter((event as CustomEvent<VitalisChapterSignal>).detail);
    };

    const sections = Array.from(
      document.querySelectorAll<HTMLElement>("[data-header-section]"),
    );
    const sectionObserver = new IntersectionObserver(
      (entries) => {
        const activeEntry = entries.find((entry) => entry.isIntersecting);

        if (!activeEntry) {
          return;
        }

        const node = activeEntry.target as HTMLElement;
        publishVitalisChapter({
          activeHref: node.dataset.headerHref || null,
          id: node.dataset.headerSection || "content",
          label: node.dataset.headerLabel || "Vitalis",
          tone: node.dataset.headerTone === "dark" ? "dark" : "light",
        });
      },
      { rootMargin: "-28% 0px -58% 0px", threshold: 0 },
    );

    sections.forEach((section) => sectionObserver.observe(section));
    window.addEventListener(VITALIS_CHAPTER_EVENT, handleChapterChange);

    return () => {
      sectionObserver.disconnect();
      window.removeEventListener(VITALIS_CHAPTER_EVENT, handleChapterChange);
    };
  }, []);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") {
        return;
      }

      setIsOpen(false);
      triggerRef.current?.focus();
    };

    const handlePointerDown = (event: PointerEvent) => {
      if (!headerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("pointerdown", handlePointerDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [isOpen]);

  const closeMenu = () => setIsOpen(false);

  return (
    <header
      ref={headerRef}
      className="site-header"
      data-open={isOpen ? "true" : "false"}
      data-tone={chapter.tone}
    >
      <div className="site-header__inner">
        <BrandMark tone={chapter.tone} />

        <nav className="site-header__nav" aria-label="Navegação principal">
          {navItems.map((item) => {
            const isActive = chapter.activeHref === item.hash;

            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive ? "location" : undefined}
                className="site-header__link"
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="site-header__actions">
          <span className="site-header__chapter" aria-live="polite">
            {chapter.label}
          </span>
          <Link href="/entrar" className="site-header__cta">
            Começar agora
          </Link>
          <button
            ref={triggerRef}
            type="button"
            aria-controls="site-mobile-menu"
            aria-expanded={isOpen}
            aria-label={isOpen ? "Fechar menu" : "Abrir menu"}
            onClick={() => setIsOpen((current) => !current)}
            className="site-header__trigger"
          >
            <span aria-hidden="true">
              <i />
              <i />
            </span>
          </button>
        </div>
      </div>

      {isOpen ? (
        <div id="site-mobile-menu" className="site-header__mobile-menu">
          <nav aria-label="Navegação mobile">
            {navItems.map((item) => {
              const isActive = chapter.activeHref === item.hash;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={isActive ? "location" : undefined}
                  onClick={closeMenu}
                >
                  <span>{item.label}</span>
                  <span aria-hidden="true">↗</span>
                </Link>
              );
            })}
            <Link
              href="/entrar"
              onClick={closeMenu}
              className="site-header__mobile-cta"
            >
              Começar agora
            </Link>
          </nav>
        </div>
      ) : null}
    </header>
  );
}



