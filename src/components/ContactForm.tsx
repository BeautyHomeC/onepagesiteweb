'use client'

import { useState, useTransition, useRef } from 'react'
import { submitContact } from '@/app/contact/actions'

export default function ContactForm() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const [isPending, startTransition] = useTransition()
  const formRef = useRef<HTMLFormElement>(null)

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setStatus('loading')
    const fd = new FormData(e.currentTarget)

    startTransition(async () => {
      const result = await submitContact(fd)
      if (result?.error) {
        setErrorMsg(result.error)
        setStatus('error')
      } else {
        setStatus('success')
        formRef.current?.reset()
      }
    })
  }

  const inputClass = "w-full border border-outline-variant/50 bg-surface-container-lowest px-4 py-3 text-sm text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:border-primary transition-colors"

  if (status === 'success') {
    return (
      <div className="py-12 text-center space-y-3">
        <p className="font-playfair text-2xl text-on-surface">Message envoyé</p>
        <p className="text-on-surface-variant text-sm">Je vous répondrai sous 24 à 48 heures.</p>
        <button
          onClick={() => setStatus('idle')}
          className="mt-4 text-xs font-label-caps tracking-widest text-primary border-b border-primary pb-[1px] hover:opacity-70 transition-opacity uppercase"
        >
          Envoyer un autre message
        </button>
      </div>
    )
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-5" noValidate>
      {/* Honeypot — hidden from real users */}
      <input
        type="text"
        name="website"
        tabIndex={-1}
        aria-hidden="true"
        autoComplete="off"
        style={{ display: 'none' }}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div>
          <label htmlFor="contact-prenom" className="block text-xs font-label-caps tracking-wider text-on-surface-variant mb-2 uppercase">
            Prénom <span aria-hidden="true" className="text-primary">*</span>
          </label>
          <input
            id="contact-prenom"
            name="prenom"
            type="text"
            required
            minLength={2}
            autoComplete="given-name"
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="contact-nom" className="block text-xs font-label-caps tracking-wider text-on-surface-variant mb-2 uppercase">
            Nom <span aria-hidden="true" className="text-primary">*</span>
          </label>
          <input
            id="contact-nom"
            name="nom"
            type="text"
            required
            minLength={2}
            autoComplete="family-name"
            className={inputClass}
          />
        </div>
      </div>

      <div>
        <label htmlFor="contact-email" className="block text-xs font-label-caps tracking-wider text-on-surface-variant mb-2 uppercase">
          Email <span aria-hidden="true" className="text-primary">*</span>
        </label>
        <input
          id="contact-email"
          name="email"
          type="email"
          required
          autoComplete="email"
          className={inputClass}
        />
      </div>

      <div>
        <label htmlFor="contact-message" className="block text-xs font-label-caps tracking-wider text-on-surface-variant mb-2 uppercase">
          Message <span aria-hidden="true" className="text-primary">*</span>
        </label>
        <textarea
          id="contact-message"
          name="message"
          required
          minLength={10}
          maxLength={2000}
          rows={6}
          className={`${inputClass} resize-none`}
        />
      </div>

      {status === 'error' && (
        <p className="text-sm text-red-600" role="alert">{errorMsg}</p>
      )}

      <button
        type="submit"
        disabled={isPending || status === 'loading'}
        className="bg-primary text-on-primary px-8 py-3 text-xs font-label-caps tracking-widest uppercase hover:opacity-90 transition-opacity disabled:opacity-50 active:scale-[0.97]"
      >
        {status === 'loading' ? 'Envoi…' : 'Envoyer le message'}
      </button>
    </form>
  )
}
