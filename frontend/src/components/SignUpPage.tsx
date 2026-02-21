import { useState, type ChangeEvent, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import alaviaLogo from '../assets/alavia-ai_logo.png'
import { authApi } from '../api/services'

interface SignUpPageProps {
  onSuccess: (user: { name: string; email: string; phone: string }) => void
  onSwitchToSignIn: () => void
  onBack: () => void
}

export default function SignUpPage({ onSuccess, onSwitchToSignIn, onBack }: SignUpPageProps) {
  const { t } = useTranslation()
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<Partial<typeof form>>({})
  const [apiError, setApiError] = useState('')

  const mapLanguageCode = (value: string) => {
    const input = value.toLowerCase()
    if (input === 'pcm') return 'PIDGIN'
    if (input === 'yo') return 'YORUBA'
    if (input === 'ha') return 'HAUSA'
    if (input === 'ig') return 'IGBO'
    return 'EN'
  }

  const validate = () => {
    const newErrors: Partial<typeof form> = {}
    if (!form.name.trim()) newErrors.name = 'Full name is required'
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      newErrors.email = 'Valid email is required'
    if (!form.phone.trim() || !/^\+?[\d\s\-()]{7,15}$/.test(form.phone))
      newErrors.phone = 'Valid phone number is required'
    if (!form.password || form.password.length < 6)
      newErrors.password = 'Password must be at least 6 characters'
    return newErrors
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    const validationErrors = validate()
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }
    setErrors({})
    setApiError('')
    setIsLoading(true)

    try {
      const selectedLanguage = localStorage.getItem('alavia.selectedLanguage') ?? 'en'
      const result = await authApi.register({
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        password: form.password,
        password_confirmation: form.password,
        language: mapLanguageCode(selectedLanguage),
        emergency_contact_name: form.name.trim(),
        emergency_contact_phone: form.phone.trim(),
      })

      const user = {
        name: result.user.name ?? form.name.trim(),
        email: result.user.email ?? form.email.trim(),
        phone: result.user.phone ?? form.phone.trim(),
      }
      localStorage.setItem('alavia.user', JSON.stringify(user))
      setIsLoading(false)
      onSuccess(user)
    } catch (error) {
      // Fallback keeps prototype usable even when backend is offline.
      const user = { name: form.name.trim(), email: form.email.trim(), phone: form.phone.trim() }
      localStorage.setItem('alavia.user', JSON.stringify(user))
      setApiError(error instanceof Error ? error.message : 'Unable to reach server, continued in offline mode.')
      setIsLoading(false)
      onSuccess(user)
    }
  }

  const handleChange = (field: keyof typeof form) => (e: ChangeEvent<HTMLInputElement>) => {
    setForm(prev => ({ ...prev, [field]: e.target.value }))
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: undefined }))
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-white">
      {/* Green top bar accent */}
      <div className="absolute top-0 left-0 right-0 h-1.5 bg-emerald-600" />
      {/* Side accents */}
      <div className="absolute left-0 top-0 h-full w-1.5 bg-emerald-600/30" />
      <div className="absolute right-0 top-0 h-full w-1.5 bg-emerald-600/30" />

      {/* Back button */}
      <button
        onClick={onBack}
        className="absolute top-6 left-5 flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium text-slate-500 transition-all hover:bg-emerald-50 hover:text-emerald-700"
        aria-label="Back to language selection"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        {t('auth.back')}
      </button>

      {/* Soft background blobs */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(circle at top right, rgba(16,185,129,0.08) 0%, transparent 50%), radial-gradient(circle at bottom left, rgba(16,185,129,0.06) 0%, transparent 50%)'
        }}
      />

      <div className="relative mx-auto flex min-h-screen w-full max-w-md flex-col items-center justify-center px-6 py-12">
        {/* Logo & header */}
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-600 shadow-lg shadow-emerald-200">
            <img src={alaviaLogo} alt="Alavia AI" className="h-11 w-11 rounded-xl object-contain" />
          </div>
          <span className="mb-3 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold uppercase tracking-wider text-emerald-700 ring-1 ring-emerald-200">
            {t('auth.step2Label')}
          </span>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
            {t('auth.signupTitle')}
          </h1>
          <p className="mt-2 text-sm text-slate-500">{t('auth.signupSubtitle')}</p>
        </div>

        {/* Form card */}
        <div className="w-full rounded-3xl border border-slate-100 bg-white p-8 shadow-2xl shadow-slate-200/60">
          {apiError ? (
            <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800">
              {apiError}
            </div>
          ) : null}
          <form onSubmit={handleSubmit} noValidate className="space-y-5">
            {/* Full Name */}
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                {t('auth.fullName')}
              </label>
              <div className="relative">
                <span className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center text-slate-400">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </span>
                <input
                  type="text"
                  autoComplete="name"
                  value={form.name}
                  onChange={handleChange('name')}
                  placeholder={t('auth.fullNamePlaceholder')}
                  className={`w-full rounded-xl border py-3 pl-10 pr-4 text-sm text-slate-800 outline-none transition-all placeholder:text-slate-300 focus:ring-2 focus:ring-emerald-500/30 ${
                    errors.name
                      ? 'border-red-400 bg-red-50 focus:border-red-400'
                      : 'border-slate-200 bg-slate-50 focus:border-emerald-500 focus:bg-white'
                  }`}
                />
              </div>
              {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name}</p>}
            </div>

            {/* Email */}
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                {t('auth.email')}
              </label>
              <div className="relative">
                <span className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center text-slate-400">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </span>
                <input
                  type="email"
                  autoComplete="email"
                  value={form.email}
                  onChange={handleChange('email')}
                  placeholder={t('auth.emailPlaceholder')}
                  className={`w-full rounded-xl border py-3 pl-10 pr-4 text-sm text-slate-800 outline-none transition-all placeholder:text-slate-300 focus:ring-2 focus:ring-emerald-500/30 ${
                    errors.email
                      ? 'border-red-400 bg-red-50 focus:border-red-400'
                      : 'border-slate-200 bg-slate-50 focus:border-emerald-500 focus:bg-white'
                  }`}
                />
              </div>
              {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email}</p>}
            </div>

            {/* Phone */}
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                {t('auth.phone')}
              </label>
              <div className="relative">
                <span className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center text-slate-400">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                </span>
                <input
                  type="tel"
                  autoComplete="tel"
                  value={form.phone}
                  onChange={handleChange('phone')}
                  placeholder={t('auth.phonePlaceholder')}
                  className={`w-full rounded-xl border py-3 pl-10 pr-4 text-sm text-slate-800 outline-none transition-all placeholder:text-slate-300 focus:ring-2 focus:ring-emerald-500/30 ${
                    errors.phone
                      ? 'border-red-400 bg-red-50 focus:border-red-400'
                      : 'border-slate-200 bg-slate-50 focus:border-emerald-500 focus:bg-white'
                  }`}
                />
              </div>
              {errors.phone && <p className="mt-1 text-xs text-red-500">{errors.phone}</p>}
            </div>

            {/* Password with eye icon */}
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                {t('auth.password')}
              </label>
              <div className="relative">
                <span className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center text-slate-400">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={form.password}
                  onChange={handleChange('password')}
                  placeholder={t('auth.passwordPlaceholder')}
                  className={`w-full rounded-xl border py-3 pl-10 pr-12 text-sm text-slate-800 outline-none transition-all placeholder:text-slate-300 focus:ring-2 focus:ring-emerald-500/30 ${
                    errors.password
                      ? 'border-red-400 bg-red-50 focus:border-red-400'
                      : 'border-slate-200 bg-slate-50 focus:border-emerald-500 focus:bg-white'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute inset-y-0 right-3.5 flex items-center text-slate-400 transition-colors hover:text-emerald-600"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
              {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password}</p>}
            </div>

            {/* Submit button */}
            <button
              type="submit"
              disabled={isLoading}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3.5 text-sm font-bold text-white shadow-lg shadow-emerald-200 transition-all hover:bg-emerald-700 hover:shadow-emerald-300 active:scale-[0.98] disabled:opacity-70"
            >
              {isLoading ? (
                <>
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  {t('auth.creating')}
                </>
              ) : (
                <>
                  {t('auth.createAccount')}
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </>
              )}
            </button>
          </form>

          {/* Switch to Sign In */}
          <p className="mt-6 text-center text-sm text-slate-500">
            {t('auth.alreadyHaveAccount')}{' '}
            <button
              onClick={onSwitchToSignIn}
              className="font-semibold text-emerald-600 transition-colors hover:text-emerald-700 hover:underline"
            >
              {t('auth.signIn')}
            </button>
          </p>
        </div>

        {/* Footer */}
        <p className="mt-8 text-center text-xs font-bold uppercase tracking-widest text-slate-300">
          {t('onboarding.footer')}
        </p>
      </div>
    </div>
  )
}
