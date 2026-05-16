"use client";

import { useState } from "react";

/**
 * SessionBooking — composant de réservation conforme RGPD/Qualiopi
 *
 * Avant la redirection Stripe, une modale affiche :
 *   • le récapitulatif de la session (formation, dates, prix, acompte)
 *   • un aperçu des conditions (CGV, RGPD, contrat, règlement intérieur)
 *   • 3 cases à cocher obligatoires : CGV / RGPD / acceptation du contrat
 *
 * Tant que les 3 cases ne sont pas cochées, le bouton "Confirmer & Payer
 * l'acompte" reste désactivé. Le clic redirige ensuite vers Stripe Checkout,
 * qui collecte également l'acceptation officielle des CGV (terms_of_service)
 * pour la conformité légale (preuve de consentement double).
 */
export default function SessionBooking({
  formation,
  sessions,
}: {
  formation: any;
  sessions: any[];
}) {
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [showConsent, setShowConsent] = useState(false);
  const [acceptCgv, setAcceptCgv] = useState(false);
  const [acceptRgpd, setAcceptRgpd] = useState(false);
  const [acceptContrat, setAcceptContrat] = useState(false);

  const acompte = Math.round(formation.prix * 0.3);
  const solde = formation.prix - acompte;

  const openModal = (sessionId: string) => {
    setSelectedSessionId(sessionId);
    setShowConsent(true);
    setAcceptCgv(false);
    setAcceptRgpd(false);
    setAcceptContrat(false);
  };

  const closeModal = () => {
    if (!checkoutLoading) {
      setShowConsent(false);
      setSelectedSessionId(null);
    }
  };

  const handleCheckout = async () => {
    if (!selectedSessionId || !acceptCgv || !acceptRgpd || !acceptContrat) return;

    setCheckoutLoading(true);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: selectedSessionId,
          consent: {
            cgv: true,
            rgpd: true,
            contrat: true,
            timestamp: new Date().toISOString(),
          },
        }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error || "Une erreur est survenue");
        setCheckoutLoading(false);
      }
    } catch (e) {
      console.error(e);
      alert("Erreur réseau");
      setCheckoutLoading(false);
    }
  };

  const selectedSession = sessions.find((s) => s.id === selectedSessionId);
  const allChecked = acceptCgv && acceptRgpd && acceptContrat;

  return (
    <>
      <div className="bg-surface p-8 shadow-ambient border border-surface-container-highest">
        <h3 className="font-headline-sm text-headline-sm text-on-surface mb-2">
          Prochaines Sessions
        </h3>
        <p className="font-body-md text-on-surface-variant mb-6">
          Sélectionnez une date pour réserver votre place.
        </p>

        <div className="space-y-4">
          {sessions.length > 0 ? (
            sessions.map((session) => (
              <div
                key={session.id}
                className="border border-outline-variant p-4 flex flex-col xl:flex-row justify-between items-center gap-4 hover:border-primary transition-colors"
              >
                <div>
                  <p className="font-body-md text-on-surface font-medium">
                    Du {new Date(session.date_debut).toLocaleDateString("fr-FR")} au{" "}
                    {new Date(session.date_fin).toLocaleDateString("fr-FR")}
                  </p>
                  <p className="font-label-caps text-label-caps text-primary mt-1 uppercase">
                    {session.places_disponibles} place(s) restante(s)
                  </p>
                </div>
                <button
                  onClick={() => openModal(session.id)}
                  disabled={checkoutLoading}
                  className="border border-primary text-primary font-label-caps text-label-caps px-6 py-3 uppercase tracking-widest hover:bg-primary hover:text-on-primary transition-colors disabled:opacity-50 whitespace-nowrap"
                >
                  Réserver — Acompte {acompte}€
                </button>
              </div>
            ))
          ) : (
            <p className="text-on-surface-variant font-body-md italic py-4">
              Aucune session disponible pour le moment.
            </p>
          )}
        </div>

        {/* Téléchargement du programme PDF */}
        {formation.programme_pdf_url && (
          <a
            href={formation.programme_pdf_url}
            target="_blank"
            rel="noopener noreferrer"
            download
            className="mt-6 inline-flex items-center gap-2 text-primary hover:underline font-label-caps text-xs uppercase tracking-widest"
          >
            <span className="material-symbols-outlined text-[18px]">download</span>
            Télécharger le programme détaillé (PDF)
          </a>
        )}

        <div className="mt-6 pt-6 border-t border-surface-container-highest text-sm text-on-surface-variant font-body-md">
          <p className="mb-2">
            <strong>Important :</strong> L'inscription est définitive après paiement de l'acompte de 30%.
          </p>
          <p>Le solde de {solde}€ sera à régler au plus tard le premier jour de la formation.</p>
        </div>
      </div>

      {/* ─── MODALE DE CONSENTEMENT ─────────────────────────────────────── */}
      {showConsent && selectedSession && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={closeModal}
        >
          <div
            className="bg-surface max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* En-tête */}
            <div className="bg-primary text-on-primary px-8 py-6">
              <span className="block font-label-caps text-xs uppercase tracking-widest opacity-80 mb-1">
                Confirmation d'inscription
              </span>
              <h2 className="font-headline-md text-2xl">{formation.titre}</h2>
            </div>

            {/* Récapitulatif */}
            <div className="px-8 py-6 border-b border-outline-variant">
              <h3 className="font-label-caps text-xs uppercase tracking-widest text-on-surface-variant mb-4">
                Récapitulatif
              </h3>
              <dl className="space-y-2 font-body-md text-sm">
                <div className="flex justify-between">
                  <dt className="text-on-surface-variant">Session</dt>
                  <dd className="text-on-surface font-medium">
                    Du {new Date(selectedSession.date_debut).toLocaleDateString("fr-FR")} au{" "}
                    {new Date(selectedSession.date_fin).toLocaleDateString("fr-FR")}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-on-surface-variant">Lieu</dt>
                  <dd className="text-on-surface">22A rue du Général Leclerc, 80000 Amiens</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-on-surface-variant">Prix total TTC</dt>
                  <dd className="text-on-surface font-medium">{formation.prix} €</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-on-surface-variant">Acompte (30%) — à régler maintenant</dt>
                  <dd className="text-primary font-bold">{acompte} €</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-on-surface-variant">Solde — au plus tard 1er jour</dt>
                  <dd className="text-on-surface">{solde} €</dd>
                </div>
              </dl>
            </div>

            {/* Documents légaux à consulter */}
            <div className="px-8 py-6 border-b border-outline-variant">
              <h3 className="font-label-caps text-xs uppercase tracking-widest text-on-surface-variant mb-3">
                Documents à consulter avant inscription
              </h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <a
                    href="/cgv"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline inline-flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-[16px]">open_in_new</span>
                    Conditions Générales de Vente (CGV)
                  </a>
                </li>
                <li>
                  <a
                    href="/documents/reglement-interieur.pdf"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline inline-flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-[16px]">open_in_new</span>
                    Règlement intérieur de l'institut
                  </a>
                </li>
                <li>
                  <a
                    href="/mentions-legales"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline inline-flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-[16px]">open_in_new</span>
                    Politique de Confidentialité (RGPD)
                  </a>
                </li>
                {formation.programme_pdf_url && (
                  <li>
                    <a
                      href={formation.programme_pdf_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline inline-flex items-center gap-1"
                    >
                      <span className="material-symbols-outlined text-[16px]">open_in_new</span>
                      Programme détaillé de la formation
                    </a>
                  </li>
                )}
              </ul>
              <p className="mt-4 text-xs text-on-surface-variant italic">
                Votre contrat de formation personnalisé vous sera envoyé par email après le paiement de l'acompte,
                accompagné du règlement intérieur et de la facture.
              </p>
            </div>

            {/* Cases à cocher obligatoires */}
            <div className="px-8 py-6 border-b border-outline-variant space-y-3">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={acceptCgv}
                  onChange={(e) => setAcceptCgv(e.target.checked)}
                  className="mt-1 accent-primary"
                />
                <span className="text-sm text-on-surface">
                  J'ai lu et j'accepte les{" "}
                  <a href="/cgv" target="_blank" className="text-primary underline">
                    Conditions Générales de Vente
                  </a>{" "}
                  et le règlement intérieur.
                </span>
              </label>
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={acceptRgpd}
                  onChange={(e) => setAcceptRgpd(e.target.checked)}
                  className="mt-1 accent-primary"
                />
                <span className="text-sm text-on-surface">
                  Je consens au traitement de mes données personnelles conformément à la{" "}
                  <a href="/mentions-legales" target="_blank" className="text-primary underline">
                    Politique de Confidentialité (RGPD)
                  </a>
                  .
                </span>
              </label>
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={acceptContrat}
                  onChange={(e) => setAcceptContrat(e.target.checked)}
                  className="mt-1 accent-primary"
                />
                <span className="text-sm text-on-surface">
                  Je reconnais que le paiement de l'acompte vaut signature électronique du
                  contrat de formation qui me sera envoyé par email, dans les conditions de
                  l'article 1366 du Code civil.
                </span>
              </label>
            </div>

            {/* Boutons */}
            <div className="px-8 py-6 flex flex-col sm:flex-row gap-3 justify-end">
              <button
                onClick={closeModal}
                disabled={checkoutLoading}
                className="font-label-caps text-xs uppercase tracking-widest px-6 py-3 border border-outline-variant text-on-surface hover:bg-surface-container-low transition-colors disabled:opacity-50"
              >
                Annuler
              </button>
              <button
                onClick={handleCheckout}
                disabled={!allChecked || checkoutLoading}
                className="font-label-caps text-xs uppercase tracking-widest px-6 py-3 bg-primary text-on-primary hover:opacity-90 transition-opacity disabled:opacity-30 disabled:cursor-not-allowed"
              >
                {checkoutLoading ? "Redirection..." : `Confirmer & Payer ${acompte}€`}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
