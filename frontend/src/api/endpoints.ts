const API_BASE_URL = import.meta.env.VITE_API_BASE_URL

export const API = {
  baseUrl: API_BASE_URL,
  auth: {
    register: '/api/auth/register',
    login: '/api/auth/login',
    logout: '/api/auth/logout',
    forgotPassword: '/api/auth/forgot-password',
    resetPassword: '/api/auth/reset-password',
  },
  user: {
    profile: '/api/user/profile',
  },
  hospitals: {
    list: '/api/hospitals',
    detail: (id: string | number) => `/api/hospitals/${id}`,
  },
  consultations: {
    start: '/api/consultations/start',
    message: (id: string | number) => `/api/consultations/${id}/message`,
    detail: (id: string | number) => `/api/consultations/${id}`,
    history: '/api/consultations/history',
    delete: (id: string | number) => `/api/consultations/${id}`,
  },
  speech: {
    stt: '/api/speech/stt',
    tts: '/api/speech/tts',
  },
  admin: {
    login: '/api/admin/login',
    hospitals: '/api/admin/hospitals',
    hospitalDetail: (id: string | number) => `/api/admin/hospitals/${id}`,
    hospitalSpecialties: (id: string | number) => `/api/admin/hospitals/${id}/specialties`,
    hospitalFacilities: (id: string | number) => `/api/admin/hospitals/${id}/facilities`,
    analyticsOverview: '/api/admin/analytics/overview',
  },
} as const

export type ApiRoutes = typeof API

