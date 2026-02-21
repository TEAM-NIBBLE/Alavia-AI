import { apiRequest, authTokenStorage } from './client'
import { API } from './endpoints'

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

export interface AuthResponse {
  user: { id: number; email: string; name?: string; phone?: string }
  token: string
}

export interface LoginPayload {
  email: string
  password: string
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

export const authApi = {
  async register(payload: RegisterPayload) {
    const result = await apiRequest<AuthResponse>(API.auth.register, { method: 'POST', body: payload })
    authTokenStorage.set(result.token)
    return result
  },
  async login(payload: LoginPayload) {
    const result = await apiRequest<AuthResponse>(API.auth.login, { method: 'POST', body: payload })
    authTokenStorage.set(result.token)
    return result
  },
  async logout() {
    const token = authTokenStorage.get()
    const result = await apiRequest<{ status: string }>(API.auth.logout, { method: 'POST', token })
    authTokenStorage.clear()
    return result
  },
  async forgotPassword(email: string) {
    return apiRequest<{ reset_token: string }>(API.auth.forgotPassword, {
      method: 'POST',
      body: { email },
    })
  },
}

export const userApi = {
  async getProfile() {
    const token = authTokenStorage.get()
    return apiRequest<UserProfile>(API.user.profile, { method: 'GET', token })
  },
  async updateProfile(payload: ProfilePatchPayload) {
    const token = authTokenStorage.get()
    return apiRequest<{ user: { id: number; email: string; name?: string } }>(API.user.profile, {
      method: 'PATCH',
      body: payload,
      token,
    })
  },
}

export interface HospitalsQuery {
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

function toQueryString(params: Record<string, string | number | boolean | undefined>) {
  const query = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value == null || value === '') return
    query.set(key, String(value))
  })
  const output = query.toString()
  return output ? `?${output}` : ''
}

export const hospitalsApi = {
  list(params: HospitalsQuery = {}) {
    return apiRequest<{ data: Array<{ id: number; name: string; lat: number; lng: number; distance_km?: number }> }>(
      `${API.hospitals.list}${toQueryString(params)}`
    )
  },
  detail(id: string | number) {
    return apiRequest<{ data: { id: number; name: string; lat: number; lng: number } }>(API.hospitals.detail(id))
  },
}

export const consultationsApi = {
  start(initial_message?: string) {
    const token = authTokenStorage.get()
    return apiRequest<{
      consultation_id: number
      message: { id: number; role: string; content: string }
    }>(API.consultations.start, {
      method: 'POST',
      token,
      body: initial_message ? { initial_message } : {},
    })
  },
  sendMessage(id: string | number, content: string) {
    const token = authTokenStorage.get()
    return apiRequest<{
      consultation_id: number
      status: string
      severity: string | null
      message: { id: number; role: string; content: string }
    }>(API.consultations.message(id), {
      method: 'POST',
      token,
      body: { content },
    })
  },
  detail(id: string | number) {
    const token = authTokenStorage.get()
    return apiRequest<{
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
      messages: Array<{ id: number; role: string; content: string }>
    }>(API.consultations.detail(id), { token })
  },
  history() {
    const token = authTokenStorage.get()
    return apiRequest<{
      data: Array<{ id: number; status: string; severity: string | null; category: string; summary: string }>
    }>(API.consultations.history, { token })
  },
  delete(id: string | number) {
    const token = authTokenStorage.get()
    return apiRequest<{ status: string }>(API.consultations.delete(id), {
      method: 'DELETE',
      token,
    })
  },
}

export const speechApi = {
  stt(payload: { audio: File; language?: string }) {
    const body = new FormData()
    body.append('audio', payload.audio)
    if (payload.language) body.append('language', payload.language)
    return apiRequest<{ transcript: string }>(API.speech.stt, {
      method: 'POST',
      body,
    })
  },
  tts(payload: { text: string; language?: string; voice?: string }) {
    return apiRequest<{ audio_url: string }>(API.speech.tts, {
      method: 'POST',
      body: payload,
    })
  },
}

export const adminApi = {
  login(payload: { email: string; password: string }) {
    return apiRequest<{
      admin: { id: number; email: string; role: string }
      token: string
    }>(API.admin.login, {
      method: 'POST',
      body: payload,
    })
  },
  listHospitals(adminToken: string) {
    return apiRequest<{ data: Array<{ id: number; name: string }> }>(API.admin.hospitals, {
      token: adminToken,
    })
  },
  createHospital(
    payload: { osm_type: string; osm_id: number; name: string; lat: number; lng: number; state: string },
    adminToken: string
  ) {
    return apiRequest<{ data: { id: number; name: string } }>(API.admin.hospitals, {
      method: 'POST',
      token: adminToken,
      body: payload,
    })
  },
  patchHospital(id: string | number, payload: Record<string, unknown>, adminToken: string) {
    return apiRequest<{ data: Record<string, unknown> }>(API.admin.hospitalDetail(id), {
      method: 'PATCH',
      token: adminToken,
      body: payload,
    })
  },
  deleteHospital(id: string | number, adminToken: string) {
    return apiRequest<{ status: string }>(API.admin.hospitalDetail(id), {
      method: 'DELETE',
      token: adminToken,
    })
  },
  setSpecialties(id: string | number, specialties: string[], adminToken: string) {
    return apiRequest<{ status: string }>(API.admin.hospitalSpecialties(id), {
      method: 'POST',
      token: adminToken,
      body: { specialties },
    })
  },
  setFacilities(id: string | number, facilities: string[], adminToken: string) {
    return apiRequest<{ status: string }>(API.admin.hospitalFacilities(id), {
      method: 'POST',
      token: adminToken,
      body: { facilities },
    })
  },
  analyticsOverview(adminToken: string) {
    return apiRequest<{
      users: number
      consultations: number
      severity_breakdown: Record<string, number>
      last_7_days: Record<string, number>
    }>(API.admin.analyticsOverview, {
      token: adminToken,
    })
  },
}
