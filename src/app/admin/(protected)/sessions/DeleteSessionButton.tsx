'use client';

import { useState } from 'react';
import { deleteSession } from '../../actions';
import { Trash2 } from 'lucide-react';

export default function DeleteSessionButton({ id }: { id: string }) {
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleDelete() {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette session ? Cela ne supprimera pas les réservations liées.')) return;
    
    setIsDeleting(true);
    try {
      await deleteSession(id);
    } catch (error: any) {
      alert(error.message);
      setIsDeleting(false);
    }
  }

  return (
    <button 
      onClick={handleDelete}
      disabled={isDeleting}
      className="text-on-surface-variant hover:text-error transition-colors"
      title="Supprimer la session"
    >
      <Trash2 className="w-5 h-5" />
    </button>
  );
}
