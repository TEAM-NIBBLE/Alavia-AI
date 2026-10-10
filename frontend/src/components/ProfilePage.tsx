import { useEffect, useRef, useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { userApi } from '../api/services'
import { AnimatePresence, motion } from 'framer-motion'
import {
  ArrowLeft, User, Globe, Heart, MapPin, AlertTriangle,
  Trash2, LogOut, Eye, EyeOff, CheckCircle2, Volume2, Moon, Type,
  ChevronRight, Save, Sun, Mic, Plus, X, Phone
} from 'lucide-react'
import {
  PROFILE_SETTINGS_KEY, applyDisplaySettings, newContactId, normalizeContacts, readStoredSettings,
  type EmergencyContact,
} from '../utils/appSettings'

type LanguageCode = 'en' | 'pcm' | 'yo' | 'ha' | 'ig'

interface ProfilePageProps {
  onBack: () => void
  onLogout: () => void
  onLanguageChange: (code: LanguageCode) => void
}

interface Settings {
  appLanguage: LanguageCode
  largeText: boolean
  highContrast: boolean
  darkMode: boolean
  audioAutoplay: boolean
  voiceSpeed: 'slow' | 'normal' | 'fast'
  ttsVoice: 'Idera'
  readPrompts: boolean
  ageBand: string
  gender: string
  pregnancyStatus: boolean
  condAsthma: boolean
  condDiabetes: boolean
  condHypertension: boolean
  condSickleCell: boolean
  condHeart: boolean
  condNone: boolean
  allergies: string
  emergencyContacts: EmergencyContact[]
  useLocation: boolean
  homeArea: string
  showRedFlag: boolean
  emergencyButtonBehavior: 'call' | 'sms' | 'app'
}

const getDefaults = (): Settings => ({
  appLanguage: (localStorage.getItem('alavia.selectedLanguage') as LanguageCode) || 'en',
  largeText: false, highContrast: false, darkMode: false,
  audioAutoplay: true, voiceSpeed: 'normal', ttsVoice: 'Idera', readPrompts: false,
  ageBand: '', gender: '', pregnancyStatus: false,
  condAsthma: false, condDiabetes: false, condHypertension: false,
  condSickleCell: false, condHeart: false, condNone: false,
  allergies: '', emergencyContacts: [],
  useLocation: true, homeArea: '', showRedFlag: true,
  emergencyButtonBehavior: 'call',
})

function loadSettings(): Settings {
  try {
    const stored = localStorage.getItem(PROFILE_SETTINGS_KEY)
    if (!stored) return getDefaults()
    const parsed = JSON.parse(stored) as Partial<Settings> & {
      ttsVoice?: string; emergencyName?: string; emergencyPhone?: string; emergencyRelation?: string
    }
    const merged = { ...getDefaults(), ...parsed } as Settings & { ttsVoice?: string }
    if (merged.ttsVoice !== 'Idera') merged.ttsVoice = 'Idera'
    // Migrate the old single emergency contact into the contacts list.
    merged.emergencyContacts = normalizeContacts(parsed.emergencyContacts)
    if (!merged.emergencyContacts.length && parsed.emergencyPhone?.trim()) {
      merged.emergencyContacts = normalizeContacts([
        { name: parsed.emergencyName, phone: parsed.emergencyPhone, relation: parsed.emergencyRelation },
      ])
    }
    return merged
  } catch { return getDefaults() }
}

// ── Toggle ─────────────────────────────────────────────────────────────
function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button" role="switch" aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200 ${checked ? 'bg-emerald-500' : 'bg-slate-200'}`}
    >
      <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform duration-200 ${checked ? 'translate-x-6' : 'translate-x-1'}`} />
    </button>
  )
}

// ── Section Card ───────────────────────────────────────────────────────
function SectionCard({ icon, title, hint, accent = 'emerald', dark = false, children }: {
  icon: ReactNode; title: string; hint?: string
  accent?: 'emerald' | 'red'; dark?: boolean; children: ReactNode
}) {
  const iconBg = accent === 'red' ? 'bg-red-500/10 text-red-500' : 'bg-emerald-100 text-emerald-700'
  return (
    <div className={`mb-5 overflow-hidden rounded-2xl border shadow-sm ${dark ? 'border-slate-700 bg-slate-800' : 'border-slate-100 bg-white'}`}>
      <div className={`flex items-center gap-3 border-b px-5 py-4 ${dark ? 'border-slate-700' : 'border-slate-50'}`}>
        <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${iconBg}`}>{icon}</div>
        <div>
          <p className={`font-bold ${dark ? 'text-white' : 'text-slate-900'}`}>{title}</p>
          {hint && <p className={`text-xs ${dark ? 'text-slate-400' : 'text-slate-400'}`}>{hint}</p>}
        </div>
      </div>
      <div className={`divide-y ${dark ? 'divide-slate-700' : 'divide-slate-50'}`}>{children}</div>
    </div>
  )
}

// ── Row ────────────────────────────────────────────────────────────────
function Row({ label, hint, dark = false, children }: { label: string; hint?: string; dark?: boolean; children: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 px-5 py-4">
      <div className="min-w-0">
        <p className={`text-sm font-semibold ${dark ? 'text-slate-200' : 'text-slate-800'}`}>{label}</p>
        {hint && <p className={`mt-0.5 text-xs ${dark ? 'text-slate-500' : 'text-slate-400'}`}>{hint}</p>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  )
}

// ── Confirm Modal ──────────────────────────────────────────────────────
function ConfirmModal({ title, body, confirmLabel, cancelLabel, onConfirm, onCancel, danger = true, error }: {
  error?: string
  title: string; body: string; confirmLabel: string; cancelLabel: string
  onConfirm: () => void; onCancel: () => void; danger?: boolean
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 px-6 backdrop-blur-sm"
    >
      <motion.div
        initial={{ scale: 0.92, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.92, y: 20 }}
        className="w-full max-w-sm rounded-3xl bg-white p-7 shadow-2xl"
      >
        <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-2xl ${danger ? 'bg-red-100' : 'bg-amber-100'}`}>
          <Trash2 size={22} className={danger ? 'text-red-600' : 'text-amber-600'} />
        </div>
        <h3 className="mb-2 text-lg font-extrabold text-slate-900">{title}</h3>
        <p className="mb-6 text-sm leading-relaxed text-slate-500">{body}</p>
        {error && <p className="mb-4 text-xs font-semibold text-red-500">{error}</p>}
        <div className="flex flex-col gap-3">
          <button onClick={onConfirm}
            className={`w-full rounded-xl py-3 text-sm font-bold text-white transition-all active:scale-[0.98] ${danger ? 'bg-red-600 hover:bg-red-700' : 'bg-amber-500 hover:bg-amber-600'}`}>
            {confirmLabel}
          </button>
          <button onClick={onCancel}
            className="w-full rounded-xl border border-slate-200 py-3 text-sm font-bold text-slate-600 transition-all hover:bg-slate-50 active:scale-[0.98]">
            {cancelLabel}
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

// ── Input styles ───────────────────────────────────────────────────────
const inputCls = (dark: boolean) =>
  `w-full rounded-xl border px-3 py-2.5 text-sm outline-none transition-all focus:ring-2 focus:ring-emerald-500/20 ${dark
    ? 'border-slate-600 bg-slate-700 text-slate-100 placeholder:text-slate-500 focus:border-emerald-500'
    : 'border-slate-200 bg-slate-50 text-slate-800 placeholder:text-slate-300 focus:border-emerald-500 focus:bg-white'}`

const selectCls = (dark: boolean) =>
  `rounded-xl border px-3 py-2 text-sm font-semibold outline-none focus:border-emerald-500 ${dark
    ? 'border-slate-600 bg-slate-700 text-slate-100'
    : 'border-slate-200 bg-slate-50 text-slate-800'}`

// ── MAIN COMPONENT ─────────────────────────────────────────────────────
export default function ProfilePage({ onBack, onLogout, onLanguageChange }: ProfilePageProps) {
  const { t, i18n } = useTranslation()
  const [settings, setSettings] = useState<Settings>(loadSettings)
  const [user, setUser] = useState({ name: '', email: '' })
  const [showPwForm, setShowPwForm] = useState(false)
  const [pw, setPw] = useState({ current: '', newPw: '', confirm: '' })
  const [showPwEye, setShowPwEye] = useState(false)
  const [pwError, setPwError] = useState('')
  const [modal, setModal] = useState<'delete' | null>(null)
  const [toast, setToast] = useState<{ kind: 'ok' | 'local'; msg: string } | null>(null)
  const [contactError, setContactError] = useState('')
  const [pwBusy, setPwBusy] = useState(false)
  const [deleteError, setDeleteError] = useState('')
  const [locPermission, setLocPermission] = useState<'granted' | 'denied' | 'unknown'>('unknown')
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Dark mode is applied app-wide on <html> (see applyDisplaySettings); the page itself stays light-styled.
  const dark = false
  const langCodes: LanguageCode[] = ['en', 'pcm', 'yo', 'ha', 'ig']

  // Live-preview display settings; restore whatever is saved if the user leaves without saving.
  useEffect(() => {
    applyDisplaySettings(settings)
  }, [settings.largeText, settings.highContrast, settings.darkMode]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => () => applyDisplaySettings(readStoredSettings()), [])

  useEffect(() => {
    try {
      const stored = localStorage.getItem('alavia.user')
      if (stored) {
        const u = JSON.parse(stored) as { name: string; email: string }
        setUser({ name: u.name || '', email: u.email || '' })
      }
    } catch { /* ignore */ }
    navigator.permissions?.query({ name: 'geolocation' })
      .then(r => {
        setLocPermission(r.state as 'granted' | 'denied' | 'unknown')
        r.addEventListener('change', () => setLocPermission(r.state as 'granted' | 'denied' | 'unknown'))
      })
      .catch(() => setLocPermission('unknown'))

    // Attempt profile hydration from API; fallback remains local storage settings.
    userApi.getProfile()
      .then((profile) => {
        setUser((value) => ({ ...value, name: profile.name || value.name, email: profile.email || value.email }))
        setSettings((value) => ({
          ...value,
          appLanguage: (profile.language?.toLowerCase() as LanguageCode) || value.appLanguage,
          emergencyContacts: normalizeContacts(profile.emergency_contacts).length
            ? normalizeContacts(profile.emergency_contacts)
            : value.emergencyContacts,
        }))
      })
      .catch(() => {
        // offline/local mode
      })
  }, [])

  const set = <K extends keyof Settings>(key: K, val: Settings[K]) =>
    setSettings(prev => ({ ...prev, [key]: val }))

  const showToast = (kind: 'ok' | 'local' = 'ok', msg?: string) => {
    setToast({ kind, msg: msg ?? t('profile.savedToast') })
    if (toastTimer.current) clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(null), 3000)
  }

  const addContact = () => {
    if (settings.emergencyContacts.length >= 5) return
    set('emergencyContacts', [...settings.emergencyContacts, { id: newContactId(), name: '', phone: '', relation: '' }])
  }
  const updateContact = (id: string, patch: Partial<EmergencyContact>) =>
    set('emergencyContacts', settings.emergencyContacts.map(c => (c.id === id ? { ...c, ...patch } : c)))
  const removeContact = (id: string) =>
    set('emergencyContacts', settings.emergencyContacts.filter(c => c.id !== id))

  const handleSave = async () => {
    // Drop fully-empty rows; a row with a name but no number can't be called, so block the save.
    const contacts = settings.emergencyContacts
      .map(c => ({ ...c, name: c.name.trim(), phone: c.phone.trim(), relation: c.relation.trim() }))
      .filter(c => c.name || c.phone)
    if (contacts.some(c => !c.phone || !/^\+?[0-9\s()-]{7,20}$/.test(c.phone))) {
      setContactError(t('profile.contactPhoneInvalid'))
      return
    }
    setContactError('')
    const next: Settings = { ...settings, emergencyContacts: contacts }
    setSettings(next)

    // Persist user name change
    try {
      const stored = localStorage.getItem('alavia.user')
      const u = stored ? JSON.parse(stored) : {}
      localStorage.setItem('alavia.user', JSON.stringify({
        ...u,
        name: user.name,
        emergency_contacts: contacts.map(({ name, phone, relation }) => ({ name, phone, relation })),
        emergency_contact_name: contacts[0]?.name ?? null,
        emergency_contact_phone: contacts[0]?.phone ?? null,
      }))
    } catch { /* ignore */ }
    localStorage.setItem(PROFILE_SETTINGS_KEY, JSON.stringify(next))
    applyDisplaySettings(next)

    if (next.appLanguage !== i18n.language) {
      onLanguageChange(next.appLanguage)
      void i18n.changeLanguage(next.appLanguage)
    }

    try {
      await userApi.updateProfile({
        name: user.name,
        language: next.appLanguage.toUpperCase(),
        emergency_contacts: contacts.map(({ name, phone, relation }) => ({ name, phone, relation })),
      })
      showToast('ok')
    } catch {
      showToast('local', t('profile.savedLocalOnly'))
    }
  }

  const handleSavePw = async () => {
    if (!pw.current) { setPwError(t('profile.currentPassword')); return }
    if (pw.newPw.length < 6) { setPwError(t('profile.passwordMin')); return }
    if (pw.newPw !== pw.confirm) { setPwError(t('profile.passwordMismatch')); return }
    setPwError('')
    setPwBusy(true)
    try {
      await userApi.changePassword({
        current_password: pw.current,
        new_password: pw.newPw,
        new_password_confirmation: pw.confirm,
      })
      setPw({ current: '', newPw: '', confirm: '' })
      setShowPwForm(false)
      showToast('ok')
    } catch (err) {
      setPwError(err instanceof Error ? err.message : t('profile.passwordMismatch'))
    } finally {
      setPwBusy(false)
    }
  }

  const handleDeleteAccount = async () => {
    setDeleteError('')
    try {
      await userApi.deleteAccount()
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Could not delete account.')
      return
    }
    localStorage.removeItem('alavia.user')
    localStorage.removeItem('alavia.authToken')
    localStorage.removeItem(PROFILE_SETTINGS_KEY)
    applyDisplaySettings({})
    setModal(null)
    onLogout()
  }

  const permLabel =
    locPermission === 'granted' ? t('profile.permGranted') :
    locPermission === 'denied' ? t('profile.permDenied') :
    t('profile.permUnknown')
  const permColor =
    locPermission === 'granted' ? 'text-emerald-600 bg-emerald-50' :
    locPermission === 'denied' ? 'text-red-600 bg-red-50' :
    'text-slate-500 bg-slate-100'

  const conditions: Array<{ key: keyof Settings; label: string }> = [
    { key: 'condAsthma', label: t('profile.condAsthma') },
    { key: 'condDiabetes', label: t('profile.condDiabetes') },
    { key: 'condHypertension', label: t('profile.condHypertension') },
    { key: 'condSickleCell', label: t('profile.condSickleCell') },
    { key: 'condHeart', label: t('profile.condHeart') },
    { key: 'condNone', label: t('profile.condNone') },
  ]


  return (
    <div className={`min-h-full ${dark ? 'bg-slate-900' : 'bg-slate-50'}`}>
      {/* Accent top bar */}
      <div className="sticky top-0 z-0 h-1.5 bg-emerald-600" />

      {/* ── Sticky Header ──────────────────────────────────────────── */}
      <header className={`sticky top-1.5 z-20 flex items-center gap-3 border-b px-4 py-4 backdrop-blur-xl ${dark ? 'border-slate-700 bg-slate-900/95' : 'border-slate-100 bg-white/95'}`}>
        <button
          onClick={onBack}
          className={`flex h-10 w-10 items-center justify-center rounded-xl transition-all active:scale-95 ${dark ? 'text-slate-300 hover:bg-slate-700' : 'text-slate-600 hover:bg-emerald-50 hover:text-emerald-700'}`}
          aria-label={t('profile.back')}
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className={`flex-1 text-lg font-extrabold tracking-tight ${dark ? 'text-white' : 'text-slate-900'}`}>
          {t('profile.title')}
        </h1>
        <button
          onClick={handleSave}
          className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white shadow-md shadow-emerald-200/60 transition-all hover:bg-emerald-700 active:scale-95"
        >
          <Save size={14} />
          {t('profile.saveChanges')}
        </button>
      </header>

      {/* ── Content ────────────────────────────────────────────────── */}
      <main className="mx-auto max-w-xl px-4 py-6 pb-32">

        {/* ── 1 · ACCOUNT ──────────────────────────────────────────── */}
        <SectionCard icon={<User size={18} />} title={t('profile.sectionAccount')} dark={dark}>
          {/* Full Name */}
          <Row label={t('profile.fullName')} dark={dark}>
            <input
              type="text" value={user.name} autoComplete="name"
              onChange={e => setUser(u => ({ ...u, name: e.target.value }))}
              className={`w-36 rounded-xl border px-3 py-2 text-right text-sm outline-none focus:border-emerald-500 ${dark ? 'border-slate-600 bg-slate-700 text-slate-100' : 'border-slate-200 bg-slate-50 text-slate-800 focus:bg-white'}`}
            />
          </Row>

          {/* Email */}
          <Row label={t('profile.email')} dark={dark}>
            <span className={`max-w-[160px] truncate text-right text-sm ${dark ? 'text-slate-400' : 'text-slate-500'}`}>
              {user.email || t('common.empty')}
            </span>
          </Row>

          {/* Change Password */}
          <div className={`px-5 py-4 border-b ${dark ? 'border-slate-700' : 'border-slate-50'}`}>
            <button
              onClick={() => setShowPwForm(v => !v)}
              className={`flex w-full items-center justify-between text-sm font-semibold ${dark ? 'text-slate-200' : 'text-slate-800'}`}
            >
              <span>{t('profile.changePassword')}</span>
              <ChevronRight size={16} className={`transition-transform text-slate-400 ${showPwForm ? 'rotate-90' : ''}`} />
            </button>
            <AnimatePresence>
              {showPwForm && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                  <div className="mt-4 space-y-3">
                    {([['current', t('profile.currentPassword')], ['newPw', t('profile.newPassword')], ['confirm', t('profile.confirmPassword')]] as Array<[keyof typeof pw, string]>).map(([field, label]) => (
                      <div key={field} className="relative">
                        <label className={`mb-1 block text-xs font-semibold ${dark ? 'text-slate-400' : 'text-slate-500'}`}>{label}</label>
                        <input
                          type={showPwEye ? 'text' : 'password'}
                          value={pw[field]}
                          onChange={e => setPw(p => ({ ...p, [field]: e.target.value }))}
                          className={inputCls(dark) + ' pr-10'}
                        />
                        {field === 'newPw' && (
                          <button type="button" onClick={() => setShowPwEye(v => !v)}
                            className="absolute right-3 top-[26px] text-slate-400 hover:text-emerald-600">
                            {showPwEye ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        )}
                      </div>
                    ))}
                    {pwError && <p className="text-xs text-red-500">{pwError}</p>}
                    <button onClick={() => void handleSavePw()} disabled={pwBusy}
                      className="w-full rounded-xl bg-emerald-600 py-2.5 disabled:opacity-60 text-sm font-bold text-white transition-all hover:bg-emerald-700 active:scale-[0.98]">
                      {t('profile.savePassword')}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Log Out */}
          <button onClick={onLogout}
            className="flex w-full items-center gap-3 px-5 py-4 text-sm font-bold text-red-500 transition-all hover:bg-red-50 active:opacity-70">
            <LogOut size={16} />
            {t('profile.logout')}
          </button>
        </SectionCard>

        {/* ── 2 · LANGUAGE & ACCESSIBILITY ─────────────────────────── */}
        <SectionCard icon={<Globe size={18} />} title={t('profile.sectionLang')} dark={dark}>
          {/* App Language */}
          <Row label={t('profile.appLanguage')} dark={dark}>
            <select value={settings.appLanguage}
              onChange={e => set('appLanguage', e.target.value as LanguageCode)}
              className={selectCls(dark)}>
              {langCodes.map(c => <option key={c} value={c}>{t(`language.${c}.name`)}</option>)}
            </select>
          </Row>

          {/* Large Text */}
          <Row label={t('profile.largeText')} hint={t('profile.largeTextHint')} dark={dark}>
            <Toggle checked={settings.largeText} onChange={v => set('largeText', v)} />
          </Row>

          {/* High Contrast */}
          <Row label={t('profile.highContrast')} hint={t('profile.highContrastHint')} dark={dark}>
            <Toggle checked={settings.highContrast} onChange={v => set('highContrast', v)} />
          </Row>

          {/* Dark Mode */}
          <Row label={t('profile.darkMode')} hint={t('profile.darkModeHint')} dark={dark}>
            <Toggle checked={settings.darkMode} onChange={v => set('darkMode', v)} />
          </Row>

          {/* Audio Autoplay */}
          <Row label={t('profile.audioAutoplay')} hint={t('profile.audioAutoplayHint')} dark={dark}>
            <Toggle checked={settings.audioAutoplay} onChange={v => set('audioAutoplay', v)} />
          </Row>

          {/* Voice Speed */}
          <div className={`px-5 py-4 border-b ${dark ? 'border-slate-700' : 'border-slate-50'}`}>
            <p className={`mb-3 text-sm font-semibold ${dark ? 'text-slate-200' : 'text-slate-800'}`}>{t('profile.voiceSpeed')}</p>
            <div className="flex gap-2">
              {(['slow', 'normal', 'fast'] as const).map(speed => (
                <button key={speed} onClick={() => set('voiceSpeed', speed)}
                  className={`flex-1 rounded-xl py-2.5 text-xs font-bold transition-all ${settings.voiceSpeed === speed
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-200/60'
                    : dark ? 'border border-slate-600 bg-slate-700 text-slate-300 hover:border-emerald-500' : 'border border-slate-200 bg-slate-50 text-slate-600 hover:border-emerald-300 hover:text-emerald-700'}`}>
                  {t(`profile.${speed}`)}
                </button>
              ))}
            </div>
          </div>

          <Row label={t('profile.aiVoiceLabel')} hint={t('profile.aiVoiceHint')} dark={dark}>
            <select
              value={settings.ttsVoice}
              onChange={e => set('ttsVoice', e.target.value as Settings['ttsVoice'])}
              className={selectCls(dark)}
            >
              <option value="Idera">Idera</option>
            </select>
          </Row>

          {/* Read Prompts */}
          <Row label={t('profile.readPrompts')} hint={t('profile.readPromptsHint')} dark={dark}>
            <Toggle checked={settings.readPrompts} onChange={v => set('readPrompts', v)} />
          </Row>
        </SectionCard>

        {/* ── 3 · HEALTH PROFILE ───────────────────────────────────── */}
        <SectionCard icon={<Heart size={18} />} title={t('profile.sectionHealth')} hint={t('profile.healthHint')} dark={dark}>
          {/* Age Band */}
          <Row label={t('profile.ageBand')} dark={dark}>
            <select value={settings.ageBand} onChange={e => set('ageBand', e.target.value)} className={selectCls(dark)}>
              <option value="">{t('common.empty')}</option>
              {(['ageBandUnder18', 'ageBand18', 'ageBand31', 'ageBand46', 'ageBand60'] as const).map(k => (
                <option key={k} value={k}>{t(`profile.${k}`)}</option>
              ))}
            </select>
          </Row>

          {/* Gender */}
          <Row label={t('profile.genderLabel')} dark={dark}>
            <select value={settings.gender} onChange={e => set('gender', e.target.value)} className={selectCls(dark)}>
              <option value="">{t('common.empty')}</option>
              <option value="male">{t('profile.genderMale')}</option>
              <option value="female">{t('profile.genderFemale')}</option>
              <option value="none">{t('profile.genderNone')}</option>
            </select>
          </Row>

          {/* Pregnancy — only for female/unset */}
          {(settings.gender === 'female' || settings.gender === '') && (
            <Row label={t('profile.pregnancy')} hint={t('profile.pregnancyHint')} dark={dark}>
              <Toggle checked={settings.pregnancyStatus} onChange={v => set('pregnancyStatus', v)} />
            </Row>
          )}

          {/* Known Conditions */}
          <div className={`px-5 py-4 border-b ${dark ? 'border-slate-700' : 'border-slate-50'}`}>
            <p className={`mb-3 text-sm font-semibold ${dark ? 'text-slate-200' : 'text-slate-800'}`}>{t('profile.conditions')}</p>
            <div className="grid grid-cols-2 gap-2">
              {conditions.map(({ key, label }) => (
                <button key={key} onClick={() => set(key, !settings[key])}
                  className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 text-left text-xs font-semibold transition-all ${settings[key]
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-800'
                    : dark ? 'border-slate-600 bg-slate-700 text-slate-300 hover:border-emerald-500' : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-emerald-200'}`}>
                  <div className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-md border transition-all ${settings[key] ? 'border-emerald-500 bg-emerald-500' : dark ? 'border-slate-500' : 'border-slate-300'}`}>
                    {settings[key] && (
                      <svg className="h-2.5 w-2.5 text-white" fill="none" viewBox="0 0 12 12">
                        <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </div>
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Allergies */}
          <div className={`px-5 pb-4 pt-3 border-b ${dark ? 'border-slate-700' : 'border-slate-50'}`}>
            <label className={`mb-1.5 block text-sm font-semibold ${dark ? 'text-slate-200' : 'text-slate-800'}`}>
              {t('profile.allergies')}
              <span className="ml-1 text-xs font-normal text-slate-400">({t('profile.allergiesHint')})</span>
            </label>
            <textarea rows={2} value={settings.allergies}
              onChange={e => set('allergies', e.target.value)}
              placeholder={t('profile.allergiesPlaceholder')}
              className={inputCls(dark) + ' resize-none'} />
          </div>

          {/* Emergency Contacts */}
          <div className="px-5 pb-5 pt-4">
            <div className="mb-3 flex items-center justify-between">
              <p className={`text-sm font-semibold ${dark ? 'text-slate-200' : 'text-slate-800'}`}>{t('profile.emergencyContact')}</p>
              <span className="text-xs text-slate-400">{settings.emergencyContacts.length}/5</span>
            </div>
            <div className="space-y-3">
              {settings.emergencyContacts.length === 0 && (
                <p className="rounded-xl border border-dashed border-slate-200 px-4 py-3 text-xs text-slate-400">
                  {t('profile.noContacts')}
                </p>
              )}
              {settings.emergencyContacts.map((c, index) => (
                <div key={c.id} className="rounded-2xl border border-slate-100 bg-slate-50/60 p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600">
                      {index === 0 ? t('profile.primaryContact') : `${t('profile.emergencyContact')} ${index + 1}`}
                    </span>
                    <button type="button" onClick={() => removeContact(c.id)}
                      aria-label={t('profile.removeContact')}
                      className="flex h-7 w-7 items-center justify-center rounded-full text-slate-400 transition-all hover:bg-red-50 hover:text-red-500">
                      <X size={14} />
                    </button>
                  </div>
                  <div className="grid gap-2">
                    <input type="text" autoComplete="off" value={c.name} placeholder={t('profile.emergencyName')}
                      onChange={e => updateContact(c.id, { name: e.target.value })} className={inputCls(dark)} />
                    <input type="tel" autoComplete="off" inputMode="tel" value={c.phone} placeholder={t('profile.emergencyPhone')}
                      onChange={e => updateContact(c.id, { phone: e.target.value })} className={inputCls(dark)} />
                    <input type="text" autoComplete="off" value={c.relation} placeholder={t('profile.emergencyRelation')}
                      onChange={e => updateContact(c.id, { relation: e.target.value })} className={inputCls(dark)} />
                  </div>
                </div>
              ))}
              {contactError && <p className="text-xs font-semibold text-red-500">{contactError}</p>}
              {settings.emergencyContacts.length < 5 && (
                <button type="button" onClick={addContact}
                  className="flex w-full items-center justify-center gap-2 rounded-full border-2 border-dashed border-emerald-300 py-2.5 text-sm font-bold text-emerald-700 transition-all hover:bg-emerald-50 active:scale-[0.98]">
                  <Plus size={16} />
                  {t('profile.addContact')}
                </button>
              )}
            </div>
          </div>
        </SectionCard>

        {/* ── 4 · LOCATION ─────────────────────────────────────────── */}
        <SectionCard icon={<MapPin size={18} />} title={t('profile.sectionLocation')} dark={dark}>
          <Row label={t('profile.useLocation')} hint={t('profile.useLocationHint')} dark={dark}>
            <Toggle checked={settings.useLocation} onChange={v => set('useLocation', v)} />
          </Row>
          <Row label={t('profile.locationPermission')} dark={dark}>
            <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${permColor}`}>{permLabel}</span>
          </Row>
          {locPermission === 'denied' && (
            <div className="px-5 pb-3">
              <p className="text-xs text-slate-500">
                {t('profile.locationBlockedHelp')}
              </p>
            </div>
          )}
          <div className={`px-5 pb-5 pt-3 border-t ${dark ? 'border-slate-700' : 'border-slate-50'}`}>
            <label className={`mb-1.5 block text-sm font-semibold ${dark ? 'text-slate-200' : 'text-slate-800'}`}>
              {t('profile.homeArea')}
              <span className="ml-1 text-xs font-normal text-slate-400">({t('profile.homeAreaHint')})</span>
            </label>
            <input type="text" value={settings.homeArea}
              onChange={e => set('homeArea', e.target.value)}
              placeholder={t('profile.homeAreaPlaceholder')}
              className={inputCls(dark)} />
          </div>
        </SectionCard>

        {/* ── 5 · PRIVACY & DATA ───────────────────────────────────── */}
        {/* ── 6 · SAFETY ───────────────────────────────────────────── */}
        <SectionCard icon={<AlertTriangle size={18} />} title={t('profile.sectionSafety')} dark={dark}>
          {/* Red Flag Warnings */}
          <Row label={t('profile.showRedFlag')} hint={t('profile.showRedFlagHint')} dark={dark}>
            <Toggle checked={settings.showRedFlag} onChange={v => set('showRedFlag', v)} />
          </Row>

          {/* Emergency Button Behavior */}
          <div className={`px-5 py-4 border-b ${dark ? 'border-slate-700' : 'border-slate-50'}`}>
            <p className={`mb-1 text-sm font-semibold ${dark ? 'text-slate-200' : 'text-slate-800'}`}>
              {t('profile.emergencyButtonBehavior')}
            </p>
            <p className={`mb-3 text-xs ${dark ? 'text-slate-500' : 'text-slate-400'}`}>
              {t('profile.emergencyButtonBehaviorHint')}
            </p>
            <div className="flex gap-2">
              {(['call', 'sms', 'app'] as const).map(mode => (
                <button key={mode} onClick={() => set('emergencyButtonBehavior', mode)}
                  className={`flex-1 rounded-xl py-2.5 text-xs font-bold capitalize transition-all ${settings.emergencyButtonBehavior === mode
                    ? 'bg-red-600 text-white shadow-md shadow-red-200/60'
                    : dark ? 'border border-slate-600 bg-slate-700 text-slate-300 hover:border-red-500' : 'border border-slate-200 bg-slate-50 text-slate-600 hover:border-red-300 hover:text-red-600'}`}>
                  {mode === 'call'
                    ? t('profile.emergencyCallLabel')
                    : mode === 'sms'
                      ? t('profile.emergencySmsLabel')
                      : t('profile.emergencyAppLabel')}
                </button>
              ))}
            </div>
          </div>

          {/* Emergency contacts summary */}
          <div className="flex items-center justify-between px-5 py-4">
            <div className="min-w-0">
              <p className={`text-sm font-semibold ${dark ? 'text-slate-200' : 'text-slate-800'}`}>{t('profile.emergencyContact')}</p>
              <p className="truncate text-xs text-slate-400">
                {settings.emergencyContacts.filter(c => c.phone.trim()).length === 0
                  ? t('common.empty')
                  : settings.emergencyContacts.filter(c => c.phone.trim()).map(c => c.name || c.phone).join(', ')}
              </p>
            </div>
            <Phone size={15} className="shrink-0 text-slate-400" />
          </div>
        </SectionCard>

        {/* ── 7 · DANGER ZONE ──────────────────────────────────────── */}
        <SectionCard icon={<Trash2 size={18} />} title={t('profile.sectionDanger')} accent="red" dark={dark}>
          <button onClick={() => setModal('delete')}
            className="flex w-full items-center justify-between px-5 py-4 text-sm font-bold text-red-600 transition-all hover:bg-red-50 active:opacity-70">
            <span>{t('profile.deleteAccount')}</span>
            <Trash2 size={15} />
          </button>
        </SectionCard>

      </main>

      {/* ── Active accessibility hints (bottom-right corner) ───────── */}
      <div className="pointer-events-none fixed bottom-6 right-4 z-10 flex flex-col items-end gap-1 opacity-40">
        {settings.largeText && <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-700"><Type size={12} /> {t('profile.accessibilityLargeText')}</div>}
        {settings.darkMode && <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-700"><Moon size={12} /> {t('profile.accessibilityDark')}</div>}
        {settings.highContrast && <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-700"><Sun size={12} /> {t('profile.accessibilityContrast')}</div>}
        {settings.audioAutoplay && <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-700"><Volume2 size={12} /> {t('profile.accessibilityAudioOn')}</div>}
        {settings.readPrompts && <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-700"><Mic size={12} /> {t('profile.accessibilityReading')}</div>}
      </div>

      {/* ── Saved Toast ──────────────────────────────────────────────── */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 80, opacity: 0 }}
            className="fixed bottom-6 left-1/2 z-40 -translate-x-1/2"
          >
            <div className={`flex items-center gap-2 rounded-2xl px-5 py-3 text-sm font-bold text-white shadow-xl ${toast.kind === 'ok' ? 'bg-emerald-600 shadow-emerald-300/50' : 'bg-amber-500 shadow-amber-300/50'}`}>
              {toast.kind === 'ok' ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
              {toast.msg}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Confirmation Modals ──────────────────────────────────────── */}
      <AnimatePresence>
        {modal === 'delete' && (
          <ConfirmModal
            error={deleteError}
            title={t('profile.deleteAccount')}
            body={t('profile.deleteWarning')}
            confirmLabel={t('profile.confirmDelete')}
            cancelLabel={t('profile.cancel')}
            onConfirm={() => void handleDeleteAccount()}
            onCancel={() => setModal(null)}
            danger
          />
        )}
      </AnimatePresence>
    </div>
  )
}

