// ===== 门店 =====
export interface Store {
  id: string; name: string; group: string; brand: string
  region: string; address: string; status: string; created_at: string
}
export interface StoreDetail extends Store {
  contacts: Contact[]; contracts: Contract[]; followups: Followup[]
}

// ===== 联系人 =====
export interface Contact {
  id: string; name: string; store_id: string; store_name: string
  title: string; phone: string; wechat: string; role: string; preferences: string
}

// ===== 合同 =====
export interface Contract {
  id: string; name: string; store_id: string; store_name: string
  type: string; amount: number; start_date: string; end_date: string
  payment: string; alert: string
}

// ===== 跟进 =====
export interface Followup {
  id: string; topic: string; store_id: string; store_name: string
  type: string; contact_name: string; notes: string
  next_date: string; created_at: string
}

// ===== 商机 =====
export interface Opportunity {
  id: string; name: string; store_id: string; store_name: string
  amount: number; stage: string
}

// ===== 首页 =====
export interface DashboardData {
  monthVisits: number; monthRenewals: number; totalDeal: number
  todayTasks: { type: string; topic?: string; store_name?: string; contact_name?: string; contract_name?: string; alert?: string; end_date?: string }[]
}

// ===== 通用 =====
export interface ApiResponse<T> { success: boolean; data: T | null; error?: string }
export interface Pagination { page: number; pageSize: number; total: number; totalPages: number }
export interface ListResult<T> { items: T[]; pagination?: Pagination }

export const STORE_STATUS = ['未签约','已签约','待续约','已流失'] as const
export const STAGES = ['初步触达','方案报价','商务谈判','盖章签约','服务交付'] as const
export const FOLLOWUP_TYPES = ['到店拜访','电话','微信'] as const
export const CONTACT_TITLES = ['总经理','市场经理','网销经理','二手车经理','销售总监','其他'] as const
export const ROLES = ['决策者','影响者','执行者'] as const
export const CONTRACT_TYPES = ['线索包','SaaS','硬广','其他'] as const
export const ALERT_MAP: Record<string,string> = {'60天预警':'#f59e0b','30天预警':'#f97316','15天预警':'#ef4444','正常':'#22c55e'}