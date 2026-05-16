'use client';

import { useState } from 'react';
import { createFormation, deleteFormation } from '../../actions';

export default function CreateFormationForm() {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    
    try {
      const formData = new FormData(e.currentTarget);
      await createFormation(formData);
      setIsOpen(false);
      (e.target as HTMLFormElement).reset();
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
        className="bg-primary text-on-primary px-6 py-3 font-label-caps tracking-widest text-sm hover:bg-primary-container hover:text-on-primary-container transition-colors"
      >
        + CRÉER UNE FORMATION
      </button>
    );
  }

  return (
    <div className="bg-surface-container-lowest border border-surface-container-highest p-6 max-w-2xl">
      <div className="flex justify-between items-center mb-6">
        <h2 className="font-playfair text-xl text-on-surface">Nouvelle Formation</h2>
        <button onClick={() => setIsOpen(false)} className="text-on-surface-variant hover:text-error text-2xl leading-none">&times;</button>
      </div>

      {error && <div className="mb-6 p-4 bg-error-container text-on-error-container text-sm">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-label-caps tracking-wider text-on-surface-variant mb-2">Titre</label>
          <input required type="text" name="titre" className="w-full bg-surface-container-low border border-surface-container-highest px-4 py-3 text-on-surface focus:outline-none focus:border-primary" />
        </div>
        
        <div>
          <label className="block text-sm font-label-caps tracking-wider text-on-surface-variant mb-2">Description</label>
          <textarea required name="description" rows={3} className="w-full bg-surface-container-low border border-surface-container-highest px-4 py-3 text-on-surface focus:outline-none focus:border-primary"></textarea>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-label-caps tracking-wider text-on-surface-variant mb-2">Prix (€)</label>
            <input required type="number" step="0.01" name="prix" className="w-full bg-surface-container-low border border-surface-container-highest px-4 py-3 text-on-surface focus:outline-none focus:border-primary" />
          </div>
          <div>
            <label className="block text-sm font-label-caps tracking-wider text-on-surface-variant mb-2">Durée (ex: 2 Jours)</label>
            <input required type="text" name="duree" className="w-full bg-surface-container-low border border-surface-container-highest px-4 py-3 text-on-surface focus:outline-none focus:border-primary" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-label-caps tracking-wider text-on-surface-variant mb-2">Image de couverture</label>
          <input type="file" name="image" accept="image/*" className="w-full text-sm text-on-surface-variant file:mr-4 file:py-2 file:px-4 file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-on-primary hover:file:bg-primary-container" />
        </div>

        <div className="pt-4 flex justify-end gap-4">
          <button type="button" onClick={() => setIsOpen(false)} className="px-6 py-3 text-sm font-label-caps tracking-widest text-on-surface-variant hover:text-on-surface">ANNULER</button>
          <button type="submit" disabled={isLoading} className="bg-primary text-on-primary px-6 py-3 font-label-caps tracking-widest text-sm hover:bg-primary-container hover:text-on-primary-container transition-colors disabled:opacity-50">
            {isLoading ? 'ENREGISTREMENT...' : 'ENREGISTRER'}
          </button>
        </div>
      </form>
    </div>
  );
}
