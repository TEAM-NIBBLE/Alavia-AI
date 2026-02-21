import { useEffect, useMemo, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import {
  Mic,
  Keyboard,
  Send,
  X,
  AlertTriangle,
  Activity,
  CheckCircle2,
  Volume2,
  ShieldCheck,
  User,
  Globe,
  ChevronDown,
  LogOut,
  Loader2,
  MicOff
} from 'lucide-react'
import alaviaLogo from '../assets/alavia-ai_logo.png'

type InputMode = 'tap' | 'hold'
type SessionStatus = 'ready' | 'listening' | 'processing'
type Severity = 'low' | 'medium' | 'high' | 'critical'
type MicPermission = 'unknown' | 'granted' | 'denied'

interface TriageQuestion {
  id: string
  question: string
}

interface AIResponse {
  heading: string
  summary: string
  severity?: Severity
}

// Speech Recognition Types
interface SpeechRecognitionAlternative {
  readonly transcript: string
  readonly confidence: number
}
interface SpeechRecognitionResult {
  readonly isFinal: boolean
  readonly length: number
  item(index: number): SpeechRecognitionAlternative
  [index: number]: SpeechRecognitionAlternative
}
interface SpeechRecognitionResultList {
  readonly length: number
  item(index: number): SpeechRecognitionResult
  [index: number]: SpeechRecognitionResult
}
interface SpeechRecognitionEvent extends Event {
  readonly resultIndex: number
  readonly results: SpeechRecognitionResultList
}
interface SpeechRecognitionErrorEvent extends Event {
  readonly error: string
}
interface SpeechRecognition extends EventTarget {
  continuous: boolean
  interimResults: boolean
  lang: string
  onresult: ((event: SpeechRecognitionEvent) => void) | null
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null
  onend: (() => void) | null
  start: () => void
  stop: () => void
}
interface SpeechRecognitionConstructor {
  new(): SpeechRecognition
}

const severityStyle: Record<Severity, { bg: string, text: string, border: string, icon: any }> = {
  low: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', icon: CheckCircle2 },
  medium: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', icon: Activity },
  high: { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200', icon: AlertTriangle },
  critical: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', icon: AlertTriangle },
}

interface VoiceInteractionScreenProps {
  userName?: string
  onLogout: () => void
  onLanguageChange: (code: any) => void
}

export default function VoiceInteractionScreen({ userName, onLogout, onLanguageChange }: VoiceInteractionScreenProps) {
  const { t, i18n } = useTranslation()
  const recognitionRef = useRef<SpeechRecognition | null>(null)
  const transcriptRef = useRef('')
  const interimRef = useRef('')
  const lastSpokenQuestionRef = useRef<string | null>(null)

  const [sessionStatus, setSessionStatus] = useState<SessionStatus>('ready')
  const [inputMode, setInputMode] = useState<InputMode>('tap')
  const [isListening, setIsListening] = useState(false)
  const [micPermission, setMicPermission] = useState<MicPermission>('unknown')
  const [transcript, setTranscript] = useState('')
  const [interimTranscript, setInterimTranscript] = useState('')
  const [aiResponse, setAIResponse] = useState<AIResponse | null>(null)
  const [answers, setAnswers] = useState<Record<string, boolean>>({})
  const [questionIndex, setQuestionIndex] = useState(0)
  const [showKeyboardPanel, setShowKeyboardPanel] = useState(false)
  const [showLanguagePanel, setShowLanguagePanel] = useState(false)
  const [showUserDropdown, setShowUserDropdown] = useState(false)
  const [isChangingLanguage, setIsChangingLanguage] = useState(false)
  const [textInput, setTextInput] = useState('')

  const selectedLanguage = (i18n.language || 'en').toLowerCase()

  const languages = [
    { code: 'en' },
    { code: 'pcm' },
    { code: 'yo' },
    { code: 'ha' },
    { code: 'ig' },
  ]

  const currentLanguageName = t(`language.${selectedLanguage}.name`)

  const TRIAGE_QUESTIONS: TriageQuestion[] = useMemo(() => [
    { id: 'breathing', question: t('voice.questions.breathing') },
    { id: 'fainting', question: t('voice.questions.fainting') },
    { id: 'worse', question: t('voice.questions.worse') },
    { id: 'weakness', question: t('voice.questions.weakness') },
  ], [t])

  const supportsSpeech = useMemo(() => {
    return typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)
  }, [])

  const activeQuestion = questionIndex < TRIAGE_QUESTIONS.length ? TRIAGE_QUESTIONS[questionIndex] : null

  const createAIResponse = (text: string, currentAnswers: Record<string, boolean>): AIResponse => {
    const transcriptText = text.toLowerCase()
    const redFlag =
      currentAnswers.breathing === true ||
      currentAnswers.fainting === true ||
      currentAnswers.weakness === true ||
      transcriptText.includes('cannot breathe') ||
      transcriptText.includes('chest pain')

    const worsening = currentAnswers.worse === true
    let severity: Severity = 'low'

    if (redFlag) {
      severity = 'critical'
    } else if (worsening) {
      severity = 'high'
    } else if (transcriptText.includes('pain') || transcriptText.includes('fever')) {
      severity = 'medium'
    }

    return {
      heading: t('voice.responseHeading'),
      summary: t(`voice.summaries.${severity}`),
      severity,
    }
  }

  const speakText = (text: string) => {
    if (!('speechSynthesis' in window)) return
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = selectedLanguage === 'pcm' ? 'en-NG' : `${selectedLanguage}-NG`
    utterance.rate = 1.0
    window.speechSynthesis.cancel()
    window.speechSynthesis.speak(utterance)
  }

  const triggerHaptics = (pattern: number | number[]) => {
    if ('vibrate' in navigator) {
      navigator.vibrate(pattern)
    }
  }

  const submitInputIntoFlow = (value: string, answersOverride?: Record<string, boolean>) => {
    const cleaned = value.trim()
    if (!cleaned) return

    setTranscript(cleaned)
    setInterimTranscript('')
    setSessionStatus('processing')

    setTimeout(() => {
      const nextResponse = createAIResponse(cleaned, answersOverride ?? answers)
      setAIResponse(nextResponse)
      setSessionStatus('ready')
      speakText(`${nextResponse.heading}. ${nextResponse.summary}`)
    }, 600)
  }

  const stopListening = () => {
    recognitionRef.current?.stop()
    triggerHaptics([10, 20, 10])
  }

  const startListening = async () => {
    if (!supportsSpeech) return
    if (isListening) return

    try {
      await navigator.mediaDevices.getUserMedia({ audio: true })
      setMicPermission('granted')
    } catch {
      setMicPermission('denied')
      return
    }

    setSessionStatus('listening')
    setInterimTranscript('')

    try {
      recognitionRef.current?.start()
    } catch (err) {
      console.error('Speech recognition start failed:', err)
      // If it fails because it's already started, we just continue
    }

    setIsListening(true)
    triggerHaptics(30)
  }

  const handleSpeakTap = () => {
    if (inputMode === 'hold') return
    if (isListening) {
      stopListening()
      return
    }
    void startListening()
  }

  const handleHoldStart = () => {
    if (inputMode !== 'hold') return
    void startListening()
  }

  const handleHoldEnd = () => {
    if (inputMode !== 'hold') return
    if (isListening) stopListening()
  }

  const answerQuestion = (value: boolean) => {
    if (!activeQuestion) return

    const nextAnswers = { ...answers, [activeQuestion.id]: value }
    setAnswers(nextAnswers)

    const nextIndex = questionIndex + 1
    setQuestionIndex(nextIndex)

    if (nextIndex < TRIAGE_QUESTIONS.length) {
      const nextUpdate = createAIResponse(transcript || interimTranscript || 'symptoms', nextAnswers)
      setAIResponse(nextUpdate)
      return
    }

    const finalResponse = createAIResponse(transcript || interimTranscript || 'symptoms', nextAnswers)
    setAIResponse(finalResponse)
    speakText(`${finalResponse.heading}. ${finalResponse.summary}`)
  }

  useEffect(() => {
    transcriptRef.current = transcript
  }, [transcript])

  useEffect(() => {
    interimRef.current = interimTranscript
  }, [interimTranscript])

  useEffect(() => {
    if (!supportsSpeech) return

    const speechWindow = window as any
    const SpeechRecognitionImpl = speechWindow.SpeechRecognition || speechWindow.webkitSpeechRecognition
    if (!SpeechRecognitionImpl) return

    const recognition = new SpeechRecognitionImpl()
    recognition.continuous = false
    recognition.interimResults = true
    recognition.lang = selectedLanguage === 'pcm' ? 'en-NG' : `${selectedLanguage}-NG`

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let finalChunk = ''
      let interim = ''

      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const result = event.results[i]
        const text = result[0]?.transcript ?? ''
        if (result.isFinal) {
          finalChunk += text
        } else {
          interim += text
        }
      }

      if (interim) setInterimTranscript(interim.trim())
      if (finalChunk.trim()) setTranscript((prev) => `${prev} ${finalChunk}`.trim())
    }

    recognition.onerror = () => {
      setIsListening(false)
      setSessionStatus('ready')
    }

    recognition.onend = () => {
      setIsListening(false)
      setSessionStatus('ready')

      const finalText = `${transcriptRef.current} ${interimRef.current}`.trim()
      if (finalText) {
        submitInputIntoFlow(finalText)
      }
    }

    recognitionRef.current = recognition

    return () => {
      recognition.stop()
      recognitionRef.current = null
    }
  }, [selectedLanguage, supportsSpeech])

  useEffect(() => {
    const queryPermission = async () => {
      if (!('permissions' in navigator)) return
      try {
        const status = await navigator.permissions.query({ name: 'microphone' as PermissionName })
        setMicPermission(status.state as MicPermission)
        status.onchange = () => setMicPermission(status.state as MicPermission)
      } catch {
        setMicPermission('unknown')
      }
    }
    void queryPermission()
  }, [])

  useEffect(() => {
    if (aiResponse && activeQuestion && lastSpokenQuestionRef.current !== activeQuestion.id) {
      lastSpokenQuestionRef.current = activeQuestion.id
      setTimeout(() => speakText(activeQuestion.question), 1000)
    }
  }, [activeQuestion, aiResponse])

  const currentTranscript = (interimTranscript || transcript).trim()

  return (
    <div className="min-h-screen bg-[#fdfdfd] text-slate-900 transition-all duration-500 text-base">
      {/* Global Loading Overlay for Language Change */}
      <AnimatePresence mode="wait">
        {isChangingLanguage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-white/80 backdrop-blur-md"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
              className="mb-4 text-emerald-600"
            >
              <Loader2 size={48} strokeWidth={2.5} />
            </motion.div>
            <p className="text-sm font-black uppercase tracking-[0.2em] text-emerald-700 animate-pulse">
              {t('onboarding.saving')}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="fixed inset-0 bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.03),transparent_40%),radial-gradient(circle_at_bottom_left,rgba(6,182,212,0.03),transparent_40%)] pointer-events-none" />

      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-white bg-white/60 backdrop-blur-2xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center gap-3 sm:gap-6">
            <motion.div
              whileHover={{ rotate: 5 }}
              className="relative"
            >
              <img src={alaviaLogo} alt="Alavia" className="h-11 w-11 rounded-2xl object-contain shadow-sm border border-slate-100" />
              <div className="absolute -bottom-1 -right-1 h-3.5 w-3.5 rounded-full border-2 border-white bg-emerald-500" />
            </motion.div>
            <div className="flex flex-col">
              <h1 className="hidden sm:block text-[10px] font-black uppercase tracking-[0.2em] text-emerald-600/80">Alavia AI</h1>
              <p className="text-lg sm:text-xl font-black text-slate-800 tracking-tight leading-none">
                {userName ? `Hi, ${userName.split(' ')[0]}` : t('voice.healthSession')}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                setShowLanguagePanel(true)
                setShowUserDropdown(false)
              }}
              title={currentLanguageName}
              className="group relative flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1.5 sm:px-4 sm:py-2 text-[10px] sm:text-[11px] font-black text-emerald-700 border border-emerald-500/20 hover:bg-emerald-500 hover:text-white transition-all duration-300"
            >
              <Globe size={13} className="group-hover:rotate-12 transition-transform" />
              <span>{selectedLanguage.toUpperCase()}</span>
              <ChevronDown size={10} className="opacity-50 hidden sm:block" />
            </motion.button>

            <motion.button
              whileTap={{ scale: 0.9 }}
              className="group rounded-full bg-red-500/5 p-2 sm:p-2.5 text-red-600 transition-all hover:bg-red-500 hover:text-white border border-red-500/10"
              title={t('voice.emergencyHelp')}
            >
              <AlertTriangle size={18} />
            </motion.button>

            <div className="relative">
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => {
                  setShowUserDropdown(!showUserDropdown)
                  setShowLanguagePanel(false)
                }}
                className={`flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full transition-all ${showUserDropdown
                  ? 'bg-slate-900 text-white shadow-lg'
                  : 'bg-slate-100 text-slate-600 border border-slate-200 hover:bg-white hover:shadow-md'
                  }`}
              >
                <User size={18} />
              </motion.button>

              <AnimatePresence>
                {showUserDropdown && (
                  <>
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="fixed inset-0 z-40 bg-transparent"
                      onClick={() => setShowUserDropdown(false)}
                    />
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: 10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: 10 }}
                      className="absolute right-0 mt-3 w-48 overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-2xl z-50 p-1.5"
                    >
                      <div className="px-4 py-3 border-b border-slate-50 mb-1">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-0.5">Logged in as</p>
                        <p className="text-sm font-bold text-slate-900 truncate">{userName || 'User'}</p>
                      </div>
                      <button
                        onClick={() => {
                          setShowUserDropdown(false)
                          onLogout()
                        }}
                        className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold text-red-600 transition-all hover:bg-red-50 active:bg-red-100"
                      >
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-500/10 text-red-600">
                          <LogOut size={16} />
                        </div>
                        {t('auth.logout')}
                      </button>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-xl px-6 pt-8 pb-32 relative z-10">
        <div className="flex flex-col items-center gap-10 text-center">

          {/* Status Badge */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex items-center gap-2 rounded-full px-5 py-2 text-[10px] font-black uppercase tracking-[0.2em] border shadow-sm transition-all duration-500 ${isListening
              ? 'bg-emerald-500 text-white border-emerald-400 shadow-emerald-200'
              : 'bg-white text-slate-400 border-slate-100'
              }`}
          >
            {!supportsSpeech && (
              <div className="flex items-center gap-2">
                <MicOff size={14} className="text-amber-500" />
                <span className="text-amber-600">Browser Unsupported</span>
              </div>
            )}
            {supportsSpeech && micPermission === 'denied' && (
              <div className="flex items-center gap-2">
                <MicOff size={14} className="text-red-500" />
                <span className="text-red-600">Mic Blocked</span>
              </div>
            )}
            {supportsSpeech && micPermission !== 'denied' && (
              <>
                {isListening ? (
                  <Activity size={14} className="animate-pulse" />
                ) : (
                  <ShieldCheck size={14} />
                )}
                {isListening ? t('voice.status.listening') : sessionStatus === 'processing' ? t('voice.status.processing') : t('voice.status.ready')}
              </>
            )}
          </motion.div>

          {/* Hero Section */}
          <section className="relative flex flex-col items-center gap-10">
            <div className="relative">
              <AnimatePresence>
                {isListening && (
                  <>
                    <motion.div
                      key="pulse-1"
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1.6, opacity: 1 }}
                      exit={{ scale: 2.2, opacity: 0 }}
                      transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
                      className="absolute inset-0 rounded-full bg-emerald-500/10"
                    />
                    <motion.div
                      key="pulse-2"
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 2.2, opacity: 1 }}
                      exit={{ scale: 3, opacity: 0 }}
                      transition={{ duration: 2.5, repeat: Infinity, ease: "easeOut", delay: 0.6 }}
                      className="absolute inset-0 rounded-full bg-emerald-500/5"
                    />
                  </>
                )}
              </AnimatePresence>

              <motion.button
                whileHover={{ scale: 1.05, translateY: -2 }}
                whileTap={{ scale: 0.94 }}
                onClick={handleSpeakTap}
                onMouseDown={handleHoldStart}
                onMouseUp={handleHoldEnd}
                onTouchStart={handleHoldStart}
                onTouchEnd={handleHoldEnd}
                className={`speak-button relative z-10 border-4 border-white ${micPermission === 'denied'
                  ? 'bg-red-50 text-red-500 border-red-200'
                  : isListening
                    ? 'is-live scale-110'
                    : 'bg-white text-slate-900 shadow-xl'
                  }`}
              >
                {micPermission === 'denied' ? (
                  <MicOff size={56} strokeWidth={2.5} />
                ) : (
                  <Mic size={56} strokeWidth={2.5} />
                )}
              </motion.button>

              <AnimatePresence>
                {isListening && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute -bottom-14 left-1/2 flex -translate-x-1/2 items-end gap-1.5 px-6 py-4 rounded-3xl bg-white/50 backdrop-blur-md border border-white"
                  >
                    {Array.from({ length: 15 }).map((_, i) => (
                      <motion.span
                        key={i}
                        className="wave-bar bg-emerald-500/80"
                        style={{ animationDelay: `${i * 80}ms` }}
                      />
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="space-y-2 max-w-xs">
              <motion.h2
                layout
                className="text-2xl sm:text-3xl font-black tracking-tight text-slate-800"
              >
                {isListening ? t('voice.listeningTitle') : t('voice.speakTitle')}
              </motion.h2>
              <motion.p
                layout
                className={`text-base font-bold leading-relaxed ${micPermission === 'denied' ? 'text-red-500' : 'text-slate-400'}`}
              >
                {micPermission === 'denied'
                  ? t('voice.micDisabledText')
                  : isListening
                    ? t('voice.listeningHint')
                    : t('voice.speakHint')}
              </motion.p>
            </div>
          </section>

          {/* Input Controls */}
          <section className="flex items-center gap-4">
            <div className="flex rounded-[20px] bg-white p-1 shadow-xl shadow-slate-200/50 border border-slate-50">
              <button
                onClick={() => setInputMode('tap')}
                className={`rounded-[15px] px-5 py-2 text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${inputMode === 'tap' ? 'bg-slate-900 text-white shadow-xl' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'
                  }`}
              >
                {t('voice.modeTap')}
              </button>
              <button
                onClick={() => setInputMode('hold')}
                className={`rounded-[15px] px-5 py-2 text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${inputMode === 'hold' ? 'bg-slate-900 text-white shadow-xl' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'
                  }`}
              >
                {t('voice.modeHold')}
              </button>
            </div>
          </section>

          {/* Results Area */}
          <div className="w-full space-y-10 text-left">
            <AnimatePresence mode="popLayout">
              {currentTranscript && (
                <motion.div
                  key="transcript"
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="triage-card p-6 border-none shadow-2xl shadow-slate-200/40 relative overflow-hidden"
                >
                  <div className="absolute top-0 left-0 w-2 h-full bg-slate-100" />
                  <label className="mb-2 block text-[9px] font-black uppercase tracking-[0.3em] text-slate-300">{t('voice.transcript')}</label>
                  <p className="text-xl font-bold leading-relaxed text-slate-800 tracking-tight">"{currentTranscript}"</p>
                </motion.div>
              )}

              {aiResponse && (
                <motion.div
                  key="ai-response"
                  initial={{ opacity: 0, scale: 0.95, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  className="triage-card border-none p-8 shadow-emerald-200/40 bg-gradient-to-br from-white to-emerald-50/30"
                >
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="text-2xl font-black text-slate-900 tracking-tighter">{aiResponse.heading}</h3>
                    {aiResponse.severity && (
                      <motion.span
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-[10px] font-black uppercase tracking-widest ${severityStyle[aiResponse.severity].bg} ${severityStyle[aiResponse.severity].text} border ${severityStyle[aiResponse.severity].border} shadow-sm
                      `}>
                        {(() => {
                          const SeverityIcon = severityStyle[aiResponse.severity!].icon
                          return <SeverityIcon size={12} strokeWidth={3} />
                        })()}
                        {aiResponse.severity}
                      </motion.span>
                    )}
                  </div>
                  <p className="text-xl font-bold leading-snug text-slate-600 mb-8 tracking-tight">{aiResponse.summary}</p>
                  <motion.button
                    whileHover={{ scale: 1.02, translateY: -2 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => speakText(`${aiResponse.heading}. ${aiResponse.summary}`)}
                    className="flex items-center gap-3 rounded-2xl bg-slate-900 px-6 py-4 text-xs font-black text-white shadow-2xl shadow-slate-900/20 transition-all active:scale-100 uppercase tracking-widest"
                  >
                    <Volume2 size={20} />
                    {t('voice.playAudio')}
                  </motion.button>
                </motion.div>
              )}

              {aiResponse && activeQuestion && (
                <motion.div
                  key={activeQuestion.id}
                  initial={{ opacity: 0, x: 40 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="triage-card bg-slate-900 p-8 text-white shadow-2xl shadow-slate-900/30 border-none relative overflow-hidden"
                >
                  <motion.div
                    animate={{
                      scale: [1, 1.1, 1],
                      opacity: [0.1, 0.2, 0.1]
                    }}
                    transition={{ duration: 4, repeat: Infinity }}
                    className="absolute -top-20 -right-20 h-64 w-64 rounded-full bg-emerald-500 blur-[80px]"
                  />

                  <div className="relative z-10">
                    <div className="mb-4 flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-400">{t('voice.triageQuestion')}</span>
                      <span className="rounded-full bg-white/10 px-3 py-1.5 text-[10px] font-bold text-white/80 backdrop-blur-sm border border-white/10">
                        {questionIndex + 1} of {TRIAGE_QUESTIONS.length}
                      </span>
                    </div>
                    <h4 className="text-2xl font-black leading-tight mb-8 tracking-tight text-emerald-400">
                      {activeQuestion.question}
                    </h4>
                    <div className="flex gap-4">
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => answerQuestion(true)}
                        className="flex-1 rounded-2xl bg-emerald-500 py-4 text-lg font-black text-white shadow-2xl shadow-emerald-500/30 transition-all hover:bg-emerald-400"
                      >
                        {t('voice.yes')}
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => answerQuestion(false)}
                        className="flex-1 rounded-2xl bg-white/10 py-4 text-lg font-black text-white border border-white/20 backdrop-blur-md hover:bg-white/20 transition-all"
                      >
                        {t('voice.no')}
                      </motion.button>
                    </div>

                    <button
                      onClick={handleSpeakTap}
                      className="mt-6 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-emerald-400 transition-colors"
                    >
                      <Mic size={14} />
                      {t('voice.speakAnswer')}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </main>

      {/* Action Buttons */}
      <div className="fixed bottom-20 right-4 z-40 flex flex-col gap-5">
        <motion.button
          whileHover={{ scale: 1.1, rotate: -5 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setShowKeyboardPanel(true)}
          className="flex h-16 w-16 items-center justify-center rounded-[24px] bg-white text-slate-800 shadow-2xl shadow-slate-200/80 transition-all border border-slate-50"
        >
          <Keyboard size={30} strokeWidth={2.5} />
        </motion.button>
      </div>

      {/* Keyboard Panel */}
      <AnimatePresence>
        {showLanguagePanel && (
          <div className="fixed inset-0 z-[110]">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowLanguagePanel(false)}
              className="absolute inset-0 bg-slate-900/10 backdrop-blur-[2px]"
            />
            <motion.section
              initial={{ scale: 0.95, opacity: 0, y: -20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: -20 }}
              className="absolute right-4 top-20 w-64 rounded-[24px] bg-white p-3 shadow-2xl border border-slate-100"
            >
              <div className="grid gap-1">
                {languages.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => {
                      if (lang.code === selectedLanguage) {
                        setShowLanguagePanel(false)
                        return
                      }
                      setIsChangingLanguage(true)
                      setTimeout(() => {
                        onLanguageChange(lang.code)
                        setIsChangingLanguage(false)
                        setShowLanguagePanel(false)
                      }, 800)
                    }}
                    className={`flex items-center justify-between rounded-xl px-4 py-3 text-sm font-bold transition-all ${selectedLanguage === lang.code
                      ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200'
                      : 'bg-white text-slate-600 hover:bg-slate-50'
                      }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`h-2 w-2 rounded-full ${selectedLanguage === lang.code ? 'bg-white' : 'bg-emerald-500'}`} />
                      <span>{t(`language.${lang.code}.name`)}</span>
                    </div>
                    {selectedLanguage === lang.code && <CheckCircle2 size={16} />}
                  </button>
                ))}
              </div>
            </motion.section>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showKeyboardPanel && (
          <div className="fixed inset-0 z-[100] flex items-end">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowKeyboardPanel(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-xl"
            />
            <motion.section
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 220 }}
              className="relative w-full rounded-t-[48px] bg-white p-12 pb-20 shadow-[0_-30px_60px_-15px_rgba(0,0,0,0.4)]"
            >
              <div className="mx-auto mb-10 h-1.5 w-20 rounded-full bg-slate-100" />
              <div className="mb-10 flex items-center justify-between px-2">
                <h3 className="text-3xl font-black text-slate-900 tracking-tight">{t('voice.typeSymptoms')}</h3>
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setShowKeyboardPanel(false)}
                  className="rounded-2xl bg-slate-50 p-4 text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors"
                >
                  <X size={28} />
                </motion.button>
              </div>
              <div className="flex gap-5">
                <div className="relative flex-1">
                  <input
                    autoFocus
                    placeholder={t('voice.inputPlaceholder')}
                    className="h-[80px] w-full rounded-3xl border-4 border-slate-50 bg-slate-50 px-8 text-2xl font-bold text-slate-900 outline-none transition-all placeholder:text-slate-300 focus:border-emerald-500/20 focus:bg-white focus:ring-4 focus:ring-emerald-500/5"
                    value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        submitInputIntoFlow(textInput)
                        setTextInput('')
                        setShowKeyboardPanel(false)
                      }
                    }}
                  />
                </div>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  disabled={!textInput.trim()}
                  onClick={() => {
                    submitInputIntoFlow(textInput)
                    setTextInput('')
                    setShowKeyboardPanel(false)
                  }}
                  className="flex h-[80px] w-24 items-center justify-center rounded-3xl bg-emerald-600 font-black text-white shadow-2xl shadow-emerald-200 transition-all hover:bg-emerald-700 disabled:opacity-40 disabled:grayscale"
                >
                  <Send size={32} />
                </motion.button>
              </div>
            </motion.section>
          </div>
        )}
      </AnimatePresence>

      {/* Footer */}
      <footer className="fixed bottom-0 left-0 right-0 z-30 border-t border-white/50 bg-white/40 py-5 backdrop-blur-xl">
        <div className="flex flex-col items-center justify-center gap-1.5">
          <p className="text-[9px] font-black uppercase tracking-[0.4em] text-slate-400">
            {t('voice.footer')}
          </p>
        </div>
      </footer>
    </div>
  )
}
