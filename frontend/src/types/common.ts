export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  page_size: number
  pages: number
}

export interface MessageResponse {
  message: string
  success: boolean
}

export interface ApiError {
  error: string
  detail: string
  errors?: Array<{ field: string; message: string; type: string }>
}
