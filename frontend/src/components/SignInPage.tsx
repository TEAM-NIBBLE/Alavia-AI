import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import alaviaLogo from '../assets/alavia-ai_logo.png'

interface SignInPageProps {
  onSuccess: () => void
  onSwitchToSignUp: () => void
  onBack: () => void
}

export default function SignInPage({ onSuccess, onSwitchToSignUp, onBack }: SignInPageProps) {
  const { t } = useTranslation()
  const [form, setForm] = useState({ emailOrPhone: '', password: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<Partial<typeof form>>({})
  const [forgotSent, setForgotSent] = useState(false)

  const validate = () => {
    const newErrors: Partial<typeof form> = {}
    if (!form.emailOrPhone.trim()) newErrors.emailOrPhone = 'Email or phone is required'
    if (!form.password) newErrors.password = 'Password is required'
    return newErrors
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    const validationErrors = validate()
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }
    setErrors({})
    setIsLoading(true)
    // Simulate sign in — in production, verify against backend
    setTimeout(() => {
      setIsLoading(false)
      onSuccess()
    }, 900)
  }

  const handleChange =
    (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => {
      setForm(prev => ({ ...prev, [field]: e.target.value }))
      if (errors[field]) setErrors(prev => ({ ...prev, [field]: undefined }))
    }

  const handleForgotPassword = () => {
    setForgotSent(true)
    setTimeout(() => setForgotSent(false), 4000)
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
            'radial-gradient(circle at top left, rgba(16,185,129,0.08) 0%, transparent 50%), radial-gradient(circle at bottom right, rgba(16,185,129,0.06) 0%, transparent 50%)'
        }}
      />

      <div className="relative mx-auto flex min-h-screen w-full max-w-md flex-col items-center justify-center px-6 py-12">
        {/* Logo & header */}
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-600 shadow-lg shadow-emerald-200">
            <img src={alaviaLogo} alt="Alavia AI" className="h-11 w-11 rounded-xl object-contain" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
            {t('auth.signinTitle')}
          </h1>
          <p className="mt-2 text-sm text-slate-500">{t('auth.signinSubtitle')}</p>
        </div>

        {/* Forgot-password toast */}
        {forgotSent && (
          <div className="mb-4 w-full rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700 shadow-sm animate-in fade-in slide-in-from-top-2">
            {t('auth.forgotPasswordSuccess')}
          </div>
        )}

        {/* Form card */}
        <div className="w-full rounded-3xl border border-slate-100 bg-white p-8 shadow-2xl shadow-slate-200/60">
          <form onSubmit={handleSubmit} noValidate className="space-y-5">
            {/* Email or Phone */}
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                {t('auth.emailOrPhone')}
              </label>
              <div className="relative">
                <span className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center text-slate-400">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                  </svg>
                </span>
                <input
                  type="text"
                  autoComplete="username"
                  value={form.emailOrPhone}
                  onChange={handleChange('emailOrPhone')}
                  placeholder={t('auth.emailOrPhonePlaceholder')}
                  className={`w-full rounded-xl border py-3 pl-10 pr-4 text-sm text-slate-800 outline-none transition-all placeholder:text-slate-300 focus:ring-2 focus:ring-emerald-500/30 ${errors.emailOrPhone
                    ? 'border-red-400 bg-red-50 focus:border-red-400'
                    : 'border-slate-200 bg-slate-50 focus:border-emerald-500 focus:bg-white'
                    }`}
                />
              </div>
              {errors.emailOrPhone && (
                <p className="mt-1 text-xs text-red-500">{errors.emailOrPhone}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label className="text-sm font-semibold text-slate-700">
                  {t('auth.signinPassword')}
                </label>
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  className="text-xs font-medium text-emerald-600 transition-colors hover:text-emerald-700 hover:underline"
                >
                  {t('auth.forgotPassword')}
                </button>
              </div>
              <div className="relative">
                <span className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center text-slate-400">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={form.password}
                  onChange={handleChange('password')}
                  placeholder={t('auth.signinPasswordPlaceholder')}
                  className={`w-full rounded-xl border py-3 pl-10 pr-12 text-sm text-slate-800 outline-none transition-all placeholder:text-slate-300 focus:ring-2 focus:ring-emerald-500/30 ${errors.password
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
              {errors.password && (
                <p className="mt-1 text-xs text-red-500">{errors.password}</p>
              )}
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
                  {t('auth.signingIn')}
                </>
              ) : (
                <>
                  {t('auth.signInBtn')}
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-slate-100" />
            <span className="text-xs font-medium text-slate-300 uppercase tracking-widest text-[10px]">{t('auth.orDivider')}</span>
            <div className="h-px flex-1 bg-slate-100" />
          </div>

          <button
            type="button"
            onClick={() => {
              setIsLoading(true)
              setTimeout(() => {
                localStorage.setItem('alavia.user', JSON.stringify({ name: 'Demo User', email: 'demo@alavia.ai' }))
                setIsLoading(false)
                onSuccess()
              }, 1000)
            }}
            className="mb-6 flex w-full items-center justify-center gap-2 rounded-xl border-2 border-emerald-100 bg-white py-3 text-sm font-bold text-emerald-700 transition-all hover:border-emerald-500 hover:bg-emerald-50 hover:shadow-md active:scale-[0.98]"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {t('auth.signInDemo')}
          </button>

          {/* Switch to Sign Up */}
          <p className="text-center text-sm text-slate-500">
            {t('auth.noAccount')}{' '}
            <button
              onClick={onSwitchToSignUp}
              className="font-semibold text-emerald-600 transition-colors hover:text-emerald-700 hover:underline"
            >
              {t('auth.signUp')}
            </button>
          </p>
        </div>

        {/* Decorative green ring */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-20 -right-20 h-64 w-64 rounded-full border-2 border-emerald-100 opacity-50"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -left-16 -top-16 h-48 w-48 rounded-full border-2 border-emerald-100 opacity-40"
        />

        {/* Footer */}
        <p className="mt-8 text-center text-xs font-bold uppercase tracking-widest text-slate-300 relative z-10">
          {t('onboarding.footer')}
        </p>
      </div>
    </div>
  )
}
