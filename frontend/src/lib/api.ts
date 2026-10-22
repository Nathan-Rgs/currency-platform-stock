import axios from "axios"

export const API_URL: string =
  import.meta.env.VITE_API_URL ?? "http://localhost:8000"
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

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("access_token")
    }
    return Promise.reject(error)
  },
)

// Types
export interface CoinPublic {
  id: number
  title: string
  quantity: number
  year: number
  country: string
  face_value: string
  originality: string
  condition?: string | null
  category?: string | null
  catalog_ref?: string | null
  material?: string | null
  diameter_mm?: number | null
  weight_g?: number | null
  mint_mark?: string | null
  for_sale: boolean
  sale_price?: number | null
  public_description?: string | null
  image_url_front?: string | null
  image_url_back?: string | null
}

export interface CoinFacets {
  countries: string[]
  categories: string[]
  year_min: number | null
  year_max: number | null
}

export interface CoinListParams {
  page?: number
  page_size?: number
  search?: string
  country?: string
  category?: string
  year_from?: number
  year_to?: number
  originality?: "original" | "replica" | "unknown"
  for_sale?: boolean
  sort?: "created_desc" | "year_desc" | "year_asc" | "title_asc"
}

export interface ImportResult {
  inserted: number
  errors: { row: number; message: string }[]
}

export interface Coin {
  id: number
  title: string
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
  for_sale?: boolean
  sale_price?: number | null
  public_description?: string | null
  catalog_ref?: string | null
  material?: string | null
  diameter_mm?: number | null
  weight_g?: number | null
  mint_mark?: string | null
  owner_id: number
  created_at: string
  updated_at: string
}

export interface CoinCreate {
  title: string
  quantity?: number
  year: number
  country: string
  face_value: string
  purchase_price?: number | null
  estimated_value?: number | null
  originality: string
  condition?: string | null
  storage_location?: string | null
  category?: string | null
  acquisition_date?: string | null
  acquisition_source?: string | null
  notes?: string | null
  for_sale?: boolean
  sale_price?: number | null
  public_description?: string | null
  catalog_ref?: string | null
  material?: string | null
  diameter_mm?: number | null
  weight_g?: number | null
  mint_mark?: string | null
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
  total_items: number
  total_pieces: number
  total_countries: number
  total_for_sale: number
  total_estimated_value: number
  total_invested: number
  by_country: { country: string; count: number }[]
  by_year: { year: number; count: number }[]
  by_originality: { originality: string; count: number }[]
  by_category: { category: string; count: number }[]
  recent: Coin[]
}

export interface Token {
  access_token: string
  token_type: string
}

export interface LoginResponse {
  token?: Token
  mfa_required?: boolean
}

export interface MfaSetupResponse {
  provisioning_uri: string
}

export interface User {
  id: number
  email: string
  display_name: string | null
  is_mfa_enabled: boolean
  created_at: string
  updated_at: string
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
    const response = await api.get("/auth/users/me")
    return response.data
  },

  loginMfa: async (
    email: string,
    password: string,
    totp_code: string,
  ): Promise<Token> => {
    const response = await api.post("/auth/login/mfa", {
      email,
      password,
      totp_code,
    })
    return response.data
  },

  register: async (email: string, password: string) => {
    const response = await api.post("/auth/register", { email, password })
    return response.data
  },

  setupMfa: async (): Promise<MfaSetupResponse> => {
    const response = await api.post("/auth/mfa/setup")
    return response.data
  },

  verifyMfa: async (totp_code: string): Promise<{ detail: string }> => {
    const response = await api.post("/auth/mfa/verify", { totp_code })
    return response.data
  },

  disableMfa: async (totp_code: string): Promise<{ detail: string }> => {
    const response = await api.post("/auth/mfa/disable", { totp_code })
    return response.data
  },
}

// Public API (sem autenticação)
export const publicApi = {
  list: async (params?: CoinListParams) => {
    const response = await api.get<PaginatedResponse<CoinPublic>>(
      "/public/coins",
      { params },
    )
    return response.data
  },

  get: async (id: number): Promise<CoinPublic> => {
    const response = await api.get(`/public/coins/${id}`)
    return response.data
  },

  facets: async (): Promise<CoinFacets> => {
    const response = await api.get("/public/facets")
    return response.data
  },
}

// Coins API
export const coinsApi = {
  list: async (params?: CoinListParams) => {
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

  importFile: async (file: File): Promise<ImportResult> => {
    const formData = new FormData()
    formData.append("file", file)
    const response = await api.post<ImportResult>("/coins/import", formData)
    return response.data
  },

  exportFile: async (format: "csv" | "json"): Promise<Blob> => {
    const response = await api.get("/coins/export/all", {
      params: { format },
      responseType: "blob",
    })
    return response.data
  },

  template: async (): Promise<Blob> => {
    const response = await api.get("/coins/import/template", {
      responseType: "blob",
    })
    return response.data
  },

  uploadImages: async (
    id: number,
    frontImage?: File,
    backImage?: File,
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
      { params },
    )
    return response.data
  },

  adjustCoinQuantity: async (
    coinId: number,
    data: CoinAdjust,
  ): Promise<Coin> => {
    const response = await api.post(`/admin/coins/${coinId}/adjust`, data)
    return response.data
  },
}
