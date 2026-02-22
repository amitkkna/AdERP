import { useAuth } from '../../context/AuthContext';
import { MdMenu, MdNotifications } from 'react-icons/md';

const Header = ({ onMenuClick }) => {
  const { user } = useAuth();

  const roleColors = {
    ADMIN: 'bg-red-50 text-red-700 ring-red-600/10',
    MANAGER: 'bg-blue-50 text-blue-700 ring-blue-600/10',
    ACCOUNTANT: 'bg-emerald-50 text-emerald-700 ring-emerald-600/10',
    CLIENT: 'bg-purple-50 text-purple-700 ring-purple-600/10',
  };

  return (
    <header className="h-16 bg-white/80 backdrop-blur-md border-b border-gray-200/60 flex items-center justify-between px-4 lg:px-6 sticky top-0 z-10">
      <button
        onClick={onMenuClick}
        className="lg:hidden p-2 rounded-xl text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
      >
        <MdMenu className="text-xl" />
      </button>

      <div className="flex-1" />

      <div className="flex items-center gap-2">
        <button className="p-2 rounded-xl text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors relative">
          <MdNotifications className="text-xl" />
        </button>

        <div className="w-px h-6 bg-gray-200 mx-1" />

        <div className="flex items-center gap-3 pl-2">
          <div className="hidden sm:block text-right">
            <p className="text-sm font-semibold text-gray-800">{user?.name}</p>
            <span className={`inline-flex items-center text-[11px] font-medium px-2 py-0.5 rounded-full ring-1 ring-inset ${roleColors[user?.role] || 'bg-gray-50 text-gray-700 ring-gray-600/10'}`}>
              {user?.role}
            </span>
          </div>
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-sm">
            <span className="text-sm font-bold text-white">{user?.name?.charAt(0) || 'U'}</span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
