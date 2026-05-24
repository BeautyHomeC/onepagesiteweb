import { createAdminClient } from '@/lib/supabase/server'
import GoogleRatingForm from './GoogleRatingForm'

export default async function GoogleRatingAdminPage() {
  const supabase = await createAdminClient()
  const { data } = await supabase
    .from('google_rating')
    .select('note, nb_avis, google_url')
    .single()

  const current = {
    note: data?.note ?? 5.0,
    nb_avis: data?.nb_avis ?? 0,
    google_url: data?.google_url ?? '',
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-playfair text-3xl text-on-surface mb-2">Note Google</h2>
        <p className="text-on-surface-variant text-sm">
          Ces informations s'affichent sur la page d'accueil sous la section hero.
          Mettez à jour la note et le nombre d'avis depuis votre fiche Google.
        </p>
      </div>
      <GoogleRatingForm current={current} />
    </div>
  )
}
