import { NavLink, Outlet } from 'react-router-dom'

const links = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/customers', label: 'Customers' },
  { to: '/loans', label: 'Loans' },
  { to: '/new-loan', label: 'New Loan' },
  { to: '/payments', label: 'Payments Due' },
  { to: '/accounts', label: 'Accounts' },
]

export default function Layout() {
  return (
    <div className="flex min-h-screen">
      <aside className="w-56 shrink-0 bg-slate-900 text-slate-100 flex flex-col">
        <div className="px-4 py-5 border-b border-slate-700">
          <div className="text-[11px] uppercase tracking-wider text-teal-300 font-semibold">
            Document Finance
          </div>
          <div className="text-lg font-bold leading-tight mt-1">Sri Finance Desk</div>
          <div className="text-[11px] text-slate-400 mt-1">Bike RC · Loan · EMI</div>
        </div>
        <nav className="flex-1 p-3 flex flex-col gap-1">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `rounded-md px-3 py-2 text-sm font-medium no-underline transition-colors ${
                  isActive
                    ? 'bg-teal-700 text-white'
                    : 'text-slate-200 hover:bg-slate-800'
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>
        <div className="p-4 text-xs text-slate-500 border-t border-slate-700">
          Wireframe · Local state only
        </div>
      </aside>

      <main className="flex-1 min-w-0 p-5 md:p-6 overflow-auto">
        <Outlet />
      </main>
    </div>
  )
}
