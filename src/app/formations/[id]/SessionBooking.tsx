"use client";

import { useState } from "react";

export default function SessionBooking({ formation, sessions }: { formation: any, sessions: any[] }) {
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  const handleCheckout = async (sessionId: string) => {
    setCheckoutLoading(true);
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionId })
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

  return (
    <div className="bg-surface p-8 shadow-ambient border border-surface-container-highest">
      <h3 className="font-headline-sm text-headline-sm text-on-surface mb-2">Prochaines Sessions</h3>
      <p className="font-body-md text-on-surface-variant mb-6">Sélectionnez une date pour réserver votre place.</p>

      <div className="space-y-4">
        {sessions.length > 0 ? (
          sessions.map((session) => (
            <div key={session.id} className="border border-outline-variant p-4 flex flex-col xl:flex-row justify-between items-center gap-4 hover:border-primary transition-colors">
              <div>
                <p className="font-body-md text-on-surface font-medium">
                  Du {new Date(session.date_debut).toLocaleDateString('fr-FR')} au {new Date(session.date_fin).toLocaleDateString('fr-FR')}
                </p>
                <p className="font-label-caps text-label-caps text-primary mt-1 uppercase">
                  {session.places_disponibles} place(s) restante(s)
                </p>
              </div>
              <button 
                onClick={() => handleCheckout(session.id)}
                disabled={checkoutLoading}
                className="border border-primary text-primary font-label-caps text-label-caps px-6 py-3 uppercase tracking-widest hover:bg-primary hover:text-on-primary transition-colors disabled:opacity-50 whitespace-nowrap"
              >
                {checkoutLoading ? "..." : `Acompte (30%) : ${Math.round(formation.prix * 0.3)}€`}
              </button>
            </div>
          ))
        ) : (
          <p className="text-on-surface-variant font-body-md italic py-4">Aucune session disponible pour le moment.</p>
        )}
      </div>
      
      <div className="mt-6 pt-6 border-t border-surface-container-highest text-sm text-on-surface-variant font-body-md">
        <p className="mb-2"><strong>Important :</strong> L'inscription est définitive après paiement de l'acompte de 30%.</p>
        <p>Le solde de {Math.round(formation.prix * 0.7)}€ sera à régler au plus tard le premier jour de la formation.</p>
      </div>
    </div>
  );
}
