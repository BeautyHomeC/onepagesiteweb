'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import { useCallback, useState, useTransition } from 'react'
import { saveContractTemplate } from '@/app/admin/actions'

const TEMPLATE_VARS = [
  { key: '{{prenom}}',         label: 'Prénom' },
  { key: '{{nom}}',            label: 'Nom' },
  { key: '{{email}}',          label: 'Email' },
  { key: '{{telephone}}',      label: 'Téléphone' },
  { key: '{{adresse}}',        label: 'Adresse' },
  { key: '{{formation_titre}}', label: 'Titre formation' },
  { key: '{{date_session}}',   label: 'Date session' },
  { key: '{{prix}}',           label: 'Prix total (€)' },
  { key: '{{acompte}}',        label: 'Acompte (€)' },
  { key: '{{solde}}',          label: 'Solde (€)' },
  { key: '{{raison_sociale}}', label: 'Raison sociale' },
  { key: '{{siret}}',          label: 'SIRET' },
  { key: '{{clause_rgpd}}',    label: 'Clause RGPD (auto)' },
]

interface Props {
  formationId: string
  formationTitre: string
  initialContent: string
  currentVersion: number
}

export default function ContractEditor({
  formationId,
  formationTitre,
  initialContent,
  currentVersion,
}: Props) {
  const [isPending, startTransition] = useTransition()
  const [savedVersion, setSavedVersion] = useState(currentVersion)
  const [status, setStatus] = useState<'idle' | 'saved' | 'error'>('idle')

  const editor = useEditor({
    extensions: [StarterKit, Underline],
    content: initialContent || '<p>Saisissez ici le modèle de contrat...</p>',
    editorProps: {
      attributes: {
        class: 'prose max-w-none focus:outline-none min-h-[400px] p-6 text-sm leading-relaxed',
      },
    },
  })

  const insertVariable = useCallback((key: string) => {
    editor?.chain().focus().insertContent(key).run()
  }, [editor])

  const handleSave = useCallback(() => {
    if (!editor) return
    const html = editor.getHTML()

    startTransition(async () => {
      try {
        const result = await saveContractTemplate(formationId, html)
        setSavedVersion(result.version)
        setStatus('saved')
        setTimeout(() => setStatus('idle'), 3000)
      } catch {
        setStatus('error')
        setTimeout(() => setStatus('idle'), 4000)
      }
    })
  }, [editor, formationId])

  if (!editor) return null

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="bg-surface border border-surface-container-highest p-3 flex flex-wrap gap-2 items-center">
        <ToolbarButton onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')} label="G" title="Gras" />
        <ToolbarButton onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')} label="I" title="Italique" italic />
        <ToolbarButton onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive('underline')} label="S" title="Souligné" underline />
        <div className="w-px h-5 bg-surface-container-highest mx-1" />
        <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} active={editor.isActive('heading', { level: 1 })} label="H1" title="Titre 1" />
        <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive('heading', { level: 2 })} label="H2" title="Titre 2" />
        <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive('heading', { level: 3 })} label="H3" title="Titre 3" />
        <div className="w-px h-5 bg-surface-container-highest mx-1" />
        <ToolbarButton onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive('bulletList')} label="≡" title="Liste à puces" />
        <ToolbarButton onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')} label="1." title="Liste numérotée" />
        <div className="w-px h-5 bg-surface-container-highest mx-1" />
        <ToolbarButton onClick={() => editor.chain().focus().setHorizontalRule().run()} active={false} label="—" title="Ligne de séparation" />
      </div>

      {/* Variables helpers */}
      <div className="bg-surface-container-lowest border border-surface-container-highest p-4">
        <p className="text-xs font-label-caps tracking-wider text-on-surface-variant uppercase mb-3">
          Variables disponibles — cliquer pour insérer
        </p>
        <div className="flex flex-wrap gap-2">
          {TEMPLATE_VARS.map(({ key, label }) => (
            <button
              key={key}
              type="button"
              onClick={() => insertVariable(key)}
              className="text-xs px-2 py-1 border border-surface-container-highest bg-surface text-on-surface-variant hover:text-primary hover:border-primary transition-colors font-mono"
              title={label}
            >
              {key}
            </button>
          ))}
        </div>
      </div>

      {/* Editor area */}
      <div className="border border-surface-container-highest bg-white">
        <EditorContent editor={editor} />
      </div>

      {/* Footer: version info + save */}
      <div className="flex items-center justify-between pt-2">
        <p className="text-xs text-on-surface-variant font-label-caps tracking-wider">
          {savedVersion > 0
            ? `Version active : v${savedVersion}`
            : 'Aucun modèle enregistré'}
        </p>
        <div className="flex items-center gap-4">
          {status === 'saved' && (
            <span className="text-xs text-green-700 font-label-caps tracking-wider">
              ✓ Sauvegardé (v{savedVersion})
            </span>
          )}
          {status === 'error' && (
            <span className="text-xs text-red-600 font-label-caps tracking-wider">
              Erreur — réessayez
            </span>
          )}
          <button
            type="button"
            onClick={handleSave}
            disabled={isPending}
            className="bg-primary text-on-primary px-6 py-2 text-xs font-label-caps tracking-widest uppercase hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {isPending ? 'Sauvegarde…' : 'Sauvegarder'}
          </button>
        </div>
      </div>
    </div>
  )
}

function ToolbarButton({
  onClick,
  active,
  label,
  title,
  italic: isItalic = false,
  underline: isUnderline = false,
}: {
  onClick: () => void
  active: boolean
  label: string
  title: string
  italic?: boolean
  underline?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`px-2 py-1 text-sm min-w-[28px] border transition-colors ${
        active
          ? 'bg-primary text-on-primary border-primary'
          : 'bg-surface border-surface-container-highest text-on-surface-variant hover:text-primary hover:border-primary'
      } ${isItalic ? 'italic' : ''} ${isUnderline ? 'underline' : ''}`}
    >
      {label}
    </button>
  )
}
