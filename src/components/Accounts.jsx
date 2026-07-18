import { useNavigate } from 'react-router-dom'
import { useFinance } from '../context/FinanceContext'
import { useAccountStats } from './Dashboard'
import StatusBadge from './StatusBadge'
import { formatCurrency } from '../utils/loanUtils'

export default function Accounts() {
  const { customers } = useFinance()
  const navigate = useNavigate()
  const stats = useAccountStats(customers)
  const maxMonth = Math.max(...stats.monthWise.map((m) => m.amount), 1)

  return (
    <div>
      <h1 className="page-title">Accounts</h1>
      <p className="page-sub">
        Collections ledger, outstanding exposure, and month-wise recovery for the finance desk.
      </p>

      <div className="summary-grid">
        <Stat label="Customers" value={stats.totalCustomers} />
        <Stat label="Loans Disbursed (count)" value={stats.totalLoans} />
        <Stat label="Total Disbursed" value={formatCurrency(stats.totalDisbursed)} />
        <Stat label="Total Collected" value={formatCurrency(stats.totalCollected)} />
        <Stat label="Outstanding Balance" value={formatCurrency(stats.totalOutstanding)} />
        <Stat label="Overdue Amount" value={formatCurrency(stats.overdueAmount)} />
        <Stat label="This Month Collection" value={formatCurrency(stats.thisMonthCollection)} />
        <Stat label="Open Loans" value={stats.openLoans} />
      </div>

      <div className="card" style={{ marginBottom: '1.15rem' }}>
        <strong style={{ display: 'block', marginBottom: '0.85rem' }}>
          Month-wise collection (last 12 months)
        </strong>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {stats.monthWise.map((m) => (
            <div
              key={m.key}
              style={{
                display: 'grid',
                gridTemplateColumns: '90px 1fr 110px',
                gap: '0.75rem',
                alignItems: 'center',
              }}
            >
              <span style={{ fontSize: '0.8rem', color: '#475569', fontWeight: 600 }}>
                {m.label}
              </span>
              <div
                style={{
                  height: 18,
                  background: '#e2e8f0',
                  borderRadius: 4,
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    height: '100%',
                    width: `${(m.amount / maxMonth) * 100}%`,
                    background: '#0f766e',
                    borderRadius: 4,
                    minWidth: m.amount > 0 ? 4 : 0,
                  }}
                />
              </div>
              <span style={{ fontSize: '0.85rem', fontWeight: 650, textAlign: 'right' }}>
                {formatCurrency(m.amount)}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'auto' }}>
        <div
          style={{
            padding: '0.85rem 1rem',
            borderBottom: '1px solid #e2e8f0',
            fontWeight: 650,
          }}
        >
          Overdue accounts
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>Customer</th>
              <th>Loan</th>
              <th>Vehicle</th>
              <th>Amount Overdue</th>
              <th>Days</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {stats.overdueLoans.length === 0 ? (
              <tr>
                <td colSpan={6} className="empty-state">
                  No overdue accounts.
                </td>
              </tr>
            ) : (
              stats.overdueLoans.map((row) => (
                <tr
                  key={row.loanId}
                  className="clickable"
                  onClick={() => navigate(`/loans/${row.loanId}`)}
                >
                  <td style={{ fontWeight: 650 }}>{row.name}</td>
                  <td>{row.loanId}</td>
                  <td>{row.vehicle}</td>
                  <td>{formatCurrency(row.amountOverdue)}</td>
                  <td>{row.daysOverdue}</td>
                  <td>
                    <StatusBadge status="Overdue" />
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

function Stat({ label, value }) {
  return (
    <div className="summary-card">
      <div className="label">{label}</div>
      <div className="value">{value}</div>
    </div>
  )
}
