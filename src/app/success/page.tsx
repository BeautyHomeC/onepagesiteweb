import Link from 'next/link';
import { CheckCircle } from 'lucide-react';

export default function SuccessPage() {
  return (
    <div className="min-h-screen bg-surface flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-surface-container-lowest p-8 text-center space-y-6">
        <div className="flex justify-center">
          <CheckCircle className="h-16 w-16 text-primary" />
        </div>
        
        <h1 className="font-playfair text-3xl text-on-surface">
          Réservation Confirmée
        </h1>
        
        <p className="text-on-surface-variant">
          Merci pour votre confiance. Votre paiement a bien été validé et votre place est réservée.
        </p>

        <div className="p-4 bg-surface-container-low text-sm text-on-surface-variant text-left">
          Vous allez recevoir d'ici quelques instants un email de confirmation contenant votre livret d'accueil et votre facture.
        </div>

        <div className="pt-4">
          <Link 
            href="/"
            className="inline-block bg-primary text-on-primary px-8 py-3 uppercase tracking-wider text-sm hover:bg-primary-container hover:text-on-primary-container transition-colors"
          >
            Retour à l'accueil
          </Link>
        </div>
      </div>
    </div>
  );
}
