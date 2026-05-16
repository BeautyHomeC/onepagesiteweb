"use client";

import { useState } from "react";

export default function DownloadContractButton({ reservation, session }: {
  reservation: {
    id: string;
    nom_client: string;
    email_client: string;
    telephone_client: string;
    stripe_payment_id: string;
    created_at: string;
  };
  session: {
    formations: { titre: string; prix: number };
    date_debut: string;
    date_fin: string;
  };
}) {
  const [loading, setLoading] = useState(false);

  const handleDownload = async () => {
    setLoading(true);
    const filename = `Convention_${reservation.nom_client.replace(/\s/g, '_')}_${session.formations.titre.replace(/\s/g, '_')}.pdf`;
    try {
      // 1. Try to fetch the original signed PDF from Supabase Storage
      const stripeId = reservation.stripe_payment_id || reservation.id;
      const storageUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/formations_images/contracts/${stripeId}.pdf`;
      const storageRes = await fetch(storageUrl);

      let blob: Blob;
      if (storageRes.ok) {
        // Original PDF with real audit trail (IP + timestamp)
        blob = await storageRes.blob();
      } else {
        // Fallback: regenerate PDF
        const res = await fetch('/api/generate-contract', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            nomClient: reservation.nom_client,
            emailClient: reservation.email_client,
            telephoneClient: reservation.telephone_client,
            formationTitre: session.formations.titre,
            formationPrix: session.formations.prix,
            dateDebut: new Date(session.date_debut).toLocaleDateString('fr-FR'),
            dateFin: new Date(session.date_fin).toLocaleDateString('fr-FR'),
            stripeId,
            consentTimestamp: reservation.created_at,
          }),
        });
        if (!res.ok) throw new Error('Erreur génération PDF');
        blob = await res.blob();
      }

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
      alert('Erreur lors du téléchargement du contrat PDF.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleDownload}
      disabled={loading}
      title="Télécharger le dossier PDF"
      className="text-on-surface-variant hover:text-primary transition-colors disabled:opacity-50"
    >
      <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 0, 'wght' 300, 'GRAD' 0, 'opsz' 24" }}>
        {loading ? 'hourglass_empty' : 'download'}
      </span>
    </button>
  );
}
