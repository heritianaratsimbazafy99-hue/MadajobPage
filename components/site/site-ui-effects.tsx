"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

export function SiteUiEffects() {
  const pathname = usePathname();

  useEffect(() => {
    const header = document.querySelector<HTMLElement>(".site-header");
    const navToggle = document.querySelector<HTMLButtonElement>(".nav-toggle");
    const siteNav = document.querySelector<HTMLElement>(".site-nav");

    const syncHeader = () => {
      header?.classList.toggle("scrolled", window.scrollY > 12);
    };

    syncHeader();
    window.addEventListener("scroll", syncHeader, { passive: true });

    const handleToggle = () => {
      if (!navToggle || !siteNav) {
        return;
      }

      const isOpen = siteNav.classList.toggle("is-open");
      navToggle.setAttribute("aria-expanded", String(isOpen));
    };

    navToggle?.addEventListener("click", handleToggle);

    const links = Array.from(document.querySelectorAll<HTMLAnchorElement>(".site-nav a"));
    const cleanPath = pathname === "/" ? "/" : pathname.replace(/\/$/, "");

    links.forEach((link) => {
      const href = link.getAttribute("href") ?? "";
      const hrefPath = href === "/" ? "/" : href.replace(/\/$/, "");
      const isActive =
        hrefPath === cleanPath ||
        (hrefPath === "/candidats" && cleanPath.startsWith("/candidats")) ||
        (hrefPath === "/formation" && cleanPath.startsWith("/formation")) ||
        (hrefPath === "/externalisation" && cleanPath.startsWith("/externalisation")) ||
        (hrefPath === "/entreprise" && cleanPath.startsWith("/entreprise")) ||
        (hrefPath === "/carrieres" && cleanPath.startsWith("/carrieres"));

      link.classList.toggle("is-active", isActive);

      const closeMenu = () => {
        siteNav?.classList.remove("is-open");
        navToggle?.setAttribute("aria-expanded", "false");
      };

      link.addEventListener("click", closeMenu);
    });

    document.querySelectorAll<HTMLElement>("[data-year]").forEach((node) => {
      node.textContent = String(new Date().getFullYear());
    });

    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            revealObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.2 }
    );

    document.querySelectorAll<HTMLElement>("[data-reveal]").forEach((node) => {
      revealObserver.observe(node);
    });

    const formatCount = (value: number) => new Intl.NumberFormat("fr-FR").format(value);

    const counterObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) {
            return;
          }

          const node = entry.target as HTMLElement;
          const target = Number(node.dataset.count || "0");
          const prefix = node.dataset.prefix || "";
          const suffix = node.dataset.suffix || "";
          const duration = 1400;
          const start = performance.now();

          const tick = (now: number) => {
            const progress = Math.min((now - start) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            const value = Math.round(target * eased);
            node.textContent = `${prefix}${formatCount(value)}${suffix}`;

            if (progress < 1) {
              requestAnimationFrame(tick);
            }
          };

          requestAnimationFrame(tick);
          counterObserver.unobserve(node);
        });
      },
      { threshold: 0.45 }
    );

    document.querySelectorAll<HTMLElement>("[data-count]").forEach((node) => {
      counterObserver.observe(node);
    });

    return () => {
      window.removeEventListener("scroll", syncHeader);
      navToggle?.removeEventListener("click", handleToggle);
      revealObserver.disconnect();
      counterObserver.disconnect();
    };
  }, [pathname]);

  return null;
}
