import { useState } from 'react'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { BellRing, CheckCircle2, ThumbsDown, ThumbsUp } from 'lucide-react'
import { consultationsApi } from '../../api/services'

interface FeedbackCardProps {
  consultationId: number
  /** ISO time the server scheduled the check-back for. */
  followUpDueAt?: string | null
  guestToken?: string
}

type Stage = 'ask' | 'comment' | 'done'

export function FeedbackCard({ consultationId, followUpDueAt, guestToken }: FeedbackCardProps) {
  const { t } = useTranslation()
  const [stage, setStage] = useState<Stage>('ask')
  const [helpful, setHelpful] = useState<boolean | null>(null)
  const [comment, setComment] = useState('')
  const [sending, setSending] = useState(false)
  const [notifyState, setNotifyState] = useState<NotificationPermission | 'unsupported'>(
    typeof Notification === 'undefined' ? 'unsupported' : Notification.permission,
  )

  const dueTime = followUpDueAt && !Number.isNaN(Date.parse(followUpDueAt))
    ? new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' }).format(new Date(followUpDueAt))
    : null

  const submit = async (value: boolean, text?: string) => {
    setSending(true)
    try {
      await consultationsApi.feedback(consultationId, value, text, guestToken)
    } catch {
      // Feedback is best-effort; never block the person on it.
    } finally {
      setSending(false)
      setStage('done')
    }
  }

  const choose = (value: boolean) => {
    setHelpful(value)
    // A thumbs-down is worth a sentence of why; a thumbs-up is sent straight away.
    if (value) void submit(true)
    else setStage('comment')
  }

  const askNotify = async () => {
    if (typeof Notification === 'undefined') return
    setNotifyState(await Notification.requestPermission())
  }

  return (
    <div className="rounded-[32px] border border-slate-100 bg-white p-5 shadow-2xl shadow-slate-200/50 sm:p-8">
      {stage === 'ask' && (
        <>
          <h3 className="mb-4 text-lg font-black tracking-tight text-slate-800">{t('voice.feedback.title')}</h3>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => choose(true)}
              className="flex items-center justify-center gap-2 rounded-full border-2 border-emerald-200 bg-emerald-50 py-3 text-sm font-bold text-emerald-700 transition-all hover:bg-emerald-100 active:scale-[0.98]"
            >
              <ThumbsUp size={16} />
              {t('voice.feedback.yes')}
            </button>
            <button
              type="button"
              onClick={() => choose(false)}
              className="flex items-center justify-center gap-2 rounded-full border-2 border-slate-200 bg-slate-50 py-3 text-sm font-bold text-slate-600 transition-all hover:bg-slate-100 active:scale-[0.98]"
            >
              <ThumbsDown size={16} />
              {t('voice.feedback.no')}
            </button>
          </div>
        </>
      )}

      {stage === 'comment' && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          <h3 className="mb-3 text-lg font-black tracking-tight text-slate-800">{t('voice.feedback.commentTitle')}</h3>
          <textarea
            rows={3}
            value={comment}
            maxLength={1000}
            onChange={(e) => setComment(e.target.value)}
            placeholder={t('voice.feedback.commentPlaceholder')}
            className="w-full resize-none rounded-2xl border-2 border-slate-100 bg-slate-50 p-3 text-sm font-semibold text-slate-800 outline-none transition-all placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white"
          />
          <button
            type="button"
            disabled={sending}
            onClick={() => void submit(helpful ?? false, comment)}
            className="mt-3 w-full rounded-full bg-emerald-600 py-3 text-sm font-bold text-white transition-all hover:bg-emerald-700 active:scale-[0.98] disabled:opacity-60"
          >
            {t('voice.feedback.send')}
          </button>
        </motion.div>
      )}

      {stage === 'done' && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
          <div className="flex items-center gap-2 text-emerald-700">
            <CheckCircle2 size={20} />
            <p className="text-sm font-black">{t('voice.feedback.thanks')}</p>
          </div>
        </motion.div>
      )}

      {dueTime && (
        <div className="mt-4 flex items-start gap-3 rounded-2xl bg-slate-50 px-4 py-3">
          <BellRing size={18} className="mt-0.5 shrink-0 text-emerald-600" />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold leading-snug text-slate-600">{t('voice.followUp.scheduled', { time: dueTime })}</p>
            {notifyState === 'default' && (
              <button type="button" onClick={() => void askNotify()} className="mt-1 text-xs font-black text-emerald-700 hover:underline">
                {t('voice.followUp.notify')}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
