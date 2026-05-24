'use server'

import { createClient, createAdminClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

async function requireAuth() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/admin/login')
}

export async function markAsRead(id: string) {
  await requireAuth()
  const supabase = await createAdminClient()
  await supabase.from('contact_messages').update({ lu: true }).eq('id', id)
  revalidatePath('/admin/messages')
}
