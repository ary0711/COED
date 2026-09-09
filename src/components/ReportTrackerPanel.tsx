import { useState, useEffect } from 'react';
import { Clock, CheckCircle, XCircle, Eye, Printer, X, RefreshCw } from 'lucide-react';

interface SubmittedReport {
  id: string;
  reportType: 'accomplishment' | 'extension' | 'wfh';
  title: string;
  periodOrQuarter: string;
  status: 'submitted' | 'pending' | 'approved' | 'rejected';
  dean_remarks?: string | null;
  created_at: string;
  raw: any;
}

function getToken() {
  return localStorage.getItem('token');
}

export function ReportTrackerPanel() {
  const [reports, setReports] = useState<SubmittedReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<SubmittedReport | null>(null);

  const fetchReports = async () => {
    setLoading(true);
    const token = getToken();
    const headers = { Authorization: `Bearer ${token}` };

    try {
      const [accRes, extRes, wfhRes] = await Promise.all([
        fetch('http://localhost:5000/api/accomplishment-reports/mine', { headers }).catch(() => null),
        fetch('http://localhost:5000/api/extension-reports/mine', { headers }).catch(() => null),
        fetch('http://localhost:5000/api/wfh-reports/mine', { headers }).catch(() => null),
      ]);

      const accData = accRes && accRes.ok ? await accRes.json() : [];
      const extData = extRes && extRes.ok ? await extRes.json() : [];
      const wfhData = wfhRes && wfhRes.ok ? await wfhRes.json() : [];

      const normalized: SubmittedReport[] = [
        ...accData.map((r: any) => ({
          id: r.id,
          reportType: 'accomplishment' as const,
          title: 'Accomplishment Report',
          periodOrQuarter: `${r.quarter || '1st'} Quarter, SY ${r.year || ''}`,
          status: r.status,
          dean_remarks: r.dean_remarks,
          created_at: r.created_at,
          raw: r,
        })),
        ...extData.map((r: any) => ({
          id: r.id,
          reportType: 'extension' as const,
          title: 'Community Extension Services Accomplishment Report',
          periodOrQuarter: `${r.quarter || '1st'} Quarter, ${r.year || ''}`,
          status: r.status,
          dean_remarks: r.dean_remarks,
          created_at: r.created_at,
          raw: r,
        })),
        ...wfhData.map((r: any) => ({
          id: r.id,
          reportType: 'wfh' as const,
          title: 'Work-From-Home (WFH) Accomplishment Report',
          periodOrQuarter: r.reporting_period || 'Reporting Period',
          status: r.status,
          dean_remarks: r.dean_remarks,
          created_at: r.created_at,
          raw: r,
        })),
      ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      setReports(normalized);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const getStatusBadge = (status: string) => {
    if (status === 'approved') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold uppercase">
          <CheckCircle className="w-3.5 h-3.5" /> Approved
        </span>
      );
    }
    if (status === 'rejected') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-bold uppercase">
          <XCircle className="w-3.5 h-3.5" /> Rejected
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-bold uppercase">
        <Clock className="w-3.5 h-3.5" /> Pending Review
      </span>
    );
  };

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Submitted Reports Tracker</h2>
          <p className="text-xs text-gray-500 mt-0.5">Track the status and reviews of your submitted reports.</p>
        </div>
        <button
          onClick={fetchReports}
          className="flex items-center gap-1 text-xs text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg font-semibold transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </button>
      </div>

      {loading ? (
        <div className="py-12 text-center text-gray-400 text-sm">Loading submitted reports…</div>
      ) : reports.length === 0 ? (
        <div className="py-12 text-center text-gray-400 text-sm">
          You have not submitted any reports yet.
        </div>
      ) : (
        <div className="divide-y divide-gray-100">
          {reports.map((r) => (
            <div key={`${r.reportType}-${r.id}`} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-gray-50/70 p-3 rounded-xl transition-colors">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-semibold text-gray-900 text-sm">{r.title}</p>
                  {getStatusBadge(r.status)}
                </div>
                <p className="text-xs text-gray-500 mt-1">{r.periodOrQuarter} · Submitted on {formatDate(r.created_at)}</p>

                {r.dean_remarks && (
                  <div className="mt-2 text-xs bg-red-50 text-red-700 p-2 rounded-lg border border-red-100">
                    <span className="font-bold">Dean's Remarks:</span> {r.dean_remarks}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setSelectedReport(r)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1E3A8A] text-white hover:bg-blue-800 rounded-lg text-xs font-semibold transition-colors"
                >
                  <Eye className="w-3.5 h-3.5" /> View Report
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* View Modal */}
      {selectedReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full p-6 relative max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div>
                <h3 className="font-bold text-gray-900 text-base">{selectedReport.title}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-gray-500">{selectedReport.periodOrQuarter}</span>
                  {getStatusBadge(selectedReport.status)}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-1 text-xs px-3 py-1.5 border border-gray-200 hover:bg-gray-50 rounded-lg text-gray-700"
                >
                  <Printer className="w-3.5 h-3.5" /> Print
                </button>
                <button
                  onClick={() => setSelectedReport(null)}
                  className="p-1 rounded-lg text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Readonly Details Body */}
            <div className="overflow-y-auto py-4 text-xs space-y-4 font-sans">
              {/* WFH View */}
              {selectedReport.reportType === 'wfh' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-2 bg-gray-50 p-3 rounded-lg border border-gray-200">
                    <p><strong>Faculty:</strong> {selectedReport.raw.name}</p>
                    <p><strong>Period:</strong> {selectedReport.raw.reporting_period}</p>
                    <p><strong>Rank:</strong> {selectedReport.raw.position_rank || 'N/A'}</p>
                    <p><strong>Unit:</strong> {selectedReport.raw.program_unit || 'N/A'}</p>
                  </div>

                  <p className="font-bold text-gray-800 text-sm">Daily Accomplishments</p>
                  <table className="w-full border-collapse border border-gray-300 text-xs">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="border border-gray-300 p-2 text-left w-32">Date</th>
                        <th className="border border-gray-300 p-2 text-left">Activities Accomplished</th>
                        <th className="border border-gray-300 p-2 text-left">Output / Deliverable</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(selectedReport.raw.daily_accomplishments || []).map((row: any, i: number) => (
                        <tr key={i}>
                          <td className="border border-gray-300 p-2 align-top">{row.date}</td>
                          <td className="border border-gray-300 p-2 align-top">{row.activities}</td>
                          <td className="border border-gray-300 p-2 align-top">{row.output}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {selectedReport.raw.photos?.length > 0 && (
                    <div>
                      <p className="font-bold text-gray-800 text-sm mb-2">Attached Screenshots & Evidences</p>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {selectedReport.raw.photos.map((p: any, i: number) => (
                          <div key={i} className="border border-gray-200 rounded-lg p-1 bg-gray-50">
                            <img src={p.url} alt="Evidence" className="w-full h-32 object-contain bg-white rounded" />
                            {p.caption && <p className="text-[10px] text-gray-500 mt-1 text-center">{p.caption}</p>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Extension View */}
              {selectedReport.reportType === 'extension' && (
                <div className="space-y-4">
                  <table className="w-full border-collapse border border-gray-300 text-xs">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="border border-gray-300 p-2 text-left">Extension Project</th>
                        <th className="border border-gray-300 p-2 text-left">Highlights</th>
                        <th className="border border-gray-300 p-2 text-left">Partner</th>
                        <th className="border border-gray-300 p-2 text-left">Trainees</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(selectedReport.raw.rows || []).map((row: any, i: number) => (
                        <tr key={i}>
                          <td className="border border-gray-300 p-2">{row.extension_project}</td>
                          <td className="border border-gray-300 p-2">{row.highlights}</td>
                          <td className="border border-gray-300 p-2">{row.partner_linkage}</td>
                          <td className="border border-gray-300 p-2 text-center">{row.num_trainees}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Accomplishment View */}
              {selectedReport.reportType === 'accomplishment' && (
                <div className="space-y-4">
                  <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                    <p><strong>Chairperson:</strong> {selectedReport.raw.program_chair}</p>
                    <p><strong>Program:</strong> {selectedReport.raw.program}</p>
                  </div>
                  <p className="text-gray-500 italic">Report submitted with multiple MFO performance indicators and documentation entries.</p>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-gray-100 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedReport(null)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-xs font-semibold text-gray-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}