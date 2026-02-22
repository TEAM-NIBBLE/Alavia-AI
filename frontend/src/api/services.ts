import { ApiError, apiRequest, authTokenStorage } from './client'
import { API } from './endpoints'

const getToken = () => authTokenStorage.get()
const YARN_TTS_ENDPOINT = import.meta.env.VITE_YARNGPT_TTS_ENDPOINT || 'https://yarngpt.ai/api/v1/tts'
const YARN_TTS_API_KEY = import.meta.env.VITE_VOICE_MODEL_API || import.meta.env.VITE_VOICE_MODEL_API_KEY || ''

function toQueryString(params: Record<string, string | number | boolean | undefined>) {
  const search = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return
    search.set(key, String(value))
  })
  const query = search.toString()
  return query ? `?${query}` : ''
}

export interface RegisterPayload {
  name: string
  email: string
  phone: string
  password: string
  password_confirmation: string
  language: string
  emergency_contact_name: string
  emergency_contact_phone: string
}

export interface LoginPayload {
  email: string
  password: string
}

export interface AuthResponse {
  user: { id: number; email: string; name?: string; phone?: string }
  token: string
}

export interface ForgotPasswordResponse {
  reset_token: string
}

export interface ResetPasswordPayload {
  email: string
  token: string
  password: string
  password_confirmation: string
}

export interface StatusOkResponse {
  status: string
}

export interface UserProfile {
  id: number
  name: string
  email: string
  phone: string
  language: string
  emergency_contact_name: string
  emergency_contact_phone: string
  created_at: string
  updated_at: string
}

export interface ProfilePatchPayload {
  name?: string
  phone?: string
  language?: string
  emergency_contact_name?: string
  emergency_contact_phone?: string
}

export interface ProfilePatchResponse {
  user: {
    id: number
    email: string
    name?: string
  }
}

export interface HospitalsQuery {
  [key: string]: string | number | boolean | undefined
  lat?: number
  lng?: number
  specialty?: string
  facility?: string
  severity?: string
  is_public?: boolean
  is_24_hours?: boolean
  emergency_ready?: boolean
  min_rating?: number
}

export interface HospitalListItem {
  id: number
  name: string
  lat: number
  lng: number
  distance_km?: number
  address?: string
  phone?: string
  is_public?: boolean
  isEmergencyReady?: boolean
  emergency_ready?: boolean
  specialties?: string[]
  facilities?: string[]
  openHours?: string
  open_hours?: string
  city?: string
  area?: string
  rating?: number
  is_24_hours?: boolean
}

export interface HospitalListResponse {
  data: HospitalListItem[]
}

export interface HospitalDetailResponse {
  data: {
    id: number
    name: string
    lat: number
    lng: number
  }
}

export interface ConsultationStartResponse {
  consultation_id: number
  message: { id: number; role: 'AI' | 'USER' | string; content: string }
}

export interface ConsultationMessageResponse {
  consultation_id: number
  status: string
  severity: string | null
  message: { id: number; role: 'AI' | 'USER' | string; content: string }
}

export interface ConsultationDetailResponse {
  consultation: {
    id: number
    status: string
    severity: string | null
    category: string
    recommended_specialty: string
    first_aid: string[]
    warnings: string[]
    summary: string
  }
  messages: Array<{ id: number; role: 'AI' | 'USER' | string; content: string }>
}

export interface ConsultationHistoryItem {
  id: number
  status: string
  severity: string | null
  category: string
  summary: string
}

export interface ConsultationHistoryResponse {
  data: ConsultationHistoryItem[]
}

export interface SttResponse {
  transcript: string
}

export interface TtsPayload {
  text: string
  language?: string
  voice?: string
  response_format?: 'mp3' | 'wav' | 'opus' | 'flac'
}

export interface TtsResponse {
  audio_url: string
}

export interface AdminLoginPayload {
  email: string
  password: string
}

export interface AdminLoginResponse {
  admin: { id: number; email: string; role: string }
  token: string
}

export interface AdminHospitalCreatePayload {
  osm_type: string
  osm_id: number
  name: string
  lat: number
  lng: number
  state: string
}

export interface AdminHospitalResponse {
  data: { id: number; name?: string; [key: string]: unknown }
}

export interface AdminHospitalsResponse {
  data: Array<{ id: number; name: string }>
}

export interface AdminAnalyticsResponse {
  users: number
  consultations: number
  severity_breakdown: Record<string, number>
  last_7_days: Record<string, number>
}

export const authApi = {
  async register(payload: RegisterPayload) {
    const result = await apiRequest<AuthResponse>(API.auth.register, {
      method: 'POST',
      body: payload,
    })
    authTokenStorage.set(result.token)
    return result
  },

  async login(payload: LoginPayload) {
    const result = await apiRequest<AuthResponse>(API.auth.login, {
      method: 'POST',
      body: payload,
    })
    authTokenStorage.set(result.token)
    return result
  },

  async logout() {
    const result = await apiRequest<StatusOkResponse>(API.auth.logout, {
      method: 'POST',
      token: getToken(),
    })
    authTokenStorage.clear()
    return result
  },

  forgotPassword(email: string) {
    return apiRequest<ForgotPasswordResponse>(API.auth.forgotPassword, {
      method: 'POST',
      body: { email },
    })
  },

  resetPassword(payload: ResetPasswordPayload) {
    return apiRequest<StatusOkResponse>(API.auth.resetPassword, {
      method: 'POST',
      body: payload,
    })
  },
}

export const userApi = {
  getProfile() {
    return apiRequest<UserProfile>(API.user.profile, {
      method: 'GET',
      token: getToken(),
    })
  },

  updateProfile(payload: ProfilePatchPayload) {
    return apiRequest<ProfilePatchResponse>(API.user.profile, {
      method: 'PATCH',
      body: payload,
      token: getToken(),
    })
  },
}

export const hospitalsApi = {
  list(params: HospitalsQuery = {}) {
    return apiRequest<HospitalListResponse>(`${API.hospitals.list}${toQueryString(params)}`, {
      method: 'GET',
    })
  },

  detail(id: string | number) {
    return apiRequest<HospitalDetailResponse>(API.hospitals.detail(id), {
      method: 'GET',
    })
  },
}

export const consultationsApi = {
  start(initial_message?: string, language?: string) {
    return apiRequest<ConsultationStartResponse>(API.consultations.start, {
      method: 'POST',
      token: getToken(),
      body: { initial_message: initial_message ?? '', language: language ?? 'en' },
    })
  },

  message(id: string | number, content: string, language?: string) {
    return apiRequest<ConsultationMessageResponse>(API.consultations.message(id), {
      method: 'POST',
      token: getToken(),
      body: { content, language: language ?? 'en' },
    })
  },

  detail(id: string | number) {
    return apiRequest<ConsultationDetailResponse>(API.consultations.detail(id), {
      method: 'GET',
      token: getToken(),
    })
  },

  history() {
    return apiRequest<ConsultationHistoryResponse>(API.consultations.history, {
      method: 'GET',
      token: getToken(),
    })
  },

  delete(id: string | number) {
    return apiRequest<StatusOkResponse>(API.consultations.delete(id), {
      method: 'DELETE',
      token: getToken(),
    })
  },
}

export const speechApi = {
  stt(payload: { audio: File; language?: string }) {
    const formData = new FormData()
    formData.append('audio', payload.audio)
    if (payload.language) formData.append('language', payload.language)
    return apiRequest<SttResponse>(API.speech.stt, {
      method: 'POST',
      body: formData,
    })
  },

  async tts(payload: TtsPayload) {
    if (YARN_TTS_API_KEY) {
      const response = await fetch(YARN_TTS_ENDPOINT, {
        method: 'POST',
        headers: {
          Accept: 'application/json, audio/*',
          'Content-Type': 'application/json',
          Authorization: `Bearer ${YARN_TTS_API_KEY}`,
          'x-api-key': YARN_TTS_API_KEY,
        },
        body: JSON.stringify({
          text: payload.text.slice(0, 2000),
          voice: payload.voice || 'Idera',
          response_format: payload.response_format || 'mp3',
        }),
      })

      if (!response.ok) {
        let message = `TTS request failed with status ${response.status}`
        try {
          const body = await response.json() as { message?: string }
          if (body?.message) message = body.message
        } catch {
          // ignore non-json error payload
        }
        throw new ApiError(message, response.status)
      }

      const contentType = response.headers.get('content-type') ?? ''
      if (contentType.includes('application/json')) {
        const data = await response.json() as { audio_url?: string; url?: string; audio?: string }
        if (data.audio_url) return { audio_url: data.audio_url }
        if (data.url) return { audio_url: data.url }
        if (data.audio) return { audio_url: `data:audio/${payload.response_format || 'mp3'};base64,${data.audio}` }
        throw new ApiError('Invalid TTS JSON response.', 500)
      }

      const blob = await response.blob()
      return { audio_url: URL.createObjectURL(blob) }
    }

    return apiRequest<TtsResponse>(API.speech.tts, {
      method: 'POST',
      body: payload,
    })
  },
}

export const adminApi = {
  login(payload: AdminLoginPayload) {
    return apiRequest<AdminLoginResponse>(API.admin.login, {
      method: 'POST',
      body: payload,
    })
  },

  hospitals(token: string) {
    return apiRequest<AdminHospitalsResponse>(API.admin.hospitals, {
      method: 'GET',
      token,
    })
  },

  createHospital(payload: AdminHospitalCreatePayload, token: string) {
    return apiRequest<AdminHospitalResponse>(API.admin.hospitals, {
      method: 'POST',
      body: payload,
      token,
    })
  },

  updateHospital(id: string | number, payload: Record<string, unknown>, token: string) {
    return apiRequest<AdminHospitalResponse>(API.admin.hospitalDetail(id), {
      method: 'PATCH',
      body: payload,
      token,
    })
  },

  deleteHospital(id: string | number, token: string) {
    return apiRequest<StatusOkResponse>(API.admin.hospitalDetail(id), {
      method: 'DELETE',
      token,
    })
  },

  setSpecialties(id: string | number, specialties: string[], token: string) {
    return apiRequest<StatusOkResponse>(API.admin.hospitalSpecialties(id), {
      method: 'POST',
      body: { specialties },
      token,
    })
  },

  setFacilities(id: string | number, facilities: string[], token: string) {
    return apiRequest<StatusOkResponse>(API.admin.hospitalFacilities(id), {
      method: 'POST',
      body: { facilities },
      token,
    })
  },

  analyticsOverview(token: string) {
    return apiRequest<AdminAnalyticsResponse>(API.admin.analyticsOverview, {
      method: 'GET',
      token,
    })
  },
}
