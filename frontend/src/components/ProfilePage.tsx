import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { AnimatePresence, motion } from 'framer-motion'
import {
  ArrowLeft, User, Globe, Heart, MapPin, ShieldCheck, AlertTriangle,
  Trash2, LogOut, Eye, EyeOff, CheckCircle2, Volume2, Moon, Type,
  RefreshCcw, Download, ChevronRight, Save, Sun, Mic
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
})

function loadSettings(): Settings {
  try {
    const stored = localStorage.getItem('alavia.profileSettings')
    return stored ? { ...getDefaults(), ...JSON.parse(stored) } : getDefaults()
  } catch { return getDefaults() }
}

// ── Inline Toggle ──────────────────────────────────────────────────────
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
function SectionCard({ icon, title, hint, accent = 'emerald', children }: {
  icon: React.ReactNode; title: string; hint?: string
  accent?: 'emerald' | 'red'; children: React.ReactNode
}) {
  const bg = accent === 'red' ? 'bg-red-500/10 text-red-600' : 'bg-emerald-100 text-emerald-700'
  return (
    <div className="mb-5 overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
      <div className="flex items-center gap-3 border-b border-slate-50 px-5 py-4">
        <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${bg}`}>{icon}</div>
        <div>
          <p className="font-bold text-slate-900">{title}</p>
          {hint && <p className="text-xs text-slate-400">{hint}</p>}
        </div>
      </div>
      <div className="divide-y divide-slate-50">{children}</div>
    </div>
  )
}

// ── Setting Row ────────────────────────────────────────────────────────
function Row({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 px-5 py-4">
      <div className="min-w-0">
        <p className="text-sm font-semibold text-slate-800">{label}</p>
        {hint && <p className="mt-0.5 text-xs text-slate-400">{hint}</p>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  )
}

// ── Confirmation Modal ─────────────────────────────────────────────────
function ConfirmModal({ title, body, confirmLabel, onConfirm, onCancel, danger = true }: {
  title: string; body: string; confirmLabel: string
  onConfirm: () => void; onCancel: () => void; danger?: boolean
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 px-6 backdrop-blur-sm"
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
          <button
            onClick={onConfirm}
            className={`w-full rounded-xl py-3 text-sm font-bold text-white transition-all active:scale-[0.98] ${danger ? 'bg-red-600 hover:bg-red-700' : 'bg-amber-500 hover:bg-amber-600'}`}
          >{confirmLabel}</button>
          <button
            onClick={onCancel}
            className="w-full rounded-xl border border-slate-200 py-3 text-sm font-bold text-slate-600 transition-all hover:bg-slate-50 active:scale-[0.98]"
          >Cancel</button>
        </div>
      </motion.div>
    </motion.div>
  )
}

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

  const langCodes: LanguageCode[] = ['en', 'pcm', 'yo', 'ha', 'ig']

  useEffect(() => {
    try {
      const stored = localStorage.getItem('alavia.user')
      if (stored) {
        const u = JSON.parse(stored) as { name: string; email: string }
        setUser({ name: u.name || '', email: u.email || '' })
      }
    } catch { /* ignore */ }

    navigator.permissions?.query({ name: 'geolocation' }).then(r => {
      setLocPermission(r.state as 'granted' | 'denied' | 'unknown')
      r.addEventListener('change', () => setLocPermission(r.state as 'granted' | 'denied' | 'unknown'))
    }).catch(() => setLocPermission('unknown'))
  }, [])

  const set = <K extends keyof Settings>(key: K, val: Settings[K]) =>
    setSettings(prev => ({ ...prev, [key]: val }))

  const handleSave = () => {
    localStorage.setItem('alavia.profileSettings', JSON.stringify(settings))
    if (settings.appLanguage !== i18n.language) {
      onLanguageChange(settings.appLanguage)
      void i18n.changeLanguage(settings.appLanguage)
    }
    setToast(true)
    if (toastTimer.current) clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(false), 3000)
  }

  const handleSavePw = () => {
    if (pw.newPw !== pw.confirm) { setPwError(t('profile.passwordMismatch')); return }
    if (pw.newPw.length < 6) { setPwError('Min 6 characters'); return }
    setPwError('')
    setPw({ current: '', newPw: '', confirm: '' })
    setShowPwForm(false)
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
    setToast(true)
    toastTimer.current = setTimeout(() => setToast(false), 3000)
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
    <div className={`relative min-h-screen ${settings.darkMode ? 'bg-slate-900' : 'bg-slate-50'}`}>
      {/* Accent bars */}
      <div className="absolute top-0 left-0 right-0 h-1.5 bg-emerald-600" />
      <div className="absolute left-0 top-0 h-full w-1 bg-emerald-600/20" />
      <div className="absolute right-0 top-0 h-full w-1 bg-emerald-600/20" />

      {/* Sticky header */}
      <header className={`sticky top-0 z-20 flex items-center gap-3 border-b px-4 py-4 backdrop-blur-xl ${settings.darkMode ? 'border-slate-700 bg-slate-900/90' : 'border-slate-100 bg-white/90'}`}>
        <button
          onClick={onBack}
          className={`flex h-10 w-10 items-center justify-center rounded-xl transition-all ${settings.darkMode ? 'hover:bg-slate-700 text-slate-300' : 'hover:bg-emerald-50 text-slate-600 hover:text-emerald-700'}`}
          aria-label={t('profile.back')}
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className={`flex-1 text-lg font-extrabold ${settings.darkMode ? 'text-white' : 'text-slate-900'}`}>
          {t('profile.title')}
        </h1>
        <button
          onClick={handleSave}
          className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white shadow-md shadow-emerald-200 transition-all hover:bg-emerald-700 active:scale-[0.97]"
        >
          <Save size={14} />
          {t('profile.saveChanges')}
        </button>
      </header>

      {/* Scrollable content */}
      <main className="mx-auto max-w-xl px-4 py-6 pb-24">

        {/* ── 1. ACCOUNT ─────────────────────────────────────────────── */}
        <SectionCard icon={<User size={18} />} title={t('profile.sectionAccount')}>
          <Row label={t('profile.fullName')}>
            <input
              type="text" value={user.name}
              onChange={e => setUser(u => ({ ...u, name: e.target.value }))}
              className="w-40 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 outline-none focus:border-emerald-500 focus:bg-white text-right"
            />
          </Row>
          <Row label={t('profile.email')}>
            <span className="max-w-[160px] truncate text-right text-sm text-slate-500">{user.email || '—'}</span>
          </Row>

          {/* Change Password (expandable) */}
          <div className="px-5 py-4">
            <button
              onClick={() => setShowPwForm(v => !v)}
              className="flex w-full items-center justify-between text-sm font-semibold text-slate-800"
            >
              <span>{t('profile.changePassword')}</span>
              <ChevronRight size={16} className={`transition-transform ${showPwForm ? 'rotate-90' : ''} text-slate-400`} />
            </button>
            <AnimatePresence>
              {showPwForm && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }} className="overflow-hidden"
                >
                  <div className="mt-4 space-y-3">
                    {([['current', t('profile.currentPassword')] as const,
                      ['newPw', t('profile.newPassword')] as const,
                      ['confirm', t('profile.confirmPassword')] as const] as Array<[keyof typeof pw, string]>).map(([field, label]) => (
                      <div key={field} className="relative">
                        <label className="mb-1 block text-xs font-semibold text-slate-500">{label}</label>
                        <input
                          type={showPwEye ? 'text' : 'password'}
                          value={pw[field]}
                          onChange={e => setPw(p => ({ ...p, [field]: e.target.value }))}
                          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 pr-10 text-sm text-slate-800 outline-none focus:border-emerald-500 focus:bg-white"
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

          {/* Logout  */}
          <div className="px-4 pb-3">
            <button
              onClick={onLogout}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-3.5 text-sm font-bold text-red-600 transition-all hover:bg-red-50 active:scale-[0.98]"
            >
              <LogOut size={16} />
              {t('profile.logout')}
            </button>
          </div>
        </SectionCard>

        {/* ── 2. LANGUAGE & ACCESSIBILITY ────────────────────────────── */}
        <SectionCard icon={<Globe size={18} />} title={t('profile.sectionLang')}>
          <Row label={t('profile.appLanguage')}>
            <select
              value={settings.appLanguage}
              onChange={e => set('appLanguage', e.target.value as LanguageCode)}
              className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-800 outline-none focus:border-emerald-500"
            >
              {langCodes.map(c => (
                <option key={c} value={c}>{t(`language.${c}.name`)}</option>
              ))}
            </select>
          </Row>
          <Row label={t('profile.largeText')} hint={t('profile.largeTextHint')}>
            <Toggle checked={settings.largeText} onChange={v => set('largeText', v)} />
          </Row>
          <Row label={t('profile.highContrast')} hint={t('profile.highContrastHint')}>
            <Toggle checked={settings.highContrast} onChange={v => set('highContrast', v)} />
          </Row>
          <Row label={t('profile.darkMode')} hint={t('profile.darkModeHint')}>
            <Toggle checked={settings.darkMode} onChange={v => set('darkMode', v)} />
          </Row>
          <Row label={t('profile.audioAutoplay')} hint={t('profile.audioAutoplayHint')}>
            <Toggle checked={settings.audioAutoplay} onChange={v => set('audioAutoplay', v)} />
          </Row>
          <div className="px-5 py-4">
            <p className="mb-3 text-sm font-semibold text-slate-800">{t('profile.voiceSpeed')}</p>
            <div className="flex gap-2">
              {(['slow', 'normal', 'fast'] as const).map(speed => (
                <button
                  key={speed}
                  onClick={() => set('voiceSpeed', speed)}
                  className={`flex-1 rounded-xl py-2.5 text-xs font-bold transition-all ${settings.voiceSpeed === speed ? 'bg-emerald-600 text-white shadow-md shadow-emerald-200' : 'border border-slate-200 bg-slate-50 text-slate-600 hover:border-emerald-300 hover:text-emerald-700'}`}
                >
                  {t(`profile.${speed}`)}
                </button>
              ))}
            </div>
          </div>
          <Row label={t('profile.readPrompts')} hint={t('profile.readPromptsHint')}>
            <Toggle checked={settings.readPrompts} onChange={v => set('readPrompts', v)} />
          </Row>
        </SectionCard>

        {/* ── 3. HEALTH PROFILE ──────────────────────────────────────── */}
        <SectionCard icon={<Heart size={18} />} title={t('profile.sectionHealth')} hint={t('profile.healthHint')}>
          {/* Age Band */}
          <Row label={t('profile.ageBand')}>
            <select
              value={settings.ageBand}
              onChange={e => set('ageBand', e.target.value)}
              className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-800 outline-none focus:border-emerald-500"
            >
              <option value="">—</option>
              {(['ageBandUnder18', 'ageBand18', 'ageBand31', 'ageBand46', 'ageBand60'] as const).map(k => (
                <option key={k} value={k}>{t(`profile.${k}`)}</option>
              ))}
            </select>
          </Row>

          {/* Gender */}
          <Row label={t('profile.genderLabel')}>
            <select
              value={settings.gender}
              onChange={e => set('gender', e.target.value)}
              className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-800 outline-none focus:border-emerald-500"
            >
              <option value="">—</option>
              <option value="male">{t('profile.genderMale')}</option>
              <option value="female">{t('profile.genderFemale')}</option>
              <option value="none">{t('profile.genderNone')}</option>
            </select>
          </Row>

          {/* Pregnancy status — show for female or unset */}
          {(settings.gender === 'female' || settings.gender === '') && (
            <Row label={t('profile.pregnancy')} hint={t('profile.pregnancyHint')}>
              <Toggle checked={settings.pregnancyStatus} onChange={v => set('pregnancyStatus', v)} />
            </Row>
          )}

          {/* Known Conditions */}
          <div className="px-5 py-4">
            <p className="mb-3 text-sm font-semibold text-slate-800">{t('profile.conditions')}</p>
            <div className="grid grid-cols-2 gap-2">
              {conditions.map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => set(key, !settings[key])}
                  className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 text-left text-xs font-semibold transition-all ${settings[key] ? 'border-emerald-500 bg-emerald-50 text-emerald-800' : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-emerald-200'}`}
                >
                  <div className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-md border transition-all ${settings[key] ? 'border-emerald-500 bg-emerald-500' : 'border-slate-300'}`}>
                    {settings[key] && <svg className="h-2.5 w-2.5 text-white" fill="none" viewBox="0 0 12 12"><path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                  </div>
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Allergies */}
          <div className="px-5 pb-4">
            <label className="mb-1.5 block text-sm font-semibold text-slate-800">
              {t('profile.allergies')}
              <span className="ml-1 font-normal text-slate-400 text-xs">({t('profile.allergiesHint')})</span>
            </label>
            <textarea
              value={settings.allergies}
              onChange={e => set('allergies', e.target.value)}
              rows={2}
              placeholder={t('profile.allergiesPlaceholder')}
              className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 outline-none placeholder:text-slate-300 focus:border-emerald-500 focus:bg-white"
            />
          </div>

          {/* Emergency Contact */}
          <div className="px-5 pb-5 pt-1">
            <p className="mb-3 text-sm font-semibold text-slate-800">{t('profile.emergencyContact')}</p>
            <div className="space-y-3">
              {([
                ['emergencyName', t('profile.emergencyName'), 'text', 'name'] as const,
                ['emergencyPhone', t('profile.emergencyPhone'), 'tel', 'tel'] as const,
                ['emergencyRelation', t('profile.emergencyRelation'), 'text', 'off'] as const,
              ] as Array<[keyof Settings, string, string, string]>).map(([field, label, type, autoComplete]) => (
                <div key={field}>
                  <label className="mb-1 block text-xs font-semibold text-slate-500">{label}</label>
                  <input
                    type={type} autoComplete={autoComplete}
                    value={settings[field] as string}
                    onChange={e => set(field, e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-emerald-500 focus:bg-white"
                  />
                </div>
              ))}
            </div>
          </div>
        </SectionCard>

        {/* ── 4. LOCATION ────────────────────────────────────────────── */}
        <SectionCard icon={<MapPin size={18} />} title={t('profile.sectionLocation')}>
          <Row label={t('profile.useLocation')} hint={t('profile.useLocationHint')}>
            <Toggle checked={settings.useLocation} onChange={v => set('useLocation', v)} />
          </Row>
          <Row label={t('profile.locationPermission')}>
            <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${permColor}`}>{permLabel}</span>
          </Row>
          {locPermission === 'denied' && (
            <div className="px-5 pb-4">
              <button
                onClick={() => window.open('about:preferences', '_blank')}
                className="flex items-center gap-2 text-sm font-semibold text-emerald-600 hover:underline"
              >
                <ChevronRight size={14} />
                {t('profile.openSettings')}
              </button>
            </div>
          )}
          <div className="px-5 pb-5 pt-2">
            <label className="mb-1.5 block text-sm font-semibold text-slate-800">
              {t('profile.homeArea')}
              <span className="ml-1 font-normal text-slate-400 text-xs">({t('profile.homeAreaHint')})</span>
            </label>
            <input
              type="text"
              value={settings.homeArea}
              onChange={e => set('homeArea', e.target.value)}
              placeholder={t('profile.homeAreaPlaceholder')}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 outline-none placeholder:text-slate-300 focus:border-emerald-500 focus:bg-white"
            />
          </div>
        </SectionCard>

        {/* ── 5. PRIVACY & DATA ──────────────────────────────────────── */}
        <SectionCard icon={<ShieldCheck size={18} />} title={t('profile.sectionPrivacy')}>
          <Row label={t('profile.saveChatHistory')} hint={t('profile.saveChatHistoryHint')}>
            <Toggle checked={settings.saveChatHistory} onChange={v => set('saveChatHistory', v)} />
          </Row>
          {[
            { label: t('profile.clearChat'), icon: <RefreshCcw size={14} />, action: () => setModal('clear') },
            { label: t('profile.clearSummaries'), icon: <RefreshCcw size={14} />, action: () => setModal('clear') },
            { label: t('profile.downloadData'), icon: <Download size={14} />, action: () => {} },
            { label: t('profile.consentLink'), icon: <ChevronRight size={14} />, action: () => {} },
          ].map(({ label, icon, action }) => (
            <button
              key={label} onClick={action}
              className="flex w-full items-center justify-between px-5 py-4 text-sm font-semibold text-slate-700 transition-all hover:bg-slate-50 active:bg-slate-100"
            >
              <span>{label}</span>
              <span className="text-slate-400">{icon}</span>
            </button>
          ))}
        </SectionCard>

        {/* ── 6. SAFETY ──────────────────────────────────────────────── */}
        <SectionCard icon={<AlertTriangle size={18} />} title={t('profile.sectionSafety')}>
          <Row label={t('profile.showRedFlag')} hint={t('profile.showRedFlagHint')}>
            <Toggle checked={settings.showRedFlag} onChange={v => set('showRedFlag', v)} />
          </Row>
        </SectionCard>

        {/* ── 7. DANGER ZONE ─────────────────────────────────────────── */}
        <SectionCard icon={<Trash2 size={18} />} title={t('profile.sectionDanger')} accent="red">
          <button
            onClick={() => setModal('clear')}
            className="flex w-full items-center justify-between px-5 py-4 text-sm font-bold text-amber-600 transition-all hover:bg-amber-50 active:bg-amber-100"
          >
            <span>{t('profile.clearData')}</span>
            <RefreshCcw size={15} />
          </button>
          <button
            onClick={() => setModal('delete')}
            className="flex w-full items-center justify-between px-5 py-4 text-sm font-bold text-red-600 transition-all hover:bg-red-50 active:bg-red-100"
          >
            <span>{t('profile.deleteAccount')}</span>
            <Trash2 size={15} />
          </button>
        </SectionCard>

      </main>

      {/* ── Saved Toast ─────────────────────────────────────────────── */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            className="fixed bottom-6 left-1/2 z-40 -translate-x-1/2"
          >
            <div className="flex items-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-bold text-white shadow-xl shadow-emerald-300">
              <CheckCircle2 size={16} />
              {t('profile.savedToast')}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Confirmation Modals ─────────────────────────────────────── */}
      <AnimatePresence>
        {modal === 'delete' && (
          <ConfirmModal
            title={t('profile.deleteAccount')}
            body={t('profile.deleteWarning')}
            confirmLabel={t('profile.confirmDelete')}
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
            onConfirm={handleClearData}
            onCancel={() => setModal(null)}
            danger={false}
          />
        )}
      </AnimatePresence>

      {/* Floating accessibility icons row (visual accessibility cues) */}
      <div className="pointer-events-none fixed bottom-6 right-4 z-10 flex flex-col items-center gap-1.5 opacity-30">
        {settings.largeText && <Type size={14} className="text-emerald-700" />}
        {settings.darkMode && <Moon size={14} className="text-emerald-700" />}
        {settings.highContrast && <Sun size={14} className="text-emerald-700" />}
        {settings.audioAutoplay && <Volume2 size={14} className="text-emerald-700" />}
        {settings.readPrompts && <Mic size={14} className="text-emerald-700" />}
      </div>
    </div>
  )
}
