import { createAdminClient } from '@/lib/supabase/server';
import CreateFormationForm from './CreateFormationForm';
import DeleteFormationButton from './DeleteFormationButton';
import EditFormationForm from './EditFormationForm';
import ProgrammePdfUpload from './ProgrammePdfUpload';

export default async function FormationsAdminPage() {
  const supabase = await createAdminClient();
  const { data: formations } = await supabase.from('formations').select('*').order('created_at', { ascending: false });

  return (
    <div className="space-y-12">
      <div>
        <h2 className="font-playfair text-3xl text-on-surface mb-2">Catalogue des Formations</h2>
        <p className="text-on-surface-variant mb-8">Gérez les descriptions, les prix et les images de vos formations.</p>
        <CreateFormationForm />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {formations?.map((formation) => (
          <div key={formation.id} className="bg-surface-container-lowest border border-surface-container-highest overflow-hidden flex flex-col">
            {formation.image_url ? (
              <img src={formation.image_url} alt={formation.titre} className="w-full h-48 object-cover" />
            ) : (
              <div className="w-full h-48 bg-surface-container flex items-center justify-center text-on-surface-variant text-sm">Aucune image</div>
            )}
            <div className="p-6 flex-1 flex flex-col">
              <h3 className="font-playfair text-xl text-on-surface mb-2">{formation.titre}</h3>
              <p className="text-on-surface-variant text-sm line-clamp-3 mb-4 flex-1">{formation.description}</p>
              <div className="flex justify-between items-center text-sm font-label-caps tracking-wider text-on-surface mb-6">
                <span>{formation.duree}</span>
                <span className="text-primary">{formation.prix} €</span>
              </div>
              <ProgrammePdfUpload formationId={formation.id} currentUrl={formation.programme_pdf_url ?? null} />

              <div className="grid grid-cols-3 border-t border-surface-container-highest divide-x divide-surface-container-highest mt-3">
                <EditFormationForm formation={formation} />
                <a
                  href={`/admin/formations/${formation.id}/contrats`}
                  className="py-3 text-center text-xs font-label-caps tracking-wider text-on-surface-variant hover:text-primary hover:bg-surface-container-low transition-colors"
                >
                  CONTRATS
                </a>
                <DeleteFormationButton id={formation.id} />
              </div>
            </div>
          </div>
        ))}
        {formations?.length === 0 && (
          <p className="text-on-surface-variant italic col-span-full">Aucune formation créée pour le moment.</p>
        )}
      </div>
    </div>
  );
}
