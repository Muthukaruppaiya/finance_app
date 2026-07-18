import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useFinance } from '../context/FinanceContext'
import StatusBadge from './StatusBadge'
import {
  deriveCustomerStatus,
  deriveLoanStatus,
  formatCurrency,
  formatDate,
  getBalanceDue,
  getEmisPaidCount,
  vehicleLabel,
} from '../utils/loanUtils'

export default function CustomerDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { getCustomer, updateCustomer } = useFinance()
  const customer = getCustomer(id)
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState(null)

  if (!customer) {
    return (
      <div className="card">
        <h1 className="page-title">Customer not found</h1>
        <button type="button" className="btn btn-primary" onClick={() => navigate('/customers')}>
          Back to Customers
        </button>
      </div>
    )
  }

  const loans = customer.loans || []
  const outstanding = loans.reduce((s, l) => s + getBalanceDue(l), 0)
  const disbursed = loans.reduce((s, l) => s + (Number(l.loanAmount) || 0), 0)
  const status = deriveCustomerStatus(customer)

  const startEdit = () => {
    setForm({
      name: customer.name,
      phone: customer.phone,
      address: customer.address || '',
      idProof: customer.idProof || '',
    })
    setEditing(true)
  }

  return (
    <div>
      <div style={{ marginBottom: '0.65rem' }}>
        <Link to="/customers" style={{ fontSize: '0.85rem', color: '#0f766e' }}>
          ← Customers
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
            {customer.name}
          </h1>
          <p className="page-sub" style={{ marginBottom: 0 }}>
            {customer.id} · {customer.phone} · Since {formatDate(customer.createdAt)}
          </p>
        </div>
        <StatusBadge status={status} />
        <button type="button" className="btn btn-secondary" onClick={editing ? () => setEditing(false) : startEdit}>
          {editing ? 'Cancel' : 'Edit Profile'}
        </button>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => navigate(`/new-loan?customerId=${customer.id}`)}
        >
          + New Loan for this Customer
        </button>
      </div>

      <div className="summary-grid">
        <Summary label="Total Loans" value={loans.length} />
        <Summary label="Total Disbursed" value={formatCurrency(disbursed)} />
        <Summary label="Outstanding" value={formatCurrency(outstanding)} />
        <Summary
          label="Open Loans"
          value={loans.filter((l) => deriveLoanStatus(l) !== 'Closed').length}
        />
      </div>

      {editing && form ? (
        <div className="card" style={{ marginBottom: '1.1rem' }}>
          <div className="section-title">Edit customer profile</div>
          <div className="form-grid">
            <div className="form-field">
              <label>Full Name</label>
              <input
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              />
            </div>
            <div className="form-field">
              <label>Phone</label>
              <input
                value={form.phone}
                onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
              />
            </div>
            <div className="form-field">
              <label>ID Proof</label>
              <input
                value={form.idProof}
                onChange={(e) => setForm((p) => ({ ...p, idProof: e.target.value }))}
              />
            </div>
            <div className="form-field full">
              <label>Address</label>
              <textarea
                rows={2}
                value={form.address}
                onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))}
              />
            </div>
          </div>
          <div style={{ marginTop: '0.85rem' }}>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => {
                updateCustomer(customer.id, form)
                setEditing(false)
              }}
            >
              Save Profile
            </button>
          </div>
        </div>
      ) : (
        <div className="card" style={{ marginBottom: '1.1rem' }}>
          <div className="form-grid">
            <Field label="Address" value={customer.address || '—'} />
            <Field label="ID Proof" value={customer.idProof || '—'} />
            <Field label="Customer since" value={formatDate(customer.createdAt)} />
            <Field label="Phone" value={customer.phone} />
          </div>
        </div>
      )}

      <div className="card" style={{ padding: 0, overflow: 'auto' }}>
        <div
          style={{
            padding: '0.85rem 1rem',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          <strong>Loan history ({loans.length})</strong>
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={() => navigate(`/new-loan?customerId=${customer.id}`)}
          >
            Generate new loan
          </button>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>Loan ID</th>
              <th>Vehicle / Reg.</th>
              <th>Document</th>
              <th>Amount</th>
              <th>EMIs</th>
              <th>Balance</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {loans.length === 0 ? (
              <tr>
                <td colSpan={7} className="empty-state">
                  No loans yet. Generate the first document loan for this customer.
                </td>
              </tr>
            ) : (
              [...loans]
                .sort((a, b) => new Date(b.startDate) - new Date(a.startDate))
                .map((l) => (
                  <tr
                    key={l.id}
                    className="clickable"
                    onClick={() => navigate(`/loans/${l.id}`)}
                  >
                    <td>
                      <div style={{ fontWeight: 650 }}>{l.id}</div>
                      <div className="meta-line">{formatDate(l.startDate)}</div>
                    </td>
                    <td>{vehicleLabel(l)}</td>
                    <td>{l.documentHeld}</td>
                    <td>{formatCurrency(l.loanAmount)}</td>
                    <td>
                      {getEmisPaidCount(l)} / {l.tenure}
                    </td>
                    <td>{formatCurrency(getBalanceDue(l))}</td>
                    <td>
                      <StatusBadge status={deriveLoanStatus(l)} />
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

function Field({ label, value }) {
  return (
    <div className="form-field">
      <label>{label}</label>
      <div style={{ fontSize: '0.9rem', fontWeight: 560 }}>{value}</div>
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
