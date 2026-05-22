import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createAdminClient } from '@/lib/supabase/server'

export async function POST(req: Request) {
  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2026-04-22.dahlia' })
    const body = await req.json()
    const { session_id, reservation_id } = body

    if (!session_id || !reservation_id) {
      return NextResponse.json({ error: 'session_id et reservation_id requis' }, { status: 400 })
    }

    const siteOrigin = new URL(req.url).origin
    const supabase = await createAdminClient()

    const { data: sessionData, error: sessionError } = await supabase
      .from('sessions')
      .select('*, formations(*)')
      .eq('id', session_id)
      .single()

    if (sessionError || !sessionData) {
      return NextResponse.json({ error: 'Session introuvable' }, { status: 404 })
    }
    if (sessionData.places_disponibles <= 0) {
      return NextResponse.json({ error: 'Cette session est complète.' }, { status: 400 })
    }

    const formation = sessionData.formations

    const checkoutSession = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      invoice_creation: { enabled: true },
      line_items: [{
        price_data: {
          currency: 'eur',
          product_data: {
            name: `Acompte (30%) — ${formation.titre}`,
            description: `Session du ${new Date(sessionData.date_debut).toLocaleDateString('fr-FR')} au ${new Date(sessionData.date_fin).toLocaleDateString('fr-FR')}`,
            images: formation.image_url ? [formation.image_url] : [],
          },
          unit_amount: Math.round(formation.prix * 0.3 * 100),
        },
        quantity: 1,
      }],
      metadata: {
        supabase_session_id: session_id,
        reservation_id,
        formation_titre: formation.titre,
        formation_prix: String(formation.prix),
        date_debut: sessionData.date_debut,
        date_fin: sessionData.date_fin,
      },
      success_url: `${siteOrigin}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteOrigin}/formations/${formation.id}`,
    })

    return NextResponse.json({ url: checkoutSession.url })
  } catch (error: any) {
    console.error('Erreur Checkout:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
