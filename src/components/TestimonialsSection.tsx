"use client";

export default function TestimonialsSection() {
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
      text: "Camille partage vraiment sa méthode, ses secrets de pro. On ne repart pas les mains vides : livret pédagogique, attestation, et un suivi post-formation sur les réseaux. Du sérieux !",
      author: "Laëtitia B.",
      role: "Prothésiste — Reims",
    },
  ];

  return (
    <section id="testimonials" className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-section-gap">
      <h2 className="font-headline-md text-headline-md text-on-surface text-center mb-4">Ce qu'en disent les élèves</h2>
      <p className="font-body-md text-on-surface-variant text-center mb-16">Elles ont suivi la formation. Voici leur retour.</p>
      <div className="flex overflow-x-auto hide-scrollbar snap-x snap-mandatory gap-6 pb-8">
        {testimonials.map((t, i) => (
          <div key={i} className="min-w-[85vw] md:min-w-[400px] snap-center bg-surface p-10 shadow-ambient flex flex-col justify-between">
            <div>
              <div className="flex text-primary mb-6">
                {[...Array(5)].map((_, j) => (
                  <span key={j} className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1, 'wght' 300, 'GRAD' 0, 'opsz' 24" }}>star</span>
                ))}
              </div>
              <p className="font-body-md text-body-md text-on-surface-variant italic mb-8">"{t.text}"</p>
            </div>
            <p className="font-label-caps text-label-caps text-on-surface uppercase tracking-[0.1em]">
              {t.author} <span className="text-outline mx-2">|</span> {t.role}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
