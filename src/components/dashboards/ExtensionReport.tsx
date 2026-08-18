import { useState, useEffect } from 'react';
import { Plus, Trash2, Save, Send, Printer, X } from 'lucide-react';

interface ReportRow {
  extension_project: string;
  highlights: string;
  partner_linkage: string;
  num_trainees: string;
  venue: string;
  inclusive_date: string;
}

interface ExtensionReportProps {
  userId: string;
  userName: string;
  readOnly?: boolean;
}

const EMPTY_ROW: ReportRow = {
  extension_project: '',
  highlights: '',
  partner_linkage: '',
  num_trainees: '',
  venue: '',
  inclusive_date: '',
};

// All reads/writes go through the Express API (JWT-authenticated),
// not straight to Supabase — mirrors the calendar_events/announcements setup.
const EXTENSION_API_URL = 'http://localhost:5000/api/extension-reports';

function getToken() {
  return localStorage.getItem('token');
}

export function ExtensionReport({ userId, userName, readOnly = false }: ExtensionReportProps) {
  const [quarter, setQuarter] = useState('1st');
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [rows, setRows] = useState<ReportRow[]>([{ ...EMPTY_ROW }, { ...EMPTY_ROW }, { ...EMPTY_ROW }]);
  const [status, setStatus] = useState<'draft' | 'submitted'>('draft');
  const [reportId, setReportId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [showPrint, setShowPrint] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [draftStatus, setDraftStatus] = useState<'loading' | 'loaded' | 'none' | 'error'>('loading');
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);

  const computeProgress = () => {
    const total = rows.length * 6;
    const filled = rows.reduce((acc, row) => acc + Object.values(row).filter(v => v.trim() !== '').length, 0);
    return total === 0 ? 0 : Math.round((filled / total) * 100);
  };

  const progress = computeProgress();

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`${EXTENSION_API_URL}/my-draft`, {
          headers: { Authorization: `Bearer ${getToken()}` },
        });
        if (!res.ok) { setDraftStatus('error'); return; }
        const data = await res.json();
        if (data) {
          setReportId(data.id);
          setQuarter(data.quarter);
          setYear(data.year);
          setRows(data.rows?.length > 0 ? data.rows : [{ ...EMPTY_ROW }, { ...EMPTY_ROW }, { ...EMPTY_ROW }]);
          setStatus(data.status);
          setLastSavedAt(data.updated_at ?? data.created_at ?? null);
          setDraftStatus('loaded');
        } else {
          setDraftStatus('none');
        }
      } catch {
        setDraftStatus('error');
      }
    };
    load();
  }, [userId]);

  const addRow = () => setRows(prev => [...prev, { ...EMPTY_ROW }]);
  const deleteRow = (idx: number) => { if (rows.length <= 1) return; setRows(prev => prev.filter((_, i) => i !== idx)); };
  const updateCell = (rowIdx: number, field: keyof ReportRow, value: string) => {
    setRows(prev => prev.map((row, i) => i === rowIdx ? { ...row, [field]: value } : row));
  };

  const showSuccess = (msg: string) => { setSuccessMsg(msg); setTimeout(() => setSuccessMsg(''), 3000); };
  const showError = (msg: string) => { setErrorMsg(msg); setTimeout(() => setErrorMsg(''), 4000); };

  const persist = async (payload: Record<string, unknown>) => {
    const headers = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getToken()}`,
    };

    if (reportId) {
      const res = await fetch(`${EXTENSION_API_URL}/${reportId}`, { method: 'PUT', headers, body: JSON.stringify(payload) });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || res.statusText);
      }
      return res.json();
    }

    const res = await fetch(EXTENSION_API_URL, { method: 'POST', headers, body: JSON.stringify(payload) });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || res.statusText);
    }
    return res.json();
  };

  const saveDraft = async () => {
    setSaving(true);
    try {
      const payload = { quarter, year, rows, status: 'draft', progress: computeProgress() };
      const data = await persist(payload);
      if (!reportId && data?.id) setReportId(data.id);
      setLastSavedAt(data?.updated_at ?? new Date().toISOString());
      setDraftStatus('loaded');
      showSuccess('Draft saved!');
    } catch (err: any) {
      showError('Failed to save draft: ' + (err?.message || 'Unknown error'));
    } finally {
      setSaving(false);
    }
  };

  const submitReport = async () => {
    setSaving(true);
    try {
      const payload = { quarter, year, rows, status: 'submitted', progress: computeProgress() };
      const data = await persist(payload);
      if (!reportId && data?.id) setReportId(data.id);
      setLastSavedAt(data?.updated_at ?? new Date().toISOString());
      setDraftStatus('loaded');
      setStatus('submitted');
      showSuccess('Report submitted to Dean!');
    } catch (err: any) {
      showError('Failed to submit report: ' + (err?.message || 'Unknown error'));
    } finally {
      setSaving(false);
    }
  };

  const formatSavedAt = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' });
  };

  return (
    <div className="space-y-4">
      {successMsg && <div className="fixed top-4 right-4 z-50 bg-green-600 text-white px-5 py-3 rounded-xl shadow-lg">{successMsg}</div>}
      {errorMsg && <div className="fixed top-4 right-4 z-50 bg-red-600 text-white px-5 py-3 rounded-xl shadow-lg">{errorMsg}</div>}

      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Extension Accomplishment Report</h2>
          <p className="text-sm text-gray-500 mt-0.5">Fill up all fields then submit to Dean</p>
          <p className="text-xs mt-1">
            {draftStatus === 'loading' && <span className="text-gray-400">Checking for a saved draft…</span>}
            {draftStatus === 'loaded' && lastSavedAt && (
              <span className="text-gray-500">Continuing your saved draft — last saved {formatSavedAt(lastSavedAt)}</span>
            )}
            {draftStatus === 'none' && <span className="text-gray-500">No draft yet — this is a new report.</span>}
            {draftStatus === 'error' && <span className="text-red-500">Couldn't load your saved draft — please refresh or contact support.</span>}
          </p>
        </div>
        {!readOnly && (
          <div className="flex gap-2 flex-wrap">
            <button onClick={() => setShowPrint(true)} className="flex items-center gap-1.5 px-3 py-2 border border-gray-200 text-gray-700 rounded-xl text-sm hover:bg-gray-50 transition-colors">
              <Printer className="w-4 h-4" /> Print
            </button>
            <button onClick={saveDraft} disabled={saving || status === 'submitted'} className="flex items-center gap-1.5 px-3 py-2 border border-blue-200 text-blue-700 bg-blue-50 rounded-xl text-sm hover:bg-blue-100 transition-colors disabled:opacity-50">
              <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save Draft'}
            </button>
            <button onClick={submitReport} disabled={saving || status === 'submitted'} className="flex items-center gap-1.5 px-3 py-2 bg-[#1E3A8A] text-white rounded-xl text-sm hover:bg-[#1E40AF] transition-colors disabled:opacity-50">
              <Send className="w-4 h-4" /> {status === 'submitted' ? 'Submitted ✓' : 'Submit to Dean'}
            </button>
          </div>
        )}
      </div>

      {/* Progress */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Form Completion</span>
          <span className="text-sm font-bold text-[#1E3A8A]">{progress}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div className="bg-[#1E3A8A] h-2.5 rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
        </div>
        {status === 'submitted' && <p className="text-xs text-green-600 font-medium mt-2">✓ Submitted to Dean</p>}
      </div>

      {/* Quarter & Year */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
        <div className="flex gap-4 flex-wrap">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Quarter</label>
            <select value={quarter} onChange={e => setQuarter(e.target.value)} disabled={readOnly || status === 'submitted'}
              className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option>1st</option><option>2nd</option><option>3rd</option><option>4th</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Year</label>
            <input type="text" value={year} onChange={e => setYear(e.target.value)} disabled={readOnly || status === 'submitted'}
              className="px-3 py-2 border border-gray-200 rounded-xl text-sm w-24 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-sm">
            <thead>
              <tr className="bg-[#1E3A8A] text-white">
                <th className="px-3 py-3 text-left font-semibold text-xs w-8">#</th>
                <th className="px-3 py-3 text-left font-semibold text-xs">Extension Project/Activity</th>
                <th className="px-3 py-3 text-left font-semibold text-xs">Highlights of the Accomplishment</th>
                <th className="px-3 py-3 text-left font-semibold text-xs">Partner/Linkage</th>
                <th className="px-3 py-3 text-left font-semibold text-xs">No. of Trainees</th>
                <th className="px-3 py-3 text-left font-semibold text-xs">Venue</th>
                <th className="px-3 py-3 text-left font-semibold text-xs">Inclusive Date</th>
                {!readOnly && status !== 'submitted' && <th className="px-3 py-3 w-8" />}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, idx) => (
                <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                  <td className="px-3 py-2 text-gray-400 text-xs">{idx + 1}</td>
                  {(['extension_project', 'highlights', 'partner_linkage', 'num_trainees', 'venue', 'inclusive_date'] as (keyof ReportRow)[]).map(field => (
                    <td key={field} className="px-2 py-1.5">
                      <textarea value={row[field]} onChange={e => updateCell(idx, field, e.target.value)} disabled={readOnly || status === 'submitted'} rows={2}
                        className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none disabled:bg-gray-50 disabled:text-gray-500"
                        placeholder={field === 'extension_project' ? 'Project/Activity name' : field === 'highlights' ? 'Key accomplishments' : field === 'partner_linkage' ? 'Partner organization' : field === 'num_trainees' ? '0' : field === 'venue' ? 'Location' : 'MM/DD/YYYY'} />
                    </td>
                  ))}
                  {!readOnly && status !== 'submitted' && (
                    <td className="px-2 py-1.5">
                      <button onClick={() => deleteRow(idx)} className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!readOnly && status !== 'submitted' && (
          <div className="p-3 border-t border-gray-100">
            <button onClick={addRow} className="flex items-center gap-1.5 text-sm text-[#1E3A8A] hover:bg-blue-50 px-3 py-2 rounded-xl transition-colors font-medium">
              <Plus className="w-4 h-4" /> Add Row
            </button>
          </div>
        )}
      </div>

      {/* Signature */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <p className="text-sm font-semibold text-gray-700 mb-4">Prepared by:</p>
        <div className="border-b border-gray-400 w-48 mb-1" />
        <p className="text-xs text-gray-500">{userName}</p>
        <p className="text-xs text-gray-500">Extension Chairperson</p>
      </div>

      {/* Noted By */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <p className="text-sm font-semibold text-gray-700 mb-4">Noted:</p>
        <div className="flex flex-wrap gap-10">
          <div>
            <p className="text-xs font-bold text-gray-800 underline">TERESITA CLEOPOLDA B. SARILE</p>
            <p className="text-xs text-gray-500">Chair, Extension Services</p>
          </div>
          <div>
            <p className="text-xs font-bold text-gray-800 underline">EINGILBERT C. BENOLIRAO</p>
            <p className="text-xs text-gray-500">Campus Director</p>
          </div>
        </div>
      </div>

      {/* Print Modal */}
      {showPrint && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-start justify-center overflow-y-auto py-8 px-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl">
            <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-white z-10">
              <h3 className="font-bold text-gray-900">Print Preview</h3>
              <div className="flex gap-2">
                <button onClick={() => window.print()} className="flex items-center gap-1.5 px-4 py-2 bg-[#1E3A8A] text-white rounded-xl text-sm">
                  <Printer className="w-4 h-4" /> Print
                </button>
                <button onClick={() => setShowPrint(false)} className="p-2 hover:bg-gray-100 rounded-xl">
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            </div>

            {/* Print content */}
            <div className="p-8 print:p-4" id="print-area">

              {/* ── CTU Header Image ── */}
              <div className="mb-4">
                <img src="/header-pics/ctu-header.png" alt="CTU Header" className="w-full object-contain" />
              </div>

              {/* ── Report Title ── */}
              <div className="text-center mb-6">
                <p className="font-bold text-base uppercase">Community Extension Services Accomplishment Report</p>
                <p className="font-semibold mt-1">_{quarter}_ Quarter of 20{year.slice(-2)}_</p>
              </div>

              {/* ── Table ── */}
              <table className="w-full border-collapse border border-black text-xs">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-black px-2 py-2 text-left font-bold">Extension Project/Activity</th>
                    <th className="border border-black px-2 py-2 text-left font-bold">Highlights of the Accomplishment</th>
                    <th className="border border-black px-2 py-2 text-left font-bold">Partner/Linkage</th>
                    <th className="border border-black px-2 py-2 text-left font-bold">No. of Trainees</th>
                    <th className="border border-black px-2 py-2 text-left font-bold">Venue</th>
                    <th className="border border-black px-2 py-2 text-left font-bold">Inclusive Date</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, idx) => (
                    <tr key={idx}>
                      <td className="border border-black px-2 py-4 align-top">{row.extension_project}</td>
                      <td className="border border-black px-2 py-4 align-top">{row.highlights}</td>
                      <td className="border border-black px-2 py-4 align-top">{row.partner_linkage}</td>
                      <td className="border border-black px-2 py-4 align-top text-center">{row.num_trainees}</td>
                      <td className="border border-black px-2 py-4 align-top">{row.venue}</td>
                      <td className="border border-black px-2 py-4 align-top">{row.inclusive_date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* ── Signature ── */}
              <div className="mt-8">
                <p className="text-sm font-bold">Prepared by:</p>
                <div className="border-b border-black w-48 mt-6 mb-1" />
                <p className="text-xs">{userName}</p>
                <p className="text-xs">Extension Chairperson</p>
              </div>

              {/* ── Noted By ── */}
              <div className="mt-8 flex justify-between flex-wrap gap-6">
                <div>
                  <p className="text-sm font-bold mb-1">Noted:</p>
                </div>
              </div>
              <div className="mt-2 flex justify-start gap-16 flex-wrap">
                <div>
                  <p className="text-xs font-bold underline">TERESITA CLEOPOLDA B. SARILE</p>
                  <p className="text-xs">Chair, Extension Services</p>
                </div>
                <div>
                  <p className="text-xs font-bold underline">EINGILBERT C. BENOLIRAO</p>
                  <p className="text-xs">Campus Director</p>
                </div>
              </div>

              {/* ── CTU Footer Image ── */}
              <div className="mt-8">
                <img src="/header-pics/ctu-footer.png" alt="CTU Footer" className="w-full object-contain" />
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
}