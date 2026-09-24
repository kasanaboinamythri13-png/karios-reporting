import { useState } from 'react';
import { CheckCircle, XCircle, AlertCircle, X, Shield, Send } from 'lucide-react';
import { submitCeoReview } from '../../api/ceoApi.js';

export default function ReviewModal({ reportId, departmentTitle, onClose, onReviewed }) {
  const [status, setStatus] = useState('APPROVED');
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (status === 'REJECTED' && (!comment || comment.trim().length === 0)) {
      setError('A comment is strictly required when requesting revision / rejecting.');
      return;
    }

    try {
      setLoading(true);
      await submitCeoReview(reportId, {
        status,
        comment: comment.trim(),
      });
      onReviewed && onReviewed({ status, comment: comment.trim() });
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to submit review');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight">Executive Report Review</h2>
            <p className="text-xs text-slate-400">
              Department: <strong className="text-slate-200">{departmentTitle || 'Department Head'}</strong>
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-4 flex items-center gap-2 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Decision Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Review Decision
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setStatus('APPROVED')}
                className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-sm font-semibold transition-all cursor-pointer ${
                  status === 'APPROVED'
                    ? 'border-emerald-500 bg-emerald-500/15 text-emerald-400 shadow-sm'
                    : 'border-slate-800 bg-slate-950 text-slate-400 hover:bg-slate-800/60'
                }`}
              >
                <CheckCircle className="w-4 h-4" />
                <span>Approve Report</span>
              </button>

              <button
                type="button"
                onClick={() => setStatus('REJECTED')}
                className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-sm font-semibold transition-all cursor-pointer ${
                  status === 'REJECTED'
                    ? 'border-rose-500 bg-rose-500/15 text-rose-400 shadow-sm'
                    : 'border-slate-800 bg-slate-950 text-slate-400 hover:bg-slate-800/60'
                }`}
              >
                <XCircle className="w-4 h-4" />
                <span>Request Revision</span>
              </button>
            </div>
          </div>

          {/* Comment Field */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Executive Feedback / Notes {status === 'REJECTED' ? <span className="text-rose-400 font-bold">* (Required)</span> : <span className="text-slate-500 lowercase">(optional)</span>}
            </label>
            <textarea
              rows={4}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder={
                status === 'APPROVED'
                  ? 'Add commendation note or executive guidance...'
                  : 'Specify what requires adjustment or additional data...'
              }
              className="w-full rounded-xl border border-slate-800 bg-slate-950 p-3 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading}
              className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white transition-all shadow-md cursor-pointer ${
                status === 'APPROVED'
                  ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-500/20'
                  : 'bg-rose-600 hover:bg-rose-500 shadow-rose-500/20'
              } disabled:opacity-50`}
            >
              <Send className="w-3.5 h-3.5" />
              <span>{loading ? 'Submitting...' : status === 'APPROVED' ? 'Confirm Approval' : 'Submit Revision'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
