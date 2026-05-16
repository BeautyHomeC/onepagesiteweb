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

// Formations
export async function createFormation(formData: FormData) {
  await requireAuth();
  const supabase = await createAdminClient();
  
  const titre = formData.get('titre') as string;
  const description = formData.get('description') as string;
  const prix = Number(formData.get('prix'));
  const duree = formData.get('duree') as string;
  const image = formData.get('image') as File | null;

  const image_url = null; // Removed inner image_url definition, moved to line 20

  const objectifs = formData.get('objectifs') as string | null;
  const competences = formData.get('competences') as string | null;
  const debouches = formData.get('debouches') as string | null;
  const deroule = formData.get('deroule') as string | null;
  const moyens = formData.get('moyens') as string | null;
  const evaluation = formData.get('evaluation') as string | null;

  let final_image_url = null;

  if (image && image.size > 0) {
    const fileExt = image.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
    
    // Use native ArrayBuffer which is fully supported by all fetch implementations
    const arrayBuffer = await image.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    const storageClient = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: uploadData, error: uploadError } = await storageClient.storage
      .from('formations_images')
      .upload(fileName, buffer, {
        contentType: image.type,
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      throw new Error("Erreur lors de l'upload de l'image");
    }

    const { data: publicUrlData } = supabase.storage
      .from('formations_images')
      .getPublicUrl(fileName);
      
    final_image_url = publicUrlData.publicUrl;
  }

  const { error } = await supabase.from('formations').insert([
    { 
      titre, description, prix, duree, image_url: final_image_url,
      objectifs, competences, debouches, deroule, moyens, evaluation
    }
  ]);

  if (error) {
    console.error("Insert error:", error);
    throw new Error("Erreur lors de la création de la formation");
  }

  revalidatePath('/admin/formations');
  revalidatePath('/admin');
  revalidatePath('/'); // Revalider la page d'accueil
  return { success: true };
}

export async function updateFormation(id: string, formData: FormData) {
  await requireAuth();
  const supabase = await createAdminClient();
  
  const titre = formData.get('titre') as string;
  const description = formData.get('description') as string;
  const prix = Number(formData.get('prix'));
  const duree = formData.get('duree') as string;
  const image = formData.get('image') as File | null;

  const objectifs = formData.get('objectifs') as string | null;
  const competences = formData.get('competences') as string | null;
  const debouches = formData.get('debouches') as string | null;
  const deroule = formData.get('deroule') as string | null;
  const moyens = formData.get('moyens') as string | null;
  const evaluation = formData.get('evaluation') as string | null;

  let final_image_url = null;

  if (image && image.size > 0) {
    const fileExt = image.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
    
    // Use native ArrayBuffer which is fully supported by all fetch implementations
    const arrayBuffer = await image.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    const storageClient = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: uploadData, error: uploadError } = await storageClient.storage
      .from('formations_images')
      .upload(fileName, buffer, {
        contentType: image.type,
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      throw new Error("Erreur lors de l'upload de la nouvelle image");
    }

    const { data: publicUrlData } = supabase.storage
      .from('formations_images')
      .getPublicUrl(fileName);
      
    final_image_url = publicUrlData.publicUrl;
  }

  const updateData: any = { 
    titre, description, prix, duree,
    objectifs, competences, debouches, deroule, moyens, evaluation
  };
  
  if (final_image_url) {
    updateData.image_url = final_image_url;
  }

  const { error } = await supabase.from('formations').update(updateData).eq('id', id);

  if (error) {
    console.error("Update error:", error);
    throw new Error("Erreur lors de la modification de la formation");
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
    console.error("Delete error:", error);
    throw new Error("Impossible de supprimer cette formation (elle a peut-être des sessions liées).");
  }

  revalidatePath('/admin/formations');
  revalidatePath('/admin');
  revalidatePath('/');
  return { success: true };
}

// Sessions
export async function createSession(formData: FormData) {
  await requireAuth();
  const supabase = await createAdminClient();
  
  const formation_id = formData.get('formation_id') as string;
  const date_debut = formData.get('date_debut') as string;
  const date_fin = formData.get('date_fin') as string;
  const places_disponibles = Number(formData.get('places_disponibles'));

  const { error } = await supabase.from('sessions').insert([
    { formation_id, date_debut, date_fin, places_disponibles }
  ]);

  if (error) {
    console.error("Insert session error:", error);
    throw new Error("Erreur lors de la création de la session");
  }

  revalidatePath('/admin/sessions');
  revalidatePath('/admin');
  revalidatePath('/');
  return { success: true };
}

export async function deleteSession(id: string) {
  await requireAuth();
  const supabase = await createAdminClient();
  
  const { error } = await supabase.from('sessions').delete().eq('id', id);
  if (error) {
    console.error("Delete session error:", error);
    throw new Error("Impossible de supprimer cette session (il y a peut-être déjà des réservations).");
  }

  revalidatePath('/admin/sessions');
  revalidatePath('/admin');
  revalidatePath('/');
  return { success: true };
}
