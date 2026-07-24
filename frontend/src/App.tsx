import { useState, useEffect } from 'react'
import { api } from './api'
import type { Customer, CustomerFormData, Pagination } from './types'
import { STATUS_MAP } from './types'
import CustomerForm from './components/CustomerForm'
import CustomerDetail from './components/CustomerDetail'

type PageView = 'list' | 'create' | 'edit' | 'detail'

export default function App() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [pagination, setPagination] = useState<Pagination>({ page: 1, pageSize: 20, total: 0, totalPages: 0 })
  const [stats, setStats] = useState<{ total: number; byStatus: { status: string; label: string; count: number }[] } | null>(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<PageView>('list')
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [error, setError] = useState('')

  const loadCustomers = async (page = 1) => {
    setLoading(true)
    setError('')
    try {
      const res = await api.listCustomers({ search, status: statusFilter, page })
      if (res.success && res.data) {
        setCustomers(res.data.customers)
        setPagination(res.data.pagination)
      } else {
        setError(res.error || '加载失败')
      }
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const loadStats = async () => {
    const res = await api.getStats()
    if (res.success && res.data) setStats(res.data)
  }

  useEffect(() => { loadCustomers(); loadStats() }, [])

  useEffect(() => {
    const timer = setTimeout(() => loadCustomers(), 300)
    return () => clearTimeout(timer)
  }, [search, statusFilter])

  const handleCreate = async (data: CustomerFormData) => {
    await api.createCustomer(data)
    setView('list')
    loadCustomers()
    loadStats()
  }

  const handleUpdate = async (id: string, data: Partial<CustomerFormData>) => {
    await api.updateCustomer(id, data)
    setView('detail')
    loadCustomers()
    loadStats()
    const detail = await api.getCustomer(id)
    if (detail.success && detail.data) setSelectedCustomer(detail.data.customer)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除该客户吗？')) return
    await api.deleteCustomer(id)
    setView('list')
    setSelectedCustomer(null)
    loadCustomers()
    loadStats()
  }

  return (
    <div className="app">
      <header className="header">
        <div className="header-content">
          <h1 className="logo" onClick={() => { setView('list'); setSelectedCustomer(null) }}>
            CRM 客户管理系统
          </h1>
          <nav className="nav">
            <button className={`nav-btn ${view === 'list' ? 'active' : ''}`}
              onClick={() => { setView('list'); setSelectedCustomer(null) }}>
              客户列表
            </button>
            <button className={`nav-btn ${view === 'create' ? 'active' : ''}`}
              onClick={() => { setView('create'); setSelectedCustomer(null) }}>
              + 新增客户
            </button>
          </nav>
        </div>
      </header>

      <main className="main">
        {error && <div className="error-banner">{error}</div>}

        {view === 'list' && stats && (
          <div className="stats-grid">
            <div className="stat-card">
              <span className="stat-number">{stats.total}</span>
              <span className="stat-label">总客户数</span>
            </div>
            {stats.byStatus.map((s) => (
              <div className="stat-card" key={s.status}>
                <span className="stat-number">{s.count}</span>
                <span className="stat-label" style={{ color: STATUS_MAP[s.status]?.color }}>
                  {s.label}
                </span>
              </div>
            ))}
          </div>
        )}

        {view === 'list' && (
          <>
            <div className="toolbar">
              <input type="text" className="search-input" placeholder="搜索客户名称、邮箱、公司..."
                value={search} onChange={(e) => setSearch(e.target.value)} />
              <select className="status-select" value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="">全部状态</option>
                <option value="active">合作中</option>
                <option value="inactive">已暂停</option>
                <option value="lead">潜在客户</option>
              </select>
            </div>

            {loading ? (
              <div className="loading">加载中...</div>
            ) : customers.length === 0 ? (
              <div className="empty">
                <p>暂无客户数据</p>
                <button className="btn btn-primary" onClick={() => setView('create')}>添加第一个客户</button>
              </div>
            ) : (
              <>
                <div className="table-container">
                  <table className="customer-table">
                    <thead>
                      <tr>
                        <th>姓名</th><th>邮箱</th><th>电话</th><th>公司</th>
                        <th>状态</th><th>创建时间</th><th>操作</th>
                      </tr>
                    </thead>
                    <tbody>
                      {customers.map((c) => (
                        <tr key={c.id} onClick={() => { setSelectedCustomer(c); setView('detail') }} className="clickable-row">
                          <td className="cell-name">{c.name}</td>
                          <td>{c.email || '-'}</td>
                          <td>{c.phone || '-'}</td>
                          <td>{c.company || '-'}</td>
                          <td>
                            <span className="status-badge" style={{ backgroundColor: STATUS_MAP[c.status]?.color || '#999' }}>
                              {c.statusLabel || STATUS_MAP[c.status]?.label || c.status}
                            </span>
                          </td>
                          <td className="cell-date">{c.created_at}</td>
                          <td>
                            <button className="btn btn-sm btn-danger"
                              onClick={(e) => { e.stopPropagation(); handleDelete(c.id) }}>删除</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="pagination">
                  <span className="page-info">共 {pagination.total} 条，第 {pagination.page}/{pagination.totalPages} 页</span>
                  <div className="page-btns">
                    <button className="btn btn-sm" disabled={pagination.page <= 1}
                      onClick={() => loadCustomers(pagination.page - 1)}>上一页</button>
                    <button className="btn btn-sm" disabled={pagination.page >= pagination.totalPages}
                      onClick={() => loadCustomers(pagination.page + 1)}>下一页</button>
                  </div>
                </div>
              </>
            )}
          </>
        )}

        {view === 'create' && (
          <div className="form-page">
            <h2>新增客户</h2>
            <CustomerForm onSubmit={handleCreate} onCancel={() => setView('list')} />
          </div>
        )}

        {view === 'edit' && selectedCustomer && (
          <div className="form-page">
            <h2>编辑客户</h2>
            <CustomerForm initialData={selectedCustomer}
              onSubmit={(data) => handleUpdate(selectedCustomer.id, data)}
              onCancel={() => setView('detail')} />
          </div>
        )}

        {view === 'detail' && selectedCustomer && (
          <CustomerDetail customer={selectedCustomer}
            onEdit={() => setView('edit')}
            onDelete={() => handleDelete(selectedCustomer.id)}
            onBack={() => { setView('list'); setSelectedCustomer(null) }} />
        )}
      </main>
    </div>
  )
}