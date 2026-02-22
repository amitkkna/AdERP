import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { PDFDownloadLink } from '@react-pdf/renderer';
import useApi from '../hooks/useApi';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import QuotationPDF from '../components/QuotationPDF';
import {
  MdArrowBack, MdEdit, MdSend, MdCheckCircle, MdCancel,
  MdDownload, MdRequestQuote, MdDelete, MdBusiness,
  MdAccessTime, MdCalendarMonth,
} from 'react-icons/md';

const STATUS_COLORS = {
  DRAFT:    'bg-gray-100 text-gray-700',
  SENT:     'bg-blue-100 text-blue-800',
  ACCEPTED: 'bg-green-100 text-green-800',
  REJECTED: 'bg-red-100 text-red-800',
  EXPIRED:  'bg-amber-100 text-amber-800',
};

const fmt = (n) => `₹${Number(n).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

const QuotationDetail = () => {
  const { id } = useParams();
  const { get, put, loading } = useApi();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [quotation, setQuotation] = useState(null);
  const [statusUpdating, setStatusUpdating] = useState(false);

  const isManager = ['ADMIN', 'MANAGER'].includes(user?.role);

  useEffect(() => {
    fetchQuotation();
  }, [id]);

  const fetchQuotation = async () => {
    try {
      const res = await get(`/quotations/${id}`);
      setQuotation(res.data);
    } catch (_) {
      toast.error('Quotation not found.');
      navigate('/quotations');
    }
  };

  const updateStatus = async (status) => {
    setStatusUpdating(true);
    try {
      await put(`/quotations/${id}`, { status });
      toast.success(`Quotation marked as ${status.toLowerCase()}.`);
      fetchQuotation();
    } catch (_) {} finally { setStatusUpdating(false); }
  };

  if (!quotation) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-8 h-8 border-[3px] border-primary-200 border-t-primary-600 rounded-full animate-spin" />
      </div>
    );
  }

  const { client, items = [] } = quotation;
  const isExpired = new Date(quotation.validUntil) < new Date();

  return (
    <div>
      {/* Page header */}
      <div className="mb-6 flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Link to="/quotations" className="p-2 rounded-xl hover:bg-gray-100 text-gray-500">
            <MdArrowBack className="text-xl" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <MdRequestQuote className="text-primary-600" />
              {quotation.quotationNo}
            </h1>
            <p className="text-sm text-gray-500">Created {fmtDate(quotation.createdAt)}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Status badge */}
          <span className={`text-sm font-semibold px-3 py-1 rounded-full ${STATUS_COLORS[quotation.status]}`}>
            {quotation.status}
          </span>

          {/* PDF Download */}
          <PDFDownloadLink
            document={<QuotationPDF quotation={quotation} />}
            fileName={`${quotation.quotationNo}.pdf`}
            className="btn-secondary flex items-center gap-2 text-sm"
          >
            {({ loading: pdfLoading }) =>
              pdfLoading ? 'Preparing PDF...' : (
                <><MdDownload className="text-base" /> Download PDF</>
              )
            }
          </PDFDownloadLink>

          {/* Status transitions */}
          {isManager && quotation.status === 'DRAFT' && (
            <button onClick={() => updateStatus('SENT')} disabled={statusUpdating}
              className="btn-primary flex items-center gap-2 text-sm">
              <MdSend className="text-base" /> Mark as Sent
            </button>
          )}
          {isManager && quotation.status === 'SENT' && (
            <>
              <button onClick={() => updateStatus('ACCEPTED')} disabled={statusUpdating}
                className="bg-green-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-green-700 flex items-center gap-2">
                <MdCheckCircle /> Accept
              </button>
              <button onClick={() => updateStatus('REJECTED')} disabled={statusUpdating}
                className="bg-red-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-red-700 flex items-center gap-2">
                <MdCancel /> Reject
              </button>
            </>
          )}
          {isManager && !['ACCEPTED','REJECTED','EXPIRED'].includes(quotation.status) && (
            <Link to="/quotations" onClick={() => {}} className="hidden">
              {/* placeholder for edit — navigate to list and open edit modal */}
            </Link>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left — main content */}
        <div className="lg:col-span-2 space-y-4">

          {/* Items table */}
          <div className="card">
            <h2 className="text-sm font-semibold text-gray-700 mb-4">Quotation Items</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left text-xs text-gray-400 font-semibold pb-2 pr-3">#</th>
                    <th className="text-left text-xs text-gray-400 font-semibold pb-2 pr-3">Description</th>
                    <th className="text-left text-xs text-gray-400 font-semibold pb-2 pr-3">Location</th>
                    <th className="text-left text-xs text-gray-400 font-semibold pb-2 pr-3">Size</th>
                    <th className="text-right text-xs text-gray-400 font-semibold pb-2 pr-3">Rate/Mo</th>
                    <th className="text-center text-xs text-gray-400 font-semibold pb-2 pr-3">Mo.</th>
                    <th className="text-right text-xs text-gray-400 font-semibold pb-2">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, i) => (
                    <tr key={item.id} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="py-2.5 pr-3 text-gray-400 text-xs">{i + 1}</td>
                      <td className="py-2.5 pr-3">
                        <p className="font-medium text-gray-800">{item.description}</p>
                        {item.asset && (
                          <p className="text-xs text-primary-600 font-mono">{item.asset.code}</p>
                        )}
                      </td>
                      <td className="py-2.5 pr-3 text-gray-500 text-xs">{item.location || '—'}</td>
                      <td className="py-2.5 pr-3 text-gray-500 text-xs">{item.size || '—'}</td>
                      <td className="py-2.5 pr-3 text-right text-gray-700">{fmt(item.monthlyRate)}</td>
                      <td className="py-2.5 pr-3 text-center text-gray-500">{item.months}</td>
                      <td className="py-2.5 text-right font-semibold text-gray-900">{fmt(item.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals */}
            <div className="mt-4 pt-4 border-t border-gray-100 flex justify-end">
              <div className="w-56 space-y-1.5">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Subtotal</span>
                  <span>{fmt(quotation.subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-600">
                  <span>GST ({quotation.taxRate}%)</span>
                  <span>{fmt(quotation.taxAmount)}</span>
                </div>
                <div className="flex justify-between text-base font-bold text-gray-900 pt-2 border-t border-gray-200">
                  <span>Total</span>
                  <span className="text-primary-700">{fmt(quotation.totalAmount)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Notes & Terms */}
          {(quotation.notes || quotation.terms) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {quotation.notes && (
                <div className="card">
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Notes</h3>
                  <p className="text-sm text-gray-600 whitespace-pre-wrap">{quotation.notes}</p>
                </div>
              )}
              {quotation.terms && (
                <div className="card">
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Terms & Conditions</h3>
                  <p className="text-sm text-gray-600 whitespace-pre-wrap">{quotation.terms}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right — sidebar */}
        <div className="space-y-4">
          {/* Client info */}
          <div className="card">
            <div className="flex items-center gap-2 mb-3">
              <MdBusiness className="text-primary-600 text-lg" />
              <h3 className="text-sm font-semibold text-gray-700">Client</h3>
            </div>
            <div className="space-y-1 text-sm">
              <Link to={`/clients`} className="font-semibold text-primary-700 hover:underline block">
                {client?.companyName}
              </Link>
              <p className="text-gray-600">{client?.contactPerson}</p>
              <p className="text-gray-500">{client?.phone}</p>
              <p className="text-gray-500">{client?.email}</p>
              <p className="text-gray-400 text-xs mt-2">{client?.address}, {client?.city}</p>
              {client?.gstNumber && <p className="text-gray-400 text-xs">GSTIN: {client.gstNumber}</p>}
            </div>
          </div>

          {/* Validity */}
          <div className="card">
            <div className="flex items-center gap-2 mb-3">
              <MdCalendarMonth className="text-primary-600 text-lg" />
              <h3 className="text-sm font-semibold text-gray-700">Validity</h3>
            </div>
            <div className={`text-center p-3 rounded-xl ${isExpired ? 'bg-red-50' : 'bg-green-50'}`}>
              <p className={`text-lg font-bold ${isExpired ? 'text-red-600' : 'text-green-700'}`}>
                {fmtDate(quotation.validUntil)}
              </p>
              <p className={`text-xs mt-1 ${isExpired ? 'text-red-500' : 'text-green-600'}`}>
                {isExpired ? 'Expired' : `Valid for ${Math.ceil((new Date(quotation.validUntil) - new Date()) / 86400000)} more days`}
              </p>
            </div>
          </div>

          {/* Summary */}
          <div className="card">
            <div className="flex items-center gap-2 mb-3">
              <MdAccessTime className="text-primary-600 text-lg" />
              <h3 className="text-sm font-semibold text-gray-700">Summary</h3>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Items</span>
                <span className="font-semibold">{items.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Total Months</span>
                <span className="font-semibold">{items.reduce((s, it) => s + it.months, 0)}</span>
              </div>
              <div className="flex justify-between border-t border-gray-100 pt-2">
                <span className="text-gray-700 font-semibold">Grand Total</span>
                <span className="font-bold text-primary-700">{fmt(quotation.totalAmount)}</span>
              </div>
            </div>
          </div>

          {/* Status guide */}
          {isManager && (
            <div className="card bg-primary-50 border border-primary-100">
              <h3 className="text-xs font-semibold text-primary-700 uppercase mb-2">Status Guide</h3>
              <ul className="text-xs text-primary-600 space-y-1">
                <li>• <strong>DRAFT</strong> → Save, review, then send</li>
                <li>• <strong>SENT</strong> → Shared with client</li>
                <li>• <strong>ACCEPTED</strong> → Client confirmed</li>
                <li>• <strong>REJECTED</strong> → Client declined</li>
                <li>• <strong>EXPIRED</strong> → Validity passed</li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuotationDetail;
