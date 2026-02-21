export interface FilterOption {
  key: string
  label: string
}

interface FilterPillsProps {
  options: FilterOption[]
  active: string
  onChange: (key: string) => void
}

export function FilterPills({ options, active, onChange }: FilterPillsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => (
        <button
          key={option.key}
          type="button"
          className={`inline-flex min-h-12 items-center rounded-full border px-4 text-sm font-semibold ${
            active === option.key ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-slate-200 bg-white text-slate-700'
          }`}
          onClick={() => onChange(option.key)}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}

