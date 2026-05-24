import Link from 'next/link'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

export const metadata = {
  title: 'Inscription confirmée — Beauty Home Concept',
}

export default function SuccessPage() {
  return (
    <>
      <Header />
      <main className="pt-[100px] min-h-screen bg-surface-container-lowest flex flex-col">

        {/* Hero confirmation */}
        <section className="flex-1 flex items-center justify-center py-24 px-6">
          <div className="w-full max-w-[560px] space-y-12">

            {/* Eyebrow */}
            <div className="flex items-center gap-3">
              <span className="h-px w-8 bg-primary shrink-0" />
              <p className="font-label-caps text-[10px] uppercase tracking-[0.28em] text-primary"
                style={{ fontFamily: 'var(--font-hanken)' }}>
                Beauty Home Concept
              </p>
            </div>

            {/* Heading */}
            <div className="space-y-4">
              <h1 className="text-on-surface leading-[1.1]"
                style={{
                  fontFamily: 'var(--font-playfair)',
                  fontSize: 'clamp(36px, 6vw, 56px)',
                  fontWeight: 400,
                  letterSpacing: '-0.01em',
                }}>
                Inscription<br />confirmée.
              </h1>
              <p className="text-base text-on-surface-variant leading-relaxed"
                style={{ fontFamily: 'var(--font-hanken)', fontWeight: 300 }}>
                Votre acompte a bien été encaissé et votre place est réservée. Nous avons hâte de vous accueillir.
              </p>
            </div>

            {/* Info card */}
            <div className="border border-outline-variant bg-surface p-6 space-y-4">
              <p className="text-[10px] uppercase tracking-[0.2em] text-primary"
                style={{ fontFamily: 'var(--font-hanken)', fontWeight: 500 }}>
                Prochaines étapes
              </p>
              <ul className="space-y-3">
                {[
                  'Un email de confirmation avec votre contrat signé vient d\'être envoyé.',
                  'Le programme détaillé et le livret d\'accueil sont joints en pièce jointe.',
                  'Le solde est réglé le dernier jour de la formation (espèces, virement ou carte).',
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-on-surface-variant leading-relaxed"
                    style={{ fontFamily: 'var(--font-hanken)' }}>
                    {/* Thin numbered circle */}
                    <span className="shrink-0 mt-0.5 w-4 h-4 flex items-center justify-center border border-outline-variant text-[9px] text-on-surface-variant"
                      style={{ fontFamily: 'var(--font-hanken)', fontWeight: 500 }}>
                      {i + 1}
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Contact note */}
            <p className="text-xs text-on-surface-variant/70 leading-relaxed"
              style={{ fontFamily: 'var(--font-hanken)' }}>
              Une question ?{' '}
              <a href="mailto:contact@beautyhomeconcept.fr"
                className="text-primary underline underline-offset-2 hover:opacity-70 transition-opacity">
                contact@beautyhomeconcept.fr
              </a>
            </p>

            {/* CTA */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Link
                href="/"
                className="inline-flex items-center justify-center min-h-[44px] border border-primary text-primary px-8 py-3 text-xs uppercase tracking-widest hover:bg-primary hover:text-on-primary transition-colors"
                style={{ fontFamily: 'var(--font-hanken)', fontWeight: 500 }}>
                Retour à l'accueil
              </Link>
              <Link
                href="/#formations"
                className="inline-flex items-center justify-center min-h-[44px] border border-outline-variant text-on-surface-variant px-8 py-3 text-xs uppercase tracking-widest hover:border-outline hover:text-on-surface transition-colors"
                style={{ fontFamily: 'var(--font-hanken)', fontWeight: 500 }}>
                Voir les formations
              </Link>
            </div>
          </div>
        </section>

        {/* Thin gold rule */}
        <div className="h-px w-full bg-primary/20" />
      </main>
      <Footer />
    </>
  )
}
