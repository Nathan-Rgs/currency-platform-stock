import axios from "axios"

export const API_URL = "http://localhost:8000"
const API_BASE_URL = `${API_URL}/api/v1`

export const api = axios.create({
  baseURL: API_BASE_URL,
})

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token")
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Types
export interface Coin {
  id: number
  quantity: number
  year: number
  country: string
  face_value: string
  purchase_price?: number
  estimated_value?: number
  originality: string
  condition?: string
  storage_location?: string
  category?: string
  acquisition_date?: string
  acquisition_source?: string
  notes?: string
  image_url_front?: string
  image_url_back?: string
  owner_id: number
  created_at: string
  updated_at: string
}

export interface CoinCreate {
  quantity?: number
  year: number
  country: string
  face_value: string
  purchase_price?: number
  estimated_value?: number
  originality: string
  condition?: string
  storage_location?: string
  category?: string
  acquisition_date?: string
  acquisition_source?: string
  notes?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  meta: {
    page: number
    page_size: number
    total_items: number
    total_pages: number
  }
}

export interface CoinAuditLog {
  id: number
  coin_id: number | null
  action: string
  delta_quantity: number | null
  before: Record<string, unknown> | null
  after: Record<string, unknown> | null
  note: string | null
  actor_user_id: number | null
  actor_email: string | null
  created_at: string
  coin: Coin | null
}

export interface CoinAdjust {
  delta_quantity: number
  note?: string
}

export interface DashboardSummary {
  total_replicas: number
  total_originals: number
  total_coins: number
  total_countries: number
  total_estimated_value: number
  by_country: { country: string; count: number }[]
  by_year: { year: number; count: number }[]
  by_originality: { originality: string; count: number }[]
}

export interface Token {
  access_token: string;
  token_type: string;
}

export interface LoginResponse {
  token?: Token;
  mfa_required?: boolean;
}

export interface MfaSetupResponse {
  provisioning_uri: string;
}

export interface User {
  id: number;
  email: string;
  display_name: string | null;
  is_mfa_enabled: boolean;
  created_at: string;
  updated_at: string;
}

// Auth API
export const authApi = {
  login: async (username: string, password: string): Promise<LoginResponse> => {
    const formData = new URLSearchParams()
    formData.append("username", username)
    formData.append("password", password)

    const response = await api.post("/auth/login", formData, {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    })
    return response.data
  },

  getMe: async (): Promise<User> => {
    const response = await api.get("/auth/users/me");
    return response.data;
  },

  loginMfa: async (email: string, password: string, totp_code: string): Promise<Token> => {
    const response = await api.post("/auth/login/mfa", { email, password, totp_code })
    return response.data
  },

  register: async (email: string, password: string) => {
    const response = await api.post("/auth/register", { email, password })
    return response.data
  },

  setupMfa: async (): Promise<MfaSetupResponse> => {
    const response = await api.post("/auth/mfa/setup");
    return response.data;
  },

  verifyMfa: async (totp_code: string): Promise<{ detail: string }> => {
    const response = await api.post("/auth/mfa/verify", { totp_code });
    return response.data;
  },

  disableMfa: async (totp_code: string): Promise<{ detail: string }> => {
    const response = await api.post("/auth/mfa/disable", { totp_code });
    return response.data;
  }
}

// Coins API
export const coinsApi = {
  list: async (params?: {
    page?: number
    page_size?: number
    country?: string
    year_from?: number
    year_to?: number
    originality?: string
    search?: string
  }) => {
    const response = await api.get<PaginatedResponse<Coin>>("/coins", {
      params,
    })
    return response.data
  },

  get: async (id: number): Promise<Coin> => {
    const response = await api.get(`/coins/${id}`)
    return response.data
  },

  create: async (data: CoinCreate): Promise<Coin> => {
    const response = await api.post("/coins", data)
    return response.data
  },

  update: async (id: number, data: Partial<CoinCreate>): Promise<Coin> => {
    const response = await api.patch(`/coins/${id}`, data)
    return response.data
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/coins/${id}`)
  },

  uploadImages: async (
    id: number,
    frontImage?: File,
    backImage?: File
  ): Promise<Coin> => {
    const formData = new FormData()
    if (frontImage) formData.append("front_image", frontImage)
    if (backImage) formData.append("back_image", backImage)

    const response = await api.post(`/coins/${id}/upload-images`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    })
    return response.data
  },
}

// Dashboard API
export const dashboardApi = {
  getSummary: async (): Promise<DashboardSummary> => {
    const response = await api.get("/dashboard/summary")
    return response.data
  },
}

// Admin API
export const adminApi = {
  listAuditLogs: async (params?: {
    page?: number
    page_size?: number
    action?: string
    coin_id?: number
    actor_email?: string
    date_from?: string
    date_to?: string
  }) => {
    const response = await api.get<PaginatedResponse<CoinAuditLog>>(
      "/admin/audit-logs",
      { params }
    )
    return response.data
  },

  adjustCoinQuantity: async (
    coinId: number,
    data: CoinAdjust
  ): Promise<Coin> => {
    const response = await api.post(`/admin/coins/${coinId}/adjust`, data)
    return response.data
  },
}
