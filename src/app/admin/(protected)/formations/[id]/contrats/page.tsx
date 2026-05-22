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
      <div className="bg-surface-container-lowest border border-surface-container-highest p-4 text-sm text-on-surface-variant space-y-1">
        <p>
          <strong className="text-on-surface">Conventions :</strong>{' '}
          Utilisez <code className="text-xs bg-surface-container px-1">{'{{variable}}'}</code> pour les données dynamiques.
          La clause RGPD (<code className="text-xs bg-surface-container px-1">{'{{clause_rgpd}}'}</code>) est toujours injectée automatiquement à la fin.
        </p>
        <p>
          <strong className="text-on-surface">Clients pro :</strong>{' '}
          Lorsque <code className="text-xs bg-surface-container px-1">client_type = pro</code>, le document est intitulé
          &laquo; Convention de formation &raquo; (sinon &laquo; Contrat de formation &raquo;).
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
