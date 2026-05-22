import { NextResponse } from 'next/server'
import JSZip from 'jszip'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/server'

interface Params {
  params: Promise<{ id: string }>
}

export async function GET(req: Request, { params }: Params) {
  // Auth check — only authenticated admins can download dossiers
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const supabaseAdmin = await createAdminClient()

  // Load reservation with related data
  const { data: reservation, error } = await supabaseAdmin
    .from('reservations')
    .select(`
      *,
      sessions (
        date_debut, date_fin,
        formations ( titre, prix, programme_pdf_url )
      )
    `)
    .eq('id', id)
    .single()

  if (error || !reservation) {
    return NextResponse.json({ error: 'Réservation introuvable' }, { status: 404 })
  }

  const formation: any = (reservation as any).sessions?.formations
  const sessionRow: any = (reservation as any).sessions
  const dateDebut = new Date(sessionRow?.date_debut ?? Date.now()).toLocaleDateString('fr-FR')
  const dateFin   = new Date(sessionRow?.date_fin   ?? Date.now()).toLocaleDateString('fr-FR')
  const dateSession = dateDebut === dateFin ? `le ${dateDebut}` : `du ${dateDebut} au ${dateFin}`
  const formationTitre = formation?.titre ?? 'Formation'
  const acompte = reservation.acompte_amount ?? 0

  const nomComplet = (`${reservation.prenom ?? ''} ${reservation.nom ?? ''}`.trim()
    || reservation.nom_client) ?? 'client'
  const docLabel = reservation.client_type === 'pro' ? 'Convention' : 'Contrat'
  const safeName = nomComplet.replace(/[^a-zA-Z0-9_-]/g, '_')

  const zip = new JSZip()

  // 1. Fiche d'inscription PDF
  try {
    const { generateFichePDF } = await import('@/lib/contract/pdf')
    const ficheBuffer = await generateFichePDF({
      prenom:           reservation.prenom ?? '',
      nom:              reservation.nom ?? '',
      email:            reservation.email_client ?? '',
      telephone:        reservation.telephone ?? reservation.telephone_client ?? '',
      adresse:          reservation.adresse ?? '',
      client_type:      (reservation.client_type ?? 'particulier') as 'particulier' | 'pro',
      raison_sociale:   reservation.raison_sociale ?? undefined,
      siret:            reservation.siret ?? undefined,
      instagram:        reservation.instagram ?? undefined,
      formation_titre:  formationTitre,
      date_session:     dateSession,
      acompte,
      created_at:       reservation.created_at ?? new Date().toISOString(),
    })
    zip.file(`Fiche_Inscription_${safeName}.pdf`, ficheBuffer)
  } catch (e) {
    console.error('Fiche PDF error:', e)
  }

  // 2. Signed contract from Storage
  const contratPath = reservation.contrat_signe_url as string | null
  if (contratPath) {
    try {
      const { data: signed } = await supabaseAdmin.storage
        .from('contracts')
        .createSignedUrl(contratPath, 3600)
      if (signed?.signedUrl) {
        const r = await fetch(signed.signedUrl)
        if (r.ok) {
          zip.file(`${docLabel}_${safeName}.pdf`, await r.arrayBuffer())
        }
      }
    } catch (e) {
      console.error('Contrat fetch error:', e)
    }
  }

  // 3. Programme PDF (if attached to formation)
  const programmeUrl = formation?.programme_pdf_url as string | null
  if (programmeUrl) {
    try {
      const r = await fetch(programmeUrl)
      if (r.ok) {
        zip.file(`Programme_${formationTitre.replace(/\s+/g, '_')}.pdf`, await r.arrayBuffer())
      }
    } catch (e) {
      console.error('Programme fetch error:', e)
    }
  }

  // Generate ZIP buffer
  const zipBuffer = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' })

  return new Response(new Uint8Array(zipBuffer), {
    headers: {
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename="Dossier_${safeName}.zip"`,
      'Content-Length': String(zipBuffer.length),
    },
  })
}
