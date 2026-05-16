"use client";

const testimonials = [
  {
    text: "Formation incroyable ! Camille est une pédagogue hors pair. En une journée, j'ai totalement revu ma technique de manucure russe. Mes clientes voient la différence immédiatement.",
    author: "Sarah L.",
    role: "Prothésiste ongulaire — Lille",
  },
  {
    text: "Je venais avec 2 ans de pratique et je suis repartie avec des automatismes que je n'aurais jamais appris seule. Le format petit groupe est un vrai plus, Camille prend le temps d'expliquer chaque geste.",
    author: "Amandine R.",
    role: "Esthéticienne — Paris",
  },
  {
    text: "La formation est certifiée Qualiopi, j'ai pu la faire financer par mon OPCO sans avancer d'argent. Le contenu est sérieux, le matériel fourni est top. Je recommande à 100%.",
    author: "Julie M.",
    role: "Auto-entrepreneuse — Amiens",
  },
  {
    text: "Camille partage vraiment sa méthode, ses secrets de pro. On ne repart pas les mains vides : livret pédagogique, attestation, et un suivi post-formation. Du sérieux !",
    author: "Laëtitia B.",
    role: "Prothésiste — Reims",
  },
];

export default function TestimonialsSection() {
  return (
    <section id="testimonials" className="bg-surface-container-lowest py-section-gap">
      <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-16">
          <div>
            <div className="flex items-center gap-4 mb-4">
              <div className="w-6 h-px bg-primary flex-shrink-0"></div>
              <span className="font-label-caps text-label-caps text-primary uppercase tracking-[0.25em]">Avis & Témoignages</span>
            </div>
            <h2 className="font-playfair text-[36px] md:text-[48px] leading-[1.1] text-on-surface" style={{ letterSpacing: '-0.01em' }}>
              Ce qu'en disent<br className="hidden md:block" /> les élèves
            </h2>
          </div>
          <p className="font-body-md text-on-surface-variant max-w-xs md:text-right">
            Elles ont suivi la formation.<br />Voici leur retour.
          </p>
        </div>

        {/* Grid desktop / carousel mobile */}
        <div className="hidden md:grid md:grid-cols-2 gap-6">
          {testimonials.map((t, i) => (
            <TestimonialCard key={i} t={t} />
          ))}
        </div>

        {/* Mobile carousel */}
        <div className="flex md:hidden overflow-x-auto hide-scrollbar snap-x snap-mandatory gap-4 pb-4">
          {testimonials.map((t, i) => (
            <div key={i} className="min-w-[88vw] snap-center">
              <TestimonialCard t={t} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function TestimonialCard({ t }: { t: typeof testimonials[0] }) {
  return (
    <div className="bg-surface p-8 md:p-10 flex flex-col justify-between border border-surface-container-highest">
      {/* Stars */}
      <div>
        <div className="flex gap-0.5 text-primary mb-6">
          {[...Array(5)].map((_, j) => (
            <span key={j} className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24" }}>star</span>
          ))}
        </div>
        {/* Large decorative quote */}
        <span className="font-playfair text-[80px] leading-none text-primary/15 select-none block -mb-4 -mt-2">"</span>
        <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">{t.text}</p>
      </div>
      <div className="mt-8 pt-6 border-t border-surface-container-highest">
        <p className="font-label-caps text-label-caps text-on-surface uppercase tracking-[0.12em]">{t.author}</p>
        <p className="font-body-md text-xs text-on-surface-variant mt-1">{t.role}</p>
      </div>
    </div>
  );
}
