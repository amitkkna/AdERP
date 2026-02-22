import { MdWarningAmber } from 'react-icons/md';

const ConfirmDialog = ({ isOpen, onClose, onConfirm, title, message, confirmText = 'Delete', loading }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 border border-gray-100">
        <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center mb-4">
          <MdWarningAmber className="text-2xl text-red-600" />
        </div>
        <h3 className="text-lg font-bold text-gray-900 mb-1.5">{title}</h3>
        <p className="text-gray-500 text-sm leading-relaxed mb-6">{message}</p>
        <div className="flex gap-3 justify-end">
          <button onClick={onClose} className="btn-secondary" disabled={loading}>
            Cancel
          </button>
          <button onClick={onConfirm} className="btn-danger" disabled={loading}>
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Processing...
              </span>
            ) : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
