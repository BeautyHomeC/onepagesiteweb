import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

export async function POST(req: Request) {
  try {
    const { session_id, prenom, nom, email } = await req.json()

    if (!session_id || !prenom?.trim() || !nom?.trim() || !email?.trim()) {
      return NextResponse.json({ error: 'Tous les champs sont requis.' }, { status: 400 })
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Adresse email invalide.' }, { status: 400 })
    }

    const supabase = await createAdminClient()

    // Check session exists and is indeed full (or not — we accept anyway)
    const { data: session } = await supabase
      .from('sessions')
      .select('id, places_disponibles, date_debut, date_fin, formations(titre, id)')
      .eq('id', session_id)
      .single()

    if (!session) {
      return NextResponse.json({ error: 'Session introuvable.' }, { status: 404 })
    }

    // Prevent duplicate entries for the same email + session
    const { data: existing } = await supabase
      .from('liste_attente')
      .select('id')
      .eq('session_id', session_id)
      .eq('email', email.toLowerCase().trim())
      .single()

    if (existing) {
      // Already registered — treat as success to avoid info leakage
      return NextResponse.json({ success: true })
    }

    const { error } = await supabase.from('liste_attente').insert({
      session_id,
      prenom: prenom.trim(),
      nom: nom.trim(),
      email: email.toLowerCase().trim(),
    })

    if (error) {
      console.error('[waitlist] insert error:', error)
      return NextResponse.json({ error: 'Erreur serveur.' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('[waitlist] unexpected error:', err)
    return NextResponse.json({ error: 'Erreur serveur.' }, { status: 500 })
  }
}
