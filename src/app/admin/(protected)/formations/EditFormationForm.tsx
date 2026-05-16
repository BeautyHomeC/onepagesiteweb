'use client';

import { useState } from 'react';
import { updateFormation } from '../../actions';
import { Edit2 } from 'lucide-react';

type Formation = {
  id: string;
  titre: string;
  description: string;
  prix: number;
  duree: string;
  objectifs?: string;
  competences?: string;
  debouches?: string;
  deroule?: string;
  moyens?: string;
  evaluation?: string;
};

export default function EditFormationForm({ formation }: { formation: Formation }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    
    try {
      const formData = new FormData(e.currentTarget);
      await updateFormation(formation.id, formData);
      setIsOpen(false);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }

  if (!isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        className="text-on-surface-variant hover:text-primary transition-colors flex items-center justify-center w-full py-2 border border-transparent hover:border-primary text-sm font-label-caps"
        title="Modifier la formation"
      >
        <Edit2 className="w-4 h-4 mr-2" />
        MODIFIER
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-surface-container-lowest border border-surface-container-highest p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="font-playfair text-xl text-on-surface">Modifier {formation.titre}</h2>
          <button onClick={() => setIsOpen(false)} className="text-on-surface-variant hover:text-error text-2xl leading-none">&times;</button>
        </div>

        {error && <div className="mb-6 p-4 bg-error-container text-on-error-container text-sm">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-label-caps tracking-wider text-on-surface-variant mb-2">Titre</label>
            <input required type="text" name="titre" defaultValue={formation.titre} className="w-full bg-surface-container-low border border-surface-container-highest px-4 py-3 text-on-surface focus:outline-none focus:border-primary" />
          </div>
          
          <div>
            <label className="block text-sm font-label-caps tracking-wider text-on-surface-variant mb-2">Description courte</label>
            <textarea required name="description" rows={3} defaultValue={formation.description} className="w-full bg-surface-container-low border border-surface-container-highest px-4 py-3 text-on-surface focus:outline-none focus:border-primary"></textarea>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-label-caps tracking-wider text-on-surface-variant mb-2">Prix (€)</label>
              <input required type="number" step="0.01" name="prix" defaultValue={formation.prix} className="w-full bg-surface-container-low border border-surface-container-highest px-4 py-3 text-on-surface focus:outline-none focus:border-primary" />
            </div>
            <div>
              <label className="block text-sm font-label-caps tracking-wider text-on-surface-variant mb-2">Durée (ex: 2 Jours)</label>
              <input required type="text" name="duree" defaultValue={formation.duree} className="w-full bg-surface-container-low border border-surface-container-highest px-4 py-3 text-on-surface focus:outline-none focus:border-primary" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-label-caps tracking-wider text-on-surface-variant mb-2">Nouvelle image (laisser vide pour conserver l'actuelle)</label>
            <input type="file" name="image" accept="image/*" className="w-full text-sm text-on-surface-variant file:mr-4 file:py-2 file:px-4 file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-on-primary hover:file:bg-primary-container" />
          </div>

          <hr className="border-surface-container-highest my-8" />
          <h3 className="font-headline-sm text-on-surface mb-6">Programme Détaillé (Optionnel)</h3>

          <div>
            <label className="block text-sm font-label-caps tracking-wider text-on-surface-variant mb-2">Objectifs & Public</label>
            <textarea name="objectifs" rows={3} defaultValue={formation.objectifs} className="w-full bg-surface-container-low border border-surface-container-highest px-4 py-3 text-on-surface focus:outline-none focus:border-primary"></textarea>
          </div>

          <div>
            <label className="block text-sm font-label-caps tracking-wider text-on-surface-variant mb-2">Compétences visées</label>
            <textarea name="competences" rows={4} defaultValue={formation.competences} className="w-full bg-surface-container-low border border-surface-container-highest px-4 py-3 text-on-surface focus:outline-none focus:border-primary"></textarea>
          </div>

          <div>
            <label className="block text-sm font-label-caps tracking-wider text-on-surface-variant mb-2">Débouchés</label>
            <textarea name="debouches" rows={2} defaultValue={formation.debouches} className="w-full bg-surface-container-low border border-surface-container-highest px-4 py-3 text-on-surface focus:outline-none focus:border-primary"></textarea>
          </div>

          <div>
            <label className="block text-sm font-label-caps tracking-wider text-on-surface-variant mb-2">Déroulé de la formation</label>
            <textarea name="deroule" rows={6} defaultValue={formation.deroule} className="w-full bg-surface-container-low border border-surface-container-highest px-4 py-3 text-on-surface focus:outline-none focus:border-primary"></textarea>
          </div>

          <div>
            <label className="block text-sm font-label-caps tracking-wider text-on-surface-variant mb-2">Moyens, Organisation & Infos Pratiques</label>
            <textarea name="moyens" rows={4} defaultValue={formation.moyens} className="w-full bg-surface-container-low border border-surface-container-highest px-4 py-3 text-on-surface focus:outline-none focus:border-primary"></textarea>
          </div>

          <div>
            <label className="block text-sm font-label-caps tracking-wider text-on-surface-variant mb-2">Évaluation & Accessibilité</label>
            <textarea name="evaluation" rows={3} defaultValue={formation.evaluation} className="w-full bg-surface-container-low border border-surface-container-highest px-4 py-3 text-on-surface focus:outline-none focus:border-primary"></textarea>
          </div>

          <div className="pt-4 flex justify-end gap-4">
            <button type="button" onClick={() => setIsOpen(false)} className="px-6 py-3 text-sm font-label-caps tracking-widest text-on-surface-variant hover:text-on-surface">ANNULER</button>
            <button type="submit" disabled={isLoading} className="bg-primary text-on-primary px-6 py-3 font-label-caps tracking-widest text-sm hover:bg-primary-container hover:text-on-primary-container transition-colors disabled:opacity-50">
              {isLoading ? 'MODIFICATION...' : 'ENREGISTRER'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
