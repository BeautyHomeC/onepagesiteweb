const stats = [
  { value: "5 ans", label: "d'expertise terrain" },
  { value: "30+", label: "formations suivies" },
  { value: "1–2", label: "élèves par session" },
  { value: "100%", label: "éligible CPF · OPCO" },
];

export default function StatsStrip() {
  return (
    <div className="border-y border-surface-container-highest bg-surface">
      <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop">
        <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-surface-container-highest">
          {stats.map((stat, i) => (
            <div key={i} className="py-8 md:py-10 px-6 md:px-10 flex flex-col gap-1">
              <span className="font-playfair text-[36px] md:text-[44px] text-primary leading-none">{stat.value}</span>
              <span className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-[0.15em] mt-2">{stat.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
