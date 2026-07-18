import { useEffect, useMemo, useState } from 'react'
import { calculateEmi, toInputDate } from '../utils/loanUtils'

const emptyLoan = {
  vehicleModel: '',
  registrationNo: '',
  chassisNo: '',
  engineNo: '',
  documentHeld: 'RC Book',
  loanAmount: '',
  interestRate: '18',
  tenure: '12',
  emiAmount: '',
  startDate: toInputDate(),
  purpose: '',
  guarantorName: '',
  guarantorPhone: '',
}

export default function LoanForm({
  mode = 'create',
  initialValues,
  onSubmit,
  onCancel,
  submitLabel,
  showActions = true,
}) {
  const [form, setForm] = useState(() => ({
    ...emptyLoan,
    ...(initialValues || {}),
  }))
  const [emiTouched, setEmiTouched] = useState(mode === 'edit')

  const suggestedEmi = useMemo(
    () => calculateEmi(form.loanAmount, form.interestRate, form.tenure),
    [form.loanAmount, form.interestRate, form.tenure],
  )

  useEffect(() => {
    if (!emiTouched) {
      setForm((prev) => ({ ...prev, emiAmount: suggestedEmi || '' }))
    }
  }, [suggestedEmi, emiTouched])

  const setField = (key, value) => setForm((prev) => ({ ...prev, [key]: value }))

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.registrationNo.trim() || !form.vehicleModel.trim()) {
      alert('Vehicle model and registration number are required (document loan).')
      return
    }
    if (!form.loanAmount || Number(form.loanAmount) <= 0) {
      alert('Enter a valid loan amount.')
      return
    }
    onSubmit({
      ...form,
      loanAmount: Number(form.loanAmount) || 0,
      interestRate: Number(form.interestRate) || 0,
      tenure: Number(form.tenure) || 0,
      emiAmount: Number(form.emiAmount) || suggestedEmi || 0,
    })
  }

  return (
    <form id="loan-form" onSubmit={handleSubmit}>
      <div className="form-section">
        <h3>Vehicle document (security)</h3>
        <div className="form-grid">
          <div className="form-field">
            <label>Vehicle Model *</label>
            <input
              value={form.vehicleModel}
              onChange={(e) => setField('vehicleModel', e.target.value)}
              placeholder="Honda Activa / Pulsar 150"
              required
            />
          </div>
          <div className="form-field">
            <label>Registration No. *</label>
            <input
              value={form.registrationNo}
              onChange={(e) => setField('registrationNo', e.target.value.toUpperCase())}
              placeholder="TN09AB1234"
              required
            />
          </div>
          <div className="form-field">
            <label>Chassis No.</label>
            <input
              value={form.chassisNo}
              onChange={(e) => setField('chassisNo', e.target.value)}
            />
          </div>
          <div className="form-field">
            <label>Engine No.</label>
            <input
              value={form.engineNo}
              onChange={(e) => setField('engineNo', e.target.value)}
            />
          </div>
          <div className="form-field">
            <label>Document Held</label>
            <select
              value={form.documentHeld}
              onChange={(e) => setField('documentHeld', e.target.value)}
            >
              <option>RC Book</option>
              <option>RC Book + Insurance</option>
              <option>RC + Invoice</option>
            </select>
          </div>
          <div className="form-field">
            <label>Loan Purpose</label>
            <input
              value={form.purpose}
              onChange={(e) => setField('purpose', e.target.value)}
              placeholder="Personal / business / medical..."
            />
          </div>
        </div>
      </div>

      <div className="form-section">
        <h3>Loan terms</h3>
        <div className="form-grid">
          <div className="form-field">
            <label>Loan Amount *</label>
            <input
              type="number"
              min="1"
              value={form.loanAmount}
              onChange={(e) => setField('loanAmount', e.target.value)}
              required
            />
            <span className="hint">Disbursed against bike document — no down payment</span>
          </div>
          <div className="form-field">
            <label>Interest Rate (% p.a.)</label>
            <input
              type="number"
              step="0.1"
              min="0"
              value={form.interestRate}
              onChange={(e) => setField('interestRate', e.target.value)}
            />
          </div>
          <div className="form-field">
            <label>Tenure (months)</label>
            <input
              type="number"
              min="1"
              value={form.tenure}
              onChange={(e) => setField('tenure', e.target.value)}
            />
          </div>
          <div className="form-field">
            <label>EMI Amount {emiTouched ? '(edited)' : '(auto)'}</label>
            <input
              type="number"
              min="0"
              value={form.emiAmount}
              onChange={(e) => {
                setEmiTouched(true)
                setField('emiAmount', e.target.value)
              }}
            />
            {emiTouched ? (
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                style={{ alignSelf: 'flex-start', marginTop: 4 }}
                onClick={() => {
                  setEmiTouched(false)
                  setField('emiAmount', suggestedEmi)
                }}
              >
                Reset to auto ({suggestedEmi})
              </button>
            ) : null}
          </div>
          <div className="form-field">
            <label>Loan Start / Disbursement Date</label>
            <input
              type="date"
              value={form.startDate}
              onChange={(e) => setField('startDate', e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="form-section">
        <h3>Guarantor (optional)</h3>
        <div className="form-grid">
          <div className="form-field">
            <label>Guarantor Name</label>
            <input
              value={form.guarantorName}
              onChange={(e) => setField('guarantorName', e.target.value)}
            />
          </div>
          <div className="form-field">
            <label>Guarantor Phone</label>
            <input
              value={form.guarantorPhone}
              onChange={(e) => setField('guarantorPhone', e.target.value)}
            />
          </div>
        </div>
      </div>

      {showActions ? (
        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
          <button type="submit" className="btn btn-primary">
            {submitLabel || (mode === 'edit' ? 'Save Loan' : 'Create Loan')}
          </button>
          {onCancel ? (
            <button type="button" className="btn btn-secondary" onClick={onCancel}>
              Cancel
            </button>
          ) : null}
        </div>
      ) : null}
    </form>
  )
}
