import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function CGV() {
  return (
    <>
      <Header />
      <main className="flex-1 pt-32 pb-24 bg-background">
        <div className="container mx-auto px-6 md:px-12 max-w-4xl">
          <h1 className="font-serif text-4xl text-tertiary mb-12">Conditions Générales de Vente (CGV)</h1>
          <div className="font-sans text-tertiary/80 space-y-8 font-light">
            <section>
              <h2 className="font-serif text-2xl text-tertiary mb-4">1. Objet</h2>
              <p>
                Les présentes Conditions Générales de Vente s'appliquent à l'ensemble des prestations de formation proposées par Beauty Home Concept.
              </p>
            </section>
            <section>
              <h2 className="font-serif text-2xl text-tertiary mb-4">2. Inscription et Réservation</h2>
              <p>
                L'inscription à une formation est définitive après réception du paiement complet ou de l'acompte prévu via notre plateforme sécurisée (Stripe). Un email de confirmation contenant le contrat de formation est automatiquement envoyé.
              </p>
            </section>
            <section>
              <h2 className="font-serif text-2xl text-tertiary mb-4">3. Conditions d'annulation</h2>
              <p>
                Toute annulation doit être notifiée par écrit. En cas d'annulation moins de 14 jours avant le début de la formation, aucun remboursement ne sera effectué, sauf cas de force majeure justifié.
              </p>
            </section>
            <section>
              <h2 className="font-serif text-2xl text-tertiary mb-4">4. Tarifs et Paiement</h2>
              <p>
                Les tarifs sont indiqués en euros. Le règlement s'effectue en ligne par carte bancaire. Les paiements sont sécurisés par Stripe.
              </p>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
