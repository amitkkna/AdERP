import { Link } from 'react-router-dom';
import { MdLocationOn, MdAspectRatio } from 'react-icons/md';

const statusColors = {
  AVAILABLE: 'bg-green-100 text-green-800',
  BOOKED: 'bg-purple-100 text-purple-800',
  UNDER_MAINTENANCE: 'bg-yellow-100 text-yellow-800',
  BLOCKED: 'bg-red-100 text-red-800',
};

const statusLabels = {
  AVAILABLE: 'Available',
  BOOKED: 'Booked',
  UNDER_MAINTENANCE: 'Maintenance',
  BLOCKED: 'Blocked',
};

const AssetCard = ({ asset }) => {
  const primaryImage = asset.images?.[0];

  return (
    <Link to={`/assets/${asset.id}`} className="card hover:shadow-md transition-shadow block">
      <div className="flex gap-4">
        <div className="w-20 h-20 bg-gray-100 rounded-lg flex-shrink-0 overflow-hidden">
          {primaryImage ? (
            <img src={primaryImage.url} alt={asset.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-300">
              <MdAspectRatio className="text-2xl" />
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-xs font-mono text-gray-400">{asset.code}</p>
              <p className="font-medium text-gray-900 truncate">{asset.name}</p>
            </div>
            <span className={`text-xs px-2 py-1 rounded-full flex-shrink-0 ${statusColors[asset.status]}`}>
              {statusLabels[asset.status]}
            </span>
          </div>
          <div className="mt-1 flex items-center gap-1 text-xs text-gray-500">
            <MdLocationOn />
            <span className="truncate">{asset.locationCity}, {asset.locationDistrict}</span>
          </div>
          <div className="mt-1 flex items-center justify-between">
            <span className="text-xs text-gray-400">{asset.type} | {asset.sizeWidth}x{asset.sizeHeight} ft</span>
            <span className="text-sm font-semibold text-gray-900">
              {Number(asset.monthlyRate).toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 })}/mo
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default AssetCard;
