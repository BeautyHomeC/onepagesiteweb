"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/", label: "Accueil" },
  { href: "/methode-camille", label: "La Fondatrice" },
  { href: "/#formations", label: "Formations" },
  { href: "/#testimonials", label: "Témoignages" },
  { href: "/financement", label: "Financement" },
  { href: "/calendrier", label: "Calendrier" },
];

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => { setIsMenuOpen(false); }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = isMenuOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isMenuOpen]);

  const toggle = () => setIsMenuOpen(v => !v);

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href.split("#")[0]) && href.split("#")[0].length > 1;
  };

  return (
    <>
      {/* ── Fixed header bar ──────────────────────────── */}
      <header className="fixed top-0 w-full bg-surface/90 backdrop-blur-sm border-b border-outline-variant/30 z-50">
        <div className="flex items-center justify-between w-full px-4 md:px-margin-desktop py-5 max-w-container-max mx-auto">

          {/* Burger */}
          <div className="flex items-center w-[80px] md:w-[120px]">
            <button
              onClick={toggle}
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

          {/* Brand */}
          <div className="flex-1 flex justify-center overflow-hidden z-[60]">
            <Link
              href="/"
              onClick={() => setIsMenuOpen(false)}
              className="font-headline-md text-[12px] xs:text-[14px] md:text-[18px] lg:text-[20px] tracking-widest text-on-surface uppercase whitespace-nowrap overflow-hidden text-ellipsis text-center hover:text-primary transition-colors duration-200"
            >
              Beauty Home Concept
            </Link>
          </div>

          {/* Formations CTA */}
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

      {/* ── Mobile drawer overlay ─────────────────────── */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Navigation principale"
        className={`fixed inset-0 bg-surface-container-lowest z-40 flex flex-col transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${
          isMenuOpen ? "translate-y-0" : "-translate-y-full"
        }`}
      >
        {/* Header row: MENU label + close */}
        <div className="flex justify-between items-center w-full px-margin-mobile md:px-margin-desktop py-5 border-b border-outline-variant/20 mt-[72px]">
          <span
            className="font-label-caps text-[10px] tracking-[0.2em] text-on-surface-variant uppercase"
            style={{ fontFamily: 'var(--font-hanken)' }}
          >
            MENU
          </span>
          <button
            onClick={toggle}
            aria-label="Fermer le menu"
            className="p-2 -mr-2 text-on-surface hover:text-primary transition-colors duration-300"
          >
            <span
              className="material-symbols-outlined text-[22px]"
              style={{ fontVariationSettings: "'FILL' 0, 'wght' 300, 'GRAD' 0, 'opsz' 24" }}
            >
              close
            </span>
          </button>
        </div>

        {/* Nav links — vertically centred */}
        <nav className="flex-1 flex flex-col justify-center px-margin-mobile md:px-margin-desktop gap-6 overflow-y-auto py-8">
          {NAV_ITEMS.map(({ href, label }) => {
            const active = isActive(href);
            return (
              <Link
                key={href}
                href={href}
                onClick={toggle}
                className={`font-playfair text-[clamp(2rem,7vw,3.5rem)] leading-tight transition-colors duration-300 self-start ${
                  active
                    ? "text-primary border-b border-primary pb-0.5"
                    : "text-on-surface hover:text-primary"
                }`}
              >
                {label}
              </Link>
            );
          })}
        </nav>

        {/* Footer: social icons + profile */}
        <div className="border-t border-outline-variant/25 px-margin-mobile md:px-margin-desktop py-8 flex flex-col gap-6">
          {/* Social icons */}
          <div className="flex gap-6">
            <a
              href="https://www.instagram.com/beauty_home.concept"
              target="_blank"
              rel="noreferrer"
              aria-label="Instagram"
              className="text-on-surface-variant hover:text-primary transition-colors duration-300"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path clipRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" fillRule="evenodd" />
              </svg>
            </a>
            <a
              href="https://www.tiktok.com/@beautyhomeconcept"
              target="_blank"
              rel="noreferrer"
              aria-label="TikTok"
              className="text-on-surface-variant hover:text-primary transition-colors duration-300"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.79a8.18 8.18 0 004.78 1.52V6.85a4.85 4.85 0 01-1.01-.16z" />
              </svg>
            </a>
          </div>

          {/* Founder profile */}
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full overflow-hidden border border-outline-variant bg-surface-container flex items-center justify-center flex-shrink-0">
              <span
                className="font-playfair text-xl text-on-surface-variant"
              >
                C
              </span>
            </div>
            <div>
              <p className="font-playfair text-base text-on-surface leading-tight">Camille</p>
              <p
                className="text-[11px] text-on-surface-variant mt-0.5"
                style={{ fontFamily: 'var(--font-hanken)', fontWeight: 300 }}
              >
                Fondatrice & Formatrice
              </p>
            </div>
          </div>

          {/* Admin link — discrete */}
          <div className="pt-2 border-t border-outline-variant/15">
            <Link
              href="/admin"
              onClick={() => setIsMenuOpen(false)}
              className="text-[10px] uppercase tracking-[0.2em] text-on-surface-variant/50 hover:text-on-surface-variant transition-colors duration-300"
              style={{ fontFamily: 'var(--font-hanken)' }}
            >
              Admin
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
