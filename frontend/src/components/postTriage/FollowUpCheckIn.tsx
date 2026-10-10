import { useCallback, useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { HeartPulse, Siren } from 'lucide-react'
import { consultationsApi } from '../../api/services'
import { followUps, type PendingFollowUp } from '../../utils/followUps'

interface FollowUpCheckInProps {
  /** Called when the person says they are worse (or still unwell after a serious result). */
  onEscalate: () => void
}

type Outcome = 'BETTER' | 'SAME' | 'WORSE'
const CHECK_EVERY_MS = 30_000

export function FollowUpCheckIn({ onEscalate }: FollowUpCheckInProps) {
  const { t } = useTranslation()
  const [due, setDue] = useState<PendingFollowUp | null>(null)
  const [reply, setReply] = useState<{ outcome: Outcome; serious: boolean } | null>(null)
  const [busy, setBusy] = useState(false)

  const check = useCallback(() => {
    setDue((current) => current ?? followUps.nextDue())
  }, [])

  // Look for a due check-back on load, every 30s while open, and when the tab is shown again.
  useEffect(() => {
    check()
    const timer = window.setInterval(check, CHECK_EVERY_MS)
    const onVisible = () => { if (document.visibilityState === 'visible') check() }
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      window.clearInterval(timer)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [check])

  // If the tab is in the background when it comes due, nudge with a notification (if allowed).
  useEffect(() => {
    if (!due || reply) return
    if (document.visibilityState === 'hidden' && typeof Notification !== 'undefined' && Notification.permission === 'granted') {
      new Notification(t('voice.followUp.notifyTitle'), { body: t('voice.followUp.question') })
    }
  }, [due, reply, t])

  const answer = async (outcome: Outcome) => {
    if (!due) return
    setBusy(true)
    const serious = ['HIGH', 'CRITICAL'].includes((due.severity ?? '').toUpperCase())
    try {
      const res = await consultationsApi.followUp(due.consultationId, outcome, due.guestToken)
      followUps.remove(due.consultationId)
      setReply({ outcome, serious })
      if (res.escalate || (outcome === 'SAME' && serious)) onEscalate()
    } catch {
      // If the server can't be reached keep the reminder so we ask again, but still react
      // to "worse" locally: safety must not depend on the network.
      if (outcome === 'WORSE') {
        setReply({ outcome, serious })
        onEscalate()
      }
    } finally {
      setBusy(false)
    }
  }

  const dismiss = () => {
    setDue(null)
    setReply(null)
  }

  const replyText = reply
    ? reply.outcome === 'BETTER'
      ? t('voice.followUp.betterReply')
      : reply.outcome === 'WORSE'
        ? t('voice.followUp.worseReply')
        : reply.serious
          ? t('voice.followUp.sameSeriousReply')
          : t('voice.followUp.sameReply')
    : null

  return (
    <AnimatePresence>
      {due && (
        <motion.section
          key={due.consultationId}
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          role="status"
          className="w-full rounded-[28px] border-2 border-emerald-200 bg-emerald-50 p-5 text-left"
        >
          <div className="mb-3 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-600 text-white">
              <HeartPulse size={20} />
            </div>
            <h3 className="text-base font-black tracking-tight text-slate-900">{t('voice.followUp.title')}</h3>
          </div>

          {!reply ? (
            <>
              <p className="mb-4 text-sm font-bold leading-snug text-slate-600">{t('voice.followUp.question')}</p>
              <div className="grid grid-cols-3 gap-2">
                <button type="button" disabled={busy} onClick={() => void answer('BETTER')}
                  className="rounded-full bg-white py-3 text-xs font-black text-emerald-700 ring-2 ring-emerald-200 transition-all hover:bg-emerald-100 active:scale-[0.98] disabled:opacity-60">
                  {t('voice.followUp.better')}
                </button>
                <button type="button" disabled={busy} onClick={() => void answer('SAME')}
                  className="rounded-full bg-white py-3 text-xs font-black text-slate-700 ring-2 ring-slate-200 transition-all hover:bg-slate-100 active:scale-[0.98] disabled:opacity-60">
                  {t('voice.followUp.same')}
                </button>
                <button type="button" disabled={busy} onClick={() => void answer('WORSE')}
                  className="rounded-full bg-red-600 py-3 text-xs font-black text-white transition-all hover:bg-red-700 active:scale-[0.98] disabled:opacity-60">
                  {t('voice.followUp.worse')}
                </button>
              </div>
              <button type="button" onClick={dismiss} className="mt-3 text-xs font-bold text-slate-400 hover:text-slate-600">
                {t('voice.followUp.dismiss')}
              </button>
            </>
          ) : (
            <>
              <p className={`mb-3 flex items-start gap-2 text-sm font-bold leading-snug ${reply.outcome === 'WORSE' ? 'text-red-700' : 'text-slate-700'}`}>
                {reply.outcome === 'WORSE' && <Siren size={18} className="mt-0.5 shrink-0" />}
                {replyText}
              </p>
              <button type="button" onClick={dismiss}
                className="rounded-full bg-emerald-600 px-5 py-2.5 text-xs font-black text-white transition-all hover:bg-emerald-700 active:scale-[0.98]">
                {t('common.ok')}
              </button>
            </>
          )}
        </motion.section>
      )}
    </AnimatePresence>
  )
}
