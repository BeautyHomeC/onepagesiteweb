import { notFound } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/server'
import ContractEditor from '@/components/admin/ContractEditor'
import Link from 'next/link'

interface Props {
  params: Promise<{ id: string }>
}

export default async function ContratFormationPage({ params }: Props) {
  const { id } = await params
  const supabase = await createAdminClient()

  // Load formation
  const { data: formation, error } = await supabase
    .from('formations')
    .select('id, titre')
    .eq('id', id)
    .single()

  if (error || !formation) notFound()

  // Load latest contract template for this formation (particulier type as reference)
  const { data: template } = await supabase
    .from('contract_templates')
    .select('contenu, version')
    .eq('formation_id', id)
    .eq('type', 'particulier')
    .order('version', { ascending: false })
    .limit(1)
    .maybeSingle()

  return (
    <div className="space-y-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-3 text-sm text-on-surface-variant">
        <Link href="/admin/formations" className="hover:text-primary transition-colors">
          Formations
        </Link>
        <span>/</span>
        <span className="text-on-surface">{formation.titre}</span>
        <span>/</span>
        <span className="text-on-surface">Modèle de contrat</span>
      </div>

      {/* Header */}
      <div>
        <h2 className="font-playfair text-3xl text-on-surface mb-2">
          Modèle de contrat
        </h2>
        <p className="text-on-surface-variant text-sm">
          {formation.titre} — Le contrat est signé électroniquement par l&apos;élève avant le paiement.
          Chaque sauvegarde crée une nouvelle version ; les réservations existantes conservent la version signée.
        </p>
      </div>

      {/* Info block */}
      <div className="bg-surface-container-lowest border border-surface-container-highest p-4 text-sm text-on-surface-variant space-y-2">
        <p>
          <strong className="text-on-surface">Modèles par défaut :</strong>{' '}
          Les contrats utilisent maintenant les beaux documents A4 générés par Claude Design
          (<code className="text-xs bg-surface-container px-1">public/templates/convention-pro.html</code> et{' '}
          <code className="text-xs bg-surface-container px-1">contrat-particulier.html</code>).
          Variables : <code className="text-xs bg-surface-container px-1">{'{{formation.intitule}}'}</code>,{' '}
          <code className="text-xs bg-surface-container px-1">{'{{stagiaire.nom_prenom}}'}</code>, etc.
        </p>
        <p>
          <strong className="text-on-surface">Surcharge par formation :</strong>{' '}
          Si vous saisissez un contenu ci-dessous, il remplace le modèle par défaut uniquement pour{' '}
          <em>{formation.titre}</em>. Utilisez alors les variables plates :{' '}
          <code className="text-xs bg-surface-container px-1">{'{{nom_prenom}}'}</code>,{' '}
          <code className="text-xs bg-surface-container px-1">{'{{formation}}'}</code>,{' '}
          <code className="text-xs bg-surface-container px-1">{'{{clause_rgpd}}'}</code>, etc.
        </p>
      </div>

      {/* Editor */}
      <ContractEditor
        formationId={formation.id}
        formationTitre={formation.titre}
        initialContent={template?.contenu ?? ''}
        currentVersion={template?.version ?? 0}
      />
    </div>
  )
}
