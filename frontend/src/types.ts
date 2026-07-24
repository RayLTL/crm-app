export interface Customer {
  id: string
  name: string
  email: string
  phone: string
  company: string
  status: 'active' | 'inactive' | 'lead'
  statusLabel: string
  notes: string
  created_at: string
  updated_at: string
}

export interface CustomerFormData {
  name: string
  email: string
  phone: string
  company: string
  status: 'active' | 'inactive' | 'lead'
  notes: string
}

export interface Pagination {
  page: number
  pageSize: number
  total: number
  totalPages: number
}

export interface ApiResponse<T> {
  success: boolean
  data: T | null
  error?: string
  message?: string
}

export const STATUS_MAP: Record<string, { label: string; color: string }> = {
  active: { label: '合作中', color: '#22c55e' },
  inactive: { label: '已暂停', color: '#6b7280' },
  lead: { label: '潜在客户', color: '#f59e0b' },
}