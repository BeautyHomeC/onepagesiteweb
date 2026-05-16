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

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="fixed bottom-0 left-0 w-full z-50 p-4 md:p-6"
        >
          <div className="container mx-auto max-w-4xl bg-secondary/95 backdrop-blur-md border border-primary/20 shadow-lg p-6 flex flex-col md:flex-row items-center justify-between gap-6 rounded-sm">
            <p className="font-sans text-sm text-tertiary/80 text-center md:text-left leading-relaxed">
              En poursuivant votre navigation, vous acceptez l'utilisation de cookies pour vous proposer des services adaptés et réaliser des statistiques de visites.
            </p>
            <div className="flex gap-4 shrink-0">
              <button
                onClick={() => setIsVisible(false)}
                className="px-6 py-2 border border-outline text-tertiary font-sans text-xs uppercase tracking-widest hover:bg-tertiary/5 transition-colors"
              >
                Refuser
              </button>
              <button
                onClick={acceptCookies}
                className="px-6 py-2 bg-primary text-secondary font-sans text-xs uppercase tracking-widest hover:bg-primary/90 transition-colors"
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
