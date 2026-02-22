import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  MdDashboard,
  MdViewQuilt,
  MdLocationOn,
  MdPeople,
  MdClose,
  MdBusiness,
  MdBookmarkAdded,
  MdReceipt,
  MdAccountBalance,
  MdAssessment,
  MdLogout,
  MdQuestionAnswer,
  MdCreditCard,
  MdCalendarMonth,
  MdRequestQuote,
  MdBuild,
} from 'react-icons/md';

const navSections = [
  {
    label: 'Overview',
    items: [
      { to: '/dashboard', icon: MdDashboard, label: 'Dashboard', roles: ['ADMIN', 'MANAGER', 'ACCOUNTANT'] },
    ],
  },
  {
    label: 'Inventory',
    items: [
      { to: '/assets', icon: MdViewQuilt, label: 'Assets', roles: ['ADMIN', 'MANAGER', 'ACCOUNTANT'] },
      { to: '/zones', icon: MdLocationOn, label: 'Zones', roles: ['ADMIN', 'MANAGER', 'ACCOUNTANT'] },
    ],
  },
  {
    label: 'Business',
    items: [
      { to: '/clients', icon: MdBusiness, label: 'Clients', roles: ['ADMIN', 'MANAGER', 'ACCOUNTANT'] },
      { to: '/enquiries', icon: MdQuestionAnswer, label: 'Enquiries', roles: ['ADMIN', 'MANAGER', 'ACCOUNTANT'] },
      { to: '/quotations', icon: MdRequestQuote, label: 'Quotations', roles: ['ADMIN', 'MANAGER', 'ACCOUNTANT'] },
      { to: '/pdc', icon: MdCreditCard, label: 'PDC Tracker', roles: ['ADMIN', 'MANAGER', 'ACCOUNTANT'] },
      { to: '/bookings', icon: MdBookmarkAdded, label: 'Bookings', roles: ['ADMIN', 'MANAGER', 'ACCOUNTANT'] },
      { to: '/work-orders', icon: MdBuild, label: 'Work Orders', roles: ['ADMIN', 'MANAGER'] },
      { to: '/invoices', icon: MdReceipt, label: 'Invoices', roles: ['ADMIN', 'MANAGER', 'ACCOUNTANT'] },
      { to: '/expenses', icon: MdAccountBalance, label: 'Expenses', roles: ['ADMIN', 'MANAGER', 'ACCOUNTANT'] },
    ],
  },
  {
    label: 'Analytics',
    items: [
      { to: '/availability', icon: MdCalendarMonth, label: 'Availability', roles: ['ADMIN', 'MANAGER', 'ACCOUNTANT'] },
      { to: '/reports', icon: MdAssessment, label: 'Reports', roles: ['ADMIN', 'MANAGER', 'ACCOUNTANT'] },
    ],
  },
  {
    label: 'Admin',
    items: [
      { to: '/users', icon: MdPeople, label: 'Users', roles: ['ADMIN'] },
    ],
  },
];

const Sidebar = ({ isOpen, onClose }) => {
  const { user, logout } = useAuth();

  const filteredSections = navSections
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => item.roles.includes(user?.role)),
    }))
    .filter((section) => section.items.length > 0);

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-20 bg-black/40 backdrop-blur-sm lg:hidden" onClick={onClose} />
      )}

      <aside
        className={`fixed top-0 left-0 z-30 h-screen w-[260px] bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 text-white transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:sticky lg:top-0 lg:z-auto flex flex-col ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Logo */}
        <div className="flex items-center justify-between h-16 px-5 border-b border-white/[0.06] flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center">
              <MdViewQuilt className="text-lg text-white" />
            </div>
            <div>
              <span className="text-base font-bold tracking-tight">AdERP</span>
              <span className="text-[10px] text-primary-300 font-medium ml-1.5 bg-primary-500/10 px-1.5 py-0.5 rounded-full">PRO</span>
            </div>
          </div>
          <button onClick={onClose} className="lg:hidden p-1 rounded-lg text-white/40 hover:text-white hover:bg-white/10">
            <MdClose className="text-xl" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-3">
          {filteredSections.map((section, idx) => (
            <div key={section.label} className={idx > 0 ? 'mt-6' : ''}>
              <p className="px-3 mb-2 text-[11px] font-semibold uppercase tracking-wider text-white/30">
                {section.label}
              </p>
              {section.items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 mb-0.5 rounded-xl text-[13px] transition-all duration-150 ${
                      isActive
                        ? 'bg-primary-600 text-white shadow-lg shadow-primary-600/20 font-semibold'
                        : 'text-white/60 hover:bg-white/[0.06] hover:text-white font-medium'
                    }`
                  }
                  end={item.to === '/dashboard'}
                >
                  <item.icon className="text-lg flex-shrink-0" />
                  <span>{item.label}</span>
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        {/* Bottom user card with logout */}
        <div className="p-3 border-t border-white/[0.06] flex-shrink-0">
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/[0.04]">
            <div className="w-8 h-8 rounded-lg bg-primary-500/20 flex items-center justify-center text-sm font-bold text-primary-300 flex-shrink-0">
              {user?.name?.charAt(0) || 'A'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-white/80 truncate">{user?.name}</p>
              <p className="text-[10px] text-white/30">{user?.role}</p>
            </div>
            <button
              onClick={logout}
              className="p-1.5 rounded-lg text-white/30 hover:text-red-400 hover:bg-white/[0.06] transition-colors flex-shrink-0"
              title="Logout"
            >
              <MdLogout className="text-base" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
