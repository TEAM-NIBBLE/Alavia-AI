import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import alaviaLogo from './assets/alavia-ai_logo.png'
import SignUpPage from './components/SignUpPage'
import SignInPage from './components/SignInPage'
import VoiceInteractionScreen from './components/VoiceInteractionScreen'
import { authApi } from './api/services'
import { guestSession } from './utils/guest'
import './App.css'

type OnboardingStep = 'splash' | 'language' | 'signup' | 'signin' | 'app'
type LanguageCode = 'en' | 'pcm' | 'yo' | 'ha' | 'ig'

const languageCodes: LanguageCode[] = ['en', 'pcm', 'yo', 'ha', 'ig']

function App() {
  const { t, i18n } = useTranslation()
  const [step, setStep] = useState<OnboardingStep>(() => {
    const user = localStorage.getItem('alavia.user')
    return user || guestSession.isActive() ? 'app' : 'splash'
  })
  const [isGuest, setIsGuest] = useState(() => !localStorage.getItem('alavia.user') && guestSession.isActive())
  const [selectedLanguage, setSelectedLanguage] = useState<LanguageCode>(
    (localStorage.getItem('alavia.selectedLanguage') as LanguageCode) ||
    (i18n.language as LanguageCode) ||
    'en'
  )
  const [isContinuing, setIsContinuing] = useState(false)
  const [isSaved, setIsSaved] = useState(false)
  const [userName, setUserName] = useState<string>(() => {
    try {
      const stored = localStorage.getItem('alavia.user')
      return stored ? (JSON.parse(stored) as { name: string }).name : ''
    } catch {
      return ''
    }
  })

  useEffect(() => {
    if (step === 'splash') {
      const timer = setTimeout(() => {
        setStep('language')
      }, 2500)
      return () => clearTimeout(timer)
    }
  }, [step])

  // IMPORTANT: This effect ensures that as soon as selectedLanguage state changes,
  // i18next updates the global language, causing the whole UI to re-translate instantly.
  useEffect(() => {
    if (i18n.language !== selectedLanguage) {
      void i18n.changeLanguage(selectedLanguage)
    }
  }, [selectedLanguage, i18n])

  const handleContinue = () => {
    setIsContinuing(true)
    setTimeout(() => {
      localStorage.setItem('alavia.selectedLanguage', selectedLanguage)
      setIsContinuing(false)
      setIsSaved(true)
      setTimeout(() => {
        const existingUser = localStorage.getItem('alavia.user')
        setStep(existingUser ? 'signin' : 'signup')
      }, 200)
    }, 200)
  }

  // Emergency access without an account. Always unblocks the user; never asks for anything.
  const handleContinueAsGuest = () => {
    localStorage.setItem('alavia.selectedLanguage', selectedLanguage)
    authApi.clearLocalSession()
    guestSession.enter()
    setUserName('')
    setIsGuest(true)
    setStep('app')
  }

  const handleSignUpSuccess = (user: { name: string }) => {
    guestSession.exit()
    setIsGuest(false)
    setUserName(user.name)
    setStep('app')
  }

  const handleSignInSuccess = () => {
    guestSession.exit()
    setIsGuest(false)
    try {
      const stored = localStorage.getItem('alavia.user')
      if (stored) setUserName((JSON.parse(stored) as { name: string }).name)
    } catch { /* ignore */ }
    setStep('app')
  }

  const handleLogout = () => {
    if (!isGuest) {
      void authApi.logout().catch(() => {
        // Ignore API logout failures in offline/demo mode.
      })
    }
    guestSession.exit()
    setIsGuest(false)
    localStorage.removeItem('alavia.user')
    setUserName('')
    setStep('language')
  }

  // A guest who decides to sign in or register leaves guest mode first.
  const handleGuestToAuth = (target: 'signin' | 'signup') => {
    guestSession.exit()
    setIsGuest(false)
    setStep(target)
  }

  const handleLanguageChange = (code: LanguageCode) => {
    setSelectedLanguage(code)
    localStorage.setItem('alavia.selectedLanguage', code)
  }

  // Auth pages render as full-page replacements
  if (step === 'signup') {
    return (
      <SignUpPage
        onSuccess={handleSignUpSuccess}
        onSwitchToSignIn={() => setStep('signin')}
        onContinueAsGuest={handleContinueAsGuest}
        onBack={() => { setIsSaved(false); setStep('language') }}
      />
    )
  }

  if (step === 'signin') {
    return (
      <SignInPage
        onSuccess={handleSignInSuccess}
        onSwitchToSignUp={() => setStep('signup')}
        onContinueAsGuest={handleContinueAsGuest}
        onBack={() => { setIsSaved(false); setStep('language') }}
      />
    )
  }

  if (step === 'app') {
    return (
      <VoiceInteractionScreen
        userName={userName}
        isGuest={isGuest}
        onSignIn={() => handleGuestToAuth('signin')}
        onSignUp={() => handleGuestToAuth('signup')}
        onLogout={handleLogout}
        onLanguageChange={handleLanguageChange}
      />
    )
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-slate-50 text-slate-900">
      {/* Dynamic Background */}
      <div className="onboarding-bg animate-in fade-in duration-1000" aria-hidden="true" />

      {/* Side Color Accents */}
      <div className="absolute left-0 top-0 h-full w-1.5 bg-emerald-600/60 sm:w-2" aria-hidden="true" />
      <div className="absolute right-0 top-0 h-full w-1.5 bg-emerald-600/60 sm:w-2" aria-hidden="true" />

      {/* Layout is identical in every step; only transform/opacity animate, so the
          splash -> language handoff runs on the compositor with no reflow. */}
      <section className="relative mx-auto flex min-h-screen w-full max-w-5xl flex-col items-center justify-start px-6 pt-16 pb-12">

        {/* Brand: rendered at its final (top) size. On splash it is translated to the
            vertical centre of the viewport and scaled up. */}
        <div
          className="flex flex-col items-center will-change-transform"
          style={{
            transform:
              step === 'splash'
                ? 'translate3d(0, calc(50svh - 4rem - 50%), 0) scale(1.6)'
                : 'translate3d(0, 0, 0) scale(1)',
            transformOrigin: 'center',
            transition: 'transform 1000ms cubic-bezier(0.22, 1, 0.36, 1)',
            marginBottom: '2rem',
          }}
        >
          <div className="relative">
            <img
              src={alaviaLogo}
              className="h-16 w-16 rounded-full object-contain md:h-20 md:w-20 animate-in zoom-in fade-in duration-1000"
              alt="Alavia AI logo"
            />
            <div
              className={`absolute -inset-4 -z-10 rounded-full bg-emerald-200/20 blur-2xl transition-opacity duration-700 ${step === 'splash' ? 'opacity-100 animate-pulse' : 'opacity-0'
                }`}
              aria-hidden="true"
            />
          </div>

          <h1 className="mt-4 text-center text-xl font-bold tracking-tight text-slate-800 md:text-2xl animate-in slide-in-from-bottom-4 fade-in duration-1000 delay-300 fill-mode-both">
            ALAVIA AI
          </h1>

          <p
            className={`mt-1 text-center text-xs font-medium text-emerald-600 transition-opacity duration-700 md:text-sm ${step === 'splash' ? 'opacity-100' : 'opacity-60'
              }`}
          >
            {t('onboarding.tagline')}
          </p>
        </div>

        {/* Language Selection Card */}
        <div
          className={`w-full max-w-xl will-change-transform transition-[opacity,transform] duration-700 ease-out ${step === 'language'
            ? 'translate-y-0 opacity-100 delay-500'
            : 'translate-y-8 opacity-0 pointer-events-none'
            }`}
        >
          <div className="mb-4 text-center">
            <button
              type="button"
              onClick={handleContinueAsGuest}
              className="w-full rounded-full border-2 border-red-200 bg-red-50 px-6 py-3 text-sm font-bold text-red-700 transition-all hover:bg-red-100 active:scale-[0.98]"
            >
              {t('auth.guestContinue')}
            </button>
            <p className="mt-2 text-xs text-slate-500">{t('auth.guestHint')}</p>
          </div>
          <div className="rounded-3xl border border-white/40 bg-white/70 p-6 shadow-2xl backdrop-blur-xl sm:p-9 ring-1 ring-slate-900/5">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-slate-900 tracking-tight">{t('onboarding.chooseLanguageTitle')}</h2>
                <p className="mt-1 text-sm text-slate-500">{t('onboarding.chooseLanguageHint')}</p>
              </div>
              <span className="shrink-0 rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold uppercase tracking-wider text-emerald-800">
                {t('onboarding.stepLabel')}
              </span>
            </div>

            <div className="grid gap-3">
              {languageCodes.map((languageCode, index) => {
                const active = selectedLanguage === languageCode
                return (
                  <button
                    key={languageCode}
                    className={`language-btn group relative overflow-hidden transition-all duration-300 ${active ? 'is-active ring-2 ring-emerald-500/20 scale-[1.02]' : 'hover:scale-[1.01]'
                      }`}
                    onClick={() => setSelectedLanguage(languageCode)}
                    style={{
                      transitionDelay: `${index * 30}ms`,
                      animationDelay: `${index * 100}ms`
                    }}
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={`flex h-10 w-10 items-center justify-center rounded-xl transition-all duration-300 ${active
                          ? 'bg-emerald-600 text-white shadow-md shadow-emerald-200'
                          : 'bg-slate-100 text-slate-400 group-hover:bg-emerald-50 group-hover:text-emerald-500'
                          }`}
                      >
                        <span className="text-xs font-black uppercase">NG</span>
                      </div>
                      <div className="text-left">
                        <p className={`font-bold transition-colors duration-300 ${active ? 'text-emerald-900' : 'text-slate-800'} sm:text-lg`}>
                          {t(`language.${languageCode}.name`)}
                        </p>
                        <p className={`text-xs font-medium transition-colors duration-300 ${active ? 'text-emerald-600/70' : 'text-slate-400'} sm:text-sm`}>
                          {t(`language.${languageCode}.nativeName`)}
                        </p>
                      </div>
                    </div>

                    <span className={`selection-dot ${active ? 'is-active scale-110' : 'scale-100 opacity-40 shadow-none'}`} aria-hidden="true" />
                  </button>
                )
              })}
            </div>

            <button
              className={`mt-8 flex w-full items-center justify-center gap-2 rounded-2xl px-6 py-4 text-lg font-bold text-white shadow-lg transition-all active:scale-[0.98] ${isSaved ? 'bg-emerald-500 shadow-emerald-100' : 'bg-emerald-600 shadow-emerald-200 hover:bg-emerald-700 hover:shadow-emerald-300'
                }`}
              onClick={handleContinue}
              disabled={isContinuing}
            >
              {isSaved ? t('onboarding.saved') : t('onboarding.continue')}
              {!isSaved && (
                <svg className={`h-5 w-5 transition-transform ${isContinuing ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  {isContinuing ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  )}
                </svg>
              )}
            </button>

            {(isContinuing || isSaved) && (
              <p className="mt-4 text-center text-sm font-semibold text-emerald-600 animate-in fade-in slide-in-from-top-2" role="status">
                {isContinuing ? t('onboarding.saving') : t('onboarding.saved')}
              </p>
            )}


            <div className="mt-8 rounded-2xl bg-slate-50 p-4 border border-slate-100">
              <p className="text-xs leading-relaxed text-slate-400">
                <span className="font-bold text-slate-500 uppercase tracking-tighter mr-1">{t('onboarding.disclaimerLabel')}</span>
                {t('onboarding.disclaimerText')}
              </p>
            </div>
          </div>
        </div>

        {/* Footer Text */}
        <div
          className={`absolute bottom-6 text-center px-4 transition-[opacity,transform] duration-700 ${step === 'language' ? 'opacity-100 translate-y-0 delay-700' : 'opacity-0 translate-y-4'
            }`}
        >
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400">{t('onboarding.footer')}</p>
        </div>
      </section>
    </main>
  )
}

export default App
