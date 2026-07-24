import type { Customer } from '../types'
import { STATUS_MAP } from '../types'

interface Props {
  customer: Customer
  onEdit: () => void
  onDelete: () => void
  onBack: () => void
}

export default function CustomerDetail({ customer, onEdit, onDelete, onBack }: Props) {
  return (
    <div className="detail-page">
      <div className="detail-header">
        <button className="btn btn-ghost" onClick={onBack}>&larr; 返回列表</button>
        <div className="detail-actions">
          <button className="btn btn-primary" onClick={onEdit}>编辑</button>
          <button className="btn btn-danger" onClick={onDelete}>删除</button>
        </div>
      </div>
      <div className="detail-card">
        <div className="detail-card-header">
          <div className="detail-avatar">{customer.name.charAt(0)}</div>
          <div>
            <h2 className="detail-name">{customer.name}</h2>
            <span className="status-badge"
              style={{ backgroundColor: STATUS_MAP[customer.status]?.color || '#999' }}>
              {customer.statusLabel || STATUS_MAP[customer.status]?.label || customer.status}
            </span>
          </div>
        </div>
        <div className="detail-grid">
          <div className="detail-item">
            <span className="detail-label">邮箱</span>
            <span className="detail-value">{customer.email || '-'}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">电话</span>
            <span className="detail-value">{customer.phone || '-'}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">公司</span>
            <span className="detail-value">{customer.company || '-'}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">创建时间</span>
            <span className="detail-value">{customer.created_at}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">更新时间</span>
            <span className="detail-value">{customer.updated_at}</span>
          </div>
        </div>
        {customer.notes && (
          <div className="detail-notes">
            <h3>备注</h3>
            <p>{customer.notes}</p>
          </div>
        )}
      </div>
    </div>
  )
}