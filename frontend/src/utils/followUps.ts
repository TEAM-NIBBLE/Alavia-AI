// Pending "check back on me" reminders, kept on the device so they survive a reload.
// A follow-up is scheduled when triage completes and removed once the person answers.

const KEY = 'alavia.followUps'

export interface PendingFollowUp {
  consultationId: number
  dueAt: string // ISO timestamp from the server
  severity: string | null
  /** Only set for guest consultations, so a reload can still prove ownership. */
  guestToken?: string
}

const read = (): PendingFollowUp[] => {
  try {
    const raw = localStorage.getItem(KEY)
    const parsed = raw ? (JSON.parse(raw) as PendingFollowUp[]) : []
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

const write = (items: PendingFollowUp[]) => localStorage.setItem(KEY, JSON.stringify(items))

export const followUps = {
  schedule(item: PendingFollowUp) {
    if (!item.dueAt || Number.isNaN(Date.parse(item.dueAt))) return
    write([...read().filter((f) => f.consultationId !== item.consultationId), item])
  },
  remove(consultationId: number) {
    write(read().filter((f) => f.consultationId !== consultationId))
  },
  /** Oldest due follow-up, if any. */
  nextDue(now = Date.now()): PendingFollowUp | null {
    return (
      read()
        .filter((f) => Date.parse(f.dueAt) <= now)
        .sort((a, b) => Date.parse(a.dueAt) - Date.parse(b.dueAt))[0] ?? null
    )
  },
}
