// Single reader for the profile settings persisted by ProfilePage, so every screen
// honours the same values instead of re-parsing localStorage on its own.

export const PROFILE_SETTINGS_KEY = 'alavia.profileSettings'

export interface EmergencyContact {
  id: string
  name: string
  phone: string
  relation: string
}

export interface StoredSettings {
  largeText?: boolean
  highContrast?: boolean
  darkMode?: boolean
  audioAutoplay?: boolean
  voiceSpeed?: 'slow' | 'normal' | 'fast'
  readPrompts?: boolean
  useLocation?: boolean
  showRedFlag?: boolean
  emergencyButtonBehavior?: 'call' | 'sms' | 'app'
  emergencyContacts?: EmergencyContact[]
  emergencyName?: string
  emergencyPhone?: string
  emergencyRelation?: string
}

export function readStoredSettings(): StoredSettings {
  try {
    const raw = localStorage.getItem(PROFILE_SETTINGS_KEY)
    return raw ? (JSON.parse(raw) as StoredSettings) : {}
  } catch {
    return {}
  }
}

export const newContactId = () => `c_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`

export function normalizeContacts(value: unknown): EmergencyContact[] {
  if (!Array.isArray(value)) return []
  return value
    .map((c) => {
      const item = (c ?? {}) as Partial<EmergencyContact>
      return {
        id: item.id || newContactId(),
        name: String(item.name ?? '').trim(),
        phone: String(item.phone ?? '').trim(),
        relation: String(item.relation ?? '').trim(),
      }
    })
    .filter((c) => c.phone)
}

/** Contacts from settings, falling back to the legacy single contact and the account record. */
export function getEmergencyContacts(): EmergencyContact[] {
  const settings = readStoredSettings()
  const list = normalizeContacts(settings.emergencyContacts)
  if (list.length) return list

  if (settings.emergencyPhone?.trim()) {
    return normalizeContacts([
      { name: settings.emergencyName, phone: settings.emergencyPhone, relation: settings.emergencyRelation },
    ])
  }

  try {
    const raw = localStorage.getItem('alavia.user')
    if (raw) {
      const user = JSON.parse(raw) as {
        emergency_contacts?: unknown
        emergency_contact_name?: string
        emergency_contact_phone?: string
      }
      const fromUser = normalizeContacts(user.emergency_contacts)
      if (fromUser.length) return fromUser
      if (user.emergency_contact_phone?.trim()) {
        return normalizeContacts([{ name: user.emergency_contact_name, phone: user.emergency_contact_phone }])
      }
    }
  } catch {
    // ignore malformed storage
  }
  return []
}

export const VOICE_SPEED_RATE = { slow: 0.9, normal: 1.1, fast: 1.25 } as const

export function applyDisplaySettings(s: Pick<StoredSettings, 'largeText' | 'highContrast' | 'darkMode'>) {
  const root = document.documentElement
  root.classList.toggle('large-text', !!s.largeText)
  root.classList.toggle('high-contrast', !!s.highContrast)
  root.classList.toggle('theme-dark', !!s.darkMode)
}
