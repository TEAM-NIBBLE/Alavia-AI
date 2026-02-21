interface RedFlagChecklistProps {
  items: string[]
  onEscalate: () => void
}

export function RedFlagChecklist({ items, onEscalate }: RedFlagChecklistProps) {
  return (
    <section className="rounded-2xl border border-red-100 bg-red-50 p-5 shadow-sm">
      <h3 className="mb-3 text-lg font-bold text-red-900">Watch for these signs</h3>
      <ul className="space-y-2">
        {items.map((item) => (
          <li key={item} className="flex items-start gap-2 text-sm text-red-800">
            <span className="mt-0.5">⚠️</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
      <button
        type="button"
        className="mt-4 inline-flex min-h-12 items-center gap-2 rounded-xl bg-red-700 px-4 text-sm font-semibold text-white"
        onClick={onEscalate}
      >
        <span>🚑</span>
        <span>I have one of these signs</span>
      </button>
    </section>
  )
}

