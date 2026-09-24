import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Shield,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  Calendar,
  FileText,
  Paperclip,
  Download,
  Send,
  Check,
  Building,
  DollarSign,
  AlertCircle,
} from 'lucide-react';
import { useAuth } from '../../auth/AuthContext.jsx';
import { fetchReportDetails, submitCeoReview } from '../../api/ceoApi.js';

export default function ReportDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);

  // CEO Review State
  const [decision, setDecision] = useState('APPROVED');
  const [comment, setComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewError, setReviewError] = useState('');
  const [reviewSuccess, setReviewSuccess] = useState('');

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const data = await fetchReportDetails(id);
        setReport(data);
        if (data?.reviewComment) {
          setComment(data.reviewComment);
        }
      } catch (err) {
        console.error('Failed to load report:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  async function handleReviewSubmit(e) {
    e.preventDefault();
    setReviewError('');
    setReviewSuccess('');

    if (decision === 'REJECTED' && (!comment || comment.trim().length === 0)) {
      setReviewError('A comment is strictly required when requesting revision / rejecting.');
      return;
    }

    try {
      setSubmittingReview(true);
      const res = await submitCeoReview(id, {
        status: decision,
        comment: comment.trim(),
      });
      setReport((prev) => ({
        ...prev,
        status: decision,
        reviewedBy: 'CEO',
        reviewedAt: new Date().toISOString(),
        reviewComment: comment.trim(),
      }));
      setReviewSuccess(`Report ${decision.toLowerCase()} successfully!`);
    } catch (err) {
      setReviewError(err.message || 'Failed to submit review');
    } finally {
      setSubmittingReview(false);
    }
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-12 text-center text-slate-400 animate-pulse space-y-4">
        <div className="h-8 w-48 bg-slate-800 rounded mx-auto" />
        <div className="h-64 bg-slate-900 rounded-xl border border-slate-800" />
      </div>
    );
  }

  if (!report) {
    return (
      <div className="max-w-xl mx-auto py-12 text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-rose-400 mx-auto" />
        <h2 className="text-lg font-bold text-white">Report Not Found</h2>
        <p className="text-xs text-slate-400">The requested daily report could not be found or has been archived.</p>
        <button
          onClick={() => navigate(-1)}
          className="px-4 py-2 rounded-lg bg-slate-800 text-xs font-semibold text-white cursor-pointer"
        >
          Return Back
        </button>
      </div>
    );
  }

  const isCeo = user?.role === 'CEO';
  const isSubmitted = report.status === 'SUBMITTED';
  const isApproved = report.status === 'APPROVED';
  const isRejected = report.status === 'REJECTED';

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in pb-12">
      {/* Top Breadcrumb & Return Action */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Reports</span>
        </button>

        <span className="font-mono text-xs text-slate-500">ID: {report.id}</span>
      </div>

      {/* Main Report Header Card */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 sm:p-7 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                {report.department}
              </span>
              <span className="text-xs text-slate-500">•</span>
              <span className="text-xs text-slate-400 font-mono flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                {report.reportDate} (Asia/Kolkata)
              </span>
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight mt-1">
              {report.title} — Daily Report
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Strict title standard enforced (no personal names)
            </p>
          </div>

          {/* Status Chip */}
          <div>
            {isSubmitted && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                Pending CEO Review
              </span>
            )}
            {isApproved && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                <CheckCircle2 className="w-4 h-4" />
                Approved by CEO
              </span>
            )}
            {isRejected && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <XCircle className="w-4 h-4" />
                Revision Requested
              </span>
            )}
          </div>
        </div>

        {/* Existing Review Audit Box if already evaluated */}
        {report.reviewedAt && (
          <div className={`mt-5 rounded-xl border p-4 ${
            isApproved
              ? 'bg-blue-950/20 border-blue-500/20 text-blue-300'
              : 'bg-amber-950/20 border-amber-500/20 text-amber-300'
          }`}>
            <div className="flex items-center justify-between text-xs font-semibold pb-2 border-b border-current/10">
              <span className="flex items-center gap-1.5">
                <Shield className="w-4 h-4" />
                Executive Decision: {report.status}
              </span>
              <span className="font-mono text-[11px] opacity-80">
                Reviewed by {report.reviewedBy || 'CEO'} • {new Date(report.reviewedAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST
              </span>
            </div>
            {report.reviewComment ? (
              <p className="mt-2 text-xs sm:text-sm text-slate-200">
                "{report.reviewComment}"
              </p>
            ) : (
              <p className="mt-2 text-xs text-slate-400 italic">No additional comments entered.</p>
            )}
          </div>
        )}

        {/* Blockers Callout if present */}
        {report.blockers && report.blockers !== 'None' && (
          <div className="mt-5 rounded-xl border border-amber-500/30 bg-amber-950/20 p-4">
            <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider">
              <AlertTriangle className="w-4 h-4" />
              <span>Department Blocker Reported</span>
            </div>
            <p className="mt-1.5 text-sm text-slate-200 font-medium">
              {report.blockers}
            </p>
          </div>
        )}

        {/* Dynamic Department Submission Data */}
        <div className="mt-6 space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Operational Deliverables & Data
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            {report.data &&
              Object.entries(report.data).map(([key, val]) => (
                <div
                  key={key}
                  className="rounded-xl border border-slate-800/80 bg-slate-950/50 p-4"
                >
                  <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wide">
                    {key.replace(/([A-Z])/g, ' $1')}
                  </span>
                  <div className="mt-1 text-sm font-semibold text-slate-200 whitespace-pre-line">
                    {typeof val === 'number' ? val.toLocaleString() : String(val)}
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* Attachments Section */}
        {report.attachments && report.attachments.length > 0 && (
          <div className="mt-6 pt-5 border-t border-slate-800">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
              <Paperclip className="w-3.5 h-3.5" />
              <span>Verified Attachments ({report.attachments.length})</span>
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {report.attachments.map((file, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 rounded-xl border border-slate-800 bg-slate-950/60 text-xs"
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <FileText className="w-4 h-4 text-indigo-400 shrink-0" />
                    <div className="truncate">
                      <p className="font-medium text-slate-200 truncate">{file.name}</p>
                      <p className="text-[10px] text-slate-500 font-mono">{file.size}</p>
                    </div>
                  </div>
                  <a
                    href={file.url}
                    onClick={(e) => {
                      if (file.url === '#') {
                        e.preventDefault();
                        alert('Secure private cloud download URL simulated for demo.');
                      }
                    }}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                    title="Download Secure Attachment"
                  >
                    <Download className="w-4 h-4" />
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* CEO Executive Decision Action Center */}
      {isCeo && (
        <div className="rounded-2xl border border-indigo-500/20 bg-slate-900/90 p-5 sm:p-7 shadow-2xl space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">CEO Decision Center</h2>
              <p className="text-xs text-slate-400">
                Execute official company audit decision on this department report
              </p>
            </div>
          </div>

          {reviewSuccess && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
              <Check className="w-4 h-4 shrink-0" />
              <span>{reviewSuccess}</span>
            </div>
          )}

          {reviewError && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-medium">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{reviewError}</span>
            </div>
          )}

          <form onSubmit={handleReviewSubmit} className="space-y-4 pt-2">
            {/* Toggle Status Buttons */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Executive Action
              </label>
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                <button
                  type="button"
                  onClick={() => setDecision('APPROVED')}
                  className={`flex items-center justify-center gap-2 p-3.5 rounded-xl border text-sm font-semibold transition-all cursor-pointer ${
                    decision === 'APPROVED'
                      ? 'border-emerald-500 bg-emerald-500/15 text-emerald-400 shadow-md shadow-emerald-500/10'
                      : 'border-slate-800 bg-slate-950 text-slate-400 hover:bg-slate-800/60'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Approve Report</span>
                </button>

                <button
                  type="button"
                  onClick={() => setDecision('REJECTED')}
                  className={`flex items-center justify-center gap-2 p-3.5 rounded-xl border text-sm font-semibold transition-all cursor-pointer ${
                    decision === 'REJECTED'
                      ? 'border-rose-500 bg-rose-500/15 text-rose-400 shadow-md shadow-rose-500/10'
                      : 'border-slate-800 bg-slate-950 text-slate-400 hover:bg-slate-800/60'
                  }`}
                >
                  <XCircle className="w-4 h-4" />
                  <span>Request Revision</span>
                </button>
              </div>
            </div>

            {/* Comment Area */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Executive Guidance / Remediation Notes {decision === 'REJECTED' ? <span className="text-rose-400 font-bold">* (Mandatory)</span> : <span className="text-slate-500 lowercase">(optional)</span>}
              </label>
              <textarea
                rows={3}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder={
                  decision === 'APPROVED'
                    ? 'Add commendation note or executive guidance...'
                    : 'Specify required adjustments for the department head...'
                }
                className="w-full rounded-xl border border-slate-800 bg-slate-950 p-3 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            {/* Submit Button */}
            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={submittingReview}
                className={`inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold text-white transition-all shadow-lg cursor-pointer ${
                  decision === 'APPROVED'
                    ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-500/20'
                    : 'bg-rose-600 hover:bg-rose-500 shadow-rose-500/20'
                } disabled:opacity-50`}
              >
                <Send className="w-4 h-4" />
                <span>{submittingReview ? 'Processing...' : `Commit ${decision === 'APPROVED' ? 'Approval' : 'Revision Request'}`}</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
