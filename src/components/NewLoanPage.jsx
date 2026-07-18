import { useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useFinance } from '../context/FinanceContext'
import LoanForm from './LoanForm'
import {
  deriveCustomerStatus,
  formatCurrency,
  generateCustomerId,
  getBalanceDue,
} from '../utils/loanUtils'
import StatusBadge from './StatusBadge'

export default function NewLoanPage() {
  const { customers, addLoan, addCustomerWithLoan } = useFinance()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const preselectId = searchParams.get('customerId') || ''

  const [mode, setMode] = useState(preselectId ? 'existing' : 'existing')
  const [query, setQuery] = useState('')
  const [selectedId, setSelectedId] = useState(preselectId)
  const [customerForm, setCustomerForm] = useState({
    id: generateCustomerId(customers),
    name: '',
    phone: '',
    address: '',
    idProof: '',
  })

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return customers.filter((c) => {
      if (!q) return true
      return (
        c.name.toLowerCase().includes(q) ||
        c.phone.includes(q) ||
        c.id.toLowerCase().includes(q) ||
        (c.idProof || '').toLowerCase().includes(q)
      )
    })
  }, [customers, query])

  const selected = customers.find((c) => c.id === selectedId)

  const handleLoanSubmit = (loanData) => {
    if (mode === 'existing') {
      if (!selectedId) {
        alert('Select an existing customer first.')
        return
      }
      const loan = addLoan(selectedId, loanData)
      navigate(`/loans/${loan.id}`)
      return
    }

    if (!customerForm.name.trim() || !customerForm.phone.trim()) {
      alert('Customer name and phone are required.')
      return
    }
    const { loanId } = addCustomerWithLoan(customerForm, loanData)
    navigate(`/loans/${loanId}`)
  }

  return (
    <div>
      <h1 className="page-title">New Document Loan</h1>
      <p className="page-sub">
        Disburse a loan against bike RC / vehicle documents. Use an old customer or register a new one.
      </p>

      <div className="choice-row">
        <button
          type="button"
          className={`choice-card ${mode === 'existing' ? 'active' : ''}`}
          onClick={() => setMode('existing')}
        >
          <strong>Existing customer</strong>
          <span>Generate another loan for someone already in the books</span>
        </button>
        <button
          type="button"
          className={`choice-card ${mode === 'new' ? 'active' : ''}`}
          onClick={() => setMode('new')}
        >
          <strong>New customer</strong>
          <span>Create customer profile + first loan together</span>
        </button>
      </div>

      {mode === 'existing' ? (
        <div className="card" style={{ marginBottom: '1.1rem' }}>
          <div className="section-title">Select customer</div>
          <div className="toolbar" style={{ marginBottom: '0.65rem' }}>
            <input
              placeholder="Search name, phone, ID, Aadhar/PAN..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <div className="customer-pick">
            {filtered.length === 0 ? (
              <div className="empty-state">No customers found.</div>
            ) : (
              filtered.map((c) => {
                const openBalance = (c.loans || []).reduce((s, l) => s + getBalanceDue(l), 0)
                return (
                  <button
                    key={c.id}
                    type="button"
                    className={`customer-pick-item ${selectedId === c.id ? 'selected' : ''}`}
                    onClick={() => setSelectedId(c.id)}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                      <div>
                        <strong>{c.name}</strong>
                        <div className="meta-line">
                          {c.id} · {c.phone} · {(c.loans || []).length} loan(s)
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <StatusBadge status={deriveCustomerStatus(c)} />
                        <div className="meta-line">OS {formatCurrency(openBalance)}</div>
                      </div>
                    </div>
                  </button>
                )
              })
            )}
          </div>

          {selected ? (
            <div
              style={{
                background: '#f0fdfa',
                border: '1px solid #99f6e4',
                borderRadius: 8,
                padding: '0.75rem 0.9rem',
                fontSize: '0.85rem',
              }}
            >
              Selected: <strong>{selected.name}</strong> ({selected.id}) —{' '}
              {selected.address || 'No address'} · ID: {selected.idProof || '—'}
            </div>
          ) : (
            <div className="meta-line">Pick a customer above to attach the new loan.</div>
          )}
        </div>
      ) : (
        <div className="card" style={{ marginBottom: '1.1rem' }}>
          <div className="section-title">New customer profile</div>
          <div className="form-grid">
            <div className="form-field">
              <label>Customer ID</label>
              <input value={customerForm.id} disabled />
            </div>
            <div className="form-field">
              <label>Full Name *</label>
              <input
                value={customerForm.name}
                onChange={(e) => setCustomerForm((p) => ({ ...p, name: e.target.value }))}
                required
              />
            </div>
            <div className="form-field">
              <label>Phone *</label>
              <input
                value={customerForm.phone}
                onChange={(e) => setCustomerForm((p) => ({ ...p, phone: e.target.value }))}
                required
              />
            </div>
            <div className="form-field">
              <label>ID Proof (Aadhar / PAN)</label>
              <input
                value={customerForm.idProof}
                onChange={(e) => setCustomerForm((p) => ({ ...p, idProof: e.target.value }))}
              />
            </div>
            <div className="form-field full">
              <label>Address</label>
              <textarea
                rows={2}
                value={customerForm.address}
                onChange={(e) => setCustomerForm((p) => ({ ...p, address: e.target.value }))}
              />
            </div>
          </div>
        </div>
      )}

      <div className="card">
        <div className="section-title">Loan against vehicle document</div>
        <LoanForm
          mode="create"
          submitLabel={mode === 'existing' ? 'Disburse Loan to Customer' : 'Create Customer & Disburse'}
          onCancel={() => navigate(selectedId ? `/customers/${selectedId}` : '/loans')}
          onSubmit={handleLoanSubmit}
        />
      </div>
    </div>
  )
}
