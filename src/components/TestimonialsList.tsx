'use client'

import { useEffect, useRef } from 'react'

interface Temoignage {
  id: string
  nom: string
  role?: string | null
  texte: string
  note: number
  photo_url?: string | null
  video_url?: string | null
  video_type?: 'youtube' | 'vimeo' | 'upload' | null
}

function getYoutubeId(url: string) {
  const m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([A-Za-z0-9_-]{11})/)
  return m?.[1] ?? null
}

function getVimeoId(url: string) {
  const m = url.match(/vimeo\.com\/(?:video\/)?(\d+)/)
  return m?.[1] ?? null
}

function VideoEmbed({ video_url, video_type }: { video_url: string; video_type: string }) {
  if (video_type === 'youtube') {
    const id = getYoutubeId(video_url)
    if (!id) return null
    return (
      <div className="aspect-video w-full mb-6 overflow-hidden bg-surface-container">
        <iframe
          src={`https://www.youtube.com/embed/${id}?modestbranding=1&rel=0`}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="w-full h-full border-0"
          title="Témoignage vidéo"
        />
      </div>
    )
  }
  if (video_type === 'vimeo') {
    const id = getVimeoId(video_url)
    if (!id) return null
    return (
      <div className="aspect-video w-full mb-6 overflow-hidden bg-surface-container">
        <iframe
          src={`https://player.vimeo.com/video/${id}?badge=0&autopause=0`}
          allow="autoplay; fullscreen; picture-in-picture"
          allowFullScreen
          className="w-full h-full border-0"
          title="Témoignage vidéo"
        />
      </div>
    )
  }
  if (video_type === 'upload') {
    return (
      <div className="aspect-video w-full mb-6 overflow-hidden bg-surface-container">
        <video
          src={video_url}
          controls
          className="w-full h-full object-cover"
          preload="metadata"
        />
      </div>
    )
  }
  return null
}

export default function TestimonialsList({ testimonials }: { testimonials: Temoignage[] }) {
  const sectionRef = useRef<HTMLElement>(null)

  useEffect(() => {
    if (!sectionRef.current) return
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) entry.target.classList.add('in-view')
        })
      },
      { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
    )
    sectionRef.current.querySelectorAll('.reveal').forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [])

  return (
    <section
      id="testimonials"
      ref={sectionRef}
      className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-section-gap"
    >
      <p className="font-label-caps text-label-caps text-primary uppercase mb-4 text-center reveal">
        Témoignages
      </p>
      <h2 className="font-headline-md text-headline-md text-on-surface text-center mb-16 reveal reveal-delay-1">
        Ce qu'en disent les élèves.
      </h2>

      <div className="flex overflow-x-auto hide-scrollbar snap-x snap-mandatory gap-6 pb-8">
        {testimonials.map((t, i) => (
          <div
            key={t.id}
            className={`min-w-[85vw] md:min-w-[400px] snap-center border border-outline-variant/40 bg-surface-container-lowest flex flex-col reveal${
              i === 1 ? ' reveal-delay-1' : i === 2 ? ' reveal-delay-2' : ''
            }`}
          >
            {/* Video embed (if any) */}
            {t.video_url && t.video_type && (
              <VideoEmbed video_url={t.video_url} video_type={t.video_type} />
            )}

            <div className={t.video_url ? 'p-8' : 'p-10'}>
              {/* Photo + quote mark */}
              {t.photo_url && !t.video_url && (
                <div className="mb-4 w-12 h-12 overflow-hidden bg-surface-container-low">
                  <img src={t.photo_url} alt={t.nom} className="w-full h-full object-cover" />
                </div>
              )}
              {!t.video_url && (
                <p className="font-playfair text-7xl text-primary/20 leading-none mb-4 select-none" aria-hidden="true">
                  &ldquo;
                </p>
              )}

              {/* Stars */}
              <div className="flex text-primary mb-6">
                {[...Array(5)].map((_, j) => (
                  <span
                    key={j}
                    className={`material-symbols-outlined text-[18px] ${j >= t.note ? 'opacity-20' : ''}`}
                    style={{ fontVariationSettings: "'FILL' 1, 'wght' 300, 'GRAD' 0, 'opsz' 24" }}
                  >
                    star
                  </span>
                ))}
              </div>

              <p className="font-body-md text-body-md text-on-surface-variant mb-8">{t.texte}</p>

              <div className="border-t border-outline-variant/40 pt-4 mt-auto">
                <p className="font-label-caps text-label-caps text-on-surface uppercase tracking-[0.1em]">
                  {t.nom}
                </p>
                {t.role && (
                  <p className="font-body-md text-[12px] text-on-surface-variant mt-1">{t.role}</p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
