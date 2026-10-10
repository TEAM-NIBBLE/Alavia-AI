import { ApiError, apiRequest, authTokenStorage } from './client'
import { API } from './endpoints'
import { guestSession } from '../utils/guest'

// A guest session never sends a stale account token; it proves ownership of its own
// consultations with the X-Guest-Token it was given when the consultation started.
const getToken = () => (guestSession.isActive() ? null : authTokenStorage.get())
const guestHeaders = (explicitToken?: string): Record<string, string> => {
  const token = explicitToken ?? (guestSession.isActive() ? guestSession.getToken() : null)
  return token ? { 'X-Guest-Token': token } : {}
}

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
  emergency_contacts?: Array<{ name: string; phone: string; relation?: string }>
  created_at: string
  updated_at: string
}

export interface ProfilePatchPayload {
  name?: string
  phone?: string
  language?: string
  emergency_contact_name?: string
  emergency_contact_phone?: string
  emergency_contacts?: Array<{ name: string; phone: string; relation?: string }>
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
  guest_token?: string
  guided?: boolean
  message: { id: number; role: 'AI' | 'USER' | string; content: string }
}

export interface ConsultationMessageResponse {
  consultation_id: number
  status: string
  severity: string | null
  follow_up_due_at?: string | null
  guided?: boolean
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
    follow_up_due_at?: string | null
    follow_up_outcome?: 'BETTER' | 'SAME' | 'WORSE' | null
    feedback_helpful?: boolean | null
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

  /** Drop any stale account token without calling the API (used when entering guest mode). */
  clearLocalSession() {
    authTokenStorage.clear()
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
  async getProfile() {
    // The API wraps the resource as { data: {...} }.
    const res = await apiRequest<{ data?: UserProfile } & Partial<UserProfile>>(API.user.profile, {
      method: 'GET',
      token: getToken(),
    })
    return (res.data ?? res) as UserProfile
  },

  changePassword(payload: { current_password: string; new_password: string; new_password_confirmation: string }) {
    return apiRequest<StatusOkResponse>(API.user.password, {
      method: 'PUT',
      body: payload,
      token: getToken(),
    })
  },

  deleteAccount() {
    return apiRequest<StatusOkResponse>(API.user.profile, {
      method: 'DELETE',
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
  async start(initial_message?: string, language?: string) {
    const res = await apiRequest<ConsultationStartResponse>(API.consultations.start, {
      method: 'POST',
      token: getToken(),
      body: { initial_message: initial_message ?? '', language: language ?? 'en' },
    })
    if (guestSession.isActive() && res.guest_token) guestSession.setToken(res.guest_token)
    return res
  },

  message(id: string | number, content: string, language?: string) {
    return apiRequest<ConsultationMessageResponse>(API.consultations.message(id), {
      method: 'POST',
      token: getToken(),
      headers: guestHeaders(),
      body: { content, language: language ?? 'en' },
    })
  },

  detail(id: string | number) {
    return apiRequest<ConsultationDetailResponse>(API.consultations.detail(id), {
      method: 'GET',
      token: getToken(),
      headers: guestHeaders(),
    })
  },

  history() {
    return apiRequest<ConsultationHistoryResponse>(API.consultations.history, {
      method: 'GET',
      token: getToken(),
    })
  },

  feedback(id: string | number, helpful: boolean, comment?: string, guestToken?: string) {
    return apiRequest<StatusOkResponse>(API.consultations.feedback(id), {
      method: 'POST',
      token: getToken(),
      headers: guestHeaders(guestToken),
      body: { helpful, comment: comment?.trim() || undefined },
    })
  },

  /** The person's answer to Alavia's check-back. `escalate` is true when they say they are worse. */
  followUp(id: string | number, outcome: 'BETTER' | 'SAME' | 'WORSE', guestToken?: string) {
    return apiRequest<{ status: string; escalate: boolean; severity: string | null }>(API.consultations.followUp(id), {
      method: 'POST',
      token: getToken(),
      headers: guestHeaders(guestToken),
      body: { outcome },
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
