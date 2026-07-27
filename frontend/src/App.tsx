import { useState, useEffect } from 'react'
import { api } from './api'
import type { Store, StoreDetail, Contact, Contract, Followup, Opportunity, OpportunityDetail, DashboardData } from './types'
import { STORE_STATUS, STAGES, ALERT_MAP } from './types'

type Tab = 'dashboard' | 'stores' | 'opportunities' | 'contacts'
type View = 'list' | 'detail' | 'form' | 'kanban'

export default function App() {
  const [tab, setTab] = useState<Tab>('dashboard')
  const [view, setView] = useState<View>('list')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [dash, setDash] = useState<DashboardData | null>(null)
  const [stores, setStores] = useState<Store[]>([])
  const [storeDetail, setStoreDetail] = useState<StoreDetail | null>(null)
  const [opportunityDetail, setOpportunityDetail] = useState<OpportunityDetail | null>(null)
  const [opportunities, setOpportunities] = useState<Opportunity[]>([])
  const [filterStatus, setFilterStatus] = useState('')
  const [filterKeyword, setFilterKeyword] = useState('')

  useEffect(() => { loadDashboard(); loadStores(); loadOpportunities() }, [])

  // 筛选条件变化时重新加载门店列表
  useEffect(() => { loadStores() }, [filterKeyword, filterStatus])

  const loadDashboard = async () => { const r = await api.dashboard(); if (r.success && r.data) setDash(r.data) }
  const loadStores = async () => {
    setLoading(true)
    const r = await api.storeList({ keyword: filterKeyword, status: filterStatus })
    if (r.success && r.data) setStores(r.data.items)
    setLoading(false)
  }
  const loadOpportunities = async () => {
    const r = await api.opportunityList()
    if (r.success && r.data) setOpportunities(r.data.items)
  }

  const gotoOpportunityDetail = async (id: string) => {
    setLoading(true); setError('')
    const r = await api.opportunityDetail(id)
    if (r.success && r.data) { setOpportunityDetail(r.data); setView('detail') }
    else { setError(r.error || '加载商机详情失败') }
    setLoading(false)
  }

  const gotoStoreDetail = async (id: string) => {
    setLoading(true); setError('')
    const r = await api.storeDetail(id)
    if (r.success && r.data) { setStoreDetail(r.data); setView('detail') }
    else { setError(r.error || '加载门店详情失败，请检查AirScript配置') }
    setLoading(false)
  }

  const gotoStoreFromOpp = async (id: string) => {
    setTab('stores')
    setLoading(true); setError('')
    const r = await api.storeDetail(id)
    if (r.success && r.data) { setStoreDetail(r.data); setView('detail') }
    else { setError(r.error || '加载门店详情失败') }
    setLoading(false)
  }

  // ====== 渲染 ======
  return (
    <div className="app">
      {/* 头部 */}
      <header className="header">
        <h1 className="logo">
          {tab === 'dashboard' && '4S店销售CRM'}
          {tab === 'stores' && (view === 'detail' ? '门店详情' : '门店管理')}
          {tab === 'opportunities' && (view === 'detail' ? '商机详情' : '商机看板')}
          {tab === 'contacts' && '联系人'}
        </h1>
        {(view === 'detail' || view === 'form') && (
          <button className="btn-back" onClick={() => { setView('list'); setStoreDetail(null); setOpportunityDetail(null) }}>返回</button>
        )}
      </header>

      <main className="main">
        {error && <div className="error">{error}</div>}

        {/* ====== 首页 ====== */}
        {tab === 'dashboard' && dash && <DashboardView dash={dash} onStoreClick={gotoStoreDetail} onNewFollowup={() => { setTab('stores'); setView('list') }} />}

        {/* ====== 门店列表 ====== */}
        {tab === 'stores' && view === 'list' && (
          <>
            <div className="filter-bar">
              <input className="search" placeholder="搜索门店名称、地区..." value={filterKeyword}
                onChange={e => setFilterKeyword(e.target.value)} />
              <select className="filter-select" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                <option value="">全部</option>
                {STORE_STATUS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            {loading ? <div className="loading">加载中...</div> : (
              <div className="store-list">
                {stores.map(s => <StoreCard key={s.id} store={s} onClick={() => gotoStoreDetail(s.id)} />)}
                {stores.length === 0 && <div className="empty">暂无门店</div>}
              </div>
            )}
          </>
        )}

        {/* ====== 门店详情 ====== */}
        {tab === 'stores' && view === 'detail' && storeDetail && (
          <StoreDetailView detail={storeDetail} onRefresh={() => gotoStoreDetail(storeDetail.id)} />
        )}

        {/* ====== 商机看板 ====== */}
        {tab === 'opportunities' && view !== 'detail' && (
          <KanbanView opportunities={opportunities} onRefresh={loadOpportunities} onOppClick={gotoOpportunityDetail} />
        )}

        {/* ====== 商机详情 ====== */}
        {tab === 'opportunities' && view === 'detail' && opportunityDetail && (
          <OpportunityDetailView detail={opportunityDetail} onRefresh={() => gotoOpportunityDetail(opportunityDetail.id)} onStoreClick={gotoStoreFromOpp} />
        )}

        {/* ====== 联系人 ====== */}
        {tab === 'contacts' && <ContactListView />}
      </main>

      {/* 底部导航 */}
      <nav className="tab-bar">
        <button className={`tab-item ${tab === 'dashboard' ? 'active' : ''}`} onClick={() => { setTab('dashboard'); setView('list') }}>
          <span className="tab-icon">📊</span>首页</button>
        <button className={`tab-item ${tab === 'stores' ? 'active' : ''}`} onClick={() => { setTab('stores'); setView('list'); loadStores() }}>
          <span className="tab-icon">🏪</span>门店</button>
        <button className={`tab-item ${tab === 'opportunities' ? 'active' : ''}`} onClick={() => { setTab('opportunities'); setView('list'); loadOpportunities() }}>
          <span className="tab-icon">📈</span>商机</button>
        <button className={`tab-item ${tab === 'contacts' ? 'active' : ''}`} onClick={() => { setTab('contacts'); setView('list') }}>
          <span className="tab-icon">👥</span>联系人</button>
      </nav>
    </div>
  )
}

// ====== 首页 ======
function DashboardView({ dash, onStoreClick, onNewFollowup }: { dash: DashboardData; onStoreClick: (id: string) => void; onNewFollowup: () => void }) {
  return (
    <div className="dashboard">
      <div className="stats-row">
        <div className="stat-card"><span className="stat-num">{dash.monthVisits}</span><span className="stat-lbl">本月拜访</span></div>
        <div className="stat-card"><span className="stat-num">{dash.monthRenewals}</span><span className="stat-lbl">本月到期续约</span></div>
        <div className="stat-card"><span className="stat-num">{(dash.totalDeal/10000).toFixed(1)}万</span><span className="stat-lbl">推进中商机</span></div>
      </div>
      <div className="section-hd">
        <h3 className="section-title" style={{margin:0}}>今日待办</h3>
        <button className="btn btn-sm btn-primary" onClick={onNewFollowup}>+ 写跟进</button>
      </div>
      <p style={{fontSize:'12px',color:'var(--gray-400)',marginBottom:'8px'}}>
        待办来源：到期合同预警（⚠️）在门店详情"合同"Tab中新增；今日跟进提醒（📋）在门店详情"跟进"Tab中录入
      </p>
      <div className="task-list">
        {dash.todayTasks.length === 0 && <div className="empty">暂无待办事项</div>}
        {dash.todayTasks.map((t, i) => (
          <div key={i} className={`task-card ${t.type === 'renewal' ? 'alert' : ''}`}>
            <div className="task-icon">{t.type === 'renewal' ? '⚠️' : '📋'}</div>
            <div className="task-body">
              <div className="task-title">{t.topic || t.contract_name}</div>
              <div className="task-meta">{t.store_name} {t.contact_name}</div>
              {t.alert && <div className="task-alert">⏰ {t.alert} · {t.end_date}到期</div>}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ====== 门店卡片 ======
function StoreCard({ store, onClick }: { store: Store; onClick: () => void }) {
  const statusColors: Record<string,string> = { '未签约':'#6b7280','已签约':'#22c55e','待续约':'#f59e0b','已流失':'#ef4444' }
  return (
    <div className="store-card" onClick={onClick}>
      <div className="store-header">
        <div className="store-avatar">{store.name.charAt(0)}</div>
        <div className="store-info">
          <div className="store-name">{store.name}</div>
          <div className="store-meta">{store.brand} · {store.region}</div>
        </div>
        <span className="store-status" style={{ background: statusColors[store.status] || '#999' }}>{store.status}</span>
      </div>
      <div className="store-footer">
        <span>{store.group}</span>
        <span className="store-arrow">›</span>
      </div>
    </div>
  )
}

// ====== 门店详情（含切换 Tab） ======
function StoreDetailView({ detail, onRefresh }: { detail: StoreDetail; onRefresh: () => void }) {
  const [subTab, setSubTab] = useState<'info'|'contacts'|'contracts'|'followups'>('info')
  const [formStore, setFormStore] = useState(false)
  const [formContact, setFormContact] = useState(false)
  const [formFollowup, setFormFollowup] = useState(false)
  const [formContract, setFormContract] = useState(false)

  if (formStore) return <StoreForm data={detail} onSave={async (d) => { await api.storeUpdate(detail.id, d); onRefresh(); setFormStore(false) }} onCancel={() => setFormStore(false)} />
  if (formContact) return <ContactForm storeId={detail.id} storeName={detail.name} onSave={async (d) => { await api.contactCreate(d); onRefresh(); setFormContact(false) }} onCancel={() => setFormContact(false)} />
  if (formFollowup) return <FollowupForm storeId={detail.id} storeName={detail.name} onSave={async (d) => { await api.followupCreate(d); onRefresh(); setFormFollowup(false) }} onCancel={() => setFormFollowup(false)} />
  if (formContract) return <ContractForm storeId={detail.id} storeName={detail.name} onSave={async (d) => { await api.contractCreate(d); onRefresh(); setFormContract(false) }} onCancel={() => setFormContract(false)} />

  return (
    <div className="store-detail">
      <div className="detail-hero">
        <h2>{detail.name}</h2>
        <div className="detail-tags">
          <span className="tag">{detail.brand}</span>
          <span className="tag">{detail.region}</span>
          <span className="tag">{detail.group}</span>
        </div>
        <p className="detail-addr">{detail.address}</p>
        <button className="btn btn-sm btn-outline" onClick={() => setFormStore(true)}>编辑门店</button>
      </div>

      <div className="sub-tabs">
        {['info','contacts','contracts','followups'].map(t => (
          <button key={t} className={`sub-tab ${subTab === t ? 'active' : ''}`} onClick={() => setSubTab(t as any)}>
            {{info:'概况',contacts:'联系人',contracts:'合同',followups:'跟进'}[t]}
          </button>
        ))}
      </div>

      {subTab === 'contacts' && (
        <div className="sub-section">
          <div className="section-hd"><span>联系人 ({detail.contacts.length})</span><button className="btn btn-sm btn-primary" onClick={() => setFormContact(true)}>+ 添加</button></div>
          {detail.contacts.map(c => <ContactCard key={c.id} contact={c} />)}
          {detail.contacts.length === 0 && <div className="empty">暂无联系人</div>}
        </div>
      )}
      {subTab === 'contracts' && (
        <div className="sub-section">
          <div className="section-hd"><span>合同产品 ({detail.contracts.length})</span><button className="btn btn-sm btn-primary" onClick={() => setFormContract(true)}>+ 添加</button></div>
          {detail.contracts.map(c => <ContractCard key={c.id} contract={c} />)}
          {detail.contracts.length === 0 && <div className="empty">暂无合同</div>}
        </div>
      )}
      {subTab === 'followups' && (
        <div className="sub-section">
          <div className="section-hd"><span>跟进记录 ({detail.followups.length})</span><button className="btn btn-sm btn-primary" onClick={() => setFormFollowup(true)}>+ 写跟进</button></div>
          {detail.followups.map(f => (
            <div key={f.id} className="followup-card">
              <div className="fu-header"><span className="fu-type">{f.type}</span><span className="fu-date">{f.created_at}</span></div>
              <div className="fu-topic">{f.topic}</div>
              <div className="fu-notes">{f.notes}</div>
              <div className="fu-meta">联系人: {f.contact_name} {f.next_date ? `| 下次跟进: ${f.next_date}` : ''}</div>
            </div>
          ))}
          {detail.followups.length === 0 && <div className="empty">暂无跟进记录</div>}
        </div>
      )}
      {subTab === 'info' && (
        <div className="sub-section">
          <div className="info-grid">
            <div className="info-item"><span className="info-label">所属集团</span><span>{detail.group || '-'}</span></div>
            <div className="info-item"><span className="info-label">主营品牌</span><span>{detail.brand || '-'}</span></div>
            <div className="info-item"><span className="info-label">地区</span><span>{detail.region || '-'}</span></div>
            <div className="info-item"><span className="info-label">合作状态</span><span>{detail.status}</span></div>
            <div className="info-item"><span className="info-label">地址</span><span>{detail.address || '-'}</span></div>
          </div>
        </div>
      )}
    </div>
  )
}

// ====== 联系人卡片 ======
function ContactCard({ contact }: { contact: Contact }) {
  const [editing, setEditing] = useState(false)
  if (editing) return <ContactForm storeId={contact.store_id} storeName={contact.store_name} initial={contact} onSave={async (d) => { await api.contactUpdate(contact.id, d); setEditing(false) }} onCancel={() => setEditing(false)} />
  return (
    <div className="contact-card">
      <div className="contact-avatar">{contact.name.charAt(0)}</div>
      <div className="contact-body">
        <div className="contact-name">{contact.name} <span className="contact-title">{contact.title}</span></div>
        <div className="contact-actions">
          {contact.phone && <a href={`tel:${contact.phone}`} className="contact-btn">📞 {contact.phone}</a>}
          {contact.wechat && <span className="contact-btn" onClick={() => navigator.clipboard.writeText(contact.wechat)}>💬 复制微信</span>}
        </div>
        <div className="contact-meta">决策角色: {contact.role} {contact.preferences ? `| ${contact.preferences}` : ''}</div>
      </div>
      <button className="btn-icon" onClick={() => setEditing(true)}>✎</button>
    </div>
  )
}

// ====== 合同卡片 ======
function ContractCard({ contract }: { contract: Contract }) {
  return (
    <div className="contract-card">
      <div className="contract-hd">
        <span className="contract-name">{contract.name}</span>
        <span className="contract-type">{contract.type}</span>
      </div>
      <div className="contract-body">
        <span className="contract-amount">¥{contract.amount.toLocaleString()}</span>
        <span className="contract-payment">{contract.payment}</span>
      </div>
      <div className="contract-footer">
        <span>{contract.start_date} ~ {contract.end_date}</span>
        {contract.alert !== '正常' && (
          <span className="contract-alert" style={{ color: ALERT_MAP[contract.alert] || '#f59e0b' }}>
            ⚠ {contract.alert}
          </span>
        )}
      </div>
    </div>
  )
}

// ====== 商机看板 ======
function KanbanView({ opportunities, onRefresh, onOppClick }: { opportunities: Opportunity[]; onRefresh: () => void; onOppClick: (id: string) => void }) {
  const [form, setForm] = useState(false)
  const [stageFilter, setStageFilter] = useState('')

  if (form) return <OpportunityForm onSave={async (d) => { await api.opportunityCreate(d); onRefresh(); setForm(false) }} onCancel={() => setForm(false)} />

  const filtered = stageFilter ? opportunities.filter(o => o.stage === stageFilter) : opportunities
  const grouped = STAGES.map(s => ({ stage: s, items: filtered.filter(o => o.stage === s) }))

  const [changingStages, setChangingStages] = useState<Record<string, boolean>>({})
  const changeStage = async (id: string, newStage: string) => {
    setChangingStages(s => ({ ...s, [id]: true }))
    const r = await api.opportunityUpdate(id, { stage: newStage })
    if (r.success) onRefresh()
    setChangingStages(s => ({ ...s, [id]: false }))
  }

  return (
    <div className="kanban">
      <div className="section-hd"><span>商机列表</span><button className="btn btn-sm btn-primary" onClick={() => setForm(true)}>+ 新建</button></div>
      <div className="stage-filter">
        <button className={`stage-filter-btn ${stageFilter === '' ? 'active' : ''}`} onClick={() => setStageFilter('')}>全部</button>
        {STAGES.map(s => <button key={s} className={`stage-filter-btn ${stageFilter === s ? 'active' : ''}`} onClick={() => setStageFilter(s)}>{s}</button>)}
      </div>
      <div className="kanban-list">
        {grouped.filter(g => g.items.length > 0).map(g => (
          <div key={g.stage} className="stage-group">
            <div className="stage-title">{g.stage} ({g.items.length})</div>
            {g.items.map(o => (
              <div key={o.id} className="opp-card" onClick={() => onOppClick(o.id)}>
                <div className="opp-name">{o.name}</div>
                <div className="opp-store">{o.store_name}</div>
                <div className="opp-amount">¥{o.amount.toLocaleString()}</div>
                <div className="opp-actions" onClick={e => e.stopPropagation()}>
                  {STAGES.map(s => s !== g.stage && (
                    <button key={s} className="btn btn-xs" disabled={changingStages[o.id]} onClick={() => changeStage(o.id, s)}>{changingStages[o.id] ? '...' : s}</button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ))}
        {filtered.length === 0 && <div className="empty">暂无商机</div>}
      </div>
    </div>
  )
}

// ====== 商机详情 ======
function OpportunityDetailView({ detail, onRefresh, onStoreClick }: { detail: OpportunityDetail; onRefresh: () => void; onStoreClick?: (id: string) => void }) {
  const [editing, setEditing] = useState(false)
  const [editAmount, setEditAmount] = useState(String(detail.amount))
  const [editStage, setEditStage] = useState(detail.stage)
  const [submitting, setSubmitting] = useState(false)
  const [stageLoading, setStageLoading] = useState<string | null>(null)
  const [stageError, setStageError] = useState('')
  const [editError, setEditError] = useState('')

  if (editing) {
    return (
      <div className="form-page">
        <h2 className="form-title">编辑商机</h2>
        <form className="form" onSubmit={async e => {
          e.preventDefault(); setSubmitting(true); setEditError('');
          try {
            const r = await api.opportunityUpdate(detail.id, { amount: Number(editAmount), stage: editStage });
            if (r.success) { onRefresh(); setEditing(false); }
            else { setEditError(r.error || '保存失败'); }
          } catch (e: any) { setEditError('网络错误: ' + (e.message || '')); }
          setSubmitting(false)
        }}>
          <div className="form-group">
            <label className="form-label">商机名称</label>
            <input className="form-input" value={detail.name} disabled />
          </div>
          <div className="form-group">
            <label className="form-label">预计金额</label>
            <input className="form-input" type="number" value={editAmount} onChange={e => setEditAmount(e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">阶段</label>
            <select className="form-input" value={editStage} onChange={e => setEditStage(e.target.value)}>
              {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          {editError && <div className="error-msg" style={{ padding: '8px 12px', background: '#fef2f2', color: '#dc2626', borderRadius: 6, fontSize: 13, marginBottom: 12 }}>{editError}</div>}
          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={() => setEditing(false)} disabled={submitting}>取消</button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>{submitting ? '提交中...' : '保存'}</button>
          </div>
        </form>
      </div>
    )
  }

  return (
    <div className="store-detail">
      <div className="detail-hero">
        <h2>{detail.name}</h2>
        <div className="detail-tags">
          <span className="tag" style={{ background: '#6366f1' }}>{detail.stage}</span>
        </div>
        <button className="btn btn-sm btn-outline" onClick={() => setEditing(true)}>编辑商机</button>
      </div>

      <div className="sub-section" style={{ marginTop: 16 }}>
        <div className="info-grid">
          <div className="info-item"><span className="info-label">预计金额</span><span style={{ fontSize: 18, fontWeight: 600, color: 'var(--primary)' }}>¥{Number(detail.amount).toLocaleString()}</span></div>
          <div className="info-item"><span className="info-label">当前阶段</span><span>{detail.stage}</span></div>
          <div className="info-item"><span className="info-label">创建时间</span><span>{detail.created_at}</span></div>
        </div>
      </div>

      {detail.store && (
        <div className="sub-section" style={{ marginTop: 12 }}>
          <div className="section-hd"><span>关联门店</span></div>
          <div className="store-card" style={{ marginTop: 8, cursor: onStoreClick ? 'pointer' : 'default' }} onClick={() => onStoreClick?.(detail.store!.id)}>
            <div className="store-header">
              <div className="store-avatar">{detail.store.name.charAt(0)}</div>
              <div className="store-info">
                <div className="store-name">{detail.store.name}</div>
                <div className="store-meta">{detail.store.brand} · {detail.store.region}</div>
              </div>
              <span className="store-status" style={{ background: detail.store.status === '已签约' ? '#22c55e' : '#6b7280' }}>{detail.store.status}</span>
            </div>
            <div className="store-footer">
              <span>{detail.store.address || ''}</span>
              <span className="store-arrow">›</span>
            </div>
          </div>
        </div>
      )}

      {stageError && <div className="error-msg" style={{ margin: '8px 0', padding: 8, background: '#fef2f2', color: '#dc2626', borderRadius: 6, fontSize: 13 }}>{stageError}</div>}

      <div className="sub-section" style={{ marginTop: 12 }}>
        <div className="section-hd"><span>快速推进</span></div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
          {STAGES.map(s => s !== detail.stage && (
            <button key={s} className="btn btn-sm" style={{ background: stageLoading === s ? '#e5e7eb' : '#f3f4f6', border: '1px solid #e5e7eb', opacity: stageLoading ? 0.6 : 1 }}
              disabled={!!stageLoading}
              onClick={async () => {
                setStageLoading(s); setStageError('');
                try {
                  const r = await api.opportunityUpdate(detail.id, { stage: s });
                  if (r.success) { onRefresh(); }
                  else { setStageError(r.error || '推进失败，请重试'); }
                } catch (e: any) {
                  setStageError('网络错误：' + (e.message || '未知错误'));
                }
                setStageLoading(null);
              }}>
              {stageLoading === s ? '处理中...' : `推进至${s}`}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

// ====== 联系人列表 ======
function ContactListView() {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState(false)
  useEffect(() => { api.contactList().then(r => { if (r.success && r.data) setContacts(r.data.items); setLoading(false) }) }, [])
  if (form) return <ContactForm onSave={async (d) => { await api.contactCreate(d); setForm(false); api.contactList().then(r => r.success && r.data && setContacts(r.data.items)) }} onCancel={() => setForm(false)} />
  return (
    <div>
      <div className="section-hd"><span>全部联系人</span><button className="btn btn-sm btn-primary" onClick={() => setForm(true)}>+ 添加</button></div>
      {loading ? <div className="loading">加载中...</div> : contacts.map(c => <ContactCard key={c.id} contact={c} />)}
      {!loading && contacts.length === 0 && <div className="empty">暂无联系人</div>}
    </div>
  )
}

// ====== 表单组件 ======
import { useState as uState } from 'react'

function StoreForm({ data, onSave, onCancel }: { data?: any; onSave: (d:any) => Promise<void>; onCancel: () => void }) {
  const [f, setF] = uState({ name: data?.name||'', group: data?.group||'', brand: data?.brand||'', region: data?.region||'', address: data?.address||'', status: data?.status||'未签约' })
  const [sub, setSub] = uState(false)
  const upd = (k: string, v: string) => setF(p => ({...p, [k]: v}))
  return <FormWrapper title="门店信息" onCancel={onCancel} onSubmit={async () => { setSub(true); await onSave(f); setSub(false) }} submitting={sub}>
    <FormInput label="门店名称" value={f.name} onChange={v => upd('name',v)} required />
    <FormInput label="所属集团" value={f.group} onChange={v => upd('group',v)} />
    <FormInput label="主营品牌" value={f.brand} onChange={v => upd('brand',v)} />
    <FormInput label="地区" value={f.region} onChange={v => upd('region',v)} />
    <FormSelect label="合作状态" value={f.status} onChange={v => upd('status',v)} options={STORE_STATUS as any} />
    <FormTextarea label="地址" value={f.address} onChange={v => upd('address',v)} />
  </FormWrapper>
}

function ContactForm({ storeId, storeName, initial, onSave, onCancel }: { storeId?: string; storeName?: string; initial?: any; onSave: (d:any) => Promise<void>; onCancel: () => void }) {
  const [f, setF] = uState({ name: initial?.name||'', title: initial?.title||'', phone: initial?.phone||'', wechat: initial?.wechat||'', role: initial?.role||'执行者', preferences: initial?.preferences||'', store_id: storeId||'', store_name: storeName||'' })
  const [sub, setSub] = uState(false)
  const upd = (k: string, v: string) => setF(p => ({...p, [k]: v}))
  return <FormWrapper title={initial?'编辑联系人':'添加联系人'} onCancel={onCancel} onSubmit={async () => { setSub(true); await onSave(f); setSub(false) }} submitting={sub}>
    <FormInput label="姓名" value={f.name} onChange={v => upd('name',v)} required />
    <FormSelect label="职务" value={f.title} onChange={v => upd('title',v)} options={['总经理','市场经理','网销经理','二手车经理','销售总监','其他']} />
    <FormInput label="电话" value={f.phone} onChange={v => upd('phone',v)} type="tel" />
    <FormInput label="微信" value={f.wechat} onChange={v => upd('wechat',v)} />
    <FormSelect label="决策角色" value={f.role} onChange={v => upd('role',v)} options={['决策者','影响者','执行者']} />
    <FormTextarea label="个人喜好/备忘" value={f.preferences} onChange={v => upd('preferences',v)} />
  </FormWrapper>
}

function FollowupForm({ storeId, storeName, onSave, onCancel }: { storeId: string; storeName: string; onSave: (d:any) => Promise<void>; onCancel: () => void }) {
  const [f, setF] = uState({ topic: '', type: '到店拜访', store_id: storeId, store_name: storeName, contact_name: '', notes: '', next_date: '' })
  const [sub, setSub] = uState(false)
  const upd = (k: string, v: string) => setF(p => ({...p, [k]: v}))
  return <FormWrapper title="写跟进" onCancel={onCancel} onSubmit={async () => { setSub(true); await onSave(f); setSub(false) }} submitting={sub}>
    <FormInput label="跟进主题" value={f.topic} onChange={v => upd('topic',v)} required />
    <FormSelect label="跟进形式" value={f.type} onChange={v => upd('type',v)} options={['到店拜访','电话','微信']} />
    <FormInput label="联系人" value={f.contact_name} onChange={v => upd('contact_name',v)} />
    <FormTextarea label="沟通要点" value={f.notes} onChange={v => upd('notes',v)} />
    <FormInput label="下一次跟进时间" value={f.next_date} onChange={v => upd('next_date',v)} type="date" />
  </FormWrapper>
}

function ContractForm({ storeId, storeName, onSave, onCancel }: { storeId: string; storeName: string; onSave: (d:any) => Promise<void>; onCancel: () => void }) {
  const [f, setF] = uState({ name: '', type: '其他', store_id: storeId, store_name: storeName, amount: 0, start_date: '', end_date: '', payment: '账期' })
  const [sub, setSub] = uState(false)
  const upd = (k: string, v: any) => setF(p => ({...p, [k]: v}))
  return <FormWrapper title="添加合同" onCancel={onCancel} onSubmit={async () => { setSub(true); await onSave(f); setSub(false) }} submitting={sub}>
    <FormInput label="产品名称" value={f.name} onChange={v => upd('name',v)} required />
    <FormSelect label="产品类型" value={f.type} onChange={v => upd('type',v)} options={['线索包','SaaS','硬广','其他']} />
    <FormInput label="合同金额" value={String(f.amount)} onChange={v => upd('amount',Number(v))} type="number" />
    <FormInput label="服务开始时间" value={f.start_date} onChange={v => upd('start_date',v)} type="date" />
    <FormInput label="服务结束时间" value={f.end_date} onChange={v => upd('end_date',v)} type="date" />
    <FormSelect label="付款状态" value={f.payment} onChange={v => upd('payment',v)} options={['已付','账期']} />
  </FormWrapper>
}

function OpportunityForm({ onSave, onCancel }: { onSave: (d:any) => Promise<void>; onCancel: () => void }) {
  const [f, setF] = uState({ name: '', store_id: '', store_name: '', amount: 0, stage: '初步触达' })
  const [sub, setSub] = uState(false)
  const [storeSearch, setStoreSearch] = useState('')
  const [storeResults, setStoreResults] = useState<Store[]>([])
  const [allStores, setAllStores] = useState<Store[]>([])
  const upd = (k: string, v: any) => setF(p => ({...p, [k]: v}))

  // 组件加载时预取所有门店，后续本地搜索
  useEffect(() => { api.storeList({}).then(r => { if (r.success && r.data) setAllStores(r.data.items) }) }, [])

  useEffect(() => {
    if (storeSearch.length < 1) { setStoreResults([]); return }
    const kw = storeSearch.toLowerCase()
    const filtered = allStores.filter(s =>
      s.name.toLowerCase().includes(kw) || s.brand.toLowerCase().includes(kw) || s.region.toLowerCase().includes(kw)
    )
    setStoreResults(filtered.slice(0, 10))
  }, [storeSearch, allStores])

  return <FormWrapper title="新建商机" onCancel={onCancel} onSubmit={async () => { setSub(true); await onSave(f); setSub(false) }} submitting={sub}>
    <FormInput label="商机名称" value={f.name} onChange={v => upd('name',v)} required />
    <div className="form-group">
      <label className="form-label">关联门店</label>
      <input className="form-input" placeholder="搜索门店..." value={storeSearch} onChange={e => setStoreSearch(e.target.value)} />
      {storeResults.length > 0 && <div className="search-dropdown">{storeResults.map(s => <div key={s.id} className="search-item" onClick={() => { upd('store_id', s.id); upd('store_name', s.name); setStoreSearch(s.name); setStoreResults([]) }}>{s.name}</div>)}</div>}
    </div>
    <FormInput label="门店名称" value={f.store_name} onChange={v => upd('store_name',v)} />
    <FormInput label="预计金额" value={String(f.amount)} onChange={v => upd('amount',Number(v))} type="number" />
    <FormSelect label="阶段" value={f.stage} onChange={v => upd('stage',v)} options={STAGES as any} />
  </FormWrapper>
}

// ====== 通用表单组件 ======
function FormWrapper({ title, children, onCancel, onSubmit, submitting }: { title: string; children: React.ReactNode; onCancel: () => void; onSubmit: () => Promise<void>; submitting: boolean }) {
  return (
    <div className="form-page">
      <h2 className="form-title">{title}</h2>
      <form className="form" onSubmit={e => { e.preventDefault(); onSubmit() }}>
        {children}
        <div className="form-actions">
          <button type="button" className="btn btn-secondary" onClick={onCancel} disabled={submitting}>取消</button>
          <button type="submit" className="btn btn-primary" disabled={submitting}>{submitting ? '提交中...' : '保存'}</button>
        </div>
      </form>
    </div>
  )
}
function FormInput({ label, value, onChange, required, type }: { label: string; value: string; onChange: (v: string) => void; required?: boolean; type?: string }) {
  return <div className="form-group"><label className="form-label">{label}{required && ' *'}</label><input className="form-input" type={type||'text'} value={value} onChange={e => onChange(e.target.value)} required={required} /></div>
}
function FormSelect({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: string[] }) {
  return <div className="form-group"><label className="form-label">{label}</label><select className="form-input" value={value} onChange={e => onChange(e.target.value)}>{options.map(o => <option key={o} value={o}>{o}</option>)}</select></div>
}
function FormTextarea({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return <div className="form-group"><label className="form-label">{label}</label><textarea className="form-input form-textarea" value={value} onChange={e => onChange(e.target.value)} rows={3} /></div>
}