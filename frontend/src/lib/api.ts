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
  items: T[]
  total: number
  page: number
  page_size: number
  total_pages: number
}

export interface DashboardSummary {
  total_coins: number
  total_countries: number
  total_estimated_value: number
  by_country: { country: string; count: number }[]
  by_year: { year: number; count: number }[]
  by_originality: { originality: string; count: number }[]
}

export interface LoginResponse {
  access_token: string
  token_type: string
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

  register: async (email: string, password: string) => {
    const response = await api.post("/auth/register", { email, password })
    return response.data
  },
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
  }): Promise<PaginatedResponse<Coin>> => {
    const response = await api.get("/coins", { params })
    // Adapt backend response to frontend interface
    const { data, meta } = response.data
    return {
      items: data,
      total: meta.total_items,
      page: meta.page,
      page_size: meta.page_size,
      total_pages: meta.total_pages,
    }
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
