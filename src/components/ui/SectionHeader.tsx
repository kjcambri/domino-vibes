export function SectionHeader({
  eyebrow,
  title,
  copy,
}: {
  eyebrow?: string
  title: string
  copy?: string
}) {
  return (
    <div>
      {eyebrow ? (
        <p className="text-xs font-black uppercase tracking-[0.18em] text-gold-200">
          {eyebrow}
        </p>
      ) : null}
      <h2 className="mt-1 text-2xl font-black leading-tight text-cream-50">
        {title}
      </h2>
      {copy ? (
        <p className="mt-2 text-sm leading-6 text-cream-100/72">{copy}</p>
      ) : null}
    </div>
  )
}
