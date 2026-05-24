'use server'

import { createAdminClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createTemoignage(fd: FormData) {
  const supabase = await createAdminClient()

  const nom   = (fd.get('nom')   as string | null)?.trim() ?? ''
  const role  = (fd.get('role')  as string | null)?.trim() ?? null
  const texte = (fd.get('texte') as string | null)?.trim() ?? ''
  const note  = parseInt(fd.get('note') as string) || 5

  if (!nom || !texte) return { error: 'Nom et texte requis' }

  // Handle video
  let video_url: string | null = null
  let video_type: string | null = null
  const videoLink = (fd.get('video_url') as string | null)?.trim()
  const videoFile = fd.get('video_file') as File | null

  if (videoFile && videoFile.size > 0) {
    const ext = videoFile.name.split('.').pop()
    const path = `videos/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
    const buf = Buffer.from(await videoFile.arrayBuffer())
    const { data: up, error: upErr } = await supabase.storage
      .from('temoignages-media')
      .upload(path, buf, { contentType: videoFile.type, upsert: false })
    if (upErr) return { error: 'Erreur upload vidéo: ' + upErr.message }
    const { data: { publicUrl } } = supabase.storage.from('temoignages-media').getPublicUrl(up.path)
    video_url = publicUrl
    video_type = 'upload'
  } else if (videoLink) {
    video_url = videoLink
    video_type = videoLink.includes('youtube') || videoLink.includes('youtu.be')
      ? 'youtube'
      : videoLink.includes('vimeo')
      ? 'vimeo'
      : 'upload'
  }

  // Handle photo
  let photo_url: string | null = null
  const photoFile = fd.get('photo_file') as File | null
  if (photoFile && photoFile.size > 0) {
    const ext = photoFile.name.split('.').pop()
    const path = `photos/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
    const buf = Buffer.from(await photoFile.arrayBuffer())
    const { data: up, error: upErr } = await supabase.storage
      .from('temoignages-media')
      .upload(path, buf, { contentType: photoFile.type, upsert: false })
    if (upErr) return { error: 'Erreur upload photo: ' + upErr.message }
    const { data: { publicUrl } } = supabase.storage.from('temoignages-media').getPublicUrl(up.path)
    photo_url = publicUrl
  }

  // Get max ordre
  const { data: last } = await supabase
    .from('temoignages')
    .select('ordre')
    .order('ordre', { ascending: false })
    .limit(1)
    .single()
  const ordre = (last?.ordre ?? -1) + 1

  const { error } = await supabase.from('temoignages').insert({
    nom, role, texte, note, photo_url, video_url, video_type, ordre,
  })

  if (error) return { error: error.message }
  revalidatePath('/admin/temoignages')
  revalidatePath('/')
  return { success: true }
}

export async function updateTemoignage(id: string, fd: FormData) {
  const supabase = await createAdminClient()

  const nom   = (fd.get('nom')   as string | null)?.trim() ?? ''
  const role  = (fd.get('role')  as string | null)?.trim() || null
  const texte = (fd.get('texte') as string | null)?.trim() ?? ''
  const note  = parseInt(fd.get('note') as string) || 5

  if (!nom || !texte) return { error: 'Nom et texte requis' }

  const updates: Record<string, any> = { nom, role, texte, note }

  // Video — only update if provided
  const videoLink = (fd.get('video_url') as string | null)?.trim()
  const videoFile = fd.get('video_file') as File | null
  const clearVideo = fd.get('clear_video') === '1'

  if (clearVideo) {
    updates.video_url = null
    updates.video_type = null
  } else if (videoFile && videoFile.size > 0) {
    const ext = videoFile.name.split('.').pop()
    const path = `videos/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
    const buf = Buffer.from(await videoFile.arrayBuffer())
    const { data: up, error: upErr } = await supabase.storage
      .from('temoignages-media')
      .upload(path, buf, { contentType: videoFile.type, upsert: false })
    if (upErr) return { error: 'Erreur upload vidéo: ' + upErr.message }
    const { data: { publicUrl } } = supabase.storage.from('temoignages-media').getPublicUrl(up.path)
    updates.video_url = publicUrl
    updates.video_type = 'upload'
  } else if (videoLink !== undefined && videoLink !== null) {
    if (videoLink) {
      updates.video_url = videoLink
      updates.video_type = videoLink.includes('youtube') || videoLink.includes('youtu.be')
        ? 'youtube'
        : videoLink.includes('vimeo')
        ? 'vimeo'
        : 'upload'
    }
  }

  // Photo — only update if provided
  const photoFile = fd.get('photo_file') as File | null
  const clearPhoto = fd.get('clear_photo') === '1'
  if (clearPhoto) {
    updates.photo_url = null
  } else if (photoFile && photoFile.size > 0) {
    const ext = photoFile.name.split('.').pop()
    const path = `photos/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
    const buf = Buffer.from(await photoFile.arrayBuffer())
    const { data: up, error: upErr } = await supabase.storage
      .from('temoignages-media')
      .upload(path, buf, { contentType: photoFile.type, upsert: false })
    if (upErr) return { error: 'Erreur upload photo: ' + upErr.message }
    const { data: { publicUrl } } = supabase.storage.from('temoignages-media').getPublicUrl(up.path)
    updates.photo_url = publicUrl
  }

  const { error } = await supabase.from('temoignages').update(updates).eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/admin/temoignages')
  revalidatePath('/')
  return { success: true }
}

export async function deleteTemoignage(id: string) {
  const supabase = await createAdminClient()
  const { error } = await supabase.from('temoignages').delete().eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/admin/temoignages')
  revalidatePath('/')
  return { success: true }
}

export async function moveTemoignage(id: string, direction: 'up' | 'down') {
  const supabase = await createAdminClient()
  const { data: all } = await supabase
    .from('temoignages')
    .select('id, ordre')
    .order('ordre', { ascending: true })

  if (!all) return { error: 'Erreur chargement' }

  const idx = all.findIndex((t) => t.id === id)
  if (idx === -1) return { error: 'Introuvable' }

  const swapIdx = direction === 'up' ? idx - 1 : idx + 1
  if (swapIdx < 0 || swapIdx >= all.length) return { success: true }

  const current = all[idx]
  const swap    = all[swapIdx]

  await Promise.all([
    supabase.from('temoignages').update({ ordre: swap.ordre }).eq('id', current.id),
    supabase.from('temoignages').update({ ordre: current.ordre }).eq('id', swap.id),
  ])

  revalidatePath('/admin/temoignages')
  revalidatePath('/')
  return { success: true }
}
