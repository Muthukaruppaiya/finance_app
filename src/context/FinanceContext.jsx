import { createContext, useContext, useMemo, useState } from 'react'
import { initialCustomers } from '../data/mockData'
import {
  flattenLoans,
  generateCustomerId,
  generateLoanId,
  getBalanceDue,
  getNextEmiNumber,
  toInputDate,
} from '../utils/loanUtils'

const FinanceContext = createContext(null)

export function FinanceProvider({ children }) {
  const [customers, setCustomers] = useState(initialCustomers)

  const allLoans = useMemo(() => flattenLoans(customers), [customers])

  const addCustomer = (payload) => {
    const id = payload.id || generateCustomerId(customers)
    const customer = {
      id,
      name: payload.name,
      phone: payload.phone,
      address: payload.address || '',
      idProof: payload.idProof || '',
      createdAt: payload.createdAt || toInputDate(),
      loans: [],
    }
    setCustomers((prev) => [...prev, customer])
    return customer
  }

  const updateCustomer = (id, updates) => {
    setCustomers((prev) =>
      prev.map((c) => {
        if (c.id !== id) return c
        const { loans, id: _id, ...rest } = updates
        return { ...c, ...rest, id: c.id, loans: c.loans }
      }),
    )
  }

  const addLoan = (customerId, loanPayload) => {
    let created = null
    setCustomers((prev) => {
      const loanId = loanPayload.id || generateLoanId(flattenLoans(prev))
      return prev.map((c) => {
        if (c.id !== customerId) return c
        const loan = {
          id: loanId,
          vehicleModel: loanPayload.vehicleModel || '',
          registrationNo: loanPayload.registrationNo || '',
          chassisNo: loanPayload.chassisNo || '',
          engineNo: loanPayload.engineNo || '',
          documentHeld: loanPayload.documentHeld || 'RC Book',
          loanAmount: Number(loanPayload.loanAmount) || 0,
          interestRate: Number(loanPayload.interestRate) || 0,
          tenure: Number(loanPayload.tenure) || 0,
          emiAmount: Number(loanPayload.emiAmount) || 0,
          startDate: loanPayload.startDate || toInputDate(),
          purpose: loanPayload.purpose || '',
          guarantorName: loanPayload.guarantorName || '',
          guarantorPhone: loanPayload.guarantorPhone || '',
          payments: [],
        }
        created = { ...loan, customerId: c.id, customerName: c.name }
        return { ...c, loans: [...(c.loans || []), loan] }
      })
    })
    return created
  }

  /** Create brand-new customer + first loan in one step */
  const addCustomerWithLoan = (customerPayload, loanPayload) => {
    const customerId = customerPayload.id || generateCustomerId(customers)
    const loanId = loanPayload.id || generateLoanId(allLoans)
    const customer = {
      id: customerId,
      name: customerPayload.name,
      phone: customerPayload.phone,
      address: customerPayload.address || '',
      idProof: customerPayload.idProof || '',
      createdAt: toInputDate(),
      loans: [
        {
          id: loanId,
          vehicleModel: loanPayload.vehicleModel || '',
          registrationNo: loanPayload.registrationNo || '',
          chassisNo: loanPayload.chassisNo || '',
          engineNo: loanPayload.engineNo || '',
          documentHeld: loanPayload.documentHeld || 'RC Book',
          loanAmount: Number(loanPayload.loanAmount) || 0,
          interestRate: Number(loanPayload.interestRate) || 0,
          tenure: Number(loanPayload.tenure) || 0,
          emiAmount: Number(loanPayload.emiAmount) || 0,
          startDate: loanPayload.startDate || toInputDate(),
          purpose: loanPayload.purpose || '',
          guarantorName: loanPayload.guarantorName || '',
          guarantorPhone: loanPayload.guarantorPhone || '',
          payments: [],
        },
      ],
    }
    setCustomers((prev) => [...prev, customer])
    return { customer, loanId }
  }

  const updateLoan = (loanId, updates) => {
    setCustomers((prev) =>
      prev.map((c) => ({
        ...c,
        loans: (c.loans || []).map((l) => {
          if (l.id !== loanId) return l
          const { id, payments, ...rest } = updates
          return { ...l, ...rest, id: l.id, payments: l.payments }
        }),
      })),
    )
  }

  const addPayment = (loanId, paymentInput) => {
    let created = null
    setCustomers((prev) =>
      prev.map((c) => ({
        ...c,
        loans: (c.loans || []).map((l) => {
          if (l.id !== loanId) return l
          const amount = Number(paymentInput.amount) || 0
          const balanceBefore = getBalanceDue(l)
          const balanceAfter = Math.max(0, balanceBefore - amount)
          const payment = {
            id: `PAY-${loanId}-${Date.now()}`,
            date: paymentInput.date || toInputDate(),
            amount,
            mode: paymentInput.mode || 'Cash',
            emiNumber: paymentInput.emiNumber || getNextEmiNumber(l),
            balanceAfter,
            remarks: paymentInput.remarks || '',
            lateFee: Number(paymentInput.lateFee) || 0,
          }
          created = payment
          return { ...l, payments: [...(l.payments || []), payment] }
        }),
      })),
    )
    return created
  }

  const getCustomer = (id) => customers.find((c) => c.id === id)

  const getLoan = (loanId) => {
    for (const c of customers) {
      const loan = (c.loans || []).find((l) => l.id === loanId)
      if (loan) {
        return {
          ...loan,
          customerId: c.id,
          customerName: c.name,
          customerPhone: c.phone,
          customerAddress: c.address,
          customerIdProof: c.idProof,
        }
      }
    }
    return null
  }

  const value = useMemo(
    () => ({
      customers,
      allLoans,
      addCustomer,
      updateCustomer,
      addLoan,
      addCustomerWithLoan,
      updateLoan,
      addPayment,
      getCustomer,
      getLoan,
    }),
    [customers, allLoans],
  )

  return <FinanceContext.Provider value={value}>{children}</FinanceContext.Provider>
}

export function useFinance() {
  const ctx = useContext(FinanceContext)
  if (!ctx) throw new Error('useFinance must be used within FinanceProvider')
  return ctx
}
