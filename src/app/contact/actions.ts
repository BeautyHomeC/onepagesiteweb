'use server'

import { createAdminClient } from '@/lib/supabase/server'
import { Resend } from 'resend'
import ContactNotificationEmail from '@/emails/ContactNotificationEmail'
import ContactConfirmationEmail from '@/emails/ContactConfirmationEmail'
import React from 'react'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function submitContact(fd: FormData) {
  // Honeypot check — bots fill the hidden 'website' field
  const honeypot = (fd.get('website') as string | null) ?? ''
  if (honeypot.trim() !== '') return { success: true } // silently ignore

  const prenom  = (fd.get('prenom')  as string | null)?.trim() ?? ''
  const nom     = (fd.get('nom')     as string | null)?.trim() ?? ''
  const email   = (fd.get('email')   as string | null)?.trim() ?? ''
  const message = (fd.get('message') as string | null)?.trim() ?? ''

  if (prenom.length < 2) return { error: 'Prénom trop court.' }
  if (nom.length < 2)    return { error: 'Nom trop court.' }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: 'Adresse email invalide.' }
  if (message.length < 10) return { error: 'Message trop court (minimum 10 caractères).' }
  if (message.length > 2000) return { error: 'Message trop long (maximum 2000 caractères).' }

  const supabase = await createAdminClient()

  const { error: dbError } = await supabase
    .from('contact_messages')
    .insert([{ prenom, nom, email, message }])

  if (dbError) return { error: "Erreur lors de l'envoi. Veuillez réessayer." }

  const ownerEmail = process.env.CONTACT_EMAIL ?? 'beautyhomeconcept@gmail.com'

  // Notification to owner
  await resend.emails.send({
    from: 'Beauty Home Concept <contact@beautyhomeconcept.fr>',
    to: ownerEmail,
    subject: `Nouveau message de ${prenom} ${nom}`,
    react: React.createElement(ContactNotificationEmail, { prenom, nom, email, message }),
  })

  // Confirmation to visitor
  await resend.emails.send({
    from: 'Beauty Home Concept <contact@beautyhomeconcept.fr>',
    to: email,
    subject: 'Votre message a bien été reçu',
    react: React.createElement(ContactConfirmationEmail, { prenom, message }),
  })

  return { success: true }
}
