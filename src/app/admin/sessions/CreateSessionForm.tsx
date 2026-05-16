'use client';

import { useState } from 'react';
import { createSession } from '../actions';

type Formation = { id: string, titre: string };

export default function CreateSessionForm({ formations }: { formations: Formation[] }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    
    try {
      const formData = new FormData(e.currentTarget);
      await createSession(formData);
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
        + OUVRIR UNE SESSION
      </button>
    );
  }

  return (
    <div className="bg-surface-container-lowest border border-surface-container-highest p-6 max-w-2xl mb-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="font-playfair text-xl text-on-surface">Nouvelle Session</h2>
        <button onClick={() => setIsOpen(false)} className="text-on-surface-variant hover:text-error text-2xl leading-none">&times;</button>
      </div>

      {error && <div className="mb-6 p-4 bg-error-container text-on-error-container text-sm">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-label-caps tracking-wider text-on-surface-variant mb-2">Formation</label>
          <select required name="formation_id" className="w-full bg-surface-container-low border border-surface-container-highest px-4 py-3 text-on-surface focus:outline-none focus:border-primary">
            <option value="">Sélectionner une formation...</option>
            {formations.map(f => (
              <option key={f.id} value={f.id}>{f.titre}</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-label-caps tracking-wider text-on-surface-variant mb-2">Date de début</label>
            <input required type="date" name="date_debut" className="w-full bg-surface-container-low border border-surface-container-highest px-4 py-3 text-on-surface focus:outline-none focus:border-primary" />
          </div>
          <div>
            <label className="block text-sm font-label-caps tracking-wider text-on-surface-variant mb-2">Date de fin</label>
            <input required type="date" name="date_fin" className="w-full bg-surface-container-low border border-surface-container-highest px-4 py-3 text-on-surface focus:outline-none focus:border-primary" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-label-caps tracking-wider text-on-surface-variant mb-2">Nombre de places disponibles</label>
          <input required type="number" min="1" name="places_disponibles" defaultValue="4" className="w-full bg-surface-container-low border border-surface-container-highest px-4 py-3 text-on-surface focus:outline-none focus:border-primary" />
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
