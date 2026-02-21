import { useEffect, useMemo, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import {
  Mic,
  Keyboard,
  Send,
  X,
  AlertTriangle,
  PhoneCall,
  MessageCircle,
  Activity,
  CheckCircle2,
  Volume2,
  ShieldCheck,
  User,
  Globe,
  ChevronDown,
  LogOut,
  Loader2,
  MicOff,
  UserCircle,
  Navigation,
  Map as MapIcon,
  HeartPulse,
} from 'lucide-react'
import alaviaLogo from '../assets/alavia-ai_logo.png'
import ProfilePage from './ProfilePage'
import { consultationsApi } from '../api/services'
import type { ConsultationDetailResponse } from '../api/services'

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

const severityStyle: Record<Severity, { bg: string, text: string, border: string, icon: any }> = {
  low: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', icon: CheckCircle2 },
  medium: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', icon: Activity },
  high: { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200', icon: AlertTriangle },
  critical: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', icon: AlertTriangle },
}

const DUMMY_HOSPITALS = [
  {
    id: 1,
    name: 'Lagoon Hospital',
    distance: '1.2km',
    type: 'Private',
    level: 'Specialist Hospital',
    emergency: 'Emergency Ready 24 hours',
    specialties: ['General Medicine', 'Emergency Medicine', 'Surgery', 'Cardiology'],
    tags: ['Has ICU', 'Has Pharmacy', 'Open 24 Hours', 'Has Ambulance'],
    coordinates: { x: 65, y: 40 }
  },
  {
    id: 2,
    name: 'Island Maternity Hospital',
    distance: '2.5km',
    type: 'Public',
    level: 'General Hospital',
    emergency: 'Emergency Ready 24 hours',
    specialties: ['Obstetrics and Gynecology', 'Pediatrics'],
    tags: ['Affordable', 'Open 24 Hours', 'Has Laboratory'],
    coordinates: { x: 35, y: 55 }
  }
]

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
  const shouldKeepListeningRef = useRef(false)
  const inputModeRef = useRef<InputMode>('tap')
  const silenceTimeoutRef = useRef<number | null>(null)
  const restartTimeoutRef = useRef<number | null>(null)
  const voicesRef = useRef<SpeechSynthesisVoice[]>([])
  const conversationModeRef = useRef<'voice' | 'keyboard' | null>(null)

  const [conversationMode, setConversationMode] = useState<'voice' | 'keyboard' | null>(null)
  const [sessionStatus, setSessionStatus] = useState<SessionStatus>('ready')
  const [inputMode, setInputMode] = useState<InputMode>('tap')
  const [isListening, setIsListening] = useState(false)
  const [micPermission, setMicPermission] = useState<MicPermission>('unknown')
  const [transcript, setTranscript] = useState('')
  const [interimTranscript, setInterimTranscript] = useState('')
  const [aiResponse, setAIResponse] = useState<AIResponse | null>(null)
  const consultationIdRef = useRef<number | null>(null)
  const [currentAIMessage, setCurrentAIMessage] = useState<string | null>(null)
  const [currentAIMessageSeq, setCurrentAIMessageSeq] = useState(0)
  const [consultationDetail, setConsultationDetail] = useState<ConsultationDetailResponse['consultation'] | null>(null)
  const [consultationComplete, setConsultationComplete] = useState(false)
  const consultationCompleteRef = useRef(false)
  const [apiError, setApiError] = useState<string | null>(null)
  const [showKeyboardPanel, setShowKeyboardPanel] = useState(false)
  const [showLanguagePanel, setShowLanguagePanel] = useState(false)
  const [showUserDropdown, setShowUserDropdown] = useState(false)
  const [showProfile, setShowProfile] = useState(false)
  const [isEmergencyMode, setIsEmergencyMode] = useState(false)
  const [showEmergencyPanel, setShowEmergencyPanel] = useState(false)
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

  const supportsSpeech = useMemo(() => {
    return typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)
  }, [])

  const activeQuestion: TriageQuestion | null = currentAIMessage && !consultationComplete
    ? { id: String(currentAIMessageSeq), question: currentAIMessage }
    : null

  const speakText = (text: string, onEnd?: () => void) => {
    if (!('speechSynthesis' in window)) {
      onEnd?.()
      return
    }

    // Map app language codes → BCP47 tags (priority order per language)
    const LANG_BCP47: Record<string, string[]> = {
      en:  ['en-NG', 'en-GB', 'en-US', 'en'],
      pcm: ['en-NG', 'en-GB', 'en-US', 'en'],   // Nigerian Pidgin – closest TTS is NG English
      yo:  ['yo', 'yo-NG', 'en-NG', 'en'],        // Yoruba (rare – falls back to NG English)
      ha:  ['ha', 'ha-NE', 'en-NG', 'en'],        // Hausa
      ig:  ['ig', 'ig-NG', 'en-NG', 'en'],        // Igbo
    }
    const bcp47List = LANG_BCP47[selectedLanguage] ?? ['en-NG', 'en']

    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = bcp47List[0]   // primary preference
    utterance.rate = 0.95
    utterance.pitch = 1.1           // warmer female pitch

    // Female voice name fragments
    const FEMALE_NAMES = [
      'zira', 'samantha', 'victoria', 'karen', 'fiona', 'susan', 'moira',
      'veena', 'tessa', 'female', 'woman', 'serena', 'siri', 'ava', 'allison',
      'joanna', 'ivy', 'kimberly', 'kendra', 'salli', 'olivia', 'aria', 'hazel',
    ]
    const isFemale = (v: SpeechSynthesisVoice) =>
      FEMALE_NAMES.some(n => v.name.toLowerCase().includes(n))

    const voices = voicesRef.current
    let chosen: SpeechSynthesisVoice | undefined

    // 1. Female voice matching any of the preferred BCP47 tags (in priority order)
    for (const tag of bcp47List) {
      chosen = voices.find(v => isFemale(v) && v.lang.startsWith(tag.split('-')[0]))
      if (chosen) break
    }
    // 2. Any voice (not necessarily female) matching the language
    if (!chosen) {
      for (const tag of bcp47List) {
        chosen = voices.find(v => v.lang.startsWith(tag.split('-')[0]))
        if (chosen) break
      }
    }
    // 3. Any female English voice as last resort
    if (!chosen) chosen = voices.find(v => isFemale(v) && v.lang.startsWith('en'))

    if (chosen) utterance.voice = chosen

    if (onEnd) utterance.onend = onEnd
    window.speechSynthesis.cancel()
    window.speechSynthesis.speak(utterance)
  }

  const triggerHaptics = (pattern: number | number[]) => {
    if ('vibrate' in navigator) {
      navigator.vibrate(pattern)
    }
  }

  const getEmergencyContactPhone = () => {
    try {
      const profileRaw = localStorage.getItem('alavia.profileSettings')
      if (profileRaw) {
        const profile = JSON.parse(profileRaw) as { emergencyPhone?: string }
        if (profile.emergencyPhone?.trim()) return profile.emergencyPhone.trim()
      }
    } catch {
      // ignore malformed local storage
    }

    try {
      const userRaw = localStorage.getItem('alavia.user')
      if (userRaw) {
        const user = JSON.parse(userRaw) as { emergency_contact_phone?: string; phone?: string }
        if (user.emergency_contact_phone?.trim()) return user.emergency_contact_phone.trim()
        if (user.phone?.trim()) return user.phone.trim()
      }
    } catch {
      // ignore malformed local storage
    }

    return '112'
  }

  const activateEmergencyMode = () => {
    setIsEmergencyMode(true)
    setShowEmergencyPanel(true)
    stopListening()
    speakText('Emergency mode activated. Call or send SMS to your emergency contact now.')
  }

  const handleEmergencyCall = () => {
    const phone = getEmergencyContactPhone()
    window.location.href = `tel:${phone}`
  }

  const handleEmergencySms = () => {
    const phone = getEmergencyContactPhone()
    const emergencyMessage = encodeURIComponent('ALAVIA AI emergency request. Please assist immediately.')
    window.location.href = `sms:${phone}?body=${emergencyMessage}`
  }

  const updateConsultationId = (id: number | null) => {
    consultationIdRef.current = id
  }

  const updateConsultationComplete = (v: boolean) => {
    consultationCompleteRef.current = v
    setConsultationComplete(v)
  }

  // Language name sent to backend so the AI replies in the correct language
  const LANG_NAMES: Record<string, string> = {
    en:  'English',
    pcm: 'Nigerian Pidgin English',
    yo:  'Yoruba',
    ha:  'Hausa',
    ig:  'Igbo',
  }

  // Instruction prepended to every message so the AI model always responds
  // in the correct language, regardless of backend language field support.
  const langInstruction = (langName: string) =>
    selectedLanguage === 'en'
      ? ''  // no prefix needed for English
      : `[SYSTEM: You MUST respond ONLY in ${langName}. Do NOT use English in your response. The user speaks ${langName}.] `

  const startConsultation = (message: string) => {
    console.debug('[VoiceInteraction] startConsultation called', { message, mode: conversationModeRef.current })
    setSessionStatus('processing')
    setApiError(null)
    const langName = LANG_NAMES[selectedLanguage] ?? 'English'
    const prefixed = langInstruction(langName) + message
    void (async () => {
      try {
        const res = await consultationsApi.start(prefixed, langName)
        console.debug('[VoiceInteraction] consultationsApi.start response', res)
        const id = res.consultation_id
        updateConsultationId(id)
        setCurrentAIMessage(res.message.content)
        setCurrentAIMessageSeq(1)
        setAIResponse({ heading: t('voice.responseHeading'), summary: message })
        speakText(res.message.content)
      } catch (err) {
        setApiError(err instanceof Error ? err.message : 'Request failed')
      } finally {
        setSessionStatus('ready')
      }
    })()
  }

  const sendConsultationMessage = async (content: string) => {
    const id = consultationIdRef.current
    console.debug('[VoiceInteraction] sendConsultationMessage called', { content, id, mode: conversationModeRef.current })
    if (!id) {
      console.warn('[VoiceInteraction] sendConsultationMessage aborted — no consultation id')
      return
    }
    setSessionStatus('processing')
    setApiError(null)
    const langName = LANG_NAMES[selectedLanguage] ?? 'English'
    // Keep reminding the AI of the language on every turn
    const prefixed = langInstruction(langName) + content
    try {
      const res = await consultationsApi.message(id, prefixed, langName)
      console.debug('[VoiceInteraction] consultationsApi.message response', res)
      setCurrentAIMessage(res.message.content)
      setCurrentAIMessageSeq(prev => prev + 1)
      if (res.severity) {
        setAIResponse(prev => prev ? { ...prev, severity: res.severity as Severity } : prev)
      }
      if (res.status === 'complete' || res.status === 'closed' || res.status === 'ended') {
        updateConsultationComplete(true)
        try {
          const detail = await consultationsApi.detail(id)
          setConsultationDetail(detail.consultation)
          if (detail.consultation.severity) {
            const sev = detail.consultation.severity as Severity
            setAIResponse(prev => prev ? { ...prev, severity: sev } : prev)
          }
        } catch {
          // detail fetch failed — first aid will be empty
        }
      } else {
        speakText(res.message.content)
      }
    } catch (err) {
      setApiError(err instanceof Error ? err.message : 'Request failed')
    } finally {
      setSessionStatus('ready')
    }
  }

  const submitInputIntoFlow = (value: string, source: 'voice' | 'keyboard' = 'voice') => {
    const cleaned = value.trim()
    if (!cleaned) return
    if (source === 'voice') {
      setTranscript(cleaned)
    } else {
      setTranscript('')
    }
    setInterimTranscript('')
    const currentId = consultationIdRef.current
    const isComplete = consultationCompleteRef.current
    if (currentId && !isComplete) {
      void sendConsultationMessage(cleaned)
    } else {
      if (isComplete) {
        updateConsultationId(null)
        setCurrentAIMessage(null)
        setCurrentAIMessageSeq(0)
        setConsultationDetail(null)
        updateConsultationComplete(false)
        setAIResponse(null)
        setApiError(null)
      }
      conversationModeRef.current = source
      setConversationMode(source)
      startConsultation(cleaned)
    }
  }

  const clearSpeechTimers = () => {
    if (silenceTimeoutRef.current !== null) {
      window.clearTimeout(silenceTimeoutRef.current)
      silenceTimeoutRef.current = null
    }
    if (restartTimeoutRef.current !== null) {
      window.clearTimeout(restartTimeoutRef.current)
      restartTimeoutRef.current = null
    }
  }

  const queueInactivityStop = () => {
    if (inputModeRef.current !== 'tap') return
    if (!shouldKeepListeningRef.current) return

    // Keep tap-to-speak stable for slower speakers; avoid abrupt stop mid-sentence.
    if (silenceTimeoutRef.current !== null) {
      window.clearTimeout(silenceTimeoutRef.current)
    }

    silenceTimeoutRef.current = window.setTimeout(() => {
      if (shouldKeepListeningRef.current && inputModeRef.current === 'tap') {
        stopListening()
      }
    }, 9000)
  }

  const finalizeCurrentTranscript = () => {
    const finalText = `${transcriptRef.current} ${interimRef.current}`.trim()
    if (!finalText) return
    submitInputIntoFlow(finalText, 'voice')
  }

  const stopListening = () => {
    shouldKeepListeningRef.current = false
    clearSpeechTimers()
    recognitionRef.current?.stop()
    setIsListening(false)
    setSessionStatus('ready')
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

    shouldKeepListeningRef.current = true
    clearSpeechTimers()
    setTranscript('')
    setSessionStatus('listening')
    setInterimTranscript('')
    transcriptRef.current = ''
    interimRef.current = ''

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

  useEffect(() => {
    transcriptRef.current = transcript
  }, [transcript])

  useEffect(() => {
    interimRef.current = interimTranscript
  }, [interimTranscript])

  useEffect(() => {
    inputModeRef.current = inputMode
  }, [inputMode])

  useEffect(() => {
    if (!supportsSpeech) return

    const speechWindow = window as any
    const SpeechRecognitionImpl = speechWindow.SpeechRecognition || speechWindow.webkitSpeechRecognition
    if (!SpeechRecognitionImpl) return

    const recognition = new SpeechRecognitionImpl()
    recognition.continuous = true
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
      queueInactivityStop()
    }

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      const shouldContinue = shouldKeepListeningRef.current && inputModeRef.current === 'tap'
      const transientError = event.error === 'no-speech' || event.error === 'aborted'

      if (shouldContinue && transientError) {
        restartTimeoutRef.current = window.setTimeout(() => {
          if (!shouldKeepListeningRef.current || inputModeRef.current !== 'tap') return
          try {
            recognitionRef.current?.start()
            setIsListening(true)
            setSessionStatus('listening')
          } catch {
            // Browser can throw if recognition is already active.
          }
        }, 150)
        return
      }

      shouldKeepListeningRef.current = false
      clearSpeechTimers()
      setIsListening(false)
      setSessionStatus('ready')
    }

    recognition.onend = () => {
      const shouldContinue = shouldKeepListeningRef.current && inputModeRef.current === 'tap'
      setIsListening(false)

      if (shouldContinue) {
        restartTimeoutRef.current = window.setTimeout(() => {
          if (!shouldKeepListeningRef.current || inputModeRef.current !== 'tap') return
          try {
            recognitionRef.current?.start()
            setIsListening(true)
            setSessionStatus('listening')
          } catch {
            // Safe no-op: browser can throw if restart collides with lifecycle.
          }
        }, 120)
        return
      }

      clearSpeechTimers()
      setSessionStatus('ready')
      finalizeCurrentTranscript()
    }

    recognitionRef.current = recognition

    return () => {
      shouldKeepListeningRef.current = false
      clearSpeechTimers()
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

  // Load TTS voices (browsers fire voiceschanged when the list is ready)
  useEffect(() => {
    if (!('speechSynthesis' in window)) return
    const loadVoices = () => {
      voicesRef.current = window.speechSynthesis.getVoices()
    }
    loadVoices()
    window.speechSynthesis.addEventListener('voiceschanged', loadVoices)
    return () => window.speechSynthesis.removeEventListener('voiceschanged', loadVoices)
  }, [])

  useEffect(() => {
    if (aiResponse && activeQuestion && lastSpokenQuestionRef.current !== activeQuestion.id) {
      lastSpokenQuestionRef.current = activeQuestion.id
      if (conversationModeRef.current === 'keyboard') {
        // keyboard mode: speak question then reopen keyboard panel
        setTimeout(() => {
          speakText(activeQuestion.question)
          setShowKeyboardPanel(true)
        }, 800)
      } else {
        // voice mode: speak question then auto-start mic
        setTimeout(() => {
          speakText(activeQuestion.question, () => {
            void startListening()
          })
        }, 800)
      }
    }
  }, [activeQuestion, aiResponse])

  const currentTranscript = (interimTranscript || transcript).trim()

  return (
    <div className={`min-h-screen text-slate-900 transition-all duration-500 text-base ${isEmergencyMode ? 'bg-red-50' : 'bg-[#fdfdfd]'}`}>
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

      <div className={`fixed inset-0 pointer-events-none ${isEmergencyMode
        ? 'bg-[radial-gradient(circle_at_top_right,rgba(239,68,68,0.12),transparent_45%),radial-gradient(circle_at_bottom_left,rgba(220,38,38,0.08),transparent_45%)]'
        : 'bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.03),transparent_40%),radial-gradient(circle_at_bottom_left,rgba(6,182,212,0.03),transparent_40%)]'
        }`} />

      {/* Header */}
      <header className={`sticky top-0 z-30 border-b backdrop-blur-2xl ${isEmergencyMode ? 'border-red-100 bg-red-50/90' : 'border-white bg-white/60'}`}>
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center gap-3 sm:gap-6">
            <motion.div
              whileHover={{ rotate: 5 }}
              className="relative"
            >
              <img src={alaviaLogo} alt="Alavia" className="h-11 w-11 rounded-2xl object-contain shadow-sm border border-slate-100" />
              <div className={`absolute -bottom-1 -right-1 h-3.5 w-3.5 rounded-full border-2 border-white ${isEmergencyMode ? 'bg-red-600' : 'bg-emerald-500'}`} />
            </motion.div>
            <div className="flex flex-col">
              <h1 className={`hidden sm:block text-[10px] font-black uppercase tracking-[0.2em] ${isEmergencyMode ? 'text-red-700' : 'text-emerald-600/80'}`}>Alavia AI</h1>
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
              onClick={activateEmergencyMode}
              className={`group rounded-full p-2 sm:p-2.5 transition-all border ${isEmergencyMode
                ? 'bg-red-600 text-white border-red-700'
                : 'bg-red-500/5 text-red-600 hover:bg-red-500 hover:text-white border-red-500/10'
                }`}
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
            </div>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {isEmergencyMode && (
          <motion.section
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="sticky top-[72px] z-20 mx-auto mt-2 w-[95%] max-w-xl rounded-2xl border border-red-200 bg-red-100 px-4 py-3"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-red-800">
                <AlertTriangle size={18} />
                <p className="text-sm font-black">Emergency Mode Active</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsEmergencyMode(false)
                  setShowEmergencyPanel(false)
                }}
                className="min-h-12 rounded-xl border border-red-300 bg-white px-4 text-xs font-bold uppercase tracking-wide text-red-700"
              >
                Exit mode
              </button>
            </div>
            {showEmergencyPanel && (
              <div className="mt-3 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={handleEmergencyCall}
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-red-700 px-3 text-sm font-bold text-white"
                >
                  <PhoneCall size={16} />
                  <span>Call contact</span>
                </button>
                <button
                  type="button"
                  onClick={handleEmergencySms}
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-red-300 bg-white px-3 text-sm font-bold text-red-700"
                >
                  <MessageCircle size={16} />
                  <span>SMS contact</span>
                </button>
              </div>
            )}
          </motion.section>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="mx-auto max-w-xl px-6 pt-8 pb-32 relative z-10">
        <div className="flex flex-col items-center gap-10 text-center">

          {/* Status Badge */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex items-center gap-2 rounded-full px-5 py-2 text-[10px] font-black uppercase tracking-[0.2em] border shadow-sm transition-all duration-500 ${isListening
              ? isEmergencyMode
                ? 'bg-red-600 text-white border-red-500 shadow-red-200'
                : 'bg-emerald-500 text-white border-emerald-400 shadow-emerald-200'
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
                      className={`absolute inset-0 rounded-full ${isEmergencyMode ? 'bg-red-500/15' : 'bg-emerald-500/10'}`}
                    />
                    <motion.div
                      key="pulse-2"
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 2.2, opacity: 1 }}
                      exit={{ scale: 3, opacity: 0 }}
                      transition={{ duration: 2.5, repeat: Infinity, ease: "easeOut", delay: 0.6 }}
                      className={`absolute inset-0 rounded-full ${isEmergencyMode ? 'bg-red-500/10' : 'bg-emerald-500/5'}`}
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
                        className={`wave-bar ${isEmergencyMode ? 'bg-red-500/90' : 'bg-emerald-500/80'}`}
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

              {apiError && (
                <motion.div
                  key="api-error"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  className="triage-card p-5 border border-red-200 bg-red-50 text-sm font-bold text-red-600 relative overflow-hidden"
                >
                  <div className="absolute top-0 left-0 w-2 h-full bg-red-400" />
                  <p className="pl-2">{apiError}</p>
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
                    onClick={() => speakText(currentAIMessage ?? `${aiResponse.heading}. ${aiResponse.summary}`)}
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
                        {t('voice.triageQuestion')}
                      </span>
                    </div>
                    <h4 className="text-2xl font-black leading-tight mb-8 tracking-tight text-emerald-400">
                      {activeQuestion.question}
                    </h4>

                    {/* Response indicator — keyboard or mic depending on conversation mode */}
                    {conversationMode === 'keyboard' ? (
                      <div
                        onClick={() => setShowKeyboardPanel(true)}
                        className={`flex items-center gap-3 rounded-2xl px-5 py-4 transition-all cursor-pointer ${
                          showKeyboardPanel
                            ? 'bg-emerald-500/20 border border-emerald-500/40'
                            : sessionStatus === 'processing'
                              ? 'bg-white/5 border border-white/10'
                              : 'bg-white/10 border border-white/20 hover:bg-white/15'
                        }`}
                      >
                        <motion.div
                          animate={showKeyboardPanel ? { scale: [1, 1.15, 1] } : {}}
                          transition={{ repeat: Infinity, duration: 1.4 }}
                        >
                          {sessionStatus === 'processing'
                            ? <Loader2 size={18} className="animate-spin text-white/40" />
                            : <Keyboard size={18} className={showKeyboardPanel ? 'text-emerald-400' : 'text-white/30'} />
                          }
                        </motion.div>
                        <span className={`flex-1 text-sm font-bold truncate ${
                          showKeyboardPanel && textInput ? 'text-white' : showKeyboardPanel ? 'text-emerald-300' : 'text-white/40'
                        }`}>
                          {sessionStatus === 'processing'
                            ? t('voice.status.processing')
                            : showKeyboardPanel && textInput
                              ? textInput
                              : showKeyboardPanel
                                ? t('voice.inputPlaceholder')
                                : t('voice.typeSymptoms')
                          }
                        </span>
                        {showKeyboardPanel && textInput && (
                          <div className="flex items-end gap-0.5">
                            {[0, 1, 2].map(i => (
                              <motion.span
                                key={i}
                                className="w-1 rounded-full bg-emerald-400"
                                animate={{ height: ['4px', '14px', '4px'] }}
                                transition={{ repeat: Infinity, duration: 0.6, delay: i * 0.18 }}
                                style={{ display: 'inline-block' }}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    ) : (
                    <div className={`flex items-center gap-3 rounded-2xl px-5 py-4 transition-all ${
                      isListening
                        ? 'bg-emerald-500/20 border border-emerald-500/40'
                        : sessionStatus === 'processing'
                          ? 'bg-white/5 border border-white/10'
                          : 'bg-white/10 border border-white/20'
                    }`}>
                      <motion.div
                        animate={isListening ? { scale: [1, 1.25, 1] } : {}}
                        transition={{ repeat: Infinity, duration: 1.2 }}
                      >
                        {sessionStatus === 'processing'
                          ? <Loader2 size={18} className="animate-spin text-white/40" />
                          : isListening
                            ? <Mic size={18} className="text-emerald-400" />
                            : <MicOff size={18} className="text-white/30" />
                        }
                      </motion.div>
                      <span className={`flex-1 text-sm font-bold ${
                        isListening ? 'text-emerald-300' : 'text-white/40'
                      }`}>
                        {sessionStatus === 'processing'
                          ? t('voice.status.processing')
                          : isListening
                            ? t('voice.status.listening')
                            : t('voice.listeningHint')
                        }
                      </span>
                      {isListening && (
                        <div className="flex items-end gap-0.5">
                          {[0, 1, 2, 3].map(i => (
                            <motion.span
                              key={i}
                              className="w-1 rounded-full bg-emerald-400"
                              animate={{ height: ['5px', '16px', '5px'] }}
                              transition={{ repeat: Infinity, duration: 0.7, delay: i * 0.15 }}
                              style={{ display: 'inline-block' }}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                    )}

                    <p className="mt-4 text-center text-[10px] font-black uppercase tracking-widest text-white/20">
                      {t('voice.typeSymptoms')}
                    </p>
                  </div>
                </motion.div>
              )}

              {consultationComplete && (
                <motion.div
                  initial={{ opacity: 0, y: 40 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6"
                >
                  {/* First Aid Section */}
                  <div className="rounded-[32px] bg-white p-6 sm:p-8 shadow-2xl shadow-slate-200/50 border border-slate-50">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-500 text-white shadow-lg shadow-emerald-200">
                        <Activity size={20} />
                      </div>
                      <h3 className="text-xl font-black text-slate-800 tracking-tight">{t('voice.firstAidTitle')}</h3>
                    </div>
                    <div className="space-y-4">
                      {(consultationDetail?.first_aid ?? []).map((step, idx) => (
                        <motion.div
                          key={idx}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.1 }}
                          className="flex items-start gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100/50"
                        >
                          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-900 text-[10px] font-black text-white">
                            {idx + 1}
                          </span>
                          <p className="text-sm font-bold text-slate-600 leading-relaxed">{step}</p>
                        </motion.div>
                      ))}
                    </div>
                  </div>

                  {/* Hospital Routing Section */}
                  <div className="rounded-[32px] bg-slate-900 p-8 shadow-2xl shadow-slate-900/20 text-white overflow-hidden relative">
                    <motion.div
                      animate={{
                        scale: [1, 1.2, 1],
                        opacity: [0.1, 0.2, 0.1]
                      }}
                      transition={{ duration: 5, repeat: Infinity }}
                      className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-emerald-500 blur-[80px]"
                    />

                    <div className="relative z-10">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="text-2xl font-black mb-1 tracking-tight">{t('voice.routingTitle')}</h3>
                          <p className="text-sm font-bold text-white/50">{t('voice.routingDesc')}</p>
                        </div>
                        <div className="h-12 w-12 rounded-2xl bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30">
                          <MapIcon size={24} className="text-emerald-400" />
                        </div>
                      </div>

                      {/* Map Preview Interface */}
                      <div className="relative mb-8 h-48 w-full overflow-hidden rounded-[28px] bg-slate-800 border border-white/5">
                        {/* Stylized Map SVG/Background */}
                        <div className="absolute inset-0 opacity-20">
                          <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
                            <path d="M0,20 L100,20 M0,50 L100,50 M0,80 L100,80 M30,0 L30,100 M70,0 L70,100" stroke="white" strokeWidth="0.5" fill="none" />
                            <circle cx="50" cy="50" r="40" stroke="white" strokeWidth="0.2" fill="none" />
                          </svg>
                        </div>

                        {/* Pulsing User Location */}
                        <motion.div
                          animate={{ scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }}
                          transition={{ duration: 2, repeat: Infinity }}
                          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-4 w-4 rounded-full bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.8)] border-2 border-white z-10"
                        />

                        {/* Hospital Markers */}
                        {DUMMY_HOSPITALS.map((h) => (
                          <motion.div
                            key={h.id}
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            style={{ left: `${h.coordinates.x}%`, top: `${h.coordinates.y}%` }}
                            className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center"
                          >
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500 text-white shadow-lg border-2 border-slate-900">
                              <HeartPulse size={14} />
                            </div>
                            <div className="mt-1 rounded-md bg-slate-900/80 px-1.5 py-0.5 backdrop-blur-sm border border-white/10">
                              <span className="text-[7px] font-black uppercase whitespace-nowrap">{h.name.split(' ')[0]}</span>
                            </div>
                          </motion.div>
                        ))}
                      </div>

                      <div className="space-y-4">
                        {DUMMY_HOSPITALS.map((hospital, idx) => (
                          <motion.div
                            key={idx}
                            whileHover={{ y: -4 }}
                            className="group flex flex-col p-5 rounded-[28px] bg-white/5 border border-white/10 hover:bg-white/10 transition-all cursor-pointer"
                          >
                            <div className="flex items-start justify-between mb-4">
                              <div className="flex items-center gap-4">
                                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500 text-white shadow-lg shadow-emerald-500/20">
                                  <Navigation size={20} />
                                </div>
                                <div>
                                  <h5 className="font-black text-base text-white tracking-tight leading-tight">{hospital.name}</h5>
                                  <div className="flex items-center gap-3 text-[10px] font-bold text-emerald-400 mt-1">
                                    <span className="flex items-center gap-1 uppercase tracking-wider">{hospital.type}</span>
                                    <span className="h-1 w-1 rounded-full bg-white/20" />
                                    <span className="flex items-center gap-1">{hospital.distance} away</span>
                                  </div>
                                </div>
                              </div>
                              <div className="rounded-full bg-emerald-500/10 px-3 py-1 text-[8px] font-black text-emerald-400 border border-emerald-500/20 uppercase">
                                {hospital.level}
                              </div>
                            </div>

                            <div className="flex flex-wrap gap-2 mb-4">
                              {hospital.specialties.slice(0, 3).map((s, i) => (
                                <span key={i} className="text-[9px] font-bold text-white/60 bg-white/5 px-2.5 py-1 rounded-lg border border-white/5">{s}</span>
                              ))}
                              {hospital.specialties.length > 3 && (
                                <span className="text-[9px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-lg">+{hospital.specialties.length - 3} more</span>
                              )}
                            </div>

                            <div className="grid grid-cols-2 gap-2 mt-auto">
                              {hospital.tags.map((tag, i) => (
                                <div key={i} className="flex items-center gap-2 text-[9px] font-bold text-white/40">
                                  <div className="h-1 w-1 rounded-full bg-emerald-500" />
                                  {tag}
                                </div>
                              ))}
                            </div>
                          </motion.div>
                        ))}
                      </div>

                      <button className="w-full mt-8 flex items-center justify-center gap-3 rounded-2xl bg-emerald-500 py-5 text-xs font-black text-white shadow-2xl shadow-emerald-500/40 transition-all hover:bg-emerald-400 uppercase tracking-widest border border-emerald-400/20">
                        <MapIcon size={18} />
                        <span>Navigate in Full Maps</span>
                      </button>
                    </div>
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
        {showUserDropdown && (
          <div className="fixed inset-0 z-[110]">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/10 backdrop-blur-[2px]"
              onClick={() => setShowUserDropdown(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              className="absolute right-4 top-20 w-56 overflow-hidden rounded-[24px] bg-white p-2 shadow-2xl border border-slate-100"
            >
              <div className="px-4 py-4 border-b border-slate-50 mb-1">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Logged in as</p>
                <p className="text-sm font-black text-slate-900 truncate">{userName || 'User'}</p>
              </div>

              <button
                onClick={() => {
                  setShowUserDropdown(false)
                  setShowProfile(true)
                }}
                className="flex w-full items-center gap-3 rounded-xl px-4 py-4 text-sm font-bold text-slate-700 transition-all hover:bg-slate-50 active:bg-slate-100"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
                  <UserCircle size={18} />
                </div>
                {t('auth.profile')}
              </button>

              <button
                onClick={() => {
                  setShowUserDropdown(false)
                  onLogout()
                }}
                className="flex w-full items-center gap-3 rounded-xl px-4 py-4 text-sm font-bold text-red-600 transition-all hover:bg-red-50 active:bg-red-100"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-500/10 text-red-600">
                  <LogOut size={18} />
                </div>
                {t('auth.logout')}
              </button>
            </motion.div>
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
                        submitInputIntoFlow(textInput, 'keyboard')
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
                    submitInputIntoFlow(textInput, 'keyboard')
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

      <AnimatePresence>
        {showProfile && (
          <motion.div
            initial={{ opacity: 0, x: '100%' }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-0 z-[150] overflow-y-auto"
          >
            <ProfilePage
              onBack={() => setShowProfile(false)}
              onLogout={() => {
                setShowProfile(false)
                onLogout()
              }}
              onLanguageChange={(code: string) => {
                onLanguageChange(code)
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
