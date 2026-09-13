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

const SUPPORTING_DOC_OPTIONS = [
  { key: 'online_class', label: 'Screenshot of Online Class' },
  { key: 'teams_zoom', label: 'MS Teams/Zoom Attendance' },
  { key: 'lms_activity', label: 'Learning Management System (LMS) Activity' },
  { key: 'lesson_plan', label: 'Lesson Plan / Learning Materials' },
  { key: 'consultation_log', label: 'Student Consultation Log' },
  { key: 'research_output', label: 'Research Output' },
  { key: 'extension_report', label: 'Extension Report' },
  { key: 'meeting_attendance', label: 'Meeting Attendance/Minutes' },
  { key: 'office_report', label: 'Office Report' },
];

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

  const handlePrint = () => {
    window.print();
  };

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
    <>
      {/* Styles that isolate the printable area and hide UI chrome */}
      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #official-print-document, #official-print-document * {
            visibility: visible !important;
          }
          #official-print-document {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
          }
          .no-print {
            display: none !important;
          }
          @page {
            size: auto;
            margin: 15mm;
          }
        }
      `}</style>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Submitted Reports Tracker</h2>
            <p className="text-xs text-gray-500 mt-0.5">Track status, review notes, and print your submitted reports anytime.</p>
          </div>
          <button
            onClick={fetchReports}
            className="flex items-center gap-1 text-xs text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg font-semibold transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </button>
        </div>

        {loading ? (
          <div className="py-12 text-center text-gray-400 text-sm">Loading submitted reports...</div>
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
                    <Eye className="w-3.5 h-3.5" /> View / Print
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* View & Print Modal */}
        {selectedReport && (
          <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 p-4 overflow-y-auto py-6">
            <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full relative flex flex-col overflow-hidden">
              
              {/* Modal Control Header (hidden on print) */}
              <div className="no-print flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/80">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-gray-900 text-sm">{selectedReport.title}</span>
                  {getStatusBadge(selectedReport.status)}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handlePrint}
                    className="flex items-center gap-1.5 text-xs px-4 py-2 bg-[#1E3A8A] text-white hover:bg-[#1E40AF] rounded-xl font-semibold shadow-sm transition-colors"
                  >
                    <Printer className="w-4 h-4" /> Print Document
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedReport(null)}
                    className="p-1.5 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-200/60 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Printable Document Container */}
              <div id="official-print-document" className="p-8 sm:p-12 text-black bg-white font-serif leading-relaxed text-xs">
                
                {/* Official CTU Header */}
                <div className="mb-4 text-center">
                  <img
                    src="/header-pics/ctu-header.png"
                    alt="Cebu Technological University Header"
                    className="w-full max-h-24 object-contain mx-auto"
                  />
                </div>

                {/* ─── WFH REPORT DOCUMENT TEMPLATE ─── */}
                {selectedReport.reportType === 'wfh' && (
                  <div>
                    <div className="text-center mb-6">
                      <h1 className="font-bold text-sm tracking-wide uppercase">WORK-FROM-HOME (WFH) ACCOMPLISHMENT REPORT</h1>
                      <p className="italic text-[11px] text-gray-700">(In Compliance with the CSC Work-from-Home Arrangement)</p>
                    </div>

                    <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 mb-5 text-[11px] border border-gray-300 p-3.5 rounded-lg">
                      <p><strong>Reporting Period:</strong> {selectedReport.raw.reporting_period || '—'}</p>
                      <p><strong>Program / Unit:</strong> {selectedReport.raw.program_unit || '—'}</p>
                      <p><strong>Faculty Name:</strong> {selectedReport.raw.name || '—'}</p>
                      <p><strong>Administrative Designation:</strong> {selectedReport.raw.admin_designation || 'N/A'}</p>
                      <p><strong>Position / Academic Rank:</strong> {selectedReport.raw.position_rank || '—'}</p>
                      <p><strong>Official Working Hours:</strong> {selectedReport.raw.working_hours || '8:00 A.M. – 12:00 NOON | 1:00 P.M. – 5:00 P.M.'}</p>
                      <p className="col-span-2"><strong>College / Office:</strong> {selectedReport.raw.college_office || '—'}</p>
                    </div>

                    {/* Section I */}
                    <div className="mb-5">
                      <p className="font-bold text-[11.5px] uppercase mb-2">I. Daily Accomplishments</p>
                      <table className="w-full border-collapse border border-black text-[10.5px]">
                        <thead>
                          <tr className="bg-gray-100 font-bold">
                            <th className="border border-black px-2.5 py-1.5 text-left w-32">Date</th>
                            <th className="border border-black px-2.5 py-1.5 text-left">Activities Accomplished</th>
                            <th className="border border-black px-2.5 py-1.5 text-left">Output / Deliverable</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(selectedReport.raw.daily_accomplishments || []).map((r: any, i: number) => (
                            <tr key={i}>
                              <td className="border border-black px-2.5 py-2 align-top whitespace-pre-wrap">{r.date}</td>
                              <td className="border border-black px-2.5 py-2 align-top whitespace-pre-wrap">{r.activities}</td>
                              <td className="border border-black px-2.5 py-2 align-top whitespace-pre-wrap">{r.output}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Section II */}
                    <div className="mb-6">
                      <p className="font-bold text-[11.5px] uppercase mb-1">II. Supporting Documents Attached</p>
                      <p className="italic text-[10px] text-gray-600 mb-2">(Check all applicable)</p>
                      <div className="grid grid-cols-2 gap-y-1.5 text-[10.5px]">
                        {SUPPORTING_DOC_OPTIONS.map((d) => (
                          <div key={d.key} className="flex items-center gap-2">
                            <span className="font-bold">{selectedReport.raw.supporting_docs?.[d.key] ? '☒' : '☐'}</span>
                            <span>{d.label}</span>
                          </div>
                        ))}
                        <div className="col-span-2 flex items-center gap-1.5 mt-1">
                          <span className="font-bold">{selectedReport.raw.supporting_docs?.other ? '☒' : '☐'}</span>
                          <span>Other: <u>&nbsp;{selectedReport.raw.other_docs_specify || '___________________________'}&nbsp;</u></span>
                        </div>
                      </div>
                    </div>

                    {/* Evidence Photos */}
                    {selectedReport.raw.photos && selectedReport.raw.photos.length > 0 && (
                      <div className="my-6">
                        <p className="font-bold text-[11.5px] uppercase mb-3">Attachments / Evidences</p>
                        <div className="grid grid-cols-2 gap-4">
                          {selectedReport.raw.photos.map((p: any, idx: number) => (
                            <div key={idx} className="border border-black p-2 flex flex-col items-center">
                              <img src={p.url} alt={`Evidence ${idx + 1}`} className="max-h-52 object-contain" />
                              {p.caption && <p className="text-[10px] mt-1 font-sans text-center">{p.caption}</p>}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Certification Statement */}
                    <div className="mt-8">
                      <p className="font-bold text-[11.5px] uppercase mb-1">Certification</p>
                      <p className="text-justify text-[10.5px] leading-relaxed mb-10">
                        I hereby certify that the foregoing information is true and correct and that I performed my official duties during the approved Work-from-Home arrangement in accordance with the Civil Service Commission guidelines and the policies of Cebu Technological University.
                      </p>

                      <div className="grid grid-cols-3 gap-6 text-center text-[10.5px]">
                        <div>
                          <p className="text-left font-semibold mb-10">Prepared by:</p>
                          <div className="border-b border-black mx-auto mb-1 w-44" />
                          <p className="font-bold uppercase">{selectedReport.raw.prepared_by_name || selectedReport.raw.name || '____________________'}</p>
                          <p className="text-[9.5px]">Faculty Member</p>
                          <p className="text-[9.5px] mt-1">Date: {selectedReport.raw.prepared_by_date || '____________'}</p>
                        </div>

                        <div>
                          <p className="text-left font-semibold mb-10">Verified by:</p>
                          <div className="border-b border-black mx-auto mb-1 w-44" />
                          <p className="font-bold uppercase">{selectedReport.raw.verified_by_name || '____________________'}</p>
                          <p className="text-[9.5px]">{selectedReport.raw.verified_by_title || 'Chairperson / Supervisor'}</p>
                          <p className="text-[9.5px] mt-1">Date: {selectedReport.raw.verified_by_date || '____________'}</p>
                        </div>

                        <div>
                          <p className="text-left font-semibold mb-10">Noted by:</p>
                          <div className="border-b border-black mx-auto mb-1 w-44" />
                          <p className="font-bold uppercase">{selectedReport.raw.noted_by_name || '____________________'}</p>
                          <p className="text-[9.5px]">{selectedReport.raw.noted_by_title || 'Dean'}</p>
                          <p className="text-[9.5px] mt-1">Date: {selectedReport.raw.noted_by_date || '____________'}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* ─── EXTENSION REPORT DOCUMENT TEMPLATE ─── */}
                {selectedReport.reportType === 'extension' && (
                  <div>
                    <div className="text-center mb-6">
                      <h1 className="font-bold text-sm tracking-wide uppercase">COMMUNITY EXTENSION SERVICES ACCOMPLISHMENT REPORT</h1>
                      <p className="text-[11px]">{selectedReport.periodOrQuarter}</p>
                    </div>

                    <table className="w-full border-collapse border border-black text-[10px] mb-8">
                      <thead>
                        <tr className="bg-gray-100 font-bold">
                          <th className="border border-black p-2 text-left">Extension Project</th>
                          <th className="border border-black p-2 text-left">Highlights</th>
                          <th className="border border-black p-2 text-left">Partner Linkage</th>
                          <th className="border border-black p-2 text-center">Trainees</th>
                          <th className="border border-black p-2 text-left">Venue</th>
                          <th className="border border-black p-2 text-left">Inclusive Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(selectedReport.raw.rows || []).map((row: any, i: number) => (
                          <tr key={i}>
                            <td className="border border-black p-2">{row.extension_project}</td>
                            <td className="border border-black p-2">{row.highlights}</td>
                            <td className="border border-black p-2">{row.partner_linkage}</td>
                            <td className="border border-black p-2 text-center">{row.num_trainees}</td>
                            <td className="border border-black p-2">{row.venue}</td>
                            <td className="border border-black p-2">{row.inclusive_date}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* ─── ACCOMPLISHMENT REPORT TEMPLATE ─── */}
                {selectedReport.reportType === 'accomplishment' && (
                  <div>
                    <div className="text-center mb-6">
                      <h1 className="font-bold text-sm tracking-wide uppercase">FACULTY / DEPARTMENT ACCOMPLISHMENT REPORT</h1>
                      <p className="text-[11px]">{selectedReport.periodOrQuarter}</p>
                    </div>
                    <div className="p-3 border border-gray-300 rounded mb-4 text-[11px]">
                      <p><strong>Program Chairperson:</strong> {selectedReport.raw.program_chair || '—'}</p>
                      <p><strong>Program / Unit:</strong> {selectedReport.raw.program || '—'}</p>
                    </div>
                    <p className="text-gray-500 italic text-center py-4">Submission contains quarterly Major Final Output (MFO) indicators and documentary attachments.</p>
                  </div>
                )}

                {/* Official CTU Footer */}
                <div className="mt-12 text-center">
                  <img
                    src="/header-pics/ctu-footer.png"
                    alt="Cebu Technological University Footer"
                    className="w-full max-h-16 object-contain mx-auto"
                  />
                </div>

              </div>

              {/* Modal Action Footer (hidden on print) */}
              <div className="no-print p-4 border-t border-gray-100 flex justify-end bg-gray-50">
                <button
                  type="button"
                  onClick={() => setSelectedReport(null)}
                  className="px-5 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-xl text-xs font-semibold transition-colors"
                >
                  Close
                </button>
              </div>

            </div>
          </div>
        )}
      </div>
    </>
  );
}