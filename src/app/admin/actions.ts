'use server';

import { createAdminClient, createClient } from '@/lib/supabase/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

async function requireAuth() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/admin/login');
}

// ─────────────────────────────────────────────────────────────────────────
//  Helpers — upload (image ou PDF) vers Supabase Storage
// ─────────────────────────────────────────────────────────────────────────
async function uploadToBucket(
  file: File,
  bucket: 'formations_images' | 'formations_documents',
): Promise<string> {
  const fileExt = file.name.split('.').pop();
  const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const storage = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  const { error: uploadError } = await storage.storage
    .from(bucket)
    .upload(fileName, buffer, {
      contentType: file.type,
      cacheControl: '3600',
      upsert: false,
    });

  if (uploadError) {
    console.error('Upload error:', uploadError);
    throw new Error("Erreur lors de l'upload du fichier");
  }

  const { data: publicUrlData } = storage.storage.from(bucket).getPublicUrl(fileName);
  return publicUrlData.publicUrl;
}

// ─────────────────────────────────────────────────────────────────────────
//  Extraction des champs formation depuis le FormData (commun create/update)
// ─────────────────────────────────────────────────────────────────────────
async function extractFormationFields(formData: FormData) {
  const fields: Record<string, any> = {
    titre:           formData.get('titre') as string,
    description:     formData.get('description') as string,
    prix:            Number(formData.get('prix')),
    duree:           formData.get('duree') as string,
    duree_formation: (formData.get('duree_formation') as string) || null,
    horaire:         (formData.get('horaire') as string) || null,
    nombre_eleves:   Number(formData.get('nombre_eleves')) || 2,
    objectifs:       (formData.get('objectifs') as string) || null,
    competences:     (formData.get('competences') as string) || null,
    debouches:       (formData.get('debouches') as string) || null,
    deroule:         (formData.get('deroule') as string) || null,
    moyens:          (formData.get('moyens') as string) || null,
    evaluation:      (formData.get('evaluation') as string) || null,
  };

  // Upload image (optionnel)
  const image = formData.get('image') as File | null;
  if (image && image.size > 0) {
    fields.image_url = await uploadToBucket(image, 'formations_images');
  }

  // Upload programme PDF (optionnel)
  const programme = formData.get('programme_pdf') as File | null;
  if (programme && programme.size > 0) {
    fields.programme_pdf_url = await uploadToBucket(programme, 'formations_documents');
  }

  return fields;
}

// ─────────────────────────────────────────────────────────────────────────
//  Formations
// ─────────────────────────────────────────────────────────────────────────
export async function createFormation(formData: FormData) {
  await requireAuth();
  const supabase = await createAdminClient();
  const fields = await extractFormationFields(formData);

  const { error } = await supabase.from('formations').insert([fields]);
  if (error) {
    console.error('Insert error:', error);
    throw new Error('Erreur lors de la création de la formation');
  }

  revalidatePath('/admin/formations');
  revalidatePath('/admin');
  revalidatePath('/');
  return { success: true };
}

export async function updateFormation(id: string, formData: FormData) {
  await requireAuth();
  const supabase = await createAdminClient();
  const fields = await extractFormationFields(formData);

  const { error } = await supabase.from('formations').update(fields).eq('id', id);
  if (error) {
    console.error('Update error:', error);
    throw new Error('Erreur lors de la modification de la formation');
  }

  revalidatePath('/admin/formations');
  revalidatePath('/admin');
  revalidatePath('/');
  return { success: true };
}

export async function deleteFormation(id: string) {
  await requireAuth();
  const supabase = await createAdminClient();

  const { error } = await supabase.from('formations').delete().eq('id', id);
  if (error) {
    console.error('Delete error:', error);
    throw new Error('Impossible de supprimer cette formation (elle a peut-être des sessions liées).');
  }

  revalidatePath('/admin/formations');
  revalidatePath('/admin');
  revalidatePath('/');
  return { success: true };
}

// ─────────────────────────────────────────────────────────────────────────
//  Sessions
// ─────────────────────────────────────────────────────────────────────────
export async function createSession(formData: FormData) {
  await requireAuth();
  const supabase = await createAdminClient();

  const formation_id      = formData.get('formation_id') as string;
  const date_debut        = formData.get('date_debut') as string;
  const date_fin          = formData.get('date_fin') as string;
  const places_disponibles = Number(formData.get('places_disponibles'));

  const { error } = await supabase
    .from('sessions')
    .insert([{ formation_id, date_debut, date_fin, places_disponibles }]);

  if (error) {
    console.error('Insert session error:', error);
    throw new Error('Erreur lors de la création de la session');
  }

  revalidatePath('/admin/sessions');
  revalidatePath('/admin');
  revalidatePath('/');
  return { success: true };
}

export async function deleteSession(id: string) {
  await requireAuth();
  const supabase = await createAdminClient();

  // Check for linked reservations before attempting delete
  const { count, error: countError } = await supabase
    .from('reservations')
    .select('id', { count: 'exact', head: true })
    .eq('session_id', id);

  if (countError) {
    console.error('Count reservations error:', countError);
    throw new Error('Erreur lors de la vérification des réservations liées.');
  }

  if (count && count > 0) {
    throw new Error(
      `Impossible de supprimer : cette session a ${count} réservation${count > 1 ? 's' : ''} liée${count > 1 ? 's' : ''}. Annulez d'abord les réservations.`
    );
  }

  const { error } = await supabase.from('sessions').delete().eq('id', id);
  if (error) {
    console.error('Delete session error:', error);
    throw new Error('Impossible de supprimer cette session.');
  }

  revalidatePath('/admin/sessions');
  revalidatePath('/admin');
  revalidatePath('/');
  return { success: true };
}

// ─────────────────────────────────────────────────────────────────────────
//  Contrats (contract_templates)
// ─────────────────────────────────────────────────────────────────────────
export async function saveContractTemplate(formationId: string, contenu: string) {
  await requireAuth();
  const supabase = await createAdminClient();

  // Get current max version for this formation (maybeSingle: null if no row yet)
  const { data: latest } = await supabase
    .from('contract_templates')
    .select('version')
    .eq('formation_id', formationId)
    .order('version', { ascending: false })
    .limit(1)
    .maybeSingle();

  const nextVersion = (latest?.version ?? 0) + 1;

  // Upsert the same content for both client types so the sign route always finds a template
  const { error } = await supabase
    .from('contract_templates')
    .upsert(
      [
        { formation_id: formationId, type: 'particulier', contenu, version: nextVersion },
        { formation_id: formationId, type: 'pro',         contenu, version: nextVersion },
      ],
      { onConflict: 'formation_id,type' },
    );

  if (error) {
    console.error('saveContractTemplate error:', error);
    throw new Error('Erreur lors de la sauvegarde du modèle de contrat');
  }

  revalidatePath(`/admin/formations/${formationId}/contrats`);
  return { success: true, version: nextVersion };
}

// ─────────────────────────────────────────────────────────────────────────
//  Paramètres admin (parametres_admin)
// ─────────────────────────────────────────────────────────────────────────
export async function saveParametre(cle: string, valeur: string) {
  await requireAuth();
  const supabase = await createAdminClient();

  const { error } = await supabase
    .from('parametres_admin')
    .upsert([{ cle, valeur }], { onConflict: 'cle' });

  if (error) {
    console.error('saveParametre error:', error);
    throw new Error(`Erreur lors de la sauvegarde du paramètre "${cle}"`);
  }

  revalidatePath('/admin/parametres');
  return { success: true };
}
