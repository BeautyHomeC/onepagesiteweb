import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function MentionsLegales() {
  return (
    <>
      <Header />
      <main className="flex-1 pt-32 pb-24 bg-background">
        <div className="container mx-auto px-6 md:px-12 max-w-4xl">
          <h1 className="font-serif text-4xl text-tertiary mb-12">Mentions Légales</h1>
          <div className="font-sans text-tertiary/80 space-y-8 font-light">
            <section>
              <h2 className="font-serif text-2xl text-tertiary mb-4">1. Éditeur du site</h2>
              <p>
                Le site Beauty Home Concept est édité par Camille [Nom de Famille], auto-entrepreneur.<br/>
                Siège social : [Adresse], 80000 Amiens, Hauts-de-France.<br/>
                SIRET : [Numéro SIRET]<br/>
                Email : contact@camille-beauty.com
              </p>
            </section>
            <section>
              <h2 className="font-serif text-2xl text-tertiary mb-4">2. Hébergement</h2>
              <p>
                Ce site est hébergé par Vercel Inc.<br/>
                340 S Lemon Ave #4133 Walnut, CA 91789, USA.
              </p>
            </section>
            <section>
              <h2 className="font-serif text-2xl text-tertiary mb-4">3. Propriété Intellectuelle</h2>
              <p>
                L'ensemble du contenu (textes, images, vidéos, etc.) de ce site est protégé par le droit d'auteur. Toute reproduction est interdite sans autorisation préalable.
              </p>
            </section>
            <section>
              <h2 className="font-serif text-2xl text-tertiary mb-4">4. Déclaration d'activité</h2>
              <p>
                Déclaration d'activité enregistrée sous le numéro [Numéro NDA] auprès du préfet de région Hauts-de-France.<br/>
                Organisme de formation certifié Qualiopi.
              </p>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
