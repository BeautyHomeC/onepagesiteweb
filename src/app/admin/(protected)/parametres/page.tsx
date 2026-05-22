import { createAdminClient } from '@/lib/supabase/server'
import ParametresForm from './ParametresForm'

// Ensure these keys always appear in the form even if not yet in DB
const DEFAULT_KEYS = ['livret_accueil_url', 'email_admin']

export default async function ParametresAdminPage() {
  const supabase = await createAdminClient()

  const { data: existing } = await supabase
    .from('parametres_admin')
    .select('cle, valeur')
    .order('cle')

  const existingMap = new Map((existing ?? []).map((p) => [p.cle, p.valeur]))

  // Build full list: always include default keys, then any extras from DB
  const extraKeys = (existing ?? [])
    .map((p) => p.cle)
    .filter((k) => !DEFAULT_KEYS.includes(k))

  const params = [...DEFAULT_KEYS, ...extraKeys].map((cle) => ({
    cle,
    valeur: existingMap.get(cle) ?? null,
  }))

  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-playfair text-3xl text-on-surface mb-2">Paramètres</h2>
        <p className="text-on-surface-variant text-sm">
          Configurez les ressources et adresses utilisées dans les emails automatiques envoyés aux élèves.
        </p>
      </div>

      <div className="bg-surface-container-lowest border border-surface-container-highest p-4 text-sm text-on-surface-variant">
        <p>
          <strong className="text-on-surface">Règlement intérieur :</strong>{' '}
          Ce document est automatiquement inclus dans tous les emails de confirmation.
          Pour le modifier, remplacez le fichier{' '}
          <code className="text-xs bg-surface-container px-1">public/documents/reglement-interieur.pdf</code>{' '}
          sur le serveur.
        </p>
      </div>

      <ParametresForm params={params} />
    </div>
  )
}
