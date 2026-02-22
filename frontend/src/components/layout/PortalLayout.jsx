import { Navigate, Outlet, NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  MdDashboard, MdBookmarkAdded, MdReceipt,
  MdRequestQuote, MdViewQuilt, MdLogout,
} from 'react-icons/md';

const NAV = [
  { to: '/portal', icon: MdDashboard, label: 'Dashboard' },
  { to: '/portal/bookings', icon: MdBookmarkAdded, label: 'My Bookings' },
  { to: '/portal/invoices', icon: MdReceipt, label: 'My Invoices' },
  { to: '/portal/quotations', icon: MdRequestQuote, label: 'Quotations' },
];

const PortalLayout = () => {
  const { user, logout, isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-10 h-10 border-[3px] border-primary-200 border-t-primary-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  return (
    <div className="min-h-screen bg-slate-50/50 flex">
      {/* Portal sidebar */}
      <aside className="hidden lg:flex flex-col w-[220px] bg-gradient-to-b from-slate-900 to-slate-950 text-white sticky top-0 h-screen">
        {/* Logo */}
        <div className="flex items-center gap-2.5 h-16 px-5 border-b border-white/[0.06] flex-shrink-0">
          <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center">
            <MdViewQuilt className="text-lg text-white" />
          </div>
          <div>
            <span className="text-base font-bold tracking-tight">AdERP</span>
            <span className="text-[10px] text-primary-300 font-medium ml-1.5 bg-primary-500/10 px-1.5 py-0.5 rounded-full">Portal</span>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 px-3">
          <p className="px-3 mb-2 text-[11px] font-semibold uppercase tracking-wider text-white/30">My Account</p>
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/portal'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 mb-0.5 rounded-xl text-[13px] transition-all duration-150 ${
                  isActive
                    ? 'bg-primary-600 text-white shadow-lg shadow-primary-600/20 font-semibold'
                    : 'text-white/60 hover:bg-white/[0.06] hover:text-white font-medium'
                }`
              }
            >
              <item.icon className="text-lg flex-shrink-0" />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* User card */}
        <div className="p-3 border-t border-white/[0.06] flex-shrink-0">
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/[0.04]">
            <div className="w-8 h-8 rounded-lg bg-primary-500/20 flex items-center justify-center text-sm font-bold text-primary-300 flex-shrink-0">
              {user?.name?.charAt(0) || 'C'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-white/80 truncate">{user?.name}</p>
              <p className="text-[10px] text-white/30">Client Portal</p>
            </div>
            <button
              onClick={logout}
              className="p-1.5 rounded-lg text-white/30 hover:text-red-400 hover:bg-white/[0.06] transition-colors"
              title="Logout"
            >
              <MdLogout className="text-base" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile header */}
        <header className="lg:hidden h-14 px-4 bg-white border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-primary-500 rounded-lg flex items-center justify-center">
              <MdViewQuilt className="text-sm text-white" />
            </div>
            <span className="font-bold text-gray-900">AdERP Portal</span>
          </div>
          <button onClick={logout} className="text-gray-400 hover:text-red-500">
            <MdLogout className="text-xl" />
          </button>
        </header>

        <main className="flex-1 p-4 lg:p-8 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default PortalLayout;
