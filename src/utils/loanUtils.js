/** Flat-rate EMI: (principal + total interest) / tenure */
export function calculateEmi(loanAmount, interestRate, tenureMonths) {
  const principal = Number(loanAmount) || 0
  const rate = Number(interestRate) || 0
  const tenure = Number(tenureMonths) || 0
  if (principal <= 0 || tenure <= 0) return 0
  const totalInterest = (principal * rate * tenure) / 1200
  return Math.round((principal + totalInterest) / tenure)
}

export function formatCurrency(amount) {
  const value = Number(amount) || 0
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value)
}

export function formatDate(dateStr) {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  if (Number.isNaN(d.getTime())) return dateStr
  return d.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

export function toInputDate(date = new Date()) {
  const d = date instanceof Date ? date : new Date(date)
  return d.toISOString().slice(0, 10)
}

export function addMonths(dateStr, months) {
  const d = new Date(dateStr)
  d.setMonth(d.getMonth() + months)
  return toInputDate(d)
}

export function daysBetween(fromDate, toDate = new Date()) {
  const from = new Date(fromDate)
  const to = new Date(toDate)
  from.setHours(0, 0, 0, 0)
  to.setHours(0, 0, 0, 0)
  return Math.floor((to - from) / (1000 * 60 * 60 * 24))
}

export function generateCustomerId(existing = []) {
  const nums = existing
    .map((c) => parseInt(String(c.id).replace(/\D/g, ''), 10))
    .filter((n) => !Number.isNaN(n))
  const next = (nums.length ? Math.max(...nums) : 1000) + 1
  return `CUST-${next}`
}

export function generateLoanId(existingLoans = []) {
  const nums = existingLoans
    .map((l) => parseInt(String(l.id).replace(/\D/g, ''), 10))
    .filter((n) => !Number.isNaN(n))
  const next = (nums.length ? Math.max(...nums) : 2000) + 1
  return `LN-${next}`
}

export function flattenLoans(customers) {
  return customers.flatMap((c) =>
    (c.loans || []).map((loan) => ({
      ...loan,
      customerId: c.id,
      customerName: c.name,
      customerPhone: c.phone,
    })),
  )
}

export function getTotalPaid(loan) {
  return (loan.payments || []).reduce((sum, p) => sum + (Number(p.amount) || 0), 0)
}

export function getBalanceDue(loan) {
  return Math.max(0, (Number(loan.loanAmount) || 0) - getTotalPaid(loan))
}

export function getEmisPaidCount(loan) {
  const paid = new Set(
    (loan.payments || [])
      .map((p) => p.emiNumber)
      .filter((n) => n != null && n > 0),
  )
  return paid.size
}

export function getNextEmiNumber(loan) {
  const paid = getEmisPaidCount(loan)
  return Math.min(paid + 1, Number(loan.tenure) || paid + 1)
}

export function getNextEmiDueDate(loan) {
  if (!loan.startDate) return null
  const paid = getEmisPaidCount(loan)
  if (paid >= (Number(loan.tenure) || 0)) return null
  return addMonths(loan.startDate, paid + 1)
}

export function deriveLoanStatus(loan) {
  const balance = getBalanceDue(loan)
  const tenure = Number(loan.tenure) || 0
  const paidCount = getEmisPaidCount(loan)

  if (balance <= 0 || paidCount >= tenure) return 'Closed'

  const dueDate = getNextEmiDueDate(loan)
  if (dueDate && daysBetween(dueDate) > 0) return 'Overdue'
  return 'Active'
}

export function deriveLoanTrackStatus(loan) {
  const status = deriveLoanStatus(loan)
  if (status === 'Closed') return 'Closed'
  if (status === 'Overdue') return 'Overdue'
  return 'On Track'
}

export function deriveCustomerStatus(customer) {
  const loans = customer.loans || []
  if (!loans.length) return 'No Loan'
  if (loans.some((l) => deriveLoanStatus(l) === 'Overdue')) return 'Overdue'
  if (loans.some((l) => deriveLoanStatus(l) === 'Active')) return 'Active'
  return 'Closed'
}

export function getMonthKey(dateStr) {
  const d = new Date(dateStr)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

export function getMonthLabel(monthKey) {
  const [y, m] = monthKey.split('-')
  const d = new Date(Number(y), Number(m) - 1, 1)
  return d.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })
}

export function isSameMonth(dateStr, ref = new Date()) {
  const d = new Date(dateStr)
  return d.getFullYear() === ref.getFullYear() && d.getMonth() === ref.getMonth()
}

export function vehicleLabel(loan) {
  const model = loan.vehicleModel || 'Vehicle'
  const reg = loan.registrationNo || ''
  return reg ? `${model} / ${reg}` : model
}

/** EMI dues across all open loans */
export function buildPaymentsDue(customers, refDate = new Date()) {
  return flattenLoans(customers)
    .map((loan) => {
      const status = deriveLoanStatus(loan)
      if (status === 'Closed') return null

      const dueDate = getNextEmiDueDate(loan)
      if (!dueDate) return null

      const paidThisMonth = (loan.payments || []).some((p) => isSameMonth(p.date, refDate))
      const daysOver = daysBetween(dueDate, refDate)
      let payStatus = 'Pending'
      if (paidThisMonth) payStatus = 'Paid'
      else if (daysOver > 0) payStatus = 'Overdue'

      const balance = getBalanceDue(loan)
      const amountDue = Math.min(Number(loan.emiAmount) || 0, balance)

      return {
        loanId: loan.id,
        customerId: loan.customerId,
        customerName: loan.customerName,
        vehicle: vehicleLabel(loan),
        dueDate,
        amountDue,
        status: payStatus,
        emiNumber: getNextEmiNumber(loan),
        daysOverdue: daysOver > 0 ? daysOver : 0,
      }
    })
    .filter(Boolean)
}
