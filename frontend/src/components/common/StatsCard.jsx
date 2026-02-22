const StatsCard = ({ title, value, icon: Icon, color = 'primary', subtitle }) => {
  const iconBg = {
    primary: 'bg-primary-100 text-primary-600',
    green: 'bg-emerald-100 text-emerald-600',
    yellow: 'bg-amber-100 text-amber-600',
    red: 'bg-red-100 text-red-600',
    purple: 'bg-violet-100 text-violet-600',
    gray: 'bg-gray-100 text-gray-600',
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-card hover:shadow-card-hover p-5 transition-all duration-200 group">
      <div className="flex items-start justify-between mb-3">
        <div className={`p-2.5 rounded-xl ${iconBg[color] || iconBg.primary} transition-transform duration-200 group-hover:scale-105`}>
          {Icon && <Icon className="text-xl" />}
        </div>
      </div>
      <div>
        <p className="text-[13px] font-medium text-gray-500 mb-0.5">{title}</p>
        <p className="text-2xl font-bold text-gray-900 tracking-tight">{value}</p>
        {subtitle && <p className="text-[11px] text-gray-400 mt-1">{subtitle}</p>}
      </div>
    </div>
  );
};

export default StatsCard;
