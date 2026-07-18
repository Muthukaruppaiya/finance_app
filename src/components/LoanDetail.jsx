import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useFinance } from '../context/FinanceContext'
import LoanForm from './LoanForm'
import PaymentForm from './PaymentForm'
import StatusBadge from './StatusBadge'
import {
  deriveLoanTrackStatus,
  formatCurrency,
  formatDate,
  getBalanceDue,
  getEmisPaidCount,
  getNextEmiDueDate,
  getTotalPaid,
  vehicleLabel,
} from '../utils/loanUtils'

export default function LoanDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { getLoan, updateLoan, addPayment } = useFinance()
  const loan = getLoan(id)
  const [editing, setEditing] = useState(false)
  const [showPayment, setShowPayment] = useState(false)

  if (!loan) {
    return (
      <div className="card">
        <h1 className="page-title">Loan not found</h1>
        <button type="button" className="btn btn-primary" onClick={() => navigate('/loans')}>
          Back to Loans
        </button>
      </div>
    )
  }

  const totalPaid = getTotalPaid(loan)
  const balance = getBalanceDue(loan)
  const trackStatus = deriveLoanTrackStatus(loan)
  const nextDue = getNextEmiDueDate(loan)
  const emisPaid = getEmisPaidCount(loan)

  return (
    <div>
      <div style={{ marginBottom: '0.65rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
        <Link to="/loans" style={{ fontSize: '0.85rem', color: '#0f766e' }}>
          ← Loans
        </Link>
        <Link
          to={`/customers/${loan.customerId}`}
          style={{ fontSize: '0.85rem', color: '#0f766e' }}
        >
          Customer: {loan.customerName}
        </Link>
      </div>

      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '0.65rem',
          alignItems: 'center',
          marginBottom: '1rem',
        }}
      >
        <div style={{ flex: 1, minWidth: 220 }}>
          <h1 className="page-title" style={{ marginBottom: 0 }}>
            {loan.id}
          </h1>
          <p className="page-sub" style={{ marginBottom: 0 }}>
            {loan.customerName} · {vehicleLabel(loan)} · Doc: {loan.documentHeld}
          </p>
        </div>
        <button type="button" className="btn btn-secondary" onClick={() => setEditing((v) => !v)}>
          {editing ? 'Cancel Edit' : 'Edit Loan'}
        </button>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => setShowPayment(true)}
          disabled={balance <= 0}
        >
          + Add Payment
        </button>
      </div>

      <div className="summary-grid">
        <Summary label="Loan Amount" value={formatCurrency(loan.loanAmount)} />
        <Summary label="Total Paid" value={formatCurrency(totalPaid)} />
        <Summary label="Balance Due" value={formatCurrency(balance)} />
        <Summary label="Next EMI Due" value={nextDue ? formatDate(nextDue) : '—'} />
        <Summary label="EMIs" value={`${emisPaid} / ${loan.tenure}`} />
        <div className="summary-card">
          <div className="label">Status</div>
          <div className="value" style={{ fontSize: '1rem' }}>
            <StatusBadge status={trackStatus} />
          </div>
        </div>
      </div>

      {editing ? (
        <div className="card" style={{ marginBottom: '1.1rem' }}>
          <div className="section-title">Edit loan & document details</div>
          <LoanForm
            mode="edit"
            initialValues={loan}
            submitLabel="Save Loan"
            onCancel={() => setEditing(false)}
            onSubmit={(data) => {
              updateLoan(loan.id, data)
              setEditing(false)
            }}
          />
        </div>
      ) : (
        <div className="two-col" style={{ marginBottom: '1.1rem' }}>
          <div className="card">
            <div className="section-title">Borrower</div>
            <div className="form-grid">
              <Field label="Name" value={loan.customerName} />
              <Field label="Phone" value={loan.customerPhone} />
              <Field label="Address" value={loan.customerAddress || '—'} />
              <Field label="ID Proof" value={loan.customerIdProof || '—'} />
            </div>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              style={{ marginTop: '0.75rem' }}
              onClick={() => navigate(`/customers/${loan.customerId}`)}
            >
              Open customer profile
            </button>
          </div>
          <div className="card">
            <div className="section-title">Vehicle document held</div>
            <div className="form-grid">
              <Field label="Model" value={loan.vehicleModel || '—'} />
              <Field label="Registration" value={loan.registrationNo || '—'} />
              <Field label="Chassis" value={loan.chassisNo || '—'} />
              <Field label="Engine" value={loan.engineNo || '—'} />
              <Field label="Document" value={loan.documentHeld || '—'} />
              <Field label="Purpose" value={loan.purpose || '—'} />
              <Field label="Interest" value={`${loan.interestRate}% p.a.`} />
              <Field label="EMI" value={formatCurrency(loan.emiAmount)} />
              <Field label="Start Date" value={formatDate(loan.startDate)} />
              <Field
                label="Guarantor"
                value={
                  loan.guarantorName
                    ? `${loan.guarantorName}${loan.guarantorPhone ? ` · ${loan.guarantorPhone}` : ''}`
                    : '—'
                }
              />
            </div>
          </div>
        </div>
      )}

      <div className="card" style={{ padding: 0, overflow: 'auto' }}>
        <div
          style={{
            padding: '0.85rem 1rem',
            borderBottom: '1px solid #e2e8f0',
            fontWeight: 650,
          }}
        >
          Payment History
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Amount</th>
              <th>Mode</th>
              <th>EMI No.</th>
              <th>Balance After</th>
              <th>Late Fee</th>
              <th>Remarks</th>
            </tr>
          </thead>
          <tbody>
            {(loan.payments || []).length === 0 ? (
              <tr>
                <td colSpan={7} className="empty-state">
                  No payments yet.
                </td>
              </tr>
            ) : (
              [...loan.payments]
                .sort((a, b) => new Date(b.date) - new Date(a.date))
                .map((p) => (
                  <tr key={p.id}>
                    <td>{formatDate(p.date)}</td>
                    <td>{formatCurrency(p.amount)}</td>
                    <td>{p.mode}</td>
                    <td>{p.emiNumber}</td>
                    <td>{formatCurrency(p.balanceAfter)}</td>
                    <td>{p.lateFee ? formatCurrency(p.lateFee) : '—'}</td>
                    <td>{p.remarks || '—'}</td>
                  </tr>
                ))
            )}
          </tbody>
        </table>
      </div>

      {showPayment ? (
        <PaymentForm
          loan={loan}
          onClose={() => setShowPayment(false)}
          onSubmit={(payment) => {
            addPayment(loan.id, payment)
            setShowPayment(false)
          }}
        />
      ) : null}
    </div>
  )
}

function Field({ label, value }) {
  return (
    <div className="form-field">
      <label>{label}</label>
      <div style={{ fontSize: '0.88rem', fontWeight: 560 }}>{value}</div>
    </div>
  )
}

function Summary({ label, value }) {
  return (
    <div className="summary-card">
      <div className="label">{label}</div>
      <div className="value">{value}</div>
    </div>
  )
}
