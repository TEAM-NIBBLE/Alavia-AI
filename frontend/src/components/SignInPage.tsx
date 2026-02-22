import { useState, type ChangeEvent, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { Eye, EyeOff } from 'lucide-react'
import alaviaLogo from '../assets/alavia-ai_logo.png'
import { authApi } from '../api/services'
import { ApiError } from '../api/client'

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
  const [apiError, setApiError] = useState('')

  const formatSignInError = (error: unknown) => {
    if (error instanceof ApiError) {
      if (error.status === 401) return 'Invalid email/phone or password.'
      if (error.status === 404) return 'User account not found. Please sign up first.'
      if (error.status === 422) return 'Please check your login details and try again.'
      return error.message || 'Unable to sign in right now.'
    }
    if (error instanceof Error) {
      if (/fetch|network|timeout/i.test(error.message)) return 'Cannot reach server. Check your internet or API base URL.'
      return error.message
    }
    return 'Unable to sign in right now.'
  }

  const validate = () => {
    const newErrors: Partial<typeof form> = {}
    if (!form.emailOrPhone.trim()) newErrors.emailOrPhone = 'Email or phone is required'
    if (!form.password) newErrors.password = 'Password is required'
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
      const result = await authApi.login({
        email: form.emailOrPhone.trim(),
        password: form.password,
      })

      localStorage.setItem(
        'alavia.user',
        JSON.stringify({
          name: result.user.name ?? 'User',
          email: result.user.email,
        })
      )
      setIsLoading(false)
      onSuccess()
    } catch (error) {
      setApiError(formatSignInError(error))
      setIsLoading(false)
    }
  }

  const handleChange =
    (field: keyof typeof form) => (e: ChangeEvent<HTMLInputElement>) => {
      setForm(prev => ({ ...prev, [field]: e.target.value }))
      if (errors[field]) setErrors(prev => ({ ...prev, [field]: undefined }))
    }

  const handleForgotPassword = async () => {
    const value = form.emailOrPhone.trim()
    if (!value) {
      setErrors(prev => ({ ...prev, emailOrPhone: 'Email or phone is required' }))
      return
    }

    try {
      await authApi.forgotPassword(value)
      setForgotSent(true)
      setTimeout(() => setForgotSent(false), 4000)
    } catch (error) {
      setApiError(error instanceof Error ? error.message : 'Could not send password reset.')
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-white">
      <div className="absolute top-0 left-0 right-0 h-1.5 bg-emerald-600" />
      <div className="absolute left-0 top-0 h-full w-1.5 bg-emerald-600/30" />
      <div className="absolute right-0 top-0 h-full w-1.5 bg-emerald-600/30" />

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

      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(circle at top left, rgba(16,185,129,0.08) 0%, transparent 50%), radial-gradient(circle at bottom right, rgba(16,185,129,0.06) 0%, transparent 50%)'
        }}
      />

      <div className="relative mx-auto flex min-h-screen w-full max-w-md flex-col items-center justify-center px-6 py-12">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-600 shadow-lg shadow-emerald-200">
            <img src={alaviaLogo} alt="Alavia AI" className="h-11 w-11 rounded-xl object-contain" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
            {t('auth.signinTitle')}
          </h1>
          <p className="mt-2 text-sm text-slate-500">{t('auth.signinSubtitle')}</p>
        </div>

        {forgotSent && (
          <div className="mb-4 w-full rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700 shadow-sm animate-in fade-in slide-in-from-top-2">
            {t('auth.forgotPasswordSuccess')}
          </div>
        )}

        <div className="w-full rounded-3xl border border-slate-100 bg-white p-8 shadow-2xl shadow-slate-200/60">
          {apiError ? (
            <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800">
              {apiError}
            </div>
          ) : null}

          <form onSubmit={handleSubmit} noValidate className="space-y-5">
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                {t('auth.emailOrPhone')}
              </label>
              <input
                type="text"
                autoComplete="username"
                value={form.emailOrPhone}
                onChange={handleChange('emailOrPhone')}
                placeholder={t('auth.emailOrPhonePlaceholder')}
                className={`w-full rounded-xl border py-3 px-4 text-sm text-slate-800 outline-none transition-all placeholder:text-slate-300 focus:ring-2 focus:ring-emerald-500/30 ${errors.emailOrPhone
                  ? 'border-red-400 bg-red-50 focus:border-red-400'
                  : 'border-slate-200 bg-slate-50 focus:border-emerald-500 focus:bg-white'
                  }`}
              />
              {errors.emailOrPhone && (
                <p className="mt-1 text-xs text-red-500">{errors.emailOrPhone}</p>
              )}
            </div>

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
                <input
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={form.password}
                  onChange={handleChange('password')}
                  placeholder={t('auth.signinPasswordPlaceholder')}
                  className={`w-full rounded-xl border py-3 px-4 pr-12 text-sm text-slate-800 outline-none transition-all placeholder:text-slate-300 focus:ring-2 focus:ring-emerald-500/30 ${errors.password
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
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-xs text-red-500">{errors.password}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3.5 text-sm font-bold text-white shadow-lg shadow-emerald-200 transition-all hover:bg-emerald-700 hover:shadow-emerald-300 active:scale-[0.98] disabled:opacity-70"
            >
              {isLoading ? t('auth.signingIn') : t('auth.signInBtn')}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-500">
            {t('auth.noAccount')}{' '}
            <button
              onClick={onSwitchToSignUp}
              className="font-semibold text-emerald-600 transition-colors hover:text-emerald-700 hover:underline"
            >
              {t('auth.signUp')}
            </button>
          </p>
        </div>

        <p className="mt-8 text-center text-xs font-bold uppercase tracking-widest text-slate-300 relative z-10">
          {t('onboarding.footer')}
        </p>
      </div>
    </div>
  )
}
