'use client';

import { useState } from 'react';
import { deleteFormation } from '../../actions';
import { Trash2 } from 'lucide-react';

export default function DeleteFormationButton({ id }: { id: string }) {
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleDelete() {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette formation ?')) return;
    
    setIsDeleting(true);
    try {
      await deleteFormation(id);
    } catch (error: any) {
      alert(error.message);
      setIsDeleting(false);
    }
  }

  return (
    <button 
      onClick={handleDelete}
      disabled={isDeleting}
      className="text-on-surface-variant hover:text-error transition-colors flex items-center justify-center w-full py-2 border border-transparent hover:border-error text-sm font-label-caps"
    >
      <Trash2 className="w-4 h-4 mr-2" />
      {isDeleting ? 'SUPPRESSION...' : 'SUPPRIMER'}
    </button>
  );
}
