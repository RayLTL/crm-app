import type { Customer, CustomerFormData, ApiResponse } from './types'

// 环境变量配置（通过 .env 文件或 Cloudflare Pages 环境变量设置）
const AIRSCRIPT_URL = import.meta.env.VITE_AIRSCRIPT_URL || ''
const AIRSCRIPT_TOKEN = import.meta.env.VITE_AIRSCRIPT_TOKEN || ''

// 代理路径: 开发环境走 vite proxy，生产环境走 Pages Functions
const API_PATH = AIRSCRIPT_URL
  ? `/api/airscript${new URL(AIRSCRIPT_URL).pathname}`
  : ''

// 未配置时使用 Mock 模式
const MOCK_MODE = !API_PATH || !AIRSCRIPT_TOKEN

async function airscriptFetch<T>(action: string, params: Record<string, unknown> = {}): Promise<ApiResponse<T>> {
  if (MOCK_MODE) {
    console.warn('[API] Mock mode: 请在 .env 中配置 VITE_AIRSCRIPT_URL 和 VITE_AIRSCRIPT_TOKEN')
    return { success: false, data: null, error: '未配置后端' }
  }

  const res = await fetch(API_PATH, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'AirScript-Token': AIRSCRIPT_TOKEN,
    },
    body: JSON.stringify({
      Context: { argv: { b: [action, JSON.stringify(params)] } },
    }),
  })

  if (!res.ok) throw new Error(`请求失败: ${res.status}`)

  const raw = await res.json()
  const result = raw?.data?.result
  if (!result) return { success: false, data: null, error: '空响应' }

  return typeof result === 'string' ? JSON.parse(result) : result
}

export const api = {
  listCustomers(params?: { search?: string; status?: string; page?: number; pageSize?: number }) {
    return airscriptFetch<{
      customers: Customer[]
      pagination: { page: number; pageSize: number; total: number; totalPages: number }
    }>('getList', params || {})
  },

  getCustomer(recordId: string) {
    return airscriptFetch<{ customer: Customer }>('getRecord', { recordId })
  },

  createCustomer(data: CustomerFormData) {
    return airscriptFetch<{ id: string }>('addRecord', data as unknown as Record<string, unknown>)
  },

  updateCustomer(recordId: string, data: Partial<CustomerFormData>) {
    return airscriptFetch<{ id: string }>('updateRecord', { recordId, ...data })
  },

  deleteCustomer(recordId: string) {
    return airscriptFetch<{ id: string }>('deleteRecord', { recordId })
  },

  getStats() {
    return airscriptFetch<{
      total: number
      byStatus: { status: string; label: string; count: number }[]
      recentCustomers: { name: string; company: string; status: string }[]
    }>('getStats', {})
  },
}