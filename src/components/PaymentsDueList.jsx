import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useFinance } from '../context/FinanceContext'
import StatusBadge from './StatusBadge'
import {
  buildPaymentsDue,
  formatCurrency,
  formatDate,
  getBalanceDue,
  toInputDate,
} from '../utils/loanUtils'

export default function PaymentsDueList() {
  const { customers, getLoan, addPayment } = useFinance()
  const navigate = useNavigate()
  const [filter, setFilter] = useState('This Month')

  const dues = useMemo(() => buildPaymentsDue(customers), [customers])

  const displayRows = useMemo(() => {
    if (filter === 'This Month' || filter === 'All') return dues
    return dues.filter((row) => row.status === filter)
  }, [dues, filter])

  const markPaid = (row) => {
    const loan = getLoan(row.loanId)
    if (!loan || row.status === 'Paid') return
    const balance = getBalanceDue(loan)
    const amount = Math.min(row.amountDue || loan.emiAmount, balance)
    if (amount <= 0) return
    addPayment(loan.id, {
      date: toInputDate(),
      amount,
      mode: 'UPI',
      emiNumber: row.emiNumber,
      remarks: 'Quick collect from Payments Due',
      lateFee: row.status === 'Overdue' ? 50 : 0,
    })
  }

  return (
    <div>
      <h1 className="page-title">Payments Due</h1>
      <p className="page-sub">
        EMI collection desk for the current cycle — filter and mark paid quickly.
      </p>

      <div className="toolbar">
        <div className="filter-tabs">
          {['This Month', 'Overdue', 'Paid', 'Pending', 'All'].map((f) => (
            <button
              key={f}
              type="button"
              className={`filter-tab ${filter === f ? 'active' : ''}`}
              onClick={() => setFilter(f)}
            >
              {f}
            </button>
          ))}
        </div>
        <div style={{ marginLeft: 'auto', fontSize: '0.85rem', color: '#64748b' }}>
          {displayRows.length} due(s)
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'auto' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Customer</th>
              <th>Loan / Vehicle</th>
              <th>EMI Due Date</th>
              <th>Amount Due</th>
              <th>EMI No.</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {displayRows.length === 0 ? (
              <tr>
                <td colSpan={7} className="empty-state">
                  No dues for this filter.
                </td>
              </tr>
            ) : (
              displayRows.map((row) => (
                <tr key={row.loanId}>
                  <td>
                    <button
                      type="button"
                      className="linkish"
                      onClick={() => navigate(`/customers/${row.customerId}`)}
                    >
                      {row.customerName}
                    </button>
                  </td>
                  <td>
                    <button
                      type="button"
                      className="linkish"
                      onClick={() => navigate(`/loans/${row.loanId}`)}
                    >
                      {row.loanId}
                    </button>
                    <div className="meta-line">{row.vehicle}</div>
                  </td>
                  <td>
                    {formatDate(row.dueDate)}
                    {row.daysOverdue > 0 ? (
                      <div style={{ fontSize: '0.75rem', color: '#b91c1c' }}>
                        {row.daysOverdue} day(s) overdue
                      </div>
                    ) : null}
                  </td>
                  <td>{formatCurrency(row.amountDue)}</td>
                  <td>{row.emiNumber}</td>
                  <td>
                    <StatusBadge status={row.status} />
                  </td>
                  <td>
                    {row.status === 'Paid' ? (
                      <span className="meta-line">Collected</span>
                    ) : (
                      <button
                        type="button"
                        className="btn btn-primary btn-sm"
                        onClick={() => markPaid(row)}
                      >
                        Mark as Paid
                      </button>
                    )}
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
