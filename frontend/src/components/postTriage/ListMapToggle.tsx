import { useTranslation } from 'react-i18next'

interface ListMapToggleProps {
  mode: 'list' | 'map'
  onChange: (mode: 'list' | 'map') => void
}

export function ListMapToggle({ mode, onChange }: ListMapToggleProps) {
  const { t } = useTranslation()
  return (
    <div className="inline-flex rounded-full border border-slate-200 bg-white p-1">
      <button
        type="button"
        className={`inline-flex min-h-12 items-center rounded-full px-4 text-sm font-semibold ${mode === 'list' ? 'bg-emerald-600 text-white' : 'text-slate-700'}`}
        onClick={() => onChange('list')}
      >
        {t('routing.listView')}
      </button>
      <button
        type="button"
        className={`inline-flex min-h-12 items-center rounded-full px-4 text-sm font-semibold ${mode === 'map' ? 'bg-emerald-600 text-white' : 'text-slate-700'}`}
        onClick={() => onChange('map')}
      >
        {t('routing.mapView')}
      </button>
    </div>
  )
}
