import { useEffect, useRef, useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { userApi } from '../api/services'
import { AnimatePresence, motion } from 'framer-motion'
import {
  ArrowLeft, User, Globe, Heart, MapPin, ShieldCheck, AlertTriangle,
  Trash2, LogOut, Eye, EyeOff, CheckCircle2, Volume2, Moon, Type,
  RefreshCcw, Download, ChevronRight, Save, Sun, Mic, Bell
} from 'lucide-react'

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
  emergencyName: string
  emergencyPhone: string
  emergencyRelation: string
  useLocation: boolean
  homeArea: string
  saveChatHistory: boolean
  showRedFlag: boolean
  emergencyButtonBehavior: 'call' | 'sms' | 'app'
}

const getDefaults = (): Settings => ({
  appLanguage: (localStorage.getItem('alavia.selectedLanguage') as LanguageCode) || 'en',
  largeText: false, highContrast: false, darkMode: false,
  audioAutoplay: true, voiceSpeed: 'normal', readPrompts: false,
  ageBand: '', gender: '', pregnancyStatus: false,
  condAsthma: false, condDiabetes: false, condHypertension: false,
  condSickleCell: false, condHeart: false, condNone: false,
  allergies: '', emergencyName: '', emergencyPhone: '', emergencyRelation: '',
  useLocation: false, homeArea: '', saveChatHistory: true, showRedFlag: true,
  emergencyButtonBehavior: 'call',
})

function loadSettings(): Settings {
  try {
    const stored = localStorage.getItem('alavia.profileSettings')
    return stored ? { ...getDefaults(), ...JSON.parse(stored) } : getDefaults()
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
function ConfirmModal({ title, body, confirmLabel, cancelLabel, onConfirm, onCancel, danger = true }: {
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
  const [modal, setModal] = useState<'delete' | 'clear' | null>(null)
  const [toast, setToast] = useState(false)
  const [locPermission, setLocPermission] = useState<'granted' | 'denied' | 'unknown'>('unknown')
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const dark = settings.darkMode
  const langCodes: LanguageCode[] = ['en', 'pcm', 'yo', 'ha', 'ig']

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
          emergencyName: profile.emergency_contact_name || value.emergencyName,
          emergencyPhone: profile.emergency_contact_phone || value.emergencyPhone,
        }))
      })
      .catch(() => {
        // offline/local mode
      })
  }, [])

  const set = <K extends keyof Settings>(key: K, val: Settings[K]) =>
    setSettings(prev => ({ ...prev, [key]: val }))

  const showToast = () => {
    setToast(true)
    if (toastTimer.current) clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(false), 3000)
  }

  const handleSave = async () => {
    // Persist user name change
    try {
      const stored = localStorage.getItem('alavia.user')
      const u = stored ? JSON.parse(stored) : {}
      localStorage.setItem('alavia.user', JSON.stringify({ ...u, name: user.name }))
    } catch { /* ignore */ }
    localStorage.setItem('alavia.profileSettings', JSON.stringify(settings))

    try {
      await userApi.updateProfile({
        name: user.name,
        language: settings.appLanguage.toUpperCase(),
        emergency_contact_name: settings.emergencyName,
        emergency_contact_phone: settings.emergencyPhone,
      })
    } catch {
      // keep local save flow when backend is unavailable
    }

    if (settings.appLanguage !== i18n.language) {
      onLanguageChange(settings.appLanguage)
      void i18n.changeLanguage(settings.appLanguage)
    }
    showToast()
  }

  const handleSavePw = () => {
    if (pw.newPw !== pw.confirm) { setPwError(t('profile.passwordMismatch')); return }
    if (pw.newPw.length < 6) { setPwError('Minimum 6 characters'); return }
    setPwError('')
    setPw({ current: '', newPw: '', confirm: '' })
    setShowPwForm(false)
    showToast()
  }

  const handleDeleteAccount = () => {
    localStorage.removeItem('alavia.user')
    localStorage.removeItem('alavia.profileSettings')
    setModal(null)
    onLogout()
  }

  const handleClearData = () => {
    localStorage.removeItem('alavia.chatHistory')
    localStorage.removeItem('alavia.summaries')
    setModal(null)
    showToast()
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

  const btnRowCls = `flex w-full items-center justify-between px-5 py-4 text-sm font-semibold transition-all ${dark ? 'text-slate-300 hover:bg-slate-700' : 'text-slate-700 hover:bg-slate-50'} active:opacity-70`

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
              {user.email || '—'}
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
                    <button onClick={handleSavePw}
                      className="w-full rounded-xl bg-emerald-600 py-2.5 text-sm font-bold text-white transition-all hover:bg-emerald-700 active:scale-[0.98]">
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
              <option value="">—</option>
              {(['ageBandUnder18', 'ageBand18', 'ageBand31', 'ageBand46', 'ageBand60'] as const).map(k => (
                <option key={k} value={k}>{t(`profile.${k}`)}</option>
              ))}
            </select>
          </Row>

          {/* Gender */}
          <Row label={t('profile.genderLabel')} dark={dark}>
            <select value={settings.gender} onChange={e => set('gender', e.target.value)} className={selectCls(dark)}>
              <option value="">—</option>
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

          {/* Emergency Contact */}
          <div className="px-5 pb-5 pt-4">
            <p className={`mb-3 text-sm font-semibold ${dark ? 'text-slate-200' : 'text-slate-800'}`}>{t('profile.emergencyContact')}</p>
            <div className="space-y-3">
              {([
                ['emergencyName', t('profile.emergencyName'), 'text', 'name'],
                ['emergencyPhone', t('profile.emergencyPhone'), 'tel', 'tel'],
                ['emergencyRelation', t('profile.emergencyRelation'), 'text', 'off'],
              ] as Array<[keyof Settings, string, string, string]>).map(([field, label, type, ac]) => (
                <div key={field}>
                  <label className={`mb-1 block text-xs font-semibold ${dark ? 'text-slate-400' : 'text-slate-500'}`}>{label}</label>
                  <input type={type} autoComplete={ac} value={settings[field] as string}
                    onChange={e => set(field, e.target.value)} className={inputCls(dark)} />
                </div>
              ))}
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
              <button onClick={() => window.open('about:preferences', '_blank')}
                className="flex items-center gap-1.5 text-sm font-semibold text-emerald-600 hover:underline">
                <ChevronRight size={14} />
                {t('profile.openSettings')}
              </button>
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
        <SectionCard icon={<ShieldCheck size={18} />} title={t('profile.sectionPrivacy')} dark={dark}>
          <Row label={t('profile.saveChatHistory')} hint={t('profile.saveChatHistoryHint')} dark={dark}>
            <Toggle checked={settings.saveChatHistory} onChange={v => set('saveChatHistory', v)} />
          </Row>
          {[
            { label: t('profile.clearChat'), icon: <RefreshCcw size={14} />, action: () => setModal('clear') },
            { label: t('profile.clearSummaries'), icon: <RefreshCcw size={14} />, action: () => setModal('clear') },
            { label: t('profile.downloadData'), icon: <Download size={14} />, action: () => {} },
            { label: t('profile.consentLink'), icon: <ChevronRight size={14} />, action: () => {} },
          ].map(({ label, icon, action }) => (
            <button key={label} onClick={action} className={btnRowCls}>
              <span>{label}</span>
              <span className="text-slate-400">{icon}</span>
            </button>
          ))}
        </SectionCard>

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
                  {mode === 'call' ? '📞 ' : mode === 'sms' ? '💬 ' : '🚨 '}{mode.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          {/* Emergency Contact quick-link */}
          <button className={btnRowCls}>
            <div>
              <p className="text-sm font-semibold">{t('profile.emergencyContact')}</p>
              <p className={`text-xs ${dark ? 'text-slate-500' : 'text-slate-400'}`}>
                {settings.emergencyName ? settings.emergencyName : '—'}
                {settings.emergencyPhone ? ` · ${settings.emergencyPhone}` : ''}
              </p>
            </div>
            <Bell size={15} className="text-slate-400 shrink-0" />
          </button>
        </SectionCard>

        {/* ── 7 · DANGER ZONE ──────────────────────────────────────── */}
        <SectionCard icon={<Trash2 size={18} />} title={t('profile.sectionDanger')} accent="red" dark={dark}>
          <button onClick={() => setModal('clear')}
            className="flex w-full items-center justify-between px-5 py-4 text-sm font-bold text-amber-500 transition-all hover:bg-amber-50 active:opacity-70">
            <span>{t('profile.clearData')}</span>
            <RefreshCcw size={15} />
          </button>
          <button onClick={() => setModal('delete')}
            className="flex w-full items-center justify-between px-5 py-4 text-sm font-bold text-red-600 transition-all hover:bg-red-50 active:opacity-70">
            <span>{t('profile.deleteAccount')}</span>
            <Trash2 size={15} />
          </button>
        </SectionCard>

      </main>

      {/* ── Active accessibility hints (bottom-right corner) ───────── */}
      <div className="pointer-events-none fixed bottom-6 right-4 z-10 flex flex-col items-end gap-1 opacity-40">
        {settings.largeText && <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-700"><Type size={12} /> Large text</div>}
        {settings.darkMode && <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-700"><Moon size={12} /> Dark</div>}
        {settings.highContrast && <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-700"><Sun size={12} /> Contrast</div>}
        {settings.audioAutoplay && <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-700"><Volume2 size={12} /> Audio on</div>}
        {settings.readPrompts && <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-700"><Mic size={12} /> Reading</div>}
      </div>

      {/* ── Saved Toast ──────────────────────────────────────────────── */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 80, opacity: 0 }}
            className="fixed bottom-6 left-1/2 z-40 -translate-x-1/2"
          >
            <div className="flex items-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-bold text-white shadow-xl shadow-emerald-300/50">
              <CheckCircle2 size={16} />
              {t('profile.savedToast')}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Confirmation Modals ──────────────────────────────────────── */}
      <AnimatePresence>
        {modal === 'delete' && (
          <ConfirmModal
            title={t('profile.deleteAccount')}
            body={t('profile.deleteWarning')}
            confirmLabel={t('profile.confirmDelete')}
            cancelLabel={t('profile.cancel')}
            onConfirm={handleDeleteAccount}
            onCancel={() => setModal(null)}
            danger
          />
        )}
        {modal === 'clear' && (
          <ConfirmModal
            title={t('profile.clearData')}
            body={t('profile.clearWarning')}
            confirmLabel={t('profile.confirmClear')}
            cancelLabel={t('profile.cancel')}
            onConfirm={handleClearData}
            onCancel={() => setModal(null)}
            danger={false}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

