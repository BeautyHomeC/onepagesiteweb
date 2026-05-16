"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const pathname = usePathname();

  // Close menu on route change
  useEffect(() => {
    setIsMenuOpen(false);
  }, [pathname]);

  // Lock body scroll when menu is open
  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isMenuOpen]);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  return (
    <>
      <header className="fixed top-0 w-full bg-surface/80 dark:bg-surface/80 backdrop-blur-sm border-b border-outline-variant/30 z-50">
        <div className="flex items-center justify-between w-full px-4 md:px-margin-desktop py-5 max-w-container-max mx-auto">
          {/* Leading Action */}
          <div className="flex items-center w-[80px] md:w-[120px]">
            <button 
              onClick={toggleMenu}
              className="text-primary hover:opacity-70 transition-opacity duration-300 active:opacity-50 flex items-center justify-center p-2 -ml-2 rounded-none z-[60]"
            >
              <span className="material-symbols-outlined text-[24px] md:text-[28px]" style={{ fontVariationSettings: "'FILL' 0, 'wght' 300, 'GRAD' 0, 'opsz' 24" }}>
                {isMenuOpen ? "close" : "menu"}
              </span>
            </button>
          </div>
          
          {/* Headline / Brand */}
          <div className="flex-1 flex justify-center overflow-hidden z-[60]">
            <h1 className="font-headline-md text-[12px] xs:text-[14px] md:text-[18px] lg:text-[20px] tracking-widest text-on-surface uppercase whitespace-nowrap overflow-hidden text-ellipsis text-center">
              Beauty Home Concept
            </h1>
          </div>
          
          {/* Trailing Action */}
          <div className="flex items-center justify-end w-[80px] md:w-[120px] z-[60]">
            <Link href="/#formations" onClick={() => setIsMenuOpen(false)} className="text-primary font-label-caps text-[10px] md:text-label-caps hover:opacity-70 transition-opacity duration-300 active:opacity-50 whitespace-nowrap tracking-widest rounded-none border-none bg-transparent pb-[2px] border-b border-transparent hover:border-primary">
              S'INSCRIRE
            </Link>
          </div>
        </div>
      </header>

      {/* Menu Overlay */}
      <div 
        className={`fixed inset-0 bg-surface z-40 transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] flex flex-col justify-center items-center ${
          isMenuOpen ? "translate-y-0" : "-translate-y-full"
        }`}
      >
        <nav className="flex flex-col items-center gap-8">
          <Link href="/" onClick={toggleMenu} className="font-playfair text-3xl md:text-5xl text-on-surface hover:text-primary transition-colors">
            Accueil
          </Link>
          <Link href="/methode-camille" onClick={toggleMenu} className="font-playfair text-3xl md:text-5xl text-on-surface hover:text-primary transition-colors">
            La Fondatrice
          </Link>
          <Link href="/#formations" onClick={toggleMenu} className="font-playfair text-3xl md:text-5xl text-on-surface hover:text-primary transition-colors">
            Formations
          </Link>
          <Link href="/#testimonials" onClick={toggleMenu} className="font-playfair text-3xl md:text-5xl text-on-surface hover:text-primary transition-colors">
            Avis & Témoignages
          </Link>
        </nav>

        <div className="absolute bottom-12 flex flex-col items-center gap-4">
          <div className="flex gap-6">
            <a href="https://instagram.com" target="_blank" rel="noreferrer" className="text-on-surface-variant hover:text-primary transition-colors">
              Instagram
            </a>
            <a href="https://tiktok.com" target="_blank" rel="noreferrer" className="text-on-surface-variant hover:text-primary transition-colors">
              TikTok
            </a>
          </div>
          <Link href="/admin" className="text-xs font-label-caps tracking-widest text-on-surface-variant hover:text-on-surface border-b border-transparent hover:border-on-surface pb-1 transition-all">
            ESPACE ADMIN
          </Link>
        </div>
      </div>
    </>
  );
}
