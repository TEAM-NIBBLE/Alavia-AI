import { useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { HospitalResultsPanel } from './postTriage/HospitalResultsPanel'
import { FeedbackCard } from './postTriage/FeedbackCard'
import { FollowUpCheckIn } from './postTriage/FollowUpCheckIn'
import { followUps } from '../utils/followUps'
import { guestSession } from '../utils/guest'
import { VOICE_SPEED_RATE, getEmergencyContacts, readStoredSettings } from '../utils/appSettings'
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
  User,
  Globe,
  ChevronDown,
  LogOut,
  Loader2,
  MicOff,
  Square,
  UserCircle,
} from 'lucide-react'
import alaviaLogo from '../assets/alavia-ai_logo.png'
import ProfilePage from './ProfilePage'
import { consultationsApi, hospitalsApi, speechApi } from '../api/services'
import type { ConsultationDetailResponse, HospitalListItem } from '../api/services'

type InputMode = 'tap' | 'hold'

// After the cloud voice fails (missing key, outage) skip it for a while instead of paying a
// failed round-trip on every message; the browser voice takes over in the meantime.
const CLOUD_TTS_COOLDOWN_MS = 5 * 60 * 1000
let cloudTtsDownUntil = 0
// Hospital data covers Lagos; this is where distances are measured from when the device gives no position.
const LAGOS_CENTRE = { lat: 6.5244, lng: 3.3792 }

async function approximateLocation(): Promise<{ lat: number; lng: number }> {
  try {
    const controller = new AbortController()
    const timer = window.setTimeout(() => controller.abort(), 3000)
    const res = await fetch('https://ipwho.is/', { signal: controller.signal })
    window.clearTimeout(timer)
    const data = (await res.json()) as { success?: boolean; latitude?: number; longitude?: number }
    const { latitude, longitude } = data
    if (data.success && typeof latitude === 'number' && typeof longitude === 'number'
      && latitude > 6.3 && latitude < 6.8 && longitude > 2.7 && longitude < 4.0) {
      return { lat: latitude, lng: longitude }
    }
  } catch {
    // fall through to the Lagos centre
  }
  return LAGOS_CENTRE
}

// Cloud voices accept short inputs; break text at sentence ends into pieces of at most `max` characters.
function splitForSpeech(text: string, max = 190): string[] {
  const sentences = text.replace(/\s+/g, ' ').trim().match(/[^.!?]+[.!?]*/g) ?? [text]
  const pieces: string[] = []
  let current = ''
  for (const raw of sentences) {
    const sentence = raw.trim()
    if (!sentence) continue
    if ((current + ' ' + sentence).trim().length <= max) {
      current = (current + ' ' + sentence).trim()
      continue
    }
    if (current) pieces.push(current)
    let rest = sentence
    while (rest.length > max) {
      const cut = rest.lastIndexOf(' ', max)
      const at = cut > 40 ? cut : max
      pieces.push(rest.slice(0, at).trim())
      rest = rest.slice(at).trim()
    }
    current = rest
  }
  if (current) pieces.push(current)
  return pieces.length ? pieces : [text.slice(0, max)]
}

const TTS_URL_TTL_MS = 60 * 1000
const ttsUrlCache = new Map<string, { at: number; url: Promise<string | null> }>()
const fetchTtsUrl = (text: string, language: string, voice: string): Promise<string | null> => {
  const key = `${language}|${voice}|${text}`
  const hit = ttsUrlCache.get(key)
  if (hit && Date.now() - hit.at < TTS_URL_TTL_MS) return hit.url
  const url = speechApi.tts({ text, language, voice }).then((r) => r.audio_url ?? null)
  ttsUrlCache.set(key, { at: Date.now(), url })
  url.catch(() => ttsUrlCache.delete(key))
  return url
}

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
  onstart: (() => void) | null
  abort: () => void
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
  isGuest?: boolean
  onSignIn?: () => void
  onSignUp?: () => void
  onLogout: () => void
  onLanguageChange: (code: any) => void
}

export default function VoiceInteractionScreen({ userName, isGuest = false, onSignIn, onSignUp, onLogout, onLanguageChange }: VoiceInteractionScreenProps) {
  const { t, i18n } = useTranslation()
  const recognitionRef = useRef<SpeechRecognition | null>(null)
  const isFinalizingVoiceRef = useRef(false)
  const lastSubmittedVoiceRef = useRef<{ text: string; at: number } | null>(null)
  const transcriptRef = useRef('')
  const interimRef = useRef('')
  const lastSpokenQuestionRef = useRef<string | null>(null)
  const shouldKeepListeningRef = useRef(false)
  const holdActiveRef = useRef(false)
  const isStartingRef = useRef(false)
  const recognitionActiveRef = useRef(false)
  const micStreamRef = useRef<MediaStream | null>(null)
  // Parallel recording of the same mic: if the browser's own recognition returns nothing
  // (it needs Google's servers, which some networks block), the audio is sent to the backend.
  const recorderRef = useRef<MediaRecorder | null>(null)
  const sessionSubmittedRef = useRef(false)
  const vadTimerRef = useRef<number | null>(null)
  const audioCtxRef = useRef<AudioContext | null>(null)
  const inputModeRef = useRef<InputMode>('tap')
  const silenceTimeoutRef = useRef<number | null>(null)
  const restartTimeoutRef = useRef<number | null>(null)
  const conversationModeRef = useRef<'voice' | 'keyboard' | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  // Bumped whenever speech is stopped or replaced, so audio that arrives late for an old question is dropped.
  const speechTokenRef = useRef(0)

  const [conversationMode, setConversationMode] = useState<'voice' | 'keyboard' | null>(null)
  const [voiceNotice, setVoiceNotice] = useState<string | null>(null)
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
  const rawAIMessageRef = useRef<string | null>(null)
  const [currentAIMessageSeq, setCurrentAIMessageSeq] = useState(0)
  // True when the AI wrote the questions/guidance itself (English, Pidgin): show them as-is.
  const [isGuided, setIsGuided] = useState(false)
  const [answerType, setAnswerType] = useState<'yes_no' | 'scale' | 'open' | null>(null)
  const [resultTab, setResultTab] = useState<'hospitals' | 'steps'>('steps')
  const guidedRef = useRef(false)
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
    if (consultationLanguage === 'en' || guidedRef.current) return message

    // Detect if this message is already in a non-English language by checking
    // for non-ASCII characters common in Yoruba/Hausa/Igbo/Pidgin loanwords.
    // If the AI actually responded in the correct language, pass it through.
    const nonAsciiRatio = (message.match(/[^\x00-\x7F]/g) || []).length / message.length
    if (nonAsciiRatio > 0.05) return message // likely already in target language

    const msg = message.toLowerCase()

    // Client-side fallback localization for common triage questions
    // when the AI model responds in English despite language instructions

    // Breathing
    if (msg.includes('breath') || msg.includes('breathing') || msg.includes('difficulty breathing'))
      return triageT('voice.questions.breathing')
    // Fainting / confusion / dizziness
    if (msg.includes('faint') || msg.includes('confusion') || msg.includes('dizz') || msg.includes('lightheaded'))
      return triageT('voice.questions.fainting')
    // Getting worse
    if (msg.includes('getting worse') || msg.includes('worsen') || msg.includes('progressing') || (msg.includes('worse') && msg.includes('symptom')))
      return triageT('voice.questions.worse')
    // Weakness / slurred speech / stroke
    if (msg.includes('one-sided') || msg.includes('one sided') || msg.includes('slur') || (msg.includes('weakness') && (msg.includes('side') || msg.includes('arm') || msg.includes('leg'))))
      return triageT('voice.questions.weakness')
    // How long / duration
    if (msg.includes('how long') || msg.includes('duration') || msg.includes('how many days') || msg.includes('how many hours') || msg.includes('since when'))
      return triageT('voice.questions.howLong')
    // Describe pain
    if ((msg.includes('describe') && msg.includes('pain')) || (msg.includes('describe') && msg.includes('symptom')) || msg.includes('tell me about the pain'))
      return triageT('voice.questions.describePain')
    // Where is the pain
    if ((msg.includes('where') && msg.includes('pain')) || (msg.includes('location') && msg.includes('pain')) || msg.includes('where does it hurt') || msg.includes('where exactly'))
      return triageT('voice.questions.wherePain')
    // Fever / temperature
    if (msg.includes('fever') || msg.includes('temperature') || msg.includes('feeling hot'))
      return triageT('voice.questions.fever')
    // Allergies
    if (msg.includes('allerg'))
      return triageT('voice.questions.allergies')
    // Current medication
    if ((msg.includes('taking') && msg.includes('medication')) || (msg.includes('taking') && msg.includes('medicine')) || (msg.includes('currently') && msg.includes('medic')) || msg.includes('on any medication'))
      return triageT('voice.questions.medication')
    // Age
    if (msg.includes('how old') || msg.includes('your age') || (msg.includes('age') && msg.includes('?')))
      return triageT('voice.questions.age')
    // Pain scale
    if (msg.includes('scale') || msg.includes('1 to 10') || msg.includes('rate the pain') || msg.includes('rate your pain') || msg.includes('severity of'))
      return triageT('voice.questions.painScale')
    // Had before / previous
    if (msg.includes('experienced this before') || msg.includes('happened before') || msg.includes('had this before') || msg.includes('first time'))
      return triageT('voice.questions.hadBefore')
    // Swelling
    if (msg.includes('swell') || msg.includes('swollen'))
      return triageT('voice.questions.swelling')
    // Headache
    if (msg.includes('headache') || msg.includes('head pain') || msg.includes('head ache'))
      return triageT('voice.questions.headache')
    // Nausea / vomiting
    if (msg.includes('nausea') || msg.includes('nauseous') || msg.includes('vomit') || msg.includes('throwing up'))
      return triageT('voice.questions.nausea')
    // Eaten today
    if (msg.includes('eaten') || (msg.includes('eat') && msg.includes('today')) || msg.includes('food today') || msg.includes('last meal'))
      return triageT('voice.questions.eaten')
    // Existing conditions / medical history
    if (msg.includes('existing') || msg.includes('medical condition') || msg.includes('medical history') || msg.includes('pre-existing') || msg.includes('underlying'))
      return triageT('voice.questions.conditions')
    // When did symptoms start
    if ((msg.includes('when') && msg.includes('start')) || msg.includes('when did') || msg.includes('onset'))
      return triageT('voice.questions.whenStart')
    // Pregnant
    if (msg.includes('pregnant') || msg.includes('pregnancy'))
      return triageT('voice.questions.pregnant')
    // Chest pain
    if (msg.includes('chest') && (msg.includes('pain') || msg.includes('tight') || msg.includes('pressure') || msg.includes('discomfort')))
      return triageT('voice.questions.chestPain')
    // Tell me more
    if (msg.includes('tell me more') || msg.includes('more detail') || msg.includes('more about') || msg.includes('elaborate') || msg.includes('explain more') || msg.includes('provide more'))
      return triageT('voice.questions.tellMore')
    // Anyone with you
    if (msg.includes('anyone with you') || msg.includes('someone with you') || msg.includes('alone') || msg.includes('somebody near'))
      return triageT('voice.questions.anyoneWith')
    // Taken medication for this
    if ((msg.includes('taken') && msg.includes('medic')) || (msg.includes('taken') && msg.includes('anything for')) || msg.includes('self-medicated') || msg.includes('tried any'))
      return triageT('voice.questions.takenMeds')
    // Diarrhea
    if (msg.includes('diarr') || msg.includes('loose stool') || msg.includes('watery stool') || msg.includes('running stomach'))
      return triageT('voice.questions.diarrhea')
    // Rash / skin
    if (msg.includes('rash') || (msg.includes('skin') && (msg.includes('change') || msg.includes('itch') || msg.includes('bump'))))
      return triageT('voice.questions.rash')
    // Injury / accident
    if (msg.includes('injur') || msg.includes('accident') || msg.includes('fell') || msg.includes('trauma') || msg.includes('hit your'))
      return triageT('voice.questions.injury')
    // Vision changes
    if (msg.includes('vision') || msg.includes('blurr') || (msg.includes('eye') && (msg.includes('change') || msg.includes('problem'))) || msg.includes('seeing well'))
      return triageT('voice.questions.visionChange')
    // Bleeding
    if (msg.includes('bleed') || msg.includes('blood'))
      return triageT('voice.questions.bleeding')
    // Appetite
    if (msg.includes('appetite') || msg.includes('hungry') || msg.includes('loss of appetite'))
      return triageT('voice.questions.appetite')
    // Sleep
    if (msg.includes('sleep') || msg.includes('insomnia') || msg.includes('rest well'))
      return triageT('voice.questions.sleep')
    // Urination
    if (msg.includes('urinat') || msg.includes('urine') || msg.includes('peeing') || msg.includes('urinary'))
      return triageT('voice.questions.urination')
    // Cough
    if (msg.includes('cough') || msg.includes('coughing'))
      return triageT('voice.questions.cough')
    // Soreness / body aches
    if (msg.includes('sore') || msg.includes('body ache') || msg.includes('body pain') || msg.includes('muscle pain') || msg.includes('aching'))
      return triageT('voice.questions.soreness')
    // Chronic illness
    if (msg.includes('diabet') || msg.includes('hypertension') || msg.includes('chronic') || msg.includes('blood pressure') || msg.includes('sugar level'))
      return triageT('voice.questions.chronicIllness')
    // Pain type (sharp, dull, burning, throbbing)
    if ((msg.includes('type') && msg.includes('pain')) || msg.includes('sharp') || msg.includes('throbbing') || (msg.includes('burning') && msg.includes('pain')) || msg.includes('nature of'))
      return triageT('voice.questions.painType')
    // Thank you / acknowledgment
    if (msg.includes('thank you') || msg.includes('thanks'))
      return triageT('voice.questions.thankYou')
    // Understood / I see
    if (msg.includes('i understand') || msg.includes('i see') || msg.includes('understood') || msg.includes('got it'))
      return triageT('voice.questions.understood')
    // Noted
    if (msg.includes('noted') || msg.includes('i have noted') || msg.includes('alright'))
      return triageT('voice.questions.noted')
    // Sorry / empathy
    if (msg.includes('sorry to hear') || msg.includes('i\'m sorry') || msg.includes('that must'))
      return triageT('voice.questions.sorry')
    // Emergency warning
    if (msg.includes('emergency') || msg.includes('seek help immediately') || msg.includes('call emergency') || msg.includes('urgent'))
      return triageT('voice.questions.emergency')
    // Follow up / more detail
    if (msg.includes('more detail') || msg.includes('elaborate') || msg.includes('bit more') || msg.includes('explain further'))
      return triageT('voice.questions.followUp')
    // Weight
    if (msg.includes('weight') || msg.includes('how much do you weigh') || msg.includes('how heavy'))
      return triageT('voice.questions.weight')
    // Gender
    if (msg.includes('gender') || msg.includes('male or female') || msg.includes('man or woman') || msg.includes('sex'))
      return triageT('voice.questions.gender')
    // Water / hydration
    if (msg.includes('water') || msg.includes('hydrat') || msg.includes('fluid') || msg.includes('drinking enough'))
      return triageT('voice.questions.water')
    // Travel
    if (msg.includes('travel') || msg.includes('trip') || msg.includes('journey') || msg.includes('been abroad'))
      return triageT('voice.questions.travel')
    // Contact with sick person
    if (msg.includes('contact') && (msg.includes('sick') || msg.includes('ill') || msg.includes('infected')))
      return triageT('voice.questions.contactSick')
    // Stress
    if (msg.includes('stress') || msg.includes('anxi') || msg.includes('worried') || msg.includes('mental'))
      return triageT('voice.questions.stress')
    // Surgery
    if (msg.includes('surgery') || msg.includes('operation') || msg.includes('surgical'))
      return triageT('voice.questions.surgery')
    // Smoking / alcohol
    if (msg.includes('smok') || msg.includes('alcohol') || msg.includes('drink') || msg.includes('tobacco'))
      return triageT('voice.questions.smoking')
    // Family history
    if (msg.includes('family') && (msg.includes('history') || msg.includes('condition') || msg.includes('similar') || msg.includes('anyone')))
      return triageT('voice.questions.familyHistory')

    // ===== CATCH-ALL =====
    // If we got here, the message is in English and didn't match any pattern.
    // Detect English by checking that text is mostly ASCII with question-like structure.
    const asciiRatio = (msg.match(/[a-z]/g) || []).length / msg.length
    if (asciiRatio > 0.7) {
      // This is clearly English — replace with a generic translated "tell me more" 
      return triageT('voice.questions.fallbackAsk')
    }

    return message
  }

  const activeQuestion: TriageQuestion | null = currentAIMessage && !consultationComplete
    ? { id: String(currentAIMessageSeq), question: localizeServerQuestion(rawAIMessageRef.current ?? currentAIMessage) }
    : null

  // Browser speech synthesis as a fallback when the cloud voice (YarnGPT/OpenAI) is unavailable.
  // Returns false when this device has no voice for the language, so the caller can say so
  // instead of reading Yoruba/Hausa/Igbo text with an English voice.
  const speakWithBrowser = (text: string, language: LanguageCode, rate: number, onEnd?: () => void): boolean => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return false

    const wanted = language === 'pcm' ? 'en' : language
    const voices = window.speechSynthesis.getVoices()
    const voice =
      voices.find((v) => v.lang.toLowerCase().startsWith(`${wanted}-ng`)) ??
      voices.find((v) => v.lang.toLowerCase().startsWith(wanted))
    if (!voice) return false

    const utterance = new SpeechSynthesisUtterance(text)
    utterance.voice = voice
    utterance.lang = voice.lang
    utterance.rate = rate
    utterance.onend = () => onEnd?.()
    utterance.onerror = () => onEnd?.()
    window.speechSynthesis.cancel()
    window.speechSynthesis.speak(utterance)
    return true
  }

  const stopSpeaking = () => {
    speechTokenRef.current += 1
    audioRef.current?.pause()
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) window.speechSynthesis.cancel()
  }

  // `force` is for explicit user actions (Play button) and safety messages; automatic
  // narration respects the Audio Autoplay / Read Prompts settings.
  const speakText = async (text: string, onEndRaw?: () => void, languageOverride?: LanguageCode, force = false) => {
    // One voice at a time: whatever was talking stops, and its late-arriving audio never plays.
    stopSpeaking()
    const token = speechTokenRef.current
    const onEnd = onEndRaw ? () => { if (token === speechTokenRef.current) onEndRaw() } : undefined
    if (!text.trim()) {
      onEnd?.()
      return
    }

    const prefs = readStoredSettings()
    const allowAudio = force || (prefs.audioAutoplay ?? true) || !!prefs.readPrompts
    if (!allowAudio) {
      onEnd?.()
      return
    }

    const speechLanguage = languageOverride ?? consultationLanguageRef.current
    const speechLangConfig = LANGUAGE_CONFIG[speechLanguage] ?? LANGUAGE_CONFIG.en

    // The cloud voice (YarnGPT via the backend) is the product's voice and covers all five
    // languages; the browser's own voice is the fallback if it is unavailable.
    const browserRate = VOICE_SPEED_RATE[prefs.voiceSpeed ?? 'normal'] ?? 1

    try {
      if (Date.now() < cloudTtsDownUntil) throw new Error('cloud tts cooling down')
      // Short pieces, all requested at once; piece 1 plays the moment it is ready while the rest load behind it.
      const pieces = splitForSpeech(text, 180)
      const startedAt = performance.now()
      const requests = pieces.map((piece) => fetchTtsUrl(piece, speechLangConfig.apiLanguage, getPreferredTtsVoice()))
      requests.slice(1).forEach((r) => r.catch(() => null))
      const firstUrl = await requests[0]
      if (token !== speechTokenRef.current) return
      console.debug(`[voice] first piece ready in ${Math.round(performance.now() - startedAt)}ms (${pieces.length} pieces)`)

      if (firstUrl) {
        const playbackRate = VOICE_SPEED_RATE[prefs.voiceSpeed ?? 'normal'] ?? 1
        const playAt = async (index: number, knownUrl?: string | null) => {
          if (token !== speechTokenRef.current) return
          if (index >= pieces.length) {
            onEnd?.()
            return
          }
          const url = knownUrl !== undefined ? knownUrl : await requests[index].catch(() => null)
          if (token !== speechTokenRef.current) return
          if (!url) {
            void playAt(index + 1)
            return
          }
          const audio = new Audio(url)
          audio.preload = 'auto'
          audio.playbackRate = playbackRate
          audioRef.current = audio
          if (index === 0) audio.onplaying = () => { console.debug(`[voice] audio started after ${Math.round(performance.now() - startedAt)}ms`); audio.onplaying = null }
          audio.onended = () => { void playAt(index + 1) }
          audio.onerror = () => { void playAt(index + 1) }
          audio.play().catch(() => onEnd?.())
        }
        void playAt(0, firstUrl)
        return
      }
    } catch (err) {
      if (Date.now() >= cloudTtsDownUntil) cloudTtsDownUntil = Date.now() + CLOUD_TTS_COOLDOWN_MS
      void err
    }

    if (token !== speechTokenRef.current) return

    // Cloud voice failed: the browser's own voice is the fallback.
    if (speakWithBrowser(text, speechLanguage, browserRate, onEnd)) {
      setVoiceNotice(null)
      return
    }

    // Neither voice is available: tell the user why it is silent.
    setVoiceNotice(t('voice.voiceOutputUnavailable'))
    onEnd?.()
  }

  const triggerHaptics = (pattern: number | number[]) => {
    if ('vibrate' in navigator) {
      navigator.vibrate(pattern)
    }
  }

  const getEmergencyContactList = () => getEmergencyContacts()

  const dialNumber = (phone: string) => {
    window.location.href = `tel:${phone}`
  }

  const smsNumber = (phone: string) => {
    const emergencyMessage = encodeURIComponent('ALAVIA AI emergency request. Please assist immediately.')
    window.location.href = `sms:${phone}?body=${emergencyMessage}`
  }

  const activateEmergencyMode = () => {
    setIsEmergencyMode(true)
    setShowEmergencyPanel(true)
    stopListening()
    void speakText(t('voice.emergencyModeActivated'), undefined, undefined, true)

    // Honour Profile → Safety → Emergency Button Action. 'app' just opens the panel.
    const primary = getEmergencyContactList()[0]?.phone ?? '112'
    const behavior = readStoredSettings().emergencyButtonBehavior ?? 'call'
    if (behavior === 'call') dialNumber(primary)
    else if (behavior === 'sms') smsNumber(primary)
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
  // The backend picks the language from the request; no instruction text is added to what the person says.
  const langInstruction = (_langName: string, _langCode: LanguageCode) => ''

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
        guidedRef.current = !!res.guided
        setIsGuided(!!res.guided)
        setAnswerType(res.answer_type ?? null)
        rawAIMessageRef.current = res.message.content
        const localizedMsg = localizeServerQuestion(res.message.content)
        // Brief pause so the "thinking" indicator is visible before the first question
        await new Promise(r => setTimeout(r, 300))
        setCurrentAIMessage(localizedMsg)
        setCurrentAIMessageSeq(1)
        setAIResponse({ heading: t('voice.responseHeading'), summary: stripSystemPrefix(message) })
        void speakText(localizedMsg, undefined, startLang)
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
      
      guidedRef.current = !!res.guided
      if (!isComplete && res.message.content) {
        // Translate and start audio playback immediately
        const localizedMsg = localizeServerQuestion(res.message.content)
        void speakText(localizedMsg, undefined, sessionLang)
      }
      
      guidedRef.current = !!res.guided
      setIsGuided(!!res.guided)
      setAnswerType(res.answer_type ?? null)
      rawAIMessageRef.current = res.message.content
      setCurrentAIMessage(localizeServerQuestion(res.message.content))
      setCurrentAIMessageSeq(prev => prev + 1)
      if (res.severity) {
        const normalized = normalizeSeverity(res.severity)
        if (normalized) {
          setAIResponse(prev => prev ? { ...prev, severity: normalized } : prev)
        }
      }
      
      if (isComplete) {
        updateConsultationComplete(true)
        // Nothing left to answer: close the typing panel so it doesn't sit over the results.
        conversationModeRef.current = 'voice'
        setConversationMode('voice')
        try {
          const detail = await consultationsApi.detail(id)
          setConsultationDetail(detail.consultation)
          // Alavia checks back later; remember it on this device so a reload doesn't lose it.
          const dueAt = detail.consultation.follow_up_due_at ?? res.follow_up_due_at
          if (dueAt) {
            followUps.schedule({
              consultationId: detail.consultation.id,
              dueAt,
              severity: detail.consultation.severity,
              guestToken: guestSession.isActive() ? guestSession.getToken() ?? undefined : undefined,
            })
          }
          if (detail.consultation.summary) {
            setAIResponse(prev => prev ? {
              ...prev,
              summary: stripSystemPrefix(detail.consultation.summary),
            } : {
              heading: t('voice.responseHeading'),
              summary: stripSystemPrefix(detail.consultation.summary),
            })
          }
          const completeLang = consultationLanguageRef.current
          const completeLangT = i18n.getFixedT(completeLang)
          let sev: Severity | undefined
          if (detail.consultation.severity) {
            sev = normalizeSeverity(detail.consultation.severity)
            if (sev) {
              setAIResponse(prev => prev ? { ...prev, severity: sev } : prev)
            }
          }
          // Speak the summary + first aid steps: the AI's own words when it wrote them,
          // otherwise the curated translations for this language.
          const sevKey = sev ?? 'medium'
          const aiSummary = res.guided ? stripSystemPrefix(detail.consultation.summary ?? '') : ''
          const aiSteps = res.guided ? (detail.consultation.first_aid ?? []) : []
          const summaryText = aiSummary || (completeLangT(`voice.summaries.${sevKey}`) as string)
          const firstAidSteps = aiSteps.length
            ? aiSteps
            : (completeLangT(`voice.firstAid.${sevKey}`, { returnObjects: true }) as string[])
          // Show it on screen too, not the backend's raw English line.
          if (summaryText) {
            setAIResponse(prev => prev ? { ...prev, summary: summaryText } : {
              heading: t('voice.responseHeading'),
              summary: summaryText,
            })
          }
          const spokenText = [summaryText, ...firstAidSteps].join('. ')
          void speakText(spokenText, undefined, completeLang)
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

  // Clears the finished conversation so the next voice/typed input starts a fresh check.
  const resetConversation = () => {
    updateConsultationId(null)
    const nextLang = normalizeLanguageCode(localStorage.getItem('alavia.selectedLanguage') || i18n.language || selectedLanguage)
    consultationLanguageRef.current = nextLang
    setConsultationLanguage(nextLang)
    setCurrentAIMessage(null)
    rawAIMessageRef.current = null
    setCurrentAIMessageSeq(0)
    setConsultationDetail(null)
    guidedRef.current = false
    setIsGuided(false)
    setAnswerType(null)
    updateConsultationComplete(false)
    setAIResponse(null)
    setApiError(null)
    setTranscript('')
    setInterimTranscript('')
  }

  const submitInputIntoFlow = (value: string, source: 'voice' | 'keyboard' = 'voice') => {
    const cleaned = value.trim()
    if (!cleaned) return
    stopSpeaking()
    if (shouldKeepListeningRef.current) stopListening()
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
      if (isComplete) resetConversation()
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
    sessionSubmittedRef.current = true
    lastSubmittedVoiceRef.current = { text: finalText, at: now }
    submitInputIntoFlow(finalText, 'voice')
  }

  // Watches the mic level so a tap-to-speak recording ends by itself ~2s after the person stops
  // talking (or after 12s of silence), instead of needing a second tap.
  const stopVoiceActivity = () => {
    if (vadTimerRef.current !== null) {
      window.clearInterval(vadTimerRef.current)
      vadTimerRef.current = null
    }
    void audioCtxRef.current?.close().catch(() => undefined)
    audioCtxRef.current = null
  }

  const startVoiceActivity = (stream: MediaStream) => {
    stopVoiceActivity()
    const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!Ctx) return
    try {
      const ctx = new Ctx()
      const analyser = ctx.createAnalyser()
      analyser.fftSize = 512
      ctx.createMediaStreamSource(stream).connect(analyser)
      const buf = new Uint8Array(analyser.fftSize)
      const startedAt = Date.now()
      let heardVoice = false
      let lastVoiceAt = startedAt
      vadTimerRef.current = window.setInterval(() => {
        analyser.getByteTimeDomainData(buf)
        let sum = 0
        for (const v of buf) {
          const x = (v - 128) / 128
          sum += x * x
        }
        const now = Date.now()
        if (Math.sqrt(sum / buf.length) > 0.04) {
          heardVoice = true
          lastVoiceAt = now
        }
        if (inputModeRef.current !== 'tap' || !shouldKeepListeningRef.current) return
        if ((heardVoice && now - lastVoiceAt > 2000) || (!heardVoice && now - startedAt > 12000)) {
          stopListening()
        }
      }, 120)
      audioCtxRef.current = ctx
    } catch {
      // no level meter: the manual stop and the 9s inactivity stop still work
    }
  }

  const startRecorder = (stream: MediaStream) => {
    if (typeof MediaRecorder === 'undefined') return
    try {
      const chunks: Blob[] = []
      const recorder = new MediaRecorder(stream)
      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data) }
      recorder.onstop = () => {
        recorderRef.current = null
        // Give the browser recognition a moment to deliver its own result first.
        window.setTimeout(() => {
          if (sessionSubmittedRef.current || !chunks.length) return
          const blob = new Blob(chunks, { type: recorder.mimeType || 'audio/webm' })
          if (blob.size < 3000) return
          void transcribeOnServer(blob)
        }, 400)
      }
      recorder.start()
      recorderRef.current = recorder
    } catch {
      recorderRef.current = null
    }
  }

  const transcribeOnServer = async (blob: Blob) => {
    setSessionStatus('processing')
    try {
      const ext = blob.type.includes('mp4') ? 'mp4' : blob.type.includes('ogg') ? 'ogg' : 'webm'
      const file = new File([blob], `speech.${ext}`, { type: blob.type })
      const res = await speechApi.stt({ audio: file, language: consultationLanguageRef.current })
      const text = (res.transcript ?? '').trim()
      if (text && !sessionSubmittedRef.current) {
        sessionSubmittedRef.current = true
        isFinalizingVoiceRef.current = true
        lastSubmittedVoiceRef.current = { text, at: Date.now() }
        submitInputIntoFlow(text, 'voice')
        return
      }
      if (!text) setVoiceNotice(t('voice.didNotCatch'))
    } catch {
      setVoiceNotice(t('voice.didNotCatch'))
    } finally {
      setSessionStatus((cur) => (cur === 'processing' && !isFinalizingVoiceRef.current ? 'ready' : cur))
    }
  }

  // Held for the whole listening period so the browser's mic indicator stays steady while
  // the speech engine restarts its own sessions underneath.
  const releaseMicStream = () => {
    stopVoiceActivity()
    micStreamRef.current?.getTracks().forEach((track) => track.stop())
    micStreamRef.current = null
  }

  const stopListening = () => {
    shouldKeepListeningRef.current = false
    if (recorderRef.current?.state === 'recording') recorderRef.current.stop()
    releaseMicStream()
    clearSpeechTimers()
    recognitionRef.current?.stop()
    setIsListening(false)
    setSessionStatus('ready')
    triggerHaptics([10, 20, 10])
  }

  const fetchRoutedHospitals = async (severity?: string | null, specialty?: string | null) => {
    setIsHospitalsLoading(true)
    setHospitalsError(null)
    setLocationNotice(null)

    let lat: number | undefined
    let lng: number | undefined

    const locationAllowed = readStoredSettings().useLocation !== false
    if (!locationAllowed) {
      setUserLocation(null)
      setLocationNotice(t('voice.locationOffNotice'))
    } else if (navigator.geolocation) {
      try {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: false,
            timeout: 8000,
            maximumAge: 300000,
          })
        })
        lat = position.coords.latitude
        lng = position.coords.longitude
        setUserLocation({ lat, lng })
      } catch {
        // No exact position (denied, or the browser has no location service): estimate from the
        // network, else assume central Lagos, so distances still show. The notice says so.
        const approx = await approximateLocation()
        lat = approx.lat
        lng = approx.lng
        setUserLocation({ lat, lng })
        setLocationNotice(t('voice.locationApprox'))
      }
    }

    try {
      const severityCode = (severity ?? '').toUpperCase()
      const response = await hospitalsApi.list({
        lat,
        lng,
        severity: severityCode || undefined,
        specialty: specialty || undefined,
        // No hard emergency_ready filter: OSM data can't confirm it for most places, so the
        // API ranks emergency-capable hospitals first instead of excluding everything else.
      })
      setRoutedHospitals(response.data ?? [])
    } catch (err) {
      setHospitalsError(t('voice.hospitalsLoadFailed'))
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

  const startListening = async () => {
    if (!supportsSpeech) return
    if (isListening || isStartingRef.current) return
    stopSpeaking()
    isStartingRef.current = true

    try {
      // Open the mic once per listening session (prompts only the first time).
      if (!micStreamRef.current) {
        try {
          micStreamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true })
          setMicPermission('granted')
        } catch {
          setMicPermission('denied')
          return
        }
      }

      // Hold mode: the finger was released while we were waiting on permission.
      if (inputModeRef.current === 'hold' && !holdActiveRef.current) {
        releaseMicStream()
        return
      }

      shouldKeepListeningRef.current = true
      isFinalizingVoiceRef.current = false
      sessionSubmittedRef.current = false
      if (!recorderRef.current && micStreamRef.current) startRecorder(micStreamRef.current)
      if (micStreamRef.current) startVoiceActivity(micStreamRef.current)
      clearSpeechTimers()
      setTranscript('')
      setSessionStatus('listening')
      setInterimTranscript('')
      transcriptRef.current = ''
      interimRef.current = ''

      try {
        if (recognitionActiveRef.current) {
          // The previous session is still winding down (e.g. a quick re-press after release).
          // Abort it; onend sees shouldKeepListening and starts a fresh session.
          recognitionRef.current?.abort()
        } else {
          recognitionRef.current?.start()
        }
      } catch (err) {
        if (!(err instanceof DOMException && err.name === 'InvalidStateError')) {
          console.error('Speech recognition start failed:', err)
        }
      }

      setIsListening(true)
      triggerHaptics(30)
      if (['yo', 'ha', 'ig'].includes(consultationLanguageRef.current)) {
        setVoiceNotice(t('voice.speechBestEffort'))
      } else {
        setVoiceNotice(null)
      }
      if (inputModeRef.current === 'tap') queueInactivityStop()
    } finally {
      isStartingRef.current = false
    }
  }

  const handleSpeakTap = () => {
    if (inputMode === 'hold') return
    if (isListening) {
      stopListening()
      return
    }
    void startListening()
  }

  const handleHoldStart = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (inputMode !== 'hold') return
    if (event.pointerType === 'mouse' && event.button !== 0) return
    // Keep receiving pointerup even if the finger/cursor slides off the button.
    event.currentTarget.setPointerCapture?.(event.pointerId)
    holdActiveRef.current = true
    void startListening()
  }

  const handleHoldEnd = () => {
    if (inputMode !== 'hold') return
    if (!holdActiveRef.current) return
    holdActiveRef.current = false
    if (shouldKeepListeningRef.current) stopListening()
  }

  // Chrome fills the browser voice list asynchronously; touch it early so the TTS fallback has voices.
  useEffect(() => {
    if (!('speechSynthesis' in window)) return
    window.speechSynthesis.getVoices()
    const warm = () => { window.speechSynthesis.getVoices() }
    window.speechSynthesis.addEventListener('voiceschanged', warm)
    return () => window.speechSynthesis.removeEventListener('voiceschanged', warm)
  }, [])

  useEffect(() => {
    transcriptRef.current = transcript
  }, [transcript])

  useEffect(() => {
    interimRef.current = interimTranscript
  }, [interimTranscript])

  useEffect(() => {
    inputModeRef.current = inputMode
    holdActiveRef.current = false
    if (shouldKeepListeningRef.current) stopListening()
  }, [inputMode])

  // When a result arrives: open the tab that matters most for its urgency, and show it from the top.
  useEffect(() => {
    if (!consultationComplete) return
    setResultTab('steps')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [consultationComplete])

  // A new question appears at the top of the screen: make sure it is in view.
  useEffect(() => {
    if (currentAIMessageSeq > 0) window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [currentAIMessageSeq])

  useEffect(() => {
    if (!consultationComplete) {
      setRoutedHospitals([])
      setHospitalsError(null)
      setIsHospitalsLoading(false)
      setLocationNotice(null)
      return
    }

    void fetchRoutedHospitals(consultationDetail?.severity, consultationDetail?.recommended_specialty)
  }, [consultationComplete, consultationDetail?.severity, consultationDetail?.recommended_specialty])

  useEffect(() => {
    if (sessionStatus === 'ready') {
      isFinalizingVoiceRef.current = false
    }
  }, [sessionStatus])

  useEffect(() => {
    // Always keep consultationLanguage in sync with the user's selected language,
    // even during an active consultation, so switching languages mid-triage works.
    const nextLang = normalizeLanguageCode(localStorage.getItem('alavia.selectedLanguage') || i18n.language || selectedLanguage)
    const prevLang = consultationLanguageRef.current
    consultationLanguageRef.current = nextLang
    setConsultationLanguage(nextLang)

    // If language changed during an active consultation with a displayed question,
    // re-translate the current question and re-speak it in the new language.
    if (prevLang !== nextLang && rawAIMessageRef.current && consultationIdRef.current !== null && !consultationCompleteRef.current) {
      const reTranslated = localizeServerQuestion(rawAIMessageRef.current)
      setCurrentAIMessage(reTranslated)
      setCurrentAIMessageSeq(prev => prev + 1) // bump seq to trigger re-speak
      void speakText(reTranslated, undefined, nextLang)
    }
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

      interimRef.current = interim.trim()
      setInterimTranscript(interimRef.current)
      if (finalChunk.trim()) {
        transcriptRef.current = `${transcriptRef.current} ${finalChunk}`.trim()
        setTranscript(transcriptRef.current)
      }
      queueInactivityStop()
    }

    // Chrome ends continuous sessions on its own (silence, ~60s cap, brief network blips).
    // While the user still wants to listen, restart, retrying if the engine hasn't fully
    // shut down yet ("already started"), so a long hold doesn't silently die.
    const scheduleRestart = (delay: number, attempt = 0) => {
      if (restartTimeoutRef.current !== null) window.clearTimeout(restartTimeoutRef.current)
      restartTimeoutRef.current = window.setTimeout(() => {
        restartTimeoutRef.current = null
        if (!shouldKeepListeningRef.current) return
        try {
          recognitionRef.current?.start()
        } catch (err) {
          const alreadyStarted = err instanceof DOMException && err.name === 'InvalidStateError'
          if (alreadyStarted) return // a session is already running; nothing to do
          if (attempt < 10) {
            scheduleRestart(250 * (attempt + 1), attempt + 1)
            return
          }
          shouldKeepListeningRef.current = false
          releaseMicStream()
          setIsListening(false)
          setSessionStatus('ready')
          finalizeCurrentTranscript()
        }
      }, delay)
    }

    recognition.onstart = () => {
      recognitionActiveRef.current = true
      if (!shouldKeepListeningRef.current) return
      setIsListening(true)
      setSessionStatus('listening')
    }

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      const transientError = ['no-speech', 'aborted', 'network'].includes(event.error)

      if (event.error === 'language-not-supported') {
        // This browser can't recognise the chosen language: stop and hand over to typing
        // instead of silently mis-hearing the person.
        shouldKeepListeningRef.current = false
        releaseMicStream()
        clearSpeechTimers()
        setIsListening(false)
        setSessionStatus('ready')
        setVoiceNotice(t('voice.speechUnsupportedLang'))
        conversationModeRef.current = 'keyboard'
        setConversationMode('keyboard')
        return
      }

      // onend always follows an error and handles the restart; just don't tear down here.
      if (shouldKeepListeningRef.current && transientError) return

      shouldKeepListeningRef.current = false
      releaseMicStream()
      clearSpeechTimers()
      setIsListening(false)
      setSessionStatus('ready')
    }

    recognition.onend = () => {
      recognitionActiveRef.current = false
      if (shouldKeepListeningRef.current) {
        scheduleRestart(150)
        return
      }

      setIsListening(false)
      clearSpeechTimers()
      setSessionStatus('ready')
      finalizeCurrentTranscript()
    }

    recognitionRef.current = recognition

    return () => {
      shouldKeepListeningRef.current = false
      recognitionActiveRef.current = false
      if (recorderRef.current) recorderRef.current.onstop = null
      releaseMicStream()
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
  const hasConversation = !!consultationIdRef.current || !!aiResponse || !!activeQuestion || consultationComplete || sessionStatus === 'processing'

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
                {userName ? `${t('voice.greeting')} ${userName.split(' ')[0]}` : isGuest ? t('auth.guestLabel') : t('voice.healthSession')}
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
                {t('voice.exitMode')}
              </button>
            </div>
            {showEmergencyPanel && (
              <div className="mt-3 space-y-2">
                {(getEmergencyContactList().length
                  ? getEmergencyContactList()
                  : [{ id: 'nigeria-112', name: '112', phone: '112', relation: '' }]
                ).map((contact) => (
                  <div key={contact.id} className="flex items-center gap-2 rounded-xl bg-white/70 p-2">
                    <div className="min-w-0 flex-1 px-2">
                      <p className="truncate text-sm font-black text-red-900">{contact.name || contact.phone}</p>
                      <p className="truncate text-xs font-semibold text-red-700/70">
                        {contact.phone}{contact.relation ? ` · ${contact.relation}` : ''}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => dialNumber(contact.phone)}
                      aria-label={`${t('voice.emergencyCallContact')} ${contact.name || contact.phone}`}
                      className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-red-700 px-4 text-sm font-bold text-white"
                    >
                      <PhoneCall size={16} />
                      <span className="hidden sm:inline">{t('voice.emergencyCallContact')}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => smsNumber(contact.phone)}
                      aria-label={`${t('voice.emergencySmsContact')} ${contact.name || contact.phone}`}
                      className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-red-300 bg-white px-4 text-sm font-bold text-red-700"
                    >
                      <MessageCircle size={16} />
                      <span className="hidden sm:inline">{t('voice.emergencySmsContact')}</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </motion.section>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className={`mx-auto max-w-xl px-4 sm:px-6 pt-4 ${consultationComplete ? 'pb-10' : 'pb-64'} relative z-10`}>
        <div className="flex flex-col gap-4 text-left">
          <FollowUpCheckIn onEscalate={activateEmergencyMode} />

          {voiceNotice && (
            <p
              role="status"
              className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-2 text-xs font-bold leading-snug text-amber-800"
            >
              {voiceNotice}
            </p>
          )}

          {!hasConversation && (
            <section className="flex flex-col items-center gap-5 pt-6 text-center">
              <div className="space-y-2">
                <h2 className="text-3xl font-black tracking-tight text-slate-800">
                  {micPermission === 'denied' ? t('voice.micBlocked') : t('voice.speakTitle')}
                </h2>
                <p className={`mx-auto max-w-xs text-base font-bold leading-relaxed ${micPermission === 'denied' ? 'text-red-500' : 'text-slate-400'}`}>
                  {micPermission === 'denied' ? t('voice.micDisabledText') : t('voice.speakHint')}
                </p>
              </div>
              {!supportsSpeech && (
                <p className="flex items-center gap-2 text-sm font-bold text-amber-600">
                  <MicOff size={16} /> {t('voice.browserUnsupported')}
                </p>
              )}
              <div className="grid w-full grid-cols-2 gap-2.5">
                {(['headache', 'fever', 'stomach', 'cough'] as const).map((key) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => submitInputIntoFlow(t(`voice.quick.${key}Msg`), 'voice')}
                    className="min-h-14 rounded-2xl border-2 border-slate-100 bg-white px-4 py-3 text-sm font-black text-slate-700 transition-all active:scale-95 hover:border-emerald-300 hover:bg-emerald-50"
                  >
                    {t(`voice.quick.${key}`)}
                  </button>
                ))}
              </div>
            </section>
          )}

          {hasConversation && !consultationComplete && (
            <>
              {currentTranscript && (
                <div className="ml-auto max-w-[85%] rounded-2xl rounded-br-md bg-emerald-50 px-4 py-3 text-base font-bold leading-snug text-emerald-900">
                  {currentTranscript}
                </div>
              )}

              {apiError && (
                <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-600">{apiError}</p>
              )}

              <motion.div
                key={sessionStatus === 'processing' ? 'thinking' : (activeQuestion?.id ?? 'q')}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative overflow-hidden rounded-[28px] bg-slate-900 p-5 text-white sm:p-7"
              >
                <div className="mb-3 flex items-center justify-between gap-3">
                  <span className="text-[10px] font-black uppercase tracking-[0.25em] text-emerald-400">{t('voice.triageQuestion')}</span>
                  {activeQuestion && sessionStatus !== 'processing' && (
                    <button
                      type="button"
                      onClick={() => { void speakText(activeQuestion.question, undefined, undefined, true) }}
                      aria-label={t('voice.playAudio')}
                      className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition-all active:scale-90 hover:bg-white/20"
                    >
                      <Volume2 size={18} />
                    </button>
                  )}
                </div>
                {sessionStatus === 'processing' || !activeQuestion ? (
                  <div className="flex items-center gap-3 py-2">
                    <Loader2 size={22} className="animate-spin text-emerald-400" />
                    <p className="text-lg font-black text-white/90">{t('voice.thinking')}</p>
                  </div>
                ) : (
                  <h4 className="text-2xl font-black leading-snug tracking-tight text-white sm:text-3xl">{activeQuestion.question}</h4>
                )}
              </motion.div>

              {activeQuestion && sessionStatus !== 'processing' && (() => {
                const isScale = answerType === 'scale' || /\b(0\s*[-–]\s*10|1\s*[-–]\s*10)\b/.test(activeQuestion.question)
                const labels = isScale
                  ? ['0', '2', '4', '6', '8', '10']
                  : answerType === 'yes_no'
                    ? [t('voice.quick.yes'), t('voice.quick.no'), t('voice.quick.notSure')]
                    : []
                if (!labels.length) return null
                return (
                  <div className={isScale ? 'grid grid-cols-6 gap-2' : 'flex flex-wrap gap-2'} data-quick-replies>
                    {labels.map((label) => (
                      <button
                        key={label}
                        type="button"
                        onClick={() => submitInputIntoFlow(label, 'voice')}
                        className="min-h-12 min-w-12 rounded-full border-2 border-slate-200 bg-white px-3 text-base font-black text-slate-700 transition-all active:scale-95 hover:border-emerald-400 hover:bg-emerald-50"
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                )
              })()}
            </>
          )}

          {consultationComplete && (
            <>
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-[28px] border border-slate-100 bg-white p-4 sm:p-5"
              >
                <div className="mb-3 flex items-center justify-between gap-3">
                  {aiResponse?.severity ? (
                    <span className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-[11px] font-black uppercase tracking-widest ${severityStyle[aiResponse.severity].bg} ${severityStyle[aiResponse.severity].text} border ${severityStyle[aiResponse.severity].border}`}>
                      {(() => {
                        const SeverityIcon = severityStyle[aiResponse.severity!].icon
                        return <SeverityIcon size={14} strokeWidth={3} />
                      })()}
                      {t(`severity.${aiResponse.severity}`)}
                    </span>
                  ) : <span />}
                  <button
                    type="button"
                    onClick={() => { void speakText(`${aiResponse?.summary ?? ''}`, undefined, undefined, true) }}
                    aria-label={t('voice.playAudio')}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-slate-900 text-white transition-all active:scale-90"
                  >
                    <Volume2 size={18} />
                  </button>
                </div>
                <p className="text-base font-bold leading-snug text-slate-700">{aiResponse?.summary}</p>
              </motion.div>

              <div className="grid grid-cols-2 gap-1 rounded-full bg-slate-100 p-1">
                {(['steps', 'hospitals'] as const).map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setResultTab(tab)}
                    className={`min-h-11 rounded-full px-4 text-sm font-black transition-all ${resultTab === tab ? 'bg-slate-900 text-white' : 'text-slate-500'}`}
                  >
                    {t(tab === 'hospitals' ? 'voice.tabHospitals' : 'voice.tabSteps')}
                  </button>
                ))}
              </div>

              {resultTab === 'steps' ? (
                <div className="space-y-3">
                  {(() => {
                    const sevKey = aiResponse?.severity ?? 'medium'
                    const aiSteps = isGuided ? consultationDetail?.first_aid ?? [] : []
                    const steps = aiSteps.length
                      ? aiSteps
                      : (t(`voice.firstAid.${sevKey}`, { returnObjects: true }) as string[])
                    return (Array.isArray(steps) ? steps : []).map((step, idx) => (
                      <div key={idx} className="flex items-start gap-3 rounded-2xl border border-slate-100 bg-white px-4 py-3">
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-xs font-black text-white">{idx + 1}</span>
                        <p className="text-[15px] font-bold leading-snug text-slate-700">{step}</p>
                      </div>
                    ))
                  })()}
                  {consultationDetail && (
                    <FeedbackCard
                      consultationId={consultationDetail.id}
                      followUpDueAt={consultationDetail.follow_up_due_at}
                      guestToken={guestSession.isActive() ? guestSession.getToken() ?? undefined : undefined}
                    />
                  )}
                </div>
              ) : (
                <HospitalResultsPanel
                  hospitals={displayHospitals}
                  userLocation={userLocation}
                  isLoading={isHospitalsLoading}
                  error={hospitalsError}
                  notice={locationNotice}
                  severity={consultationDetail?.severity ?? aiResponse?.severity}
                />
              )}

              <button
                type="button"
                onClick={() => { resetConversation(); void startListening() }}
                className="min-h-12 rounded-full border-2 border-slate-200 bg-white px-6 text-sm font-black text-slate-600 transition-all active:scale-95 hover:border-emerald-300"
              >
                {t('voice.newCheck')}
              </button>
            </>
          )}
        </div>
      </main>

      {/* Bottom dock: mic + typing always within thumb reach, never covering the answer above. */}
      {!consultationComplete && (
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-100 bg-white/95 px-4 pt-3 backdrop-blur-xl" style={{ paddingBottom: 'max(12px, env(safe-area-inset-bottom))' }}>
        <div className="mx-auto max-w-xl">
          {conversationMode === 'keyboard' ? (
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                aria-label={t('voice.modeTap')}
                onClick={() => {
                  conversationModeRef.current = 'voice'
                  setConversationMode('voice')
                  setTextInput('')
                }}
                className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition-all active:scale-90"
              >
                <Mic size={20} />
              </button>
              <input
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && textInput.trim() && sessionStatus !== 'processing') submitInlineKeyboardReply()
                }}
                placeholder={t('voice.inputPlaceholder')}
                autoFocus
                className="h-12 min-w-0 flex-1 rounded-full border-2 border-slate-100 bg-slate-50 px-5 text-base font-bold text-slate-800 outline-none transition-all placeholder:font-semibold placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white"
              />
              <button
                type="button"
                onClick={submitInlineKeyboardReply}
                disabled={!textInput.trim() || sessionStatus === 'processing'}
                className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white transition-all active:scale-90 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {sessionStatus === 'processing' ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  conversationModeRef.current = 'keyboard'
                  setConversationMode('keyboard')
                  stopListening()
                }}
                className="inline-flex min-h-12 items-center justify-self-start gap-2 whitespace-nowrap rounded-full bg-slate-100 px-4 text-sm font-black text-slate-700 transition-all active:scale-95"
              >
                <Keyboard size={18} />
                {t('voice.typeShort')}
              </button>

              <div className="flex flex-col items-center gap-1">
                <button
                  type="button"
                  onClick={handleSpeakTap}
                  onPointerDown={handleHoldStart}
                  onPointerUp={handleHoldEnd}
                  onPointerCancel={handleHoldEnd}
                  onContextMenu={(e) => e.preventDefault()}
                  aria-label={isListening ? t('voice.stop') : t('voice.speakTitle')}
                  style={{ touchAction: 'none', WebkitTouchCallout: 'none', userSelect: 'none' }}
                  className={`relative -mt-14 flex h-36 w-36 items-center justify-center rounded-full border-4 border-white transition-all active:scale-95 ${micPermission === 'denied'
                    ? 'bg-red-50 text-red-500'
                    : isListening
                      ? `${isEmergencyMode ? 'bg-red-600' : 'bg-emerald-500'} text-white ring-[12px] ${isEmergencyMode ? 'ring-red-500/20' : 'ring-emerald-500/20'}`
                      : isEmergencyMode ? 'bg-red-600 text-white' : 'bg-emerald-600 text-white'
                    }`}
                >
                  {micPermission === 'denied' ? <MicOff size={60} /> : isListening ? <Square size={46} fill="currentColor" /> : <Mic size={68} />}
                </button>
                <span className="text-[11px] font-black uppercase tracking-widest text-slate-400">
                  {isListening
                    ? t('voice.status.listening')
                    : sessionStatus === 'processing'
                      ? t('voice.status.processing')
                      : inputMode === 'hold' ? t('voice.modeHold') : t('voice.modeTap')}
                </span>
              </div>

              <div
                role="group"
                aria-label={`${t('voice.modeTap')} / ${t('voice.modeHold')}`}
                className="flex flex-col gap-1 justify-self-end rounded-[22px] bg-slate-100 p-1"
              >
                {(['tap', 'hold'] as const).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    role="switch"
                    aria-checked={inputMode === mode}
                    onClick={() => setInputMode(mode)}
                    className={`whitespace-nowrap rounded-full px-2.5 py-2 text-[10px] font-black uppercase tracking-wider transition-all active:scale-95 ${inputMode === mode ? (isEmergencyMode ? 'bg-red-600 text-white' : 'bg-emerald-600 text-white') : 'text-slate-400'}`}
                  >
                    {mode === 'tap' ? t('voice.modeTap') : t('voice.modeHold')}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      )}

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
              {isGuest ? (
                <>
                  <div className="px-4 py-4 border-b border-slate-50 mb-1">
                    <p className="text-sm font-black text-slate-900 truncate">{t('auth.guestLabel')}</p>
                    <p className="mt-1 text-xs font-semibold leading-snug text-slate-400">{t('auth.guestBanner')}</p>
                  </div>
                  <button
                    onClick={() => { setShowUserDropdown(false); onSignIn?.() }}
                    className="mb-1 flex w-full items-center justify-center rounded-full bg-emerald-600 px-4 py-3 text-sm font-bold text-white transition-all hover:bg-emerald-700 active:scale-[0.98]"
                  >
                    {t('auth.guestSignIn')}
                  </button>
                  <button
                    onClick={() => { setShowUserDropdown(false); onSignUp?.() }}
                    className="mb-1 flex w-full items-center justify-center rounded-full border border-emerald-200 px-4 py-3 text-sm font-bold text-emerald-700 transition-all hover:bg-emerald-50 active:scale-[0.98]"
                  >
                    {t('auth.createAccount')}
                  </button>
                </>
              ) : (
                <div className="px-4 py-4 border-b border-slate-50 mb-1">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">{t('common.loggedInAs')}</p>
                  <p className="text-sm font-black text-slate-900 truncate">{userName || t('common.user')}</p>
                </div>
              )}

              {!isGuest && (
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
              )}

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
                {isGuest ? t('auth.guestExit') : t('auth.logout')}
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

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
