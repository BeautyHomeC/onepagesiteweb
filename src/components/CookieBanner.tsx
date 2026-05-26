"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function CookieBanner() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem("cookie-consent");
    if (!consent) {
      setIsVisible(true);
    }
  }, []);

  const acceptCookies = () => {
    localStorage.setItem("cookie-consent", "true");
    setIsVisible(false);
  };

  const declineCookies = () => {
    localStorage.setItem("cookie-consent", "false");
    setIsVisible(false);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="fixed bottom-0 left-0 w-full z-50 px-4 pb-4 md:px-6 md:pb-6"
        >
          <div
            className="container mx-auto max-w-4xl flex flex-col sm:flex-row items-center justify-between gap-5 px-6 py-5"
            style={{
              backgroundColor: '#ffffff',
              borderTop: '2px solid #755a2d',
              boxShadow: '0 -8px 40px rgba(27,28,28,0.12)',
            }}
          >
            <p
              className="text-sm leading-relaxed text-center sm:text-left"
              style={{ fontFamily: 'var(--font-hanken)', fontWeight: 300, color: '#5a5248' }}
            >
              Ce site utilise uniquement des cookies techniques nécessaires au fonctionnement du paiement sécurisé.{" "}
              <a
                href="/mentions-legales"
                className="underline hover:opacity-70 transition-opacity"
                style={{ color: '#755a2d' }}
              >
                En savoir plus
              </a>
            </p>
            <div className="flex gap-3 shrink-0">
              <button
                onClick={declineCookies}
                className="px-5 py-2.5 border text-xs uppercase tracking-widest transition-colors hover:border-on-surface/40"
                style={{
                  fontFamily: 'var(--font-hanken)',
                  fontWeight: 500,
                  borderColor: 'rgba(117,90,45,0.25)',
                  color: '#5a5248',
                }}
              >
                Refuser
              </button>
              <button
                onClick={acceptCookies}
                className="px-5 py-2.5 text-xs uppercase tracking-widest transition-opacity hover:opacity-90 active:opacity-70"
                style={{
                  fontFamily: 'var(--font-hanken)',
                  fontWeight: 500,
                  backgroundColor: '#755a2d',
                  color: '#ffffff',
                }}
              >
                Accepter
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
