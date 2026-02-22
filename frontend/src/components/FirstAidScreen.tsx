import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ActionCardAccordion, type FirstAidAction } from './postTriage/ActionCardAccordion'
import { RedFlagChecklist } from './postTriage/RedFlagChecklist'
import { SeverityBadge } from './postTriage/SeverityBadge'

interface FirstAidScreenProps {
  severity: 'low' | 'medium' | 'high' | 'critical'
  symptomSummary: string
  actions: FirstAidAction[]
  redFlags: string[]
  onBack: () => void
  onOpenRouting: (forceCritical?: boolean) => void
  onEndSession: () => void
}

export function FirstAidScreen({
  severity,
  symptomSummary,
  actions,
  redFlags,
  onBack,
  onOpenRouting,
  onEndSession,
}: FirstAidScreenProps) {
  const { t } = useTranslation()
  const [simpleMode, setSimpleMode] = useState(true)
  const [showEmergencyModal, setShowEmergencyModal] = useState(false)
  const [largeTextMode, setLargeTextMode] = useState(false)
  const [darkMode, setDarkMode] = useState(false)
  const nextSteps = {
    primary: t(`firstAidScreen.nextSteps.primary.${severity}`),
    secondary: t(`firstAidScreen.nextSteps.secondary.${severity}`),
  }
  const avoidList = t(`firstAidScreen.avoid.${severity}`, { returnObjects: true }) as string[]

  const speak = (text: string) => {
    if (!('speechSynthesis' in window)) return
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.rate = 0.95
    window.speechSynthesis.cancel()
    window.speechSynthesis.speak(utterance)
  }

  const surfaceTone = useMemo(() => {
    if (!darkMode) return 'bg-[#f8faf9] text-[#1f2933]'
    return 'bg-slate-950 text-slate-100'
  }, [darkMode])

  return (
    <div className={`min-h-screen ${surfaceTone} ${largeTextMode ? 'text-lg' : 'text-base'}`}>
      <header className="sticky top-0 z-20 border-b border-emerald-100 bg-white/95 px-4 py-3 backdrop-blur-md dark:bg-slate-900/95">
        <div className="mx-auto max-w-4xl">
          <div className="mb-2 h-1.5 rounded-full bg-[linear-gradient(90deg,#0f9f62_0%,#ffffff_50%,#0f9f62_100%)]" />
          <div className="flex items-center justify-between gap-3">
            <button type="button" className="inline-flex min-h-12 items-center gap-2 rounded-xl border border-slate-200 px-4 text-sm font-semibold" onClick={onBack}>
              <span>←</span>
              <span>{t('firstAidScreen.back')}</span>
            </button>
            <h1 className="text-xl font-bold">{t('firstAidScreen.title')}</h1>
            <div className="flex items-center gap-2">
              <SeverityBadge severity={severity} />
              <button type="button" className="inline-flex min-h-12 min-w-12 items-center justify-center rounded-full border border-red-200 bg-red-50 text-red-700">
                🚨
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-4xl flex-col gap-5 px-4 pb-32 pt-6">
        <div className="flex flex-wrap gap-2">
          <button type="button" className="inline-flex min-h-12 items-center gap-2 rounded-xl border border-slate-200 px-4 text-sm font-semibold" onClick={() => setLargeTextMode((value) => !value)}>
            🔠 {largeTextMode ? t('firstAidScreen.standardText') : t('firstAidScreen.largeText')}
          </button>
          <button type="button" className="inline-flex min-h-12 items-center gap-2 rounded-xl border border-slate-200 px-4 text-sm font-semibold" onClick={() => setDarkMode((value) => !value)}>
            🌙 {darkMode ? t('firstAidScreen.lightMode') : t('firstAidScreen.darkMode')}
          </button>
          <button type="button" className={`inline-flex min-h-12 items-center gap-2 rounded-xl border px-4 text-sm font-semibold ${simpleMode ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-slate-200'}`} onClick={() => setSimpleMode((value) => !value)}>
            🧠 {t('firstAidScreen.keepSimple')}
          </button>
        </div>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:bg-slate-900">
          <h2 className="text-lg font-bold">{t('firstAidScreen.understoodTitle')}</h2>
          <p className="mt-2 text-sm text-slate-700 dark:text-slate-200">{symptomSummary}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" className="inline-flex min-h-12 items-center gap-2 rounded-xl border border-slate-200 px-4 text-sm font-semibold" onClick={() => speak(symptomSummary)}>
              🔊 {t('firstAidScreen.playAudio')}
            </button>
            <button type="button" className="inline-flex min-h-12 items-center gap-2 rounded-xl border border-slate-200 px-4 text-sm font-semibold">
              🌐 {t('firstAidScreen.translate')}
            </button>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:bg-slate-900">
          <h3 className="mb-4 text-lg font-bold">{t('firstAidScreen.doNow')}</h3>
          <div className="space-y-3">
            {actions.map((action) => (
              <ActionCardAccordion key={action.id} action={action} simpleMode={simpleMode} onSpeak={speak} />
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-amber-100 bg-amber-50 p-5 shadow-sm">
          <h3 className="mb-3 text-lg font-bold text-amber-900">{t('firstAidScreen.avoidTitle')}</h3>
          <ul className="space-y-2">
            {avoidList.map((item) => (
              <li key={item} className="flex gap-2 text-sm text-amber-800">
                <span>⚠️</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </section>

        <RedFlagChecklist items={redFlags} onEscalate={() => setShowEmergencyModal(true)} />

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:bg-slate-900">
          <h3 className="mb-3 text-lg font-bold">{t('firstAidScreen.nextStepsTitle')}</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <button type="button" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 text-sm font-semibold text-white" onClick={() => onOpenRouting(false)}>
              ➡️ {nextSteps.primary}
            </button>
            <button type="button" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 text-sm font-semibold" onClick={() => onOpenRouting(false)}>
              🏥 {nextSteps.secondary}
            </button>
          </div>
        </section>
      </main>

      <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-slate-200 bg-white/95 px-4 py-3 backdrop-blur-md dark:bg-slate-900/95">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-3">
          <button type="button" className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 text-sm font-semibold text-white" onClick={() => onOpenRouting(severity === 'critical')}>
            🚑 {nextSteps.primary}
          </button>
          <button type="button" className="inline-flex min-h-12 items-center gap-2 rounded-xl border border-slate-200 px-3 text-xs font-semibold" onClick={() => onOpenRouting(false)}>
            🗺️ {t('firstAidScreen.viewHospitals')}
          </button>
          <button type="button" className="inline-flex min-h-12 items-center gap-2 rounded-xl border border-slate-200 px-3 text-xs font-semibold" onClick={onEndSession}>
            💾 {t('firstAidScreen.endSave')}
          </button>
        </div>
      </div>

      <div className={`fixed inset-0 z-40 transition ${showEmergencyModal ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'}`}>
        <div className="absolute inset-0 bg-slate-900/50" onClick={() => setShowEmergencyModal(false)} />
        <section className={`absolute left-1/2 top-1/2 w-[92%] max-w-md -translate-x-1/2 rounded-2xl bg-white p-6 shadow-2xl transition-transform ${showEmergencyModal ? '-translate-y-1/2' : 'translate-y-8'}`}>
          <h4 className="text-xl font-bold text-red-800">{t('firstAidScreen.emergencyTitle')}</h4>
          <p className="mt-2 text-sm text-slate-700">
            {t('firstAidScreen.emergencyBody')}
          </p>
          <div className="mt-4 grid gap-2">
            <button type="button" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-red-700 text-sm font-semibold text-white" onClick={() => onOpenRouting(true)}>
              🚑 {t('firstAidScreen.routeNow')}
            </button>
            <button type="button" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-slate-200 text-sm font-semibold" onClick={() => setShowEmergencyModal(false)}>
              {t('firstAidScreen.close')}
            </button>
          </div>
        </section>
      </div>
    </div>
  )
}

