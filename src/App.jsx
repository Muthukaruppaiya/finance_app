import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import { FinanceProvider } from './context/FinanceContext'
import Layout from './components/Layout'
import Dashboard from './components/Dashboard'
import CustomerList from './components/CustomerList'
import CustomerDetail from './components/CustomerDetail'
import LoanList from './components/LoanList'
import LoanDetail from './components/LoanDetail'
import NewLoanPage from './components/NewLoanPage'
import PaymentsDueList from './components/PaymentsDueList'
import Accounts from './components/Accounts'

export default function App() {
  return (
    <FinanceProvider>
      {/* HashRouter keeps routes in the URL hash so refresh never 404s on static hosts */}
      <HashRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/customers" element={<CustomerList />} />
            <Route path="/customers/:id" element={<CustomerDetail />} />
            <Route path="/loans" element={<LoanList />} />
            <Route path="/loans/:id" element={<LoanDetail />} />
            <Route path="/new-loan" element={<NewLoanPage />} />
            <Route path="/add-customer" element={<Navigate to="/new-loan" replace />} />
            <Route path="/payments" element={<PaymentsDueList />} />
            <Route path="/accounts" element={<Accounts />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Route>
        </Routes>
      </HashRouter>
    </FinanceProvider>
  )
}
