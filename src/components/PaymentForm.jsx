import { useMemo, useState } from 'react'
import {
  formatCurrency,
  getBalanceDue,
  getNextEmiDueDate,
  getNextEmiNumber,
  toInputDate,
  vehicleLabel,
} from '../utils/loanUtils'
import Modal from './Modal'

export default function PaymentForm({ loan, onSubmit, onClose }) {
  const suggested = useMemo(() => {
    const balance = getBalanceDue(loan)
    const emi = Number(loan.emiAmount) || 0
    return Math.min(emi, balance)
  }, [loan])

  const [form, setForm] = useState({
    date: toInputDate(),
    amount: suggested,
    mode: 'UPI',
    emiNumber: getNextEmiNumber(loan),
    remarks: '',
    lateFee: 0,
  })

  const balanceAfter = Math.max(0, getBalanceDue(loan) - (Number(form.amount) || 0))

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.amount || Number(form.amount) <= 0) {
      alert('Enter a valid payment amount.')
      return
    }
    onSubmit({
      ...form,
      amount: Number(form.amount),
      lateFee: Number(form.lateFee) || 0,
      emiNumber: Number(form.emiNumber) || getNextEmiNumber(loan),
    })
  }

  return (
    <Modal
      title={`Collect EMI — ${loan.customerName}`}
      onClose={onClose}
      footer={
        <>
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" form="payment-form" className="btn btn-primary">
            Record Payment
          </button>
        </>
      }
    >
      <div
        style={{
          marginBottom: '0.9rem',
          fontSize: '0.82rem',
          color: '#475569',
          background: '#f8fafc',
          borderRadius: 6,
          padding: '0.65rem 0.75rem',
        }}
      >
        {loan.id} · {vehicleLabel(loan)} · Balance {formatCurrency(getBalanceDue(loan))}
      </div>
      <form id="payment-form" onSubmit={handleSubmit} className="form-grid">
        <div className="form-field">
          <label>Payment Date</label>
          <input
            type="date"
            value={form.date}
            onChange={(e) => setForm((p) => ({ ...p, date: e.target.value }))}
          />
        </div>
        <div className="form-field">
          <label>Amount Paid</label>
          <input
            type="number"
            min="1"
            value={form.amount}
            onChange={(e) => setForm((p) => ({ ...p, amount: e.target.value }))}
          />
          <span className="hint">
            Suggested EMI: {formatCurrency(suggested)} · Next due:{' '}
            {getNextEmiDueDate(loan) || '—'}
          </span>
        </div>
        <div className="form-field">
          <label>Mode</label>
          <select
            value={form.mode}
            onChange={(e) => setForm((p) => ({ ...p, mode: e.target.value }))}
          >
            <option>Cash</option>
            <option>UPI</option>
            <option>Bank</option>
          </select>
        </div>
        <div className="form-field">
          <label>EMI No.</label>
          <input
            type="number"
            min="1"
            value={form.emiNumber}
            onChange={(e) => setForm((p) => ({ ...p, emiNumber: e.target.value }))}
          />
        </div>
        <div className="form-field">
          <label>Late Fee</label>
          <input
            type="number"
            min="0"
            value={form.lateFee}
            onChange={(e) => setForm((p) => ({ ...p, lateFee: e.target.value }))}
          />
        </div>
        <div className="form-field">
          <label>Balance After</label>
          <input value={formatCurrency(balanceAfter)} readOnly disabled />
        </div>
        <div className="form-field full">
          <label>Remarks</label>
          <input
            value={form.remarks}
            onChange={(e) => setForm((p) => ({ ...p, remarks: e.target.value }))}
            placeholder="Partial / full / settlement note"
          />
        </div>
      </form>
    </Modal>
  )
}
