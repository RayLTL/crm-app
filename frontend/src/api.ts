import type { ApiResponse, Store, StoreDetail, Contact, Contract, Followup, Opportunity, OpportunityDetail, DashboardData, ListResult } from './types'

const AIRSCRIPT_URL = import.meta.env.VITE_AIRSCRIPT_URL || ''
const AIRSCRIPT_TOKEN = import.meta.env.VITE_AIRSCRIPT_TOKEN || ''
const API_PATH = AIRSCRIPT_URL ? `/api/airscript${new URL(AIRSCRIPT_URL).pathname}` : ''

async function airscriptFetch<T>(action: string, params: Record<string,unknown> = {}): Promise<ApiResponse<T>> {
  if (!API_PATH || !AIRSCRIPT_TOKEN) return { success: false, data: null, error: '请在 .env 中配置 VITE_AIRSCRIPT_URL 和 VITE_AIRSCRIPT_TOKEN' }
  const res = await fetch(API_PATH, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'AirScript-Token': AIRSCRIPT_TOKEN },
    body: JSON.stringify({ Context: { argv: { b: [action, JSON.stringify(params)] } } }),
  })
  if (!res.ok) throw new Error(`请求失败: ${res.status}`)
  const raw = await res.json()
  const result = raw?.data?.result
  return result ? (typeof result === 'string' ? JSON.parse(result) : result) : { success: false, data: null, error: '空响应' }
}

export const api = {
  // 首页
  dashboard: () => airscriptFetch<DashboardData>('dashboard'),

  // 门店
  storeList: (p?: { keyword?: string; brand?: string; status?: string; page?: number }) =>
    airscriptFetch<ListResult<Store>>('storeList', p || {}),
  storeDetail: (recordId: string) => airscriptFetch<StoreDetail>('storeDetail', { recordId }),
  storeCreate: (d: any) => airscriptFetch<{ id: string }>('storeCreate', d),
  storeUpdate: (recordId: string, d: any) => airscriptFetch<{ id: string }>('storeUpdate', { recordId, ...d }),

  // 联系人
  contactList: () => airscriptFetch<ListResult<Contact>>('contactList'),
  contactCreate: (d: any) => airscriptFetch<{ id: string }>('contactCreate', d),
  contactUpdate: (recordId: string, d: any) => airscriptFetch<{ id: string }>('contactUpdate', { recordId, ...d }),
  contactDelete: (recordId: string) => airscriptFetch<{ id: string }>('contactDelete', { recordId }),

  // 合同
  contractList: () => airscriptFetch<ListResult<Contract>>('contractList'),
  contractCreate: (d: any) => airscriptFetch<{ id: string }>('contractCreate', d),

  // 跟进
  followupList: (store_id?: string) => airscriptFetch<ListResult<Followup>>('followupList', store_id ? { store_id } : {}),
  followupCreate: (d: any) => airscriptFetch<{ id: string }>('followupCreate', d),

  // 商机
  opportunityList: (stage?: string) => airscriptFetch<ListResult<Opportunity>>('opportunityList', stage ? { stage } : {}),
  opportunityCreate: (d: any) => airscriptFetch<{ id: string }>('opportunityCreate', d),
  opportunityDetail: (recordId: string) => airscriptFetch<OpportunityDetail>('opportunityDetail', { recordId }),
  opportunityUpdate: (recordId: string, d: any) => airscriptFetch<{ id: string }>('opportunityUpdate', { recordId, ...d }),
}