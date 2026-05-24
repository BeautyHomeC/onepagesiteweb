import { createClient } from '@/lib/supabase/server'

function StarIcon({ filled }: { filled: boolean }) {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path
        d="M7 1l1.545 3.13 3.455.503-2.5 2.437.59 3.43L7 8.885l-3.09 1.625.59-3.43L2 4.633l3.455-.503L7 1z"
        fill={filled ? '#755a2d' : 'none'}
        stroke="#755a2d"
        strokeWidth="1"
      />
    </svg>
  )
}

export default async function GoogleRatingBadge() {
  let rating: { note: number; nb_avis: number; google_url: string } | null = null

  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from('google_rating')
      .select('note, nb_avis, google_url')
      .single()
    if (data && data.nb_avis > 0) rating = data
  } catch {
    // table not yet created — skip silently
  }

  if (!rating) return null

  const fullStars = Math.floor(rating.note)
  const stars = Array.from({ length: 5 }, (_, i) => i < fullStars)

  const inner = (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-0.5">
        {stars.map((filled, i) => <StarIcon key={i} filled={filled} />)}
      </div>
      <span className="font-label-caps text-[11px] tracking-wider text-on-surface">
        {rating.note.toFixed(1)}
      </span>
      <span className="text-[11px] text-on-surface-variant">
        ({rating.nb_avis} avis)
      </span>
      <span className="font-label-caps text-[9px] tracking-widest text-on-surface-variant uppercase">
        Google
      </span>
    </div>
  )

  if (rating.google_url) {
    return (
      <a
        href={rating.google_url}
        target="_blank"
        rel="noreferrer"
        className="inline-flex items-center gap-2 hover:opacity-80 transition-opacity"
        aria-label={`Note Google : ${rating.note} sur 5, ${rating.nb_avis} avis`}
      >
        {inner}
      </a>
    )
  }

  return <div className="inline-flex items-center gap-2">{inner}</div>
}
