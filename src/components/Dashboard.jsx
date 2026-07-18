import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useFinance } from '../context/FinanceContext'
import StatusBadge from './StatusBadge'
import {
  buildPaymentsDue,
  daysBetween,
  deriveLoanStatus,
  flattenLoans,
  formatCurrency,
  formatDate,
  getBalanceDue,
  getMonthKey,
  getMonthLabel,
  getNextEmiDueDate,
  getTotalPaid,
  isSameMonth,
  vehicleLabel,
} from '../utils/loanUtils'

export function useAccountStats(customers) {
  return useMemo(() => {
    const loans = flattenLoans(customers)
    const totalCustomers = customers.length
    const totalLoans = loans.length
    const totalDisbursed = loans.reduce((s, l) => s + (Number(l.loanAmount) || 0), 0)
    const totalCollected = loans.reduce((s, l) => s + getTotalPaid(l), 0)
    const totalOutstanding = loans.reduce((s, l) => s + getBalanceDue(l), 0)

    let overdueAmount = 0
    const overdueLoans = []

    loans.forEach((l) => {
      if (deriveLoanStatus(l) !== 'Overdue') return
      const due = getNextEmiDueDate(l)
      const amount = Math.min(Number(l.emiAmount) || 0, getBalanceDue(l))
      overdueAmount += amount
      overdueLoans.push({
        loanId: l.id,
        customerId: l.customerId,
        name: l.customerName,
        vehicle: vehicleLabel(l),
        amountOverdue: amount,
        daysOverdue: due ? Math.max(0, daysBetween(due)) : 0,
      })
    })

    overdueLoans.sort((a, b) => b.daysOverdue - a.daysOverdue)

    const thisMonthCollection = loans.reduce((sum, l) => {
      const monthSum = (l.payments || [])
        .filter((p) => isSameMonth(p.date))
        .reduce((s, p) => s + (Number(p.amount) || 0), 0)
      return sum + monthSum
    }, 0)

    const monthMap = {}
    const now = new Date()
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      monthMap[getMonthKey(d)] = 0
    }
    loans.forEach((l) => {
      ;(l.payments || []).forEach((p) => {
        const key = getMonthKey(p.date)
        if (key in monthMap) monthMap[key] += Number(p.amount) || 0
      })
    })

    const monthWise = Object.entries(monthMap).map(([key, amount]) => ({
      key,
      label: getMonthLabel(key),
      amount,
    }))

    const dues = buildPaymentsDue(customers)
    const openLoans = loans.filter((l) => deriveLoanStatus(l) !== 'Closed').length

    return {
      totalCustomers,
      totalLoans,
      openLoans,
      totalDisbursed,
      totalCollected,
      totalOutstanding,
      overdueAmount,
      overdueLoans,
      thisMonthCollection,
      monthWise,
      dues,
    }
  }, [customers])
}

export default function Dashboard() {
  const { customers } = useFinance()
  const navigate = useNavigate()
  const stats = useAccountStats(customers)

  return (
    <div>
      <h1 className="page-title">Dashboard</h1>
      <p className="page-sub">
        Document finance portfolio — customers, loans against bike RC, collections & overdue.
      </p>

      <div className="summary-grid">
        <Stat label="Customers" value={stats.totalCustomers} />
        <Stat label="Total Loans" value={stats.totalLoans} />
        <Stat label="Open Loans" value={stats.openLoans} />
        <Stat label="Disbursed" value={formatCurrency(stats.totalDisbursed)} />
        <Stat label="Collected" value={formatCurrency(stats.totalCollected)} />
        <Stat label="Outstanding" value={formatCurrency(stats.totalOutstanding)} />
        <Stat label="Overdue EMI" value={formatCurrency(stats.overdueAmount)} />
        <Stat label="This Month Collection" value={formatCurrency(stats.thisMonthCollection)} />
      </div>

      <div className="toolbar" style={{ marginBottom: '1rem' }}>
        <button type="button" className="btn btn-primary" onClick={() => navigate('/new-loan')}>
          + New Document Loan
        </button>
        <button type="button" className="btn btn-secondary" onClick={() => navigate('/payments')}>
          Open Collection Desk
        </button>
        <button type="button" className="btn btn-secondary" onClick={() => navigate('/customers')}>
          Customers
        </button>
      </div>

      <div className="two-col">
        <div className="card" style={{ padding: 0, overflow: 'auto' }}>
          <div
            style={{
              padding: '0.85rem 1rem',
              borderBottom: '1px solid #e2e8f0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <strong>Overdue loans</strong>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => navigate('/payments')}
            >
              Collect
            </button>
          </div>
          <table className="data-table">
            <thead>
              <tr>
                <th>Customer</th>
                <th>Vehicle</th>
                <th>Amount</th>
                <th>Days</th>
              </tr>
            </thead>
            <tbody>
              {stats.overdueLoans.length === 0 ? (
                <tr>
                  <td colSpan={4} className="empty-state">
                    No overdue loans.
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
                    <td>
                      <div className="meta-line">{row.loanId}</div>
                      {row.vehicle}
                    </td>
                    <td>{formatCurrency(row.amountOverdue)}</td>
                    <td>
                      <StatusBadge status="Overdue" /> {row.daysOverdue}d
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="card" style={{ padding: 0, overflow: 'auto' }}>
          <div
            style={{
              padding: '0.85rem 1rem',
              borderBottom: '1px solid #e2e8f0',
              fontWeight: 650,
            }}
          >
            This cycle — EMI status ({stats.dues.length})
          </div>
          <table className="data-table">
            <thead>
              <tr>
                <th>Customer</th>
                <th>Due</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {stats.dues.slice(0, 10).map((row) => (
                <tr
                  key={row.loanId}
                  className="clickable"
                  onClick={() => navigate(`/loans/${row.loanId}`)}
                >
                  <td>
                    <div style={{ fontWeight: 650 }}>{row.customerName}</div>
                    <div className="meta-line">{row.loanId}</div>
                  </td>
                  <td>
                    {formatCurrency(row.amountDue)}
                    <div className="meta-line">{formatDate(row.dueDate)}</div>
                  </td>
                  <td>
                    <StatusBadge status={row.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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
