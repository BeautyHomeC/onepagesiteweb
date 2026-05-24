'use server'

import { createAdminClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function uploadProgrammePdf(fd: FormData) {
  const supabase = await createAdminClient()

  const formationId = fd.get('formation_id') as string | null
  const pdfFile     = fd.get('pdf_file') as File | null

  if (!formationId) return { error: 'formation_id manquant' }
  if (!pdfFile || pdfFile.size === 0) return { error: 'Aucun fichier sélectionné' }
  if (pdfFile.type !== 'application/pdf') return { error: 'Le fichier doit être un PDF' }
  if (pdfFile.size > 20 * 1024 * 1024) return { error: 'Fichier trop volumineux (max 20 Mo)' }

  const safeFormationId = formationId.replace(/[^a-zA-Z0-9-_]/g, '')
  const path = `${safeFormationId}/programme.pdf`

  const buf = Buffer.from(await pdfFile.arrayBuffer())

  // Upsert (overwrite if exists)
  const { data: up, error: upErr } = await supabase.storage
    .from('programme-pdfs')
    .upload(path, buf, {
      contentType: 'application/pdf',
      upsert: true,
    })

  if (upErr) {
    console.error('[uploadProgrammePdf] storage error:', upErr)
    return { error: `Erreur upload: ${upErr.message}` }
  }

  const { data: { publicUrl } } = supabase.storage.from('programme-pdfs').getPublicUrl(path)

  // Update formation record
  const { error: updateErr } = await supabase
    .from('formations')
    .update({ programme_pdf_url: publicUrl })
    .eq('id', formationId)

  if (updateErr) return { error: `Erreur mise à jour: ${updateErr.message}` }

  revalidatePath('/admin/formations')
  revalidatePath(`/formations/${formationId}`)

  return { url: publicUrl }
}
