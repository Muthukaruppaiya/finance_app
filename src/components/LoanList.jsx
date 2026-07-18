import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useFinance } from '../context/FinanceContext'
import StatusBadge from './StatusBadge'
import {
  deriveLoanStatus,
  formatCurrency,
  formatDate,
  getBalanceDue,
  getEmisPaidCount,
  vehicleLabel,
} from '../utils/loanUtils'

export default function LoanList() {
  const { allLoans } = useFinance()
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase()
    return allLoans
      .map((l) => ({
        ...l,
        status: deriveLoanStatus(l),
        balance: getBalanceDue(l),
        emisPaid: getEmisPaidCount(l),
      }))
      .filter((l) => {
        if (statusFilter !== 'All' && l.status !== statusFilter) return false
        if (!q) return true
        return (
          l.customerName.toLowerCase().includes(q) ||
          l.id.toLowerCase().includes(q) ||
          (l.registrationNo || '').toLowerCase().includes(q) ||
          (l.vehicleModel || '').toLowerCase().includes(q)
        )
      })
  }, [allLoans, query, statusFilter])

  return (
    <div>
      <h1 className="page-title">Loans</h1>
      <p className="page-sub">
        All disbursements against vehicle documents across the portfolio.
      </p>

      <div className="toolbar">
        <input
          placeholder="Search loan ID, customer, reg. no, model..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <div className="filter-tabs">
          {['All', 'Active', 'Overdue', 'Closed'].map((s) => (
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
              <th>Loan</th>
              <th>Customer</th>
              <th>Vehicle / Reg.</th>
              <th>Amount</th>
              <th>EMIs</th>
              <th>Balance</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={7} className="empty-state">
                  No loans match.
                </td>
              </tr>
            ) : (
              rows.map((l) => (
                <tr
                  key={l.id}
                  className="clickable"
                  onClick={() => navigate(`/loans/${l.id}`)}
                >
                  <td>
                    <div style={{ fontWeight: 650 }}>{l.id}</div>
                    <div className="meta-line">{formatDate(l.startDate)}</div>
                  </td>
                  <td>
                    {l.customerName}
                    <div className="meta-line">{l.customerPhone}</div>
                  </td>
                  <td>{vehicleLabel(l)}</td>
                  <td>{formatCurrency(l.loanAmount)}</td>
                  <td>
                    {l.emisPaid} / {l.tenure}
                  </td>
                  <td>{formatCurrency(l.balance)}</td>
                  <td>
                    <StatusBadge status={l.status} />
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
