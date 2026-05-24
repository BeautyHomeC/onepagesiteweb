import { createAdminClient } from '@/lib/supabase/server'
import TemoignagesManager from './TemoignagesManager'

export default async function TemoignagesAdminPage() {
  const supabase = await createAdminClient()
  const { data: temoignages } = await supabase
    .from('temoignages')
    .select('*')
    .order('ordre', { ascending: true })

  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-playfair text-3xl text-on-surface mb-2">Témoignages</h2>
        <p className="text-on-surface-variant text-sm">
          Gérez les témoignages affichés sur la page d'accueil. Les vidéos YouTube, Vimeo et fichiers uploadés sont supportés.
        </p>
      </div>
      <TemoignagesManager initialTemoignages={(temoignages as any) ?? []} />
    </div>
  )
}
