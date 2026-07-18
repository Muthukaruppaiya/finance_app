import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useFinance } from '../context/FinanceContext'
import StatusBadge from './StatusBadge'
import {
  deriveCustomerStatus,
  formatCurrency,
  formatDate,
  getBalanceDue,
} from '../utils/loanUtils'

export default function CustomerList() {
  const { customers } = useFinance()
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase()
    return customers
      .map((c) => {
        const loans = c.loans || []
        const outstanding = loans.reduce((s, l) => s + getBalanceDue(l), 0)
        const activeCount = loans.filter((l) => getBalanceDue(l) > 0).length
        return {
          ...c,
          status: deriveCustomerStatus(c),
          loanCount: loans.length,
          activeCount,
          outstanding,
        }
      })
      .filter((c) => {
        if (statusFilter !== 'All' && c.status !== statusFilter) return false
        if (!q) return true
        return (
          c.name.toLowerCase().includes(q) ||
          c.phone.includes(q) ||
          c.id.toLowerCase().includes(q) ||
          (c.idProof || '').toLowerCase().includes(q)
        )
      })
  }, [customers, query, statusFilter])

  return (
    <div>
      <h1 className="page-title">Customers</h1>
      <p className="page-sub">
        Borrower master — one customer can hold multiple document loans over time.
      </p>

      <div className="toolbar">
        <input
          placeholder="Search name, phone, ID, Aadhar/PAN..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <div className="filter-tabs">
          {['All', 'Active', 'Overdue', 'Closed', 'No Loan'].map((s) => (
            <button
              key={s}
              type="button"
              className={`filter-tab ${statusFilter === s ? 'active' : ''}`}
              onClick={() => setStatusFilter(s)}
            >
              {s}
            </button>
          ))}
        </div>
        <button
          type="button"
          className="btn btn-primary"
          style={{ marginLeft: 'auto' }}
          onClick={() => navigate('/new-loan')}
        >
          + New Loan
        </button>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'auto' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Customer</th>
              <th>Phone</th>
              <th>Since</th>
              <th>Loans</th>
              <th>Outstanding</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={6} className="empty-state">
                  No customers match.
                </td>
              </tr>
            ) : (
              rows.map((c) => (
                <tr
                  key={c.id}
                  className="clickable"
                  onClick={() => navigate(`/customers/${c.id}`)}
                >
                  <td>
                    <div style={{ fontWeight: 650 }}>{c.name}</div>
                    <div className="meta-line">{c.id}</div>
                  </td>
                  <td>{c.phone}</td>
                  <td>{formatDate(c.createdAt)}</td>
                  <td>
                    {c.loanCount} total
                    <div className="meta-line">{c.activeCount} open</div>
                  </td>
                  <td>{formatCurrency(c.outstanding)}</td>
                  <td>
                    <StatusBadge status={c.status} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
