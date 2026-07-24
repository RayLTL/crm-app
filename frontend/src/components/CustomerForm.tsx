import { useState } from 'react'
import type { Customer, CustomerFormData } from '../types'

interface Props {
  initialData?: Customer
  onSubmit: (data: CustomerFormData) => Promise<void>
  onCancel: () => void
}

export default function CustomerForm({ initialData, onSubmit, onCancel }: Props) {
  const [form, setForm] = useState<CustomerFormData>({
    name: initialData?.name || '',
    email: initialData?.email || '',
    phone: initialData?.phone || '',
    company: initialData?.company || '',
    status: initialData?.status || 'active',
    notes: initialData?.notes || '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) { setError('客户名称不能为空'); return }
    setSubmitting(true); setError('')
    try {
      await onSubmit(form)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setSubmitting(false)
    }
  }

  const update = (field: keyof CustomerFormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <form className="customer-form" onSubmit={handleSubmit}>
      {error && <div className="form-error">{error}</div>}
      <div className="form-grid">
        <div className="form-group">
          <label className="form-label">客户名称 *</label>
          <input type="text" className="form-input" value={form.name}
            onChange={(e) => update('name', e.target.value)} placeholder="请输入客户名称" />
        </div>
        <div className="form-group">
          <label className="form-label">邮箱</label>
          <input type="email" className="form-input" value={form.email}
            onChange={(e) => update('email', e.target.value)} placeholder="email@example.com" />
        </div>
        <div className="form-group">
          <label className="form-label">电话</label>
          <input type="text" className="form-input" value={form.phone}
            onChange={(e) => update('phone', e.target.value)} placeholder="13800138000" />
        </div>
        <div className="form-group">
          <label className="form-label">公司</label>
          <input type="text" className="form-input" value={form.company}
            onChange={(e) => update('company', e.target.value)} placeholder="公司名称" />
        </div>
        <div className="form-group">
          <label className="form-label">状态</label>
          <select className="form-input" value={form.status}
            onChange={(e) => update('status', e.target.value as any)}>
            <option value="active">合作中</option>
            <option value="inactive">已暂停</option>
            <option value="lead">潜在客户</option>
          </select>
        </div>
        <div className="form-group form-group-full">
          <label className="form-label">备注</label>
          <textarea className="form-input form-textarea" value={form.notes}
            onChange={(e) => update('notes', e.target.value)}
            placeholder="客户备注信息..." rows={4} />
        </div>
      </div>
      <div className="form-actions">
        <button type="button" className="btn btn-secondary" onClick={onCancel} disabled={submitting}>取消</button>
        <button type="submit" className="btn btn-primary" disabled={submitting}>
          {submitting ? '提交中...' : initialData ? '保存修改' : '创建客户'}
        </button>
      </div>
    </form>
  )
}