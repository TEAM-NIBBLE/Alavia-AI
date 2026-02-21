import { useState, useEffect } from 'react'
import alaviaLogo from './assets/alavia-ai_logo.png'
import './App.css'

type OnboardingStep = 'splash' | 'moving' | 'language'

function App() {
  const [step, setStep] = useState<OnboardingStep>('splash')

  useEffect(() => {
    // Phase 1: Stay at center for 3 seconds
    const timer = setTimeout(() => {
      setStep('moving')
    }, 3000)

    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (step === 'moving') {
      // Phase 2: After moving animation starts, show language selection shortly after
      const timer = setTimeout(() => {
        setStep('language')
      }, 800)
      return () => clearTimeout(timer)
    }
  }, [step])

  const languages = [
    { code: 'en', name: 'English', flag: '🇳🇬' },
    { code: 'pcm', name: 'Nigerian Pidgin', flag: '🇳🇬' },
    { code: 'yo', name: 'Yoruba', flag: '🇳🇬' },
    { code: 'ha', name: 'Hausa', flag: '🇳🇬' },
    { code: 'ig', name: 'Igbo', flag: '🇳🇬' },
  ]

  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen overflow-hidden bg-white">
      {/* Background Subtle Gradient */}
      <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-400 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-violet-400 blur-[120px]" />
      </div>

      {/* Main Container */}
      <div className={`flex flex-col items-center transition-all duration-1000 ease-in-out ${step !== 'splash' ? 'transform -translate-y-24 md:-translate-y-32' : 'transform translate-y-0'
        }`}>
        <div className="relative group">
          <img
            src={alaviaLogo}
            className={`transition-all duration-1000 ${step === 'splash' ? 'w-48 h-48 md:w-64 md:h-64' : 'w-24 h-24 md:w-32 md:h-32'
              } object-contain animate-in fade-in zoom-in duration-1000`}
            alt="Alavia AI Logo"
          />
        </div>

        <h1 className={`mt-6 font-bold tracking-tighter text-slate-900 transition-all duration-1000 ${step === 'splash' ? 'text-4xl md:text-6xl opacity-100' : 'text-2xl md:text-3xl opacity-80'
          } animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-200 fill-mode-both`}>
          ALAVIA AI
        </h1>
      </div>

      {/* Language Selection Part */}
      <div className={`mt-12 w-full max-w-sm px-6 transition-all duration-1000 ${step === 'language'
        ? 'opacity-100 translate-y-0'
        : 'opacity-0 translate-y-12 pointer-events-none'
        }`}>
        <div className="p-8 glass-card rounded-3xl">
          <h2 className="mb-6 text-xl font-semibold text-center text-slate-800">
            Select your language
          </h2>

          <div className="space-y-3">
            {languages.map((lang, index) => (
              <button
                key={lang.code}
                className={`language-btn animate-in fade-in slide-in-from-bottom-4 duration-500`}
                style={{ animationDelay: `${500 + (index * 100)}ms`, animationFillMode: 'both' }}
                onClick={() => console.log(`Selected: ${lang.code}`)}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{lang.flag}</span>
                  <span className="font-medium text-slate-700">{lang.name}</span>
                </div>
                <div className="w-5 h-5 rounded-full border-2 border-slate-200 group-hover:border-indigo-500" />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Footer Text */}
      <div className={`absolute bottom-8 text-slate-400 text-sm transition-opacity duration-1000 ${step === 'language' ? 'opacity-100' : 'opacity-0'
        }`}>
        Your multilingual voice first AI health assistant
      </div>
    </div>
  )
}

export default App
