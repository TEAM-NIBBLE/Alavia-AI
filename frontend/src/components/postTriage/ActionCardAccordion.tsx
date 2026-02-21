import { useState } from 'react'

export interface FirstAidAction {
  id: string
  icon: string
  title: string
  instruction: string
  details?: string
  timerMinutes?: number
}

interface ActionCardAccordionProps {
  action: FirstAidAction
  simpleMode: boolean
  onSpeak: (text: string) => void
}

export function ActionCardAccordion({ action, simpleMode, onSpeak }: ActionCardAccordionProps) {
  const [open, setOpen] = useState(!simpleMode)
  const [timerActive, setTimerActive] = useState(false)

  const startTimer = () => {
    if (!action.timerMinutes) return
    setTimerActive(true)
    window.setTimeout(() => {
      setTimerActive(false)
      onSpeak(`${action.title}. Timer completed.`)
    }, action.timerMinutes * 60 * 1000)
  }

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <button
        type="button"
        className="flex min-h-12 w-full items-center justify-between gap-3 text-left"
        onClick={() => setOpen((value) => !value)}
      >
        <div className="flex items-center gap-3">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-xl">{action.icon}</span>
          <div>
            <h4 className="text-base font-bold text-slate-900">{action.title}</h4>
            <p className="text-sm text-slate-600">{action.instruction}</p>
          </div>
        </div>
        <span className="text-slate-500">{open ? '−' : '+'}</span>
      </button>

      {open ? (
        <div className="mt-3 space-y-3 border-t border-slate-100 pt-3">
          {action.details ? <p className="text-sm text-slate-700">{action.details}</p> : null}
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="inline-flex min-h-12 items-center gap-2 rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-700"
              onClick={() => onSpeak(`${action.title}. ${action.instruction}. ${action.details ?? ''}`)}
            >
              <span>🔊</span>
              <span>Read Aloud</span>
            </button>
            {action.timerMinutes ? (
              <button
                type="button"
                className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-emerald-600 px-4 text-sm font-semibold text-white"
                onClick={startTimer}
              >
                <span>⏱️</span>
                <span>{timerActive ? 'Timer Running' : `Start ${action.timerMinutes} min timer`}</span>
              </button>
            ) : null}
          </div>
        </div>
      ) : null}
    </article>
  )
}

