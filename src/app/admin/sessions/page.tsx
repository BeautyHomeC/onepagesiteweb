import { createAdminClient } from '@/lib/supabase/server';
import CreateSessionForm from './CreateSessionForm';
import DeleteSessionButton from './DeleteSessionButton';

export default async function SessionsAdminPage() {
  const supabase = await createAdminClient();
  
  // Fetch formations for the dropdown
  const { data: formations } = await supabase.from('formations').select('id, titre').order('titre');
  
  // Fetch sessions with formation details
  const { data: sessions } = await supabase
    .from('sessions')
    .select('*, formations(titre)')
    .order('date_debut', { ascending: false });

  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-playfair text-3xl text-on-surface mb-2">Historique des Sessions</h2>
        <p className="text-on-surface-variant mb-8">Planifiez de nouvelles dates pour vos formations existantes.</p>
        
        {(!formations || formations.length === 0) ? (
          <div className="p-4 bg-error-container text-on-error-container text-sm mb-8">
            Vous devez d'abord créer une formation avant de pouvoir ouvrir une session.
          </div>
        ) : (
          <CreateSessionForm formations={formations} />
        )}
      </div>

      <div className="bg-surface-container-lowest border border-surface-container-highest overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-surface-container-highest bg-surface-container-low text-xs font-label-caps tracking-wider text-on-surface-variant">
                <th className="p-4 font-normal">Date de début</th>
                <th className="p-4 font-normal">Date de fin</th>
                <th className="p-4 font-normal">Formation</th>
                <th className="p-4 font-normal">Places restantes</th>
                <th className="p-4 font-normal text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {sessions?.map((session) => (
                <tr key={session.id} className="border-b border-surface-container-highest hover:bg-surface-container transition-colors">
                  <td className="p-4 text-on-surface font-medium">
                    {new Date(session.date_debut).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </td>
                  <td className="p-4 text-on-surface-variant">
                    {new Date(session.date_fin).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </td>
                  <td className="p-4 text-on-surface">{session.formations?.titre}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      session.places_disponibles > 0 
                        ? 'bg-[#E1DFDC] text-[#636360]' 
                        : 'bg-error-container text-on-error-container'
                    }`}>
                      {session.places_disponibles > 0 ? `${session.places_disponibles} places` : 'COMPLET'}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <DeleteSessionButton id={session.id} />
                  </td>
                </tr>
              ))}
              {(!sessions || sessions.length === 0) && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-on-surface-variant italic">
                    Aucune session planifiée.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
