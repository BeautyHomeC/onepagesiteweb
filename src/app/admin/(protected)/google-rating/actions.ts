'use server'

import { createClient, createAdminClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

async function requireAuth() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/admin/login')
}

export async function updateGoogleRating(fd: FormData) {
  await requireAuth()

  const noteStr = (fd.get('note') as string | null)?.trim() ?? ''
  const nbAvisStr = (fd.get('nb_avis') as string | null)?.trim() ?? ''
  const googleUrl = (fd.get('google_url') as string | null)?.trim() ?? ''

  const note = parseFloat(noteStr)
  const nb_avis = parseInt(nbAvisStr, 10)

  if (isNaN(note) || note < 0 || note > 5) return { error: 'Note invalide (0–5)' }
  if (isNaN(nb_avis) || nb_avis < 0) return { error: "Nombre d'avis invalide" }
  if (googleUrl && !googleUrl.startsWith('https://')) return { error: 'URL invalide — doit commencer par https://' }

  const supabase = await createAdminClient()
  const { error } = await supabase
    .from('google_rating')
    .upsert([{ id: 1, note, nb_avis, google_url: googleUrl, updated_at: new Date().toISOString() }], { onConflict: 'id' })

  if (error) return { error: 'Erreur lors de la sauvegarde : ' + error.message }

  revalidatePath('/')
  revalidatePath('/admin/google-rating')
  return { success: true }
}
