import { useEffect, useMemo, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import {
  Mic,
  Keyboard,
  Send,
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
import { consultationsApi, hospitalsApi, speechApi } from '../api/services'
import type { ConsultationDetailResponse, HospitalListItem } from '../api/services'

type InputMode = 'tap' | 'hold'
type SessionStatus = 'ready' | 'listening' | 'processing'
type Severity = 'low' | 'medium' | 'high' | 'critical'
type MicPermission = 'unknown' | 'granted' | 'denied'
type LanguageCode = 'en' | 'pcm' | 'yo' | 'ha' | 'ig'

const LANGUAGE_CONFIG: Record<LanguageCode, { displayName: string; speechLocale: string; apiLanguage: string }> = {
  en: { displayName: 'English', speechLocale: 'en-NG', apiLanguage: 'EN' },
  pcm: { displayName: 'Nigerian Pidgin English', speechLocale: 'en-NG', apiLanguage: 'PIDGIN' },
  yo: { displayName: 'Yoruba', speechLocale: 'yo-NG', apiLanguage: 'YORUBA' },
  ha: { displayName: 'Hausa', speechLocale: 'ha-NG', apiLanguage: 'HAUSA' },
  ig: { displayName: 'Igbo', speechLocale: 'ig-NG', apiLanguage: 'IGBO' },
}

const normalizeLanguageCode = (raw?: string | null): LanguageCode => {
  const normalized = (raw ?? '').toLowerCase().trim()
  if (normalized.startsWith('pcm')) return 'pcm'
  if (normalized.startsWith('yo')) return 'yo'
  if (normalized.startsWith('ha')) return 'ha'
  if (normalized.startsWith('ig')) return 'ig'
  return 'en'
}

interface TriageQuestion {
  id: string
  question: string
}

interface AIResponse {
  heading: string
  summary: string
  severity?: Severity
}

const stripSystemPrefix = (value: string) => value.replace(/^\[SYSTEM:[^\]]+\]\s*/i, '').trim()

const normalizeSeverity = (value?: string | null): Severity | undefined => {
  if (!value) return undefined
  const normalized = value.toLowerCase()
  if (normalized === 'low' || normalized === 'medium' || normalized === 'high' || normalized === 'critical') {
    return normalized
  }
  return undefined
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

interface VoiceInteractionScreenProps {
  userName?: string
  onLogout: () => void
  onLanguageChange: (code: any) => void
}

export default function VoiceInteractionScreen({ userName, onLogout, onLanguageChange }: VoiceInteractionScreenProps) {
  const { t, i18n } = useTranslation()
  const recognitionRef = useRef<SpeechRecognition | null>(null)
  const isFinalizingVoiceRef = useRef(false)
  const lastSubmittedVoiceRef = useRef<{ text: string; at: number } | null>(null)
  const transcriptRef = useRef('')
  const interimRef = useRef('')
  const lastSpokenQuestionRef = useRef<string | null>(null)
  const shouldKeepListeningRef = useRef(false)
  const inputModeRef = useRef<InputMode>('tap')
  const silenceTimeoutRef = useRef<number | null>(null)
  const restartTimeoutRef = useRef<number | null>(null)
  const voicesRef = useRef<SpeechSynthesisVoice[]>([])
  const conversationModeRef = useRef<'voice' | 'keyboard' | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const [conversationMode, setConversationMode] = useState<'voice' | 'keyboard' | null>(null)
  const [sessionStatus, setSessionStatus] = useState<SessionStatus>('ready')
  const [inputMode, setInputMode] = useState<InputMode>('tap')
  const [isListening, setIsListening] = useState(false)
  const [micPermission, setMicPermission] = useState<MicPermission>('unknown')
  const [transcript, setTranscript] = useState('')
  const [interimTranscript, setInterimTranscript] = useState('')
  const [aiResponse, setAIResponse] = useState<AIResponse | null>(null)
  const consultationIdRef = useRef<number | null>(null)
  const consultationLanguageRef = useRef<LanguageCode>(normalizeLanguageCode(i18n.language || 'en'))
  const [currentAIMessage, setCurrentAIMessage] = useState<string | null>(null)
  const [currentAIMessageSeq, setCurrentAIMessageSeq] = useState(0)
  const [consultationDetail, setConsultationDetail] = useState<ConsultationDetailResponse['consultation'] | null>(null)
  const [routedHospitals, setRoutedHospitals] = useState<HospitalListItem[]>([])
  const [isHospitalsLoading, setIsHospitalsLoading] = useState(false)
  const [hospitalsError, setHospitalsError] = useState<string | null>(null)
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [locationNotice, setLocationNotice] = useState<string | null>(null)
  const [consultationComplete, setConsultationComplete] = useState(false)
  const consultationCompleteRef = useRef(false)
  const [apiError, setApiError] = useState<string | null>(null)
  const [showLanguagePanel, setShowLanguagePanel] = useState(false)
  const [showUserDropdown, setShowUserDropdown] = useState(false)
  const [showProfile, setShowProfile] = useState(false)
  const [isEmergencyMode, setIsEmergencyMode] = useState(false)
  const [showEmergencyPanel, setShowEmergencyPanel] = useState(false)
  const [isChangingLanguage, setIsChangingLanguage] = useState(false)
  const [textInput, setTextInput] = useState('')
  const [consultationLanguage, setConsultationLanguage] = useState<LanguageCode>(normalizeLanguageCode(i18n.language || 'en'))

  const submitInlineKeyboardReply = () => {
    if (!textInput.trim()) return
    submitInputIntoFlow(textInput, 'keyboard')
    setTextInput('')
  }

  const getPreferredTtsVoice = (): 'Idera' => {
    try {
      const raw = localStorage.getItem('alavia.profileSettings')
      if (!raw) return 'Idera'
      const parsed = JSON.parse(raw) as { ttsVoice?: string }
      if (parsed.ttsVoice === 'Idera') {
        return parsed.ttsVoice
      }
      return 'Idera'
    } catch {
      return 'Idera'
    }
  }

  const persistedLanguage = normalizeLanguageCode(localStorage.getItem('alavia.selectedLanguage'))
  const selectedLanguage = normalizeLanguageCode(i18n.language || persistedLanguage)

  const languages = [
    { code: 'en' },
    { code: 'pcm' },
    { code: 'yo' },
    { code: 'ha' },
    { code: 'ig' },
  ]

  const currentLanguageName = t(`language.${selectedLanguage}.name`)
  const consultationLangConfig = LANGUAGE_CONFIG[consultationLanguage] ?? LANGUAGE_CONFIG.en
  const triageT = useMemo(() => i18n.getFixedT(consultationLanguage), [consultationLanguage, i18n])

  const supportsSpeech = useMemo(() => {
    return typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)
  }, [])

  const localizeServerQuestion = (message: string) => {
    if (consultationLanguage === 'en') return message
    const msg = message.toLowerCase()
    // Client-side fallback localization for common triage questions
    // when the AI model responds in English despite language instructions
    if (msg.includes('breath') || msg.includes('breathing')) return triageT('voice.questions.breathing')
    if (msg.includes('faint') || msg.includes('confusion') || msg.includes('dizz')) return triageT('voice.questions.fainting')
    if (msg.includes('worse') || msg.includes('getting worse') || msg.includes('worsen')) return triageT('voice.questions.worse')
    if (msg.includes('weakness') || msg.includes('one sided') || msg.includes('slur')) return triageT('voice.questions.weakness')
    return message
  }

  const activeQuestion: TriageQuestion | null = currentAIMessage && !consultationComplete
    ? { id: String(currentAIMessageSeq), question: localizeServerQuestion(currentAIMessage) }
    : null

  const speakText = async (text: string, onEnd?: () => void, languageOverride?: LanguageCode) => {
    if (!text.trim()) {
      onEnd?.()
      return
    }

    const speechLanguage = languageOverride ?? consultationLanguageRef.current
    const speechLangConfig = LANGUAGE_CONFIG[speechLanguage] ?? LANGUAGE_CONFIG.en

    // Race the backend TTS against a tight timeout so the user never waits long.
    // If the API responds fast we play the high-quality audio; otherwise we
    // instantly fall through to the browser's built-in speech synthesis.
    const TTS_TIMEOUT_MS = 2500

    try {
      const ttsPromise = speechApi.tts({
        text,
        language: speechLangConfig.apiLanguage,
        voice: getPreferredTtsVoice(),
      })

      // Timeout sentinel – resolves to null after TTS_TIMEOUT_MS
      const timeoutPromise = new Promise<null>((resolve) =>
        setTimeout(() => resolve(null), TTS_TIMEOUT_MS)
      )

      const tts = await Promise.race([ttsPromise, timeoutPromise])

      if (tts && tts.audio_url) {
        audioRef.current?.pause()
        if (audioRef.current && audioRef.current.src.startsWith('blob:')) {
          URL.revokeObjectURL(audioRef.current.src)
        }
        const audio = new Audio(tts.audio_url)
        audio.preload = 'auto'
        audioRef.current = audio

        audio.onended = () => {
          if (audio.src.startsWith('blob:')) URL.revokeObjectURL(audio.src)
          onEnd?.()
        }

        audio.onerror = () => {
          if ('speechSynthesis' in window) {
            fallbackToSpeechSynthesis()
          } else {
            onEnd?.()
          }
        }

        audio.play().catch(() => {
          if ('speechSynthesis' in window) {
            fallbackToSpeechSynthesis()
          } else {
            onEnd?.()
          }
        })
        return
      }
      // tts was null (timeout) or had no audio_url — fall through
    } catch {
      // Network / API error — fall through to browser synthesis
    }

    // Instant zero-latency fallback
    fallbackToSpeechSynthesis()

    function fallbackToSpeechSynthesis() {
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
      const bcp47List = [speechLangConfig.speechLocale, ...(LANG_BCP47[speechLanguage] ?? ['en-NG', 'en'])]

      const utterance = new SpeechSynthesisUtterance(text)
      utterance.lang = bcp47List[0]   // primary preference
      utterance.rate = 1.12  // Faster for reduced delay perception
      utterance.pitch = 1.08  // warmer female pitch

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
    void speakText(t('voice.emergencyModeActivated'))
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

  // Instruction prepended to every message so the AI model always responds
  // in the correct language, regardless of backend language field support.
  const langInstruction = (langName: string, langCode: LanguageCode) =>
    langCode === 'en'
      ? ''  // no prefix needed for English
      : `[SYSTEM: You MUST respond ONLY in ${langName}. Do NOT use English in your response. The user speaks ${langName}.] `

  const startConsultation = (message: string) => {
    console.debug('[VoiceInteraction] startConsultation called', { message, mode: conversationModeRef.current })
    setSessionStatus('processing')
    setApiError(null)
        const startLang = normalizeLanguageCode(localStorage.getItem('alavia.selectedLanguage') || i18n.language || selectedLanguage)
        consultationLanguageRef.current = startLang
        setConsultationLanguage(startLang)
        const langName = LANGUAGE_CONFIG[startLang].displayName
        const prefixed = langInstruction(langName, startLang) + message
    void (async () => {
      try {
      const res = await consultationsApi.start(prefixed, LANGUAGE_CONFIG[startLang].apiLanguage)
      console.debug('[VoiceInteraction] consultationsApi.start response', res)
        const id = res.consultation_id
        updateConsultationId(id)
        setCurrentAIMessage(res.message.content)
        setCurrentAIMessageSeq(1)
        setAIResponse({ heading: t('voice.responseHeading'), summary: stripSystemPrefix(message) })
        void speakText(res.message.content, undefined, startLang)
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
        const sessionLang = consultationLanguageRef.current
        const langName = LANGUAGE_CONFIG[sessionLang].displayName
        // Keep reminding the AI of the language on every turn
        const prefixed = langInstruction(langName, sessionLang) + content
    try {
      const res = await consultationsApi.message(id, prefixed, LANGUAGE_CONFIG[sessionLang].apiLanguage)
      console.debug('[VoiceInteraction] consultationsApi.message response', res)
      
      // Immediately start playing audio in parallel with state updates to reduce perceived delay
      const normalizedStatus = String(res.status ?? '').toLowerCase()
      const isComplete = ['complete', 'completed', 'closed', 'ended'].includes(normalizedStatus)
      
      if (!isComplete && res.message.content) {
        // Start audio playback immediately - don't wait
        void speakText(res.message.content, undefined, sessionLang)
      }
      
      setCurrentAIMessage(res.message.content)
      setCurrentAIMessageSeq(prev => prev + 1)
      if (res.severity) {
        const normalized = normalizeSeverity(res.severity)
        if (normalized) {
          setAIResponse(prev => prev ? { ...prev, severity: normalized } : prev)
        }
      }
      
      if (isComplete) {
        updateConsultationComplete(true)
        try {
          const detail = await consultationsApi.detail(id)
          setConsultationDetail(detail.consultation)
          if (detail.consultation.summary) {
            setAIResponse(prev => prev ? {
              ...prev,
              summary: stripSystemPrefix(detail.consultation.summary),
            } : {
              heading: t('voice.responseHeading'),
              summary: stripSystemPrefix(detail.consultation.summary),
            })
          }
          if (detail.consultation.severity) {
            const sev = normalizeSeverity(detail.consultation.severity)
            if (sev) {
              setAIResponse(prev => prev ? { ...prev, severity: sev } : prev)
            }
          }
        } catch {
          // detail fetch failed — first aid will be empty
        }
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
        const nextLang = normalizeLanguageCode(localStorage.getItem('alavia.selectedLanguage') || i18n.language || selectedLanguage)
        consultationLanguageRef.current = nextLang
        setConsultationLanguage(nextLang)
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

    if (isFinalizingVoiceRef.current) return

    const now = Date.now()
    const last = lastSubmittedVoiceRef.current
    if (last && last.text === finalText && now - last.at < 3000) {
      return
    }

    isFinalizingVoiceRef.current = true
    lastSubmittedVoiceRef.current = { text: finalText, at: now }
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

  const fetchRoutedHospitals = async (severity?: string | null) => {
    setIsHospitalsLoading(true)
    setHospitalsError(null)
    setLocationNotice(null)

    let lat: number | undefined
    let lng: number | undefined

    if (navigator.geolocation) {
      try {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: false,
            timeout: 4000,
            maximumAge: 300000,
          })
        })
        lat = position.coords.latitude
        lng = position.coords.longitude
        setUserLocation({ lat, lng })
      } catch {
        setUserLocation(null)
        setLocationNotice('Location unavailable. Showing general nearest results.')
      }
    }

    try {
      const severityCode = (severity ?? '').toUpperCase()
      const response = await hospitalsApi.list({
        lat,
        lng,
        severity: severityCode || undefined,
        emergency_ready: ['HIGH', 'CRITICAL'].includes(severityCode) ? true : undefined,
      })
      setRoutedHospitals(response.data ?? [])
    } catch (err) {
      setHospitalsError(err instanceof Error ? err.message : 'Failed to load hospitals')
      setRoutedHospitals([])
    } finally {
      setIsHospitalsLoading(false)
    }
  }

  const calculateDistanceKm = (fromLat: number, fromLng: number, toLat: number, toLng: number) => {
    const toRad = (value: number) => (value * Math.PI) / 180
    const earthKm = 6371
    const dLat = toRad(toLat - fromLat)
    const dLng = toRad(toLng - fromLng)
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(fromLat)) * Math.cos(toRad(toLat)) * Math.sin(dLng / 2) * Math.sin(dLng / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return Number((earthKm * c).toFixed(1))
  }

  const displayHospitals = useMemo(() => {
    const withDistance = routedHospitals.map((hospital) => {
      const apiDistance = hospital.distance_km != null ? Number(hospital.distance_km) : null
      const clientDistance = userLocation
        ? calculateDistanceKm(userLocation.lat, userLocation.lng, hospital.lat, hospital.lng)
        : null
      const effectiveDistanceKm = apiDistance ?? clientDistance

      return {
        ...hospital,
        effectiveDistanceKm,
      }
    })

    return withDistance.sort((left, right) => {
      if (left.effectiveDistanceKm == null && right.effectiveDistanceKm == null) return 0
      if (left.effectiveDistanceKm == null) return 1
      if (right.effectiveDistanceKm == null) return -1
      return left.effectiveDistanceKm - right.effectiveDistanceKm
    })
  }, [routedHospitals, userLocation])

  const mapPoints = useMemo(() => {
    const hospitals = displayHospitals.slice(0, 6)
    if (hospitals.length === 0) return { hospitals: [] as Array<{ id: number; name: string; x: number; y: number }>, user: null as null | { x: number; y: number } }

    const lats = hospitals.map((h) => h.lat)
    const lngs = hospitals.map((h) => h.lng)
    if (userLocation) {
      lats.push(userLocation.lat)
      lngs.push(userLocation.lng)
    }

    const minLat = Math.min(...lats)
    const maxLat = Math.max(...lats)
    const minLng = Math.min(...lngs)
    const maxLng = Math.max(...lngs)

    const latRange = maxLat - minLat || 0.02
    const lngRange = maxLng - minLng || 0.02

    const toMapX = (lng: number) => 10 + ((lng - minLng) / lngRange) * 80
    const toMapY = (lat: number) => 90 - ((lat - minLat) / latRange) * 80

    return {
      hospitals: hospitals.map((h) => ({
        id: h.id,
        name: h.name,
        x: toMapX(h.lng),
        y: toMapY(h.lat),
      })),
      user: userLocation
        ? {
            x: toMapX(userLocation.lng),
            y: toMapY(userLocation.lat),
          }
        : null,
    }
  }, [displayHospitals, userLocation])

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
    isFinalizingVoiceRef.current = false
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
    if (!consultationComplete) {
      setRoutedHospitals([])
      setHospitalsError(null)
      setIsHospitalsLoading(false)
      setLocationNotice(null)
      return
    }

    void fetchRoutedHospitals(consultationDetail?.severity)
  }, [consultationComplete, consultationDetail?.severity])

  useEffect(() => {
    if (sessionStatus === 'ready') {
      isFinalizingVoiceRef.current = false
    }
  }, [sessionStatus])

  useEffect(() => {
    if (consultationIdRef.current !== null && !consultationCompleteRef.current) return
    const nextLang = normalizeLanguageCode(localStorage.getItem('alavia.selectedLanguage') || i18n.language || selectedLanguage)
    consultationLanguageRef.current = nextLang
    setConsultationLanguage(nextLang)
  }, [i18n.language, selectedLanguage])

  useEffect(() => {
    if (!supportsSpeech) return

    const speechWindow = window as any
    const SpeechRecognitionImpl = speechWindow.SpeechRecognition || speechWindow.webkitSpeechRecognition
    if (!SpeechRecognitionImpl) return

    const recognition = new SpeechRecognitionImpl()
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = consultationLangConfig.speechLocale

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

      if (event.error === 'language-not-supported') {
        recognition.lang = 'en-NG'
      }

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
  }, [consultationLangConfig.speechLocale, supportsSpeech])

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
        // keyboard mode: speak question only; typing happens inline in triage card
        void speakText(activeQuestion.question)
      } else {
        // voice mode: speak question then auto-start mic (no artificial delay)
        speakText(activeQuestion.question, () => {
          void startListening()
        })
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
              <h1 className={`hidden sm:block text-[10px] font-black uppercase tracking-[0.2em] ${isEmergencyMode ? 'text-red-700' : 'text-emerald-600/80'}`}>{t('common.appName')}</h1>
              <p className="text-lg sm:text-xl font-black text-slate-800 tracking-tight leading-none">
                {userName ? `${t('voice.greeting')} ${userName.split(' ')[0]}` : t('voice.healthSession')}
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
                <p className="text-sm font-black">{t('voice.emergencyActive')}</p>
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
                  <span>{t('voice.emergencyCallContact')}</span>
                </button>
                <button
                  type="button"
                  onClick={handleEmergencySms}
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-red-300 bg-white px-3 text-sm font-bold text-red-700"
                >
                  <MessageCircle size={16} />
                  <span>{t('voice.emergencySmsContact')}</span>
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
                <span className="text-amber-600">{t('voice.browserUnsupported')}</span>
              </div>
            )}
            {supportsSpeech && micPermission === 'denied' && (
              <div className="flex items-center gap-2">
                <MicOff size={14} className="text-red-500" />
                <span className="text-red-600">{t('voice.micBlocked')}</span>
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
                type="button"
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
          <section className="flex flex-col items-center gap-3">
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
            
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                const nextMode = conversationMode === 'keyboard' ? 'voice' : 'keyboard'
                conversationModeRef.current = nextMode
                setConversationMode(nextMode)
                if (nextMode === 'keyboard') stopListening()
              }}
              className={`flex items-center gap-2 rounded-2xl px-6 py-3 text-xs font-black uppercase tracking-wider transition-all shadow-lg ${
                conversationMode === 'keyboard'
                  ? 'bg-emerald-500 text-white border-2 border-emerald-400'
                  : 'bg-white text-slate-700 border-2 border-slate-200 hover:border-emerald-300'
              }`}
            >
              <Keyboard size={16} />
              <span>{conversationMode === 'keyboard' ? t('voice.modeTap') : t('voice.typeSymptoms')}</span>
            </motion.button>
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
                    onClick={() => { void speakText(currentAIMessage ?? `${aiResponse.heading}. ${aiResponse.summary}`) }}
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
                    <div className="mb-6">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-400">{t('voice.triageQuestion')}</span>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          type="button"
                          onClick={() => {
                            const nextMode = conversationMode === 'keyboard' ? 'voice' : 'keyboard'
                            conversationModeRef.current = nextMode
                            setConversationMode(nextMode)
                            if (nextMode === 'keyboard') stopListening()
                          }}
                          className={`inline-flex min-h-10 items-center gap-2 rounded-xl px-4 py-2 text-[10px] font-black uppercase tracking-wider transition-all shadow-lg ${
                            conversationMode === 'keyboard'
                              ? 'bg-emerald-500 text-white border-2 border-emerald-400'
                              : 'bg-white/15 text-white border-2 border-white/20 hover:bg-white/20'
                          }`}
                        >
                          {conversationMode === 'keyboard' ? <Mic size={14} /> : <Keyboard size={14} />}
                          <span>{conversationMode === 'keyboard' ? t('voice.modeTap') : t('voice.typeSymptoms')}</span>
                        </motion.button>
                      </div>
                      <h4 className="text-2xl font-black leading-tight tracking-tight text-emerald-400">
                        {activeQuestion.question}
                      </h4>
                    </div>

                    {/* Response indicator — keyboard note or mic interface */}
                    {conversationMode === 'keyboard' ? (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="rounded-2xl border-2 border-emerald-400/30 bg-gradient-to-br from-white/15 to-white/5 p-4 backdrop-blur-sm shadow-2xl"
                      >
                        <div className="flex items-center gap-2">
                          <Keyboard size={14} className="text-emerald-300" />
                          <span className="text-sm font-black text-emerald-300">{t('voice.typeYourAnswer')}</span>
                        </div>
                        <p className="mt-2 text-xs font-semibold text-white/60">Use the keyboard panel at the bottom right →</p>
                      </motion.div>
                    ) : (
                    <div className={`rounded-2xl border px-4 py-3 transition-all ${
                      isListening
                        ? 'bg-emerald-500/20 border-emerald-500/40'
                        : sessionStatus === 'processing'
                          ? 'bg-white/5 border-white/10'
                          : 'bg-white/10 border-white/20'
                    }`}>
                      <div className="flex items-center gap-3">
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
                        {isListening ? (
                          <button
                            type="button"
                            onClick={stopListening}
                            className="inline-flex min-h-12 items-center gap-2 rounded-xl border border-red-300/50 bg-red-500/20 px-3 text-xs font-black uppercase tracking-wider text-red-100"
                          >
                            <MicOff size={14} />
                            <span>{t('voice.stop')}</span>
                          </button>
                        ) : null}
                      </div>
                    </div>
                    )}
                  </div>
                </motion.div>
              )}

              {consultationComplete && (
                <motion.div
                  initial={{ opacity: 0, y: 40 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6"
                >
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

                  <div className="rounded-[32px] bg-slate-900 p-8 shadow-2xl shadow-slate-900/20 text-white overflow-hidden relative">
                    <motion.div
                      animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.2, 0.1] }}
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

                      <div className="space-y-4">
                        {!isHospitalsLoading && locationNotice && (
                          <div className="rounded-2xl border border-amber-300/20 bg-amber-500/10 px-4 py-3 text-xs font-bold text-amber-100">
                            {locationNotice}
                          </div>
                        )}

                        {!isHospitalsLoading && !hospitalsError && displayHospitals.length > 0 && (
                          <div className="relative h-64 w-full overflow-hidden rounded-[28px] border border-white/10 shadow-inner">
                            {/* Realistic map background */}
                            <div className="absolute inset-0 bg-[#1a2332]">
                              <svg width="100%" height="100%" viewBox="0 0 400 260" preserveAspectRatio="xMidYMid slice" className="absolute inset-0">
                                <defs>
                                  {/* Water texture gradient */}
                                  <linearGradient id="waterGrad" x1="0" y1="0" x2="1" y2="1">
                                    <stop offset="0%" stopColor="#0c4a6e" stopOpacity="0.5" />
                                    <stop offset="100%" stopColor="#164e63" stopOpacity="0.3" />
                                  </linearGradient>
                                  {/* Land fill */}
                                  <linearGradient id="landGrad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#1e3a2f" stopOpacity="0.4" />
                                    <stop offset="100%" stopColor="#1a2e25" stopOpacity="0.3" />
                                  </linearGradient>
                                  {/* Road dash pattern */}
                                  <pattern id="roadDash" patternUnits="userSpaceOnUse" width="12" height="2">
                                    <rect width="7" height="1" fill="rgba(255,255,255,0.12)" />
                                  </pattern>
                                  {/* Route dash */}
                                  <filter id="routeGlow">
                                    <feGaussianBlur stdDeviation="2" result="blur" />
                                    <feMerge>
                                      <feMergeNode in="blur" />
                                      <feMergeNode in="SourceGraphic" />
                                    </feMerge>
                                  </filter>
                                </defs>

                                {/* Water/lagoon areas */}
                                <path d="M0,200 Q50,180 120,195 Q200,215 280,190 Q350,175 400,200 L400,260 L0,260 Z" fill="url(#waterGrad)" />
                                <path d="M300,0 Q310,30 305,60 Q295,90 310,120 Q330,90 340,50 Q345,20 350,0 Z" fill="url(#waterGrad)" opacity="0.4" />
                                <ellipse cx="80" cy="230" rx="60" ry="20" fill="url(#waterGrad)" opacity="0.3" />

                                {/* Land mass */}
                                <path d="M0,0 L400,0 L400,200 Q350,175 280,190 Q200,215 120,195 Q50,180 0,200 Z" fill="url(#landGrad)" />

                                {/* Terrain patches (parks/green areas) */}
                                <ellipse cx="60" cy="80" rx="30" ry="18" fill="#166534" opacity="0.15" />
                                <ellipse cx="240" cy="50" rx="25" ry="15" fill="#166534" opacity="0.12" />
                                <ellipse cx="160" cy="150" rx="20" ry="12" fill="#166534" opacity="0.1" />

                                {/* Major roads - horizontal */}
                                <line x1="0" y1="60" x2="400" y2="65" stroke="rgba(255,255,255,0.08)" strokeWidth="4" />
                                <line x1="0" y1="60" x2="400" y2="65" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" />
                                <line x1="0" y1="120" x2="290" y2="115" stroke="rgba(255,255,255,0.08)" strokeWidth="3.5" />
                                <line x1="0" y1="120" x2="290" y2="115" stroke="rgba(255,255,255,0.12)" strokeWidth="1" />
                                <line x1="30" y1="170" x2="350" y2="165" stroke="rgba(255,255,255,0.06)" strokeWidth="3" />
                                <line x1="30" y1="170" x2="350" y2="165" stroke="rgba(255,255,255,0.1)" strokeWidth="0.8" />

                                {/* Major roads - vertical / diagonal */}
                                <line x1="100" y1="0" x2="110" y2="200" stroke="rgba(255,255,255,0.08)" strokeWidth="4" />
                                <line x1="100" y1="0" x2="110" y2="200" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" />
                                <line x1="200" y1="0" x2="195" y2="200" stroke="rgba(255,255,255,0.06)" strokeWidth="3" />
                                <line x1="200" y1="0" x2="195" y2="200" stroke="rgba(255,255,255,0.1)" strokeWidth="0.8" />
                                <path d="M260,0 Q270,80 240,170 Q230,200 220,210" stroke="rgba(255,255,255,0.06)" strokeWidth="3" fill="none" />

                                {/* Secondary / minor roads */}
                                <line x1="50" y1="30" x2="180" y2="35" stroke="rgba(255,255,255,0.04)" strokeWidth="1.5" />
                                <line x1="140" y1="80" x2="280" y2="85" stroke="rgba(255,255,255,0.04)" strokeWidth="1.5" />
                                <line x1="60" y1="0" x2="55" y2="130" stroke="rgba(255,255,255,0.04)" strokeWidth="1.5" />
                                <line x1="150" y1="40" x2="155" y2="170" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
                                <line x1="340" y1="30" x2="330" y2="160" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />

                                {/* Block / neighborhood fills */}
                                <rect x="105" y="65" width="35" height="45" rx="3" fill="rgba(255,255,255,0.02)" />
                                <rect x="55" y="65" width="40" height="50" rx="3" fill="rgba(255,255,255,0.015)" />
                                <rect x="115" y="125" width="30" height="35" rx="3" fill="rgba(255,255,255,0.02)" />
                                <rect x="202" y="30" width="50" height="30" rx="3" fill="rgba(255,255,255,0.015)" />
                                <rect x="205" y="70" width="45" height="40" rx="3" fill="rgba(255,255,255,0.02)" />

                                {/* Route lines: user → each hospital (dashed, glowing) */}
                                {mapPoints.user && mapPoints.hospitals.map((h) => (
                                  <line
                                    key={`route-${h.id}`}
                                    x1={mapPoints.user!.x * 4}
                                    y1={mapPoints.user!.y * 2.6}
                                    x2={h.x * 4}
                                    y2={h.y * 2.6}
                                    stroke="#10b981"
                                    strokeWidth="1.5"
                                    strokeDasharray="6,4"
                                    opacity="0.4"
                                    filter="url(#routeGlow)"
                                  />
                                ))}
                              </svg>
                            </div>

                            {/* User location marker with pulse */}
                            {mapPoints.user && (
                              <div
                                className="absolute -translate-x-1/2 -translate-y-1/2 z-30"
                                style={{ left: `${mapPoints.user.x}%`, top: `${mapPoints.user.y}%` }}
                              >
                                <div className="relative">
                                  {/* Outer pulse ring */}
                                  <motion.div
                                    animate={{ scale: [1, 2.5], opacity: [0.4, 0] }}
                                    transition={{ duration: 2, repeat: Infinity, ease: 'easeOut' }}
                                    className="absolute inset-0 rounded-full bg-blue-500"
                                    style={{ width: 16, height: 16, marginLeft: -2, marginTop: -2 }}
                                  />
                                  {/* Inner pulse ring */}
                                  <motion.div
                                    animate={{ scale: [1, 1.8], opacity: [0.3, 0] }}
                                    transition={{ duration: 2, repeat: Infinity, ease: 'easeOut', delay: 0.4 }}
                                    className="absolute inset-0 rounded-full bg-blue-400"
                                    style={{ width: 16, height: 16, marginLeft: -2, marginTop: -2 }}
                                  />
                                  {/* Dot */}
                                  <div className="relative h-3 w-3 rounded-full bg-blue-500 border-[2.5px] border-white shadow-[0_0_12px_rgba(59,130,246,0.9)]" />
                                  {/* Label */}
                                  <span className="absolute left-5 top-1/2 -translate-y-1/2 whitespace-nowrap rounded-md bg-blue-500/90 px-2 py-0.5 text-[8px] font-black text-white shadow-lg backdrop-blur-sm">
                                    You
                                  </span>
                                </div>
                              </div>
                            )}

                            {/* Hospital markers with drop-pin style */}
                            {mapPoints.hospitals.map((marker, idx) => (
                              <div
                                key={marker.id}
                                className="absolute -translate-x-1/2 -translate-y-full z-20"
                                style={{ left: `${marker.x}%`, top: `${marker.y}%` }}
                                title={marker.name}
                              >
                                <motion.div
                                  initial={{ y: -20, opacity: 0 }}
                                  animate={{ y: 0, opacity: 1 }}
                                  transition={{ delay: idx * 0.12, type: 'spring', stiffness: 300 }}
                                  className="relative flex flex-col items-center"
                                >
                                  {/* Pin head */}
                                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500 text-white border-[2.5px] border-white shadow-[0_2px_12px_rgba(16,185,129,0.6)]">
                                    <HeartPulse size={13} strokeWidth={2.5} />
                                  </div>
                                  {/* Pin tail */}
                                  <div className="h-2 w-0.5 bg-white/60" />
                                  <div className="h-1.5 w-1.5 rounded-full bg-white/40" />
                                  {/* Hospital name tooltip */}
                                  <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-black/70 px-1.5 py-0.5 text-[7px] font-bold text-white/90 backdrop-blur-sm">
                                    {marker.name.length > 18 ? marker.name.slice(0, 16) + '…' : marker.name}
                                  </span>
                                </motion.div>
                              </div>
                            ))}

                            {/* Legend bar */}
                            <div className="absolute bottom-2 left-3 right-3 flex items-center justify-between z-30">
                              <div className="flex items-center gap-3 rounded-lg bg-black/50 px-3 py-1.5 backdrop-blur-md border border-white/5">
                                <div className="flex items-center gap-1.5">
                                  <div className="h-2 w-2 rounded-full bg-blue-500 border border-white/60" />
                                  <span className="text-[8px] font-bold text-white/70">You</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <div className="h-2 w-2 rounded-full bg-emerald-500 border border-white/60" />
                                  <span className="text-[8px] font-bold text-white/70">Hospital</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <div className="h-0.5 w-4 border-t border-dashed border-emerald-400/60" />
                                  <span className="text-[8px] font-bold text-white/70">Route</span>
                                </div>
                              </div>
                              <span className="rounded-lg bg-black/50 px-2 py-1 text-[7px] font-bold text-white/40 backdrop-blur-md border border-white/5">
                                Lagos, NG
                              </span>
                            </div>
                          </div>
                        )}

                        {isHospitalsLoading && (
                          <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-5 text-sm font-bold text-white/70">
                            {t('voice.status.processing')}
                          </div>
                        )}

                        {!isHospitalsLoading && hospitalsError && (
                          <div className="rounded-2xl border border-red-300/20 bg-red-500/10 px-4 py-5 text-sm font-bold text-red-200">
                            {hospitalsError}
                          </div>
                        )}

                        {!isHospitalsLoading && !hospitalsError && displayHospitals.length === 0 && (
                          <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-5 text-sm font-bold text-white/70">
                            No hospital results available right now.
                          </div>
                        )}

                        {!isHospitalsLoading && !hospitalsError && displayHospitals.map((hospital, index) => {
                          const distanceLabel = hospital.effectiveDistanceKm != null
                            ? `${hospital.effectiveDistanceKm} km away`
                            : 'Distance unavailable'

                          return (
                            <motion.div
                              key={hospital.id}
                              whileHover={{ y: -4 }}
                              className="group flex flex-col p-5 rounded-[28px] bg-white/5 border border-white/10 hover:bg-white/10 transition-all"
                            >
                              <div className="flex items-start justify-between mb-4 gap-3">
                                <div className="flex items-center gap-4">
                                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500 text-white shadow-lg shadow-emerald-500/20">
                                    <Navigation size={20} />
                                  </div>
                                  <div>
                                    <h5 className="font-black text-base text-white tracking-tight leading-tight">{hospital.name}</h5>
                                    <div className="flex items-center gap-3 text-[10px] font-bold text-emerald-400 mt-1 flex-wrap">
                                      <span className="uppercase tracking-wider">
                                        {hospital.is_public ? t('voice.hospitals.public') : t('voice.hospitals.private')}
                                      </span>
                                      <span className="h-1 w-1 rounded-full bg-white/20" />
                                      <span>{distanceLabel}</span>
                                      {index === 0 && hospital.effectiveDistanceKm != null && (
                                        <>
                                          <span className="h-1 w-1 rounded-full bg-white/20" />
                                            <span>{t('voice.hospitals.closestToYou')}</span>
                                        </>
                                      )}
                                    </div>
                                  </div>
                                </div>
                                <div className="rounded-full bg-emerald-500/10 px-3 py-1 text-[8px] font-black text-emerald-400 border border-emerald-500/20 uppercase whitespace-nowrap">
                                  {hospital.emergency_ready ? t('voice.hospitals.emergencyReady') : t('voice.hospitals.generalCare')}
                                </div>
                              </div>

                              <div className="grid grid-cols-2 gap-2 mt-auto text-[9px] font-bold text-white/60">
                                <div className="flex items-center gap-2">
                                  <div className="h-1 w-1 rounded-full bg-emerald-500" />
                                  <span>{hospital.is_24_hours ? t('voice.hospitals.hours24') : t('voice.hospitals.hoursNon24')}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <div className="h-1 w-1 rounded-full bg-emerald-500" />
                                  <span>
                                    {hospital.rating != null
                                      ? t('voice.hospitals.rating', { rating: hospital.rating })
                                      : t('voice.hospitals.noRating')}
                                  </span>
                                </div>
                              </div>

                              {hospital.specialties && hospital.specialties.length > 0 && (
                                <div className="mt-3 flex flex-wrap gap-1.5">
                                  {hospital.specialties.slice(0, 4).map((specialty, idx) => (
                                    <span
                                      key={idx}
                                      className="inline-flex items-center gap-1 rounded-full bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 text-[9px] font-black text-blue-300 uppercase tracking-wider"
                                    >
                                      {specialty}
                                    </span>
                                  ))}
                                  {hospital.specialties.length > 4 && (
                                    <span className="inline-flex items-center rounded-full bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 text-[9px] font-black text-blue-300">
                                      +{hospital.specialties.length - 4}
                                    </span>
                                  )}
                                </div>
                              )}

                              {hospital.facilities && hospital.facilities.length > 0 && (
                                <div className="mt-2 flex flex-wrap gap-1.5">
                                  {hospital.facilities.slice(0, 3).map((facility, idx) => (
                                    <span
                                      key={idx}
                                      className="inline-flex items-center gap-1 rounded-full bg-purple-500/10 border border-purple-500/20 px-2 py-0.5 text-[9px] font-black text-purple-300 uppercase tracking-wider"
                                    >
                                      {facility}
                                    </span>
                                  ))}
                                  {hospital.facilities.length > 3 && (
                                    <span className="inline-flex items-center rounded-full bg-purple-500/10 border border-purple-500/20 px-2 py-0.5 text-[9px] font-black text-purple-300">
                                      +{hospital.facilities.length - 3}
                                    </span>
                                  )}
                                </div>
                              )}

                              {hospital.address && (
                                <p className="mt-3 text-[11px] font-semibold text-white/50">{hospital.address}</p>
                              )}
                            </motion.div>
                          )
                        })}
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          const first = routedHospitals[0]
                          if (!first?.lat || !first?.lng) return
                          window.open(`https://www.google.com/maps/search/?api=1&query=${first.lat},${first.lng}`, '_blank')
                        }}
                        disabled={!routedHospitals[0]?.lat || !routedHospitals[0]?.lng}
                        className="w-full mt-8 flex items-center justify-center gap-3 rounded-2xl bg-emerald-500 py-5 text-xs font-black text-white shadow-2xl shadow-emerald-500/40 transition-all hover:bg-emerald-400 uppercase tracking-widest border border-emerald-400/20 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <MapIcon size={18} />
                        <span>{t('voice.hospitals.openTopHospital')}</span>
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </main>

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
                      }, 200)
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
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">{t('common.loggedInAs')}</p>
                <p className="text-sm font-black text-slate-900 truncate">{userName || t('common.user')}</p>
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

      {/* Floating Keyboard Panel - Bottom Right */}
      <AnimatePresence>
        {conversationMode === 'keyboard' && (
          <motion.div
            initial={{ opacity: 0, y: 100, x: 100 }}
            animate={{ opacity: 1, y: 0, x: 0 }}
            exit={{ opacity: 0, y: 100, x: 100 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed bottom-20 right-6 z-50 w-[400px] max-w-[calc(100vw-3rem)]"
          >
            <div className="rounded-2xl border-2 border-emerald-500/50 bg-slate-900 p-5 shadow-2xl shadow-emerald-500/20">
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Keyboard size={16} className="text-emerald-400" />
                  <span className="text-xs font-black uppercase tracking-widest text-emerald-400">{t('voice.typeYourAnswer')}</span>
                </div>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  type="button"
                  onClick={() => {
                    setConversationMode('voice')
                    conversationModeRef.current = 'voice'
                    setTextInput('')
                  }}
                  className="flex h-6 w-6 items-center justify-center rounded-lg bg-white/10 text-white/60 hover:bg-white/20 transition-all"
                >
                  ×
                </motion.button>
              </div>
              <div className="flex items-center gap-3">
                <input
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && textInput.trim() && sessionStatus !== 'processing') {
                      submitInlineKeyboardReply()
                    }
                  }}
                  placeholder={t('voice.inputPlaceholder')}
                  autoFocus
                  className="h-12 flex-1 rounded-xl border-2 border-emerald-500/30 bg-black/40 px-4 text-sm font-semibold text-white placeholder:text-white/40 outline-none focus:border-emerald-400 focus:bg-black/50 transition-all"
                />
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  type="button"
                  onClick={submitInlineKeyboardReply}
                  disabled={!textInput.trim() || sessionStatus === 'processing'}
                  className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-500 text-white shadow-lg shadow-emerald-500/30 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-emerald-600 transition-all"
                >
                  {sessionStatus === 'processing' ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
