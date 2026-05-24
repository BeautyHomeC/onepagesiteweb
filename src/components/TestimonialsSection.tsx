import { createClient } from '@/lib/supabase/server'
import TestimonialsList from './TestimonialsList'

const FALLBACK = [
  {
    id: '1',
    nom: 'Sarah L.',
    role: 'Prothésiste ongulaire — Lille',
    texte: "Formation incroyable. Camille est une pédagogue hors pair. En une journée, j'ai totalement revu ma technique de manucure russe. Mes clientes voient la différence immédiatement.",
    note: 5,
    photo_url: null,
    video_url: null,
    video_type: null,
  },
  {
    id: '2',
    nom: 'Amandine R.',
    role: 'Esthéticienne — Paris',
    texte: "Je venais avec 2 ans de pratique et je suis repartie avec des automatismes que je n'aurais jamais appris seule. Le format petit groupe est un vrai plus, Camille prend le temps d'expliquer chaque geste.",
    note: 5,
    photo_url: null,
    video_url: null,
    video_type: null,
  },
  {
    id: '3',
    nom: 'Julie M.',
    role: 'Auto-entrepreneuse — Amiens',
    texte: "La formation est certifiée Qualiopi, j'ai pu la faire financer par mon OPCO sans avancer d'argent. Le contenu est sérieux, le matériel fourni est top. Je recommande à 100%.",
    note: 5,
    photo_url: null,
    video_url: null,
    video_type: null,
  },
  {
    id: '4',
    nom: 'Laëtitia B.',
    role: 'Prothésiste — Reims',
    texte: "Camille partage vraiment sa méthode, ses secrets de pro. On ne repart pas les mains vides : livret pédagogique, attestation, et un suivi post-formation sur les réseaux. Du sérieux.",
    note: 5,
    photo_url: null,
    video_url: null,
    video_type: null,
  },
]

export default async function TestimonialsSection() {
  let testimonials = FALLBACK as any[]
  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from('temoignages')
      .select('id, nom, role, texte, note, photo_url, video_url, video_type')
      .order('ordre', { ascending: true })
    if (data && data.length > 0) testimonials = data
  } catch {
    // table may not exist yet during local dev — fall back silently
  }

  return <TestimonialsList testimonials={testimonials} />
}
