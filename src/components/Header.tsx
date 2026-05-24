"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/", label: "Accueil", num: "01" },
  { href: "/methode-camille", label: "La Fondatrice", num: "02" },
  { href: "/#formations", label: "Formations", num: "03" },
  { href: "/#testimonials", label: "Témoignages", num: "04" },
  { href: "/financement", label: "Financement", num: "05" },
];

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => { setIsMenuOpen(false); }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = isMenuOpen ? "hidden" : "unset";
    return () => { document.body.style.overflow = "unset"; };
  }, [isMenuOpen]);

  const toggleMenu = () => setIsMenuOpen((v) => !v);

  return (
    <>
      {/* ── Fixed header bar ──────────────────────────── */}
      <header className="fixed top-0 w-full bg-surface/90 backdrop-blur-sm border-b border-outline-variant/30 z-50">
        <div className="flex items-center justify-between w-full px-4 md:px-margin-desktop py-5 max-w-container-max mx-auto">

          {/* Burger */}
          <div className="flex items-center w-[80px] md:w-[120px]">
            <button
              onClick={toggleMenu}
              aria-label={isMenuOpen ? "Fermer le menu" : "Ouvrir le menu"}
              aria-expanded={isMenuOpen}
              className="text-primary hover:opacity-70 transition-[opacity,transform] duration-200 active:scale-[0.97] flex items-center justify-center p-2 -ml-2"
            >
              <span
                className="material-symbols-outlined text-[24px] md:text-[28px]"
                style={{ fontVariationSettings: "'FILL' 0, 'wght' 300, 'GRAD' 0, 'opsz' 24" }}
              >
                {isMenuOpen ? "close" : "menu"}
              </span>
            </button>
          </div>

          {/* Brand → homepage */}
          <div className="flex-1 flex justify-center overflow-hidden z-[60]">
            <Link
              href="/"
              onClick={() => setIsMenuOpen(false)}
              className="font-headline-md text-[12px] xs:text-[14px] md:text-[18px] lg:text-[20px] tracking-widest text-on-surface uppercase whitespace-nowrap overflow-hidden text-ellipsis text-center hover:text-primary transition-colors duration-200"
            >
              Beauty Home Concept
            </Link>
          </div>

          {/* S'inscrire */}
          <div className="flex items-center justify-end w-[80px] md:w-[120px] z-[60]">
            <Link
              href="/#formations"
              onClick={() => setIsMenuOpen(false)}
              className="text-primary font-label-caps text-[10px] md:text-label-caps hover:opacity-70 transition-[opacity,transform] duration-200 active:scale-[0.97] whitespace-nowrap tracking-widest pb-[2px] border-b border-transparent hover:border-primary"
            >
              Formations
            </Link>
          </div>
        </div>
      </header>

      {/* ── Menu overlay ─────────────────────────────── */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Navigation principale"
        className={`fixed inset-0 bg-surface-container-lowest z-40 flex flex-col transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${
          isMenuOpen ? "translate-y-0" : "-translate-y-full"
        }`}
      >
        {/* Space reserved for the fixed header */}
        <div className="h-[72px] flex-shrink-0" />

        {/* Nav links */}
        <nav className="flex-1 flex flex-col justify-center px-margin-mobile md:px-margin-desktop overflow-y-auto">
          <div className="divide-y divide-outline-variant/25 max-w-2xl">
            {NAV_ITEMS.map(({ href, label, num }) => (
              <Link
                key={href}
                href={href}
                onClick={toggleMenu}
                className="group flex items-baseline justify-between py-6 md:py-8 hover:text-primary transition-colors duration-300"
              >
                <span className="font-playfair text-[clamp(2rem,6vw,4rem)] text-on-surface group-hover:text-primary transition-colors duration-300 leading-none">
                  {label}
                </span>
                <span className="font-label-caps text-[9px] text-on-surface-variant uppercase tracking-[0.3em] flex-shrink-0 ml-4">
                  {num}
                </span>
              </Link>
            ))}
          </div>
        </nav>

        {/* Bottom bar: socials + admin */}
        <div className="border-t border-outline-variant/25 px-margin-mobile md:px-margin-desktop py-8 flex items-center justify-between flex-shrink-0">
          <div className="flex gap-8">
            <a
              href="https://www.instagram.com/beauty_home.concept"
              target="_blank"
              rel="noreferrer"
              className="font-label-caps text-[10px] tracking-[0.2em] uppercase text-on-surface-variant hover:text-primary transition-colors duration-200"
            >
              Instagram
            </a>
            <a
              href="https://www.tiktok.com/@beautyhomeconcept"
              target="_blank"
              rel="noreferrer"
              className="font-label-caps text-[10px] tracking-[0.2em] uppercase text-on-surface-variant hover:text-primary transition-colors duration-200"
            >
              TikTok
            </a>
          </div>
          <Link
            href="/admin"
            onClick={toggleMenu}
            className="font-label-caps text-[9px] tracking-widest uppercase text-on-surface-variant/30 hover:text-on-surface-variant transition-colors duration-200"
          >
            Admin
          </Link>
        </div>
      </div>
    </>
  );
}
