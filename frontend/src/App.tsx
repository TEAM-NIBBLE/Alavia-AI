import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import alaviaLogo from './assets/alavia-ai_logo.png'
import SignUpPage from './components/SignUpPage'
import SignInPage from './components/SignInPage'
import VoiceInteractionScreen from './components/VoiceInteractionScreen'
import ProfilePage from './components/ProfilePage'
import './App.css'

type OnboardingStep = 'splash' | 'language' | 'signup' | 'signin' | 'app' | 'profile'
type LanguageCode = 'en' | 'pcm' | 'yo' | 'ha' | 'ig'

const languageCodes: LanguageCode[] = ['en', 'pcm', 'yo', 'ha', 'ig']

function App() {
  const { t, i18n } = useTranslation()
  const [step, setStep] = useState<OnboardingStep>(() => {
    const user = localStorage.getItem('alavia.user')
    return user ? 'app' : 'splash'
  })
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
      }, 700)
    }, 800)
  }

  const handleSignUpSuccess = (user: { name: string }) => {
    setUserName(user.name)
    setStep('app')
  }

  const handleSignInSuccess = () => {
    try {
      const stored = localStorage.getItem('alavia.user')
      if (stored) setUserName((JSON.parse(stored) as { name: string }).name)
    } catch { /* ignore */ }
    setStep('app')
  }

  const handleLogout = () => {
    localStorage.removeItem('alavia.user')
    setUserName('')
    setStep('language')
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
        onBack={() => { setIsSaved(false); setStep('language') }}
      />
    )
  }

  if (step === 'signin') {
    return (
      <SignInPage
        onSuccess={handleSignInSuccess}
        onSwitchToSignUp={() => setStep('signup')}
        onBack={() => { setIsSaved(false); setStep('language') }}
      />
    )
  }

  if (step === 'app') {
    return (
      <VoiceInteractionScreen
        userName={userName}
        onLogout={handleLogout}
        onLanguageChange={handleLanguageChange}
        onViewProfile={() => setStep('profile')}
      />
    )
  }

  if (step === 'profile') {
    return (
      <ProfilePage
        onBack={() => setStep('app')}
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

      <section className={`relative mx-auto flex min-h-screen w-full max-w-5xl flex-col items-center px-6 transition-all duration-1000 ease-in-out ${step === 'splash' ? 'justify-center py-12' : 'justify-start pt-16 pb-12'
        }`}>

        {/* Brand Container - Settles at the top with reduced size */}
        <div
          className={`flex flex-col items-center transition-all duration-1000 ease-in-out ${step === 'splash'
            ? 'scale-110 mb-0'
            : 'scale-90 mb-8 sm:mb-12'
            }`}
        >
          <div className="relative">
            <img
              src={alaviaLogo}
              className={`object-contain transition-all duration-1000 ring-offset-8 ring-emerald-100/30 rounded-full ${step === 'splash' ? 'h-32 w-32 md:h-48 md:w-48' : 'h-16 w-16 md:h-20 md:w-20'
                } animate-in zoom-in fade-in duration-1000`}
              alt="Alavia AI logo"
            />
            {step === 'splash' && (
              <div className="absolute -inset-4 bg-emerald-200/20 blur-2xl rounded-full -z-10 animate-pulse duration-[3000ms]" />
            )}
          </div>

          <h1
            className={`mt-4 text-center font-bold tracking-tight transition-all duration-1000 ${step === 'splash' ? 'text-4xl md:text-6xl text-slate-900' : 'text-xl md:text-2xl text-slate-800'
              } animate-in slide-in-from-bottom-4 fade-in duration-1000 delay-300 fill-mode-both`}
          >
            ALAVIA AI
          </h1>

          <p
            className={`text-center font-medium text-emerald-600 transition-all duration-1000 delay-500 ${step === 'splash' ? 'text-lg md:text-xl opacity-100 mt-3' : 'text-xs md:text-sm opacity-60 mt-1'
              } animate-in fade-in duration-1000`}
          >
            {t('onboarding.tagline')}
          </p>
        </div>

        {/* Language Selection Card */}
        <div
          className={`w-full max-w-xl transition-all duration-1000 ease-out ${step === 'language'
            ? 'translate-y-0 opacity-100'
            : 'translate-y-16 opacity-0 pointer-events-none'
            }`}
        >
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
          className={`absolute bottom-6 text-center px-4 transition-all duration-1000 ${step === 'language' ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}
        >
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400">{t('onboarding.footer')}</p>
        </div>
      </section>
    </main>
  )
}

export default App
