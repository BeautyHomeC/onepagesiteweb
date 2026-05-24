import { createAdminClient } from '@/lib/supabase/server'
import MessagesView from './MessagesView'

export default async function MessagesAdminPage() {
  const supabase = await createAdminClient()
  const { data: messages } = await supabase
    .from('contact_messages')
    .select('id, prenom, nom, email, message, lu, created_at')
    .order('created_at', { ascending: false })

  const unread = (messages ?? []).filter((m) => !m.lu).length

  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-playfair text-3xl text-on-surface mb-2">
          Messages de contact
          {unread > 0 && (
            <span className="ml-3 bg-primary text-on-primary text-xs font-label-caps tracking-wider px-2 py-0.5">
              {unread} non lu{unread > 1 ? 's' : ''}
            </span>
          )}
        </h2>
        <p className="text-on-surface-variant text-sm">
          Cliquez sur un message pour le lire et répondre directement par email.
        </p>
      </div>
      <MessagesView messages={messages ?? []} />
    </div>
  )
}
