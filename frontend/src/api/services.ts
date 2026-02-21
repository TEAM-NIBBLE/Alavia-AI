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

