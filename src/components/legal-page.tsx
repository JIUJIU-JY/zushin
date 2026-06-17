import BackButton from './back-button'

export type LegalSection = {
  title?: string
  bullets?: string[]
  paras?: string[]
}

export default function LegalPage({
  title,
  effectiveDate,
  intro,
  sections,
  numbered = false,
}: {
  title: string
  effectiveDate?: string
  intro?: string
  sections: LegalSection[]
  numbered?: boolean
}) {
  let n = 0
  return (
    <div className="pb-20">
      {/* 顶部导航 */}
      <div className="flex items-center justify-between px-4 py-4">
        <BackButton />
        <h1 className="font-semibold text-gray-900">{title}</h1>
        <div className="w-5" />
      </div>

      <div className="px-4 space-y-4 text-gray-600">
        {effectiveDate && <p className="text-xs text-gray-400">生效日期：{effectiveDate}</p>}
        {intro && <p className="text-sm leading-relaxed">{intro}</p>}

        {sections.map((s, i) => {
          if (s.title) n += 1
          return (
            <div key={i} className="space-y-2">
              {s.title && (
                <h2 className="text-sm font-semibold text-gray-900">
                  {numbered ? `${n}. ${s.title}` : s.title}
                </h2>
              )}
              {s.bullets && s.bullets.length > 0 && (
                <ul className="list-disc pl-5 space-y-1">
                  {s.bullets.map((b, j) => (
                    <li key={j} className="text-sm leading-relaxed">{b}</li>
                  ))}
                </ul>
              )}
              {s.paras && s.paras.map((p, j) => (
                <p key={j} className="text-sm leading-relaxed">{p}</p>
              ))}
            </div>
          )
        })}
      </div>
    </div>
  )
}
