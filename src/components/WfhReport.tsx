import { useState, useEffect, useRef } from 'react';
import { Plus, Trash2, Save, Send, Printer, X, Upload, ImageIcon, Loader2 } from 'lucide-react';

interface DailyAccomplishment {
  date: string;
  activities: string;
  output: string;
}

interface PhotoItem {
  path?: string;
  url: string;
  caption?: string;
}

interface WfhReportProps {
  userId: string;
  userName: string;
  readOnly?: boolean;
}

const WFH_API_URL = 'https://coed.onrender.com/api/wfh-reports';

function getToken() {
  return localStorage.getItem('token');
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

export function WfhReport({ userId, userName, readOnly = false }: WfhReportProps) {
  const [reportId, setReportId] = useState<string | null>(null);
  const [reportingPeriod, setReportingPeriod] = useState('');
  const [name, setName] = useState(userName);
  const [positionRank, setPositionRank] = useState('');
  const [collegeOffice, setCollegeOffice] = useState('');
  const [programUnit, setProgramUnit] = useState('');
  const [adminDesignation, setAdminDesignation] = useState('');
  const [workingHours, setWorkingHours] = useState('8:00 A.M. – 12:00 NOON | 1:00 P.M. – 5:00 P.M.');

  // Clean empty initial row
  const [dailyAccomplishments, setDailyAccomplishments] = useState<DailyAccomplishment[]>([
    { date: '', activities: '', output: '' },
  ]);

  // All checkboxes start unchecked
  const [supportingDocs, setSupportingDocs] = useState<Record<string, boolean>>({
    online_class: false,
    teams_zoom: false,
    lms_activity: false,
    lesson_plan: false,
    consultation_log: false,
    research_output: false,
    extension_report: false,
    meeting_attendance: false,
    office_report: false,
    other: false,
  });
  const [otherDocsSpecify, setOtherDocsSpecify] = useState('');

  // Evidence Photos
  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Signatures
  const [preparedByName, setPreparedByName] = useState(userName);
  const [preparedByDate, setPreparedByDate] = useState('');
  const [verifiedByName, setVerifiedByName] = useState('');
  const [verifiedByTitle, setVerifiedByTitle] = useState('Program Chairperson / Immediate Supervisor');
  const [verifiedByDate, setVerifiedByDate] = useState('');
  const [notedByName, setNotedByName] = useState('');
  const [notedByTitle, setNotedByTitle] = useState('Dean');
  const [notedByDate, setNotedByDate] = useState('');

  const [status, setStatus] = useState<'draft' | 'submitted'>('draft');
  const [saving, setSaving] = useState(false);
  const [showPrint, setShowPrint] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);

  useEffect(() => {
    const loadDraft = async () => {
      try {
        const res = await fetch(`${WFH_API_URL}/my-draft`, {
          headers: { Authorization: `Bearer ${getToken()}` },
        });
        if (res.ok) {
          const data = await res.json();
          if (data) {
            setReportId(data.id);
            setReportingPeriod(data.reporting_period ?? '');
            setName(data.name ?? userName);
            setPositionRank(data.position_rank ?? '');
            setCollegeOffice(data.college_office ?? '');
            setProgramUnit(data.program_unit ?? '');
            setAdminDesignation(data.admin_designation ?? '');
            setWorkingHours(data.working_hours ?? '8:00 A.M. – 12:00 NOON | 1:00 P.M. – 5:00 P.M.');
            if (data.daily_accomplishments?.length) setDailyAccomplishments(data.daily_accomplishments);
            if (data.supporting_docs) setSupportingDocs(data.supporting_docs);
            setOtherDocsSpecify(data.other_docs_specify ?? '');
            if (data.photos?.length) setPhotos(data.photos);
            setPreparedByName(data.prepared_by_name ?? userName);
            setPreparedByDate(data.prepared_by_date ?? '');
            setVerifiedByName(data.verified_by_name ?? '');
            setVerifiedByTitle(data.verified_by_title ?? 'Program Chairperson / Immediate Supervisor');
            setVerifiedByDate(data.verified_by_date ?? '');
            setNotedByName(data.noted_by_name ?? '');
            setNotedByTitle(data.noted_by_title ?? 'Dean');
            setNotedByDate(data.noted_by_date ?? '');
            setStatus(data.status ?? 'draft');
            setLastSavedAt(data.updated_at ?? null);
          }
        }
      } catch {
        // silent
      }
    };
    loadDraft();
  }, [userId, userName]);

  const addRow = () => {
    setDailyAccomplishments(prev => [...prev, { date: '', activities: '', output: '' }]);
  };

  const deleteRow = (idx: number) => {
    if (dailyAccomplishments.length <= 1) return;
    setDailyAccomplishments(prev => prev.filter((_, i) => i !== idx));
  };

  const updateRow = (idx: number, field: keyof DailyAccomplishment, value: string) => {
    setDailyAccomplishments(prev => prev.map((r, i) => (i === idx ? { ...r, [field]: value } : r)));
  };

  const handleCheckboxChange = (key: string) => {
    if (readOnly || status === 'submitted') return;
    setSupportingDocs(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      const formData = new FormData();
      Array.from(files).forEach(f => formData.append('files', f));

      const res = await fetch(`${WFH_API_URL}/photos`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${getToken()}` },
        body: formData,
      });

      if (res.ok) {
        const uploaded: { url: string; path?: string }[] = await res.json();
        setPhotos(prev => [...prev, ...uploaded.map(u => ({ url: u.url, path: u.path, caption: '' }))]);
        setSuccessMsg('Evidence photo(s) uploaded!');
      } else {
        setErrorMsg('Failed to upload image(s).');
      }
    } catch {
      setErrorMsg('Could not upload images.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const removePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const getPayload = (submitStatus: string) => ({
    reporting_period: reportingPeriod,
    name,
    position_rank: positionRank,
    college_office: collegeOffice,
    program_unit: programUnit,
    admin_designation: adminDesignation,
    working_hours: workingHours,
    daily_accomplishments: dailyAccomplishments,
    supporting_docs: supportingDocs,
    other_docs_specify: otherDocsSpecify,
    photos,
    prepared_by_name: preparedByName,
    prepared_by_date: preparedByDate,
    verified_by_name: verifiedByName,
    verified_by_title: verifiedByTitle,
    verified_by_date: verifiedByDate,
    noted_by_name: notedByName,
    noted_by_title: notedByTitle,
    noted_by_date: notedByDate,
    status: submitStatus,
  });

  const persist = async (payload: Record<string, unknown>) => {
    const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` };
    const url = reportId ? `${WFH_API_URL}/${reportId}` : WFH_API_URL;
    const method = reportId ? 'PUT' : 'POST';

    const res = await fetch(url, { method, headers, body: JSON.stringify(payload) });
    if (!res.ok) throw new Error('Save failed');
    return res.json();
  };

  const handleSave = async (submitStatus: 'draft' | 'submitted') => {
    setSaving(true);
    try {
      const data = await persist(getPayload(submitStatus));
      if (!reportId && data?.id) setReportId(data.id);
      setStatus(submitStatus);
      setLastSavedAt(new Date().toISOString());
      setSuccessMsg(submitStatus === 'submitted' ? 'WFH Report Submitted to Dean!' : 'Draft Saved!');
    } catch {
      setErrorMsg('Error saving report.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {successMsg && <div className="fixed top-4 right-4 z-50 bg-green-600 text-white px-5 py-3 rounded-xl shadow-lg">{successMsg}</div>}
      {errorMsg && <div className="fixed top-4 right-4 z-50 bg-red-600 text-white px-5 py-3 rounded-xl shadow-lg">{errorMsg}</div>}

      {/* Header Actions */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Work-From-Home (WFH) Accomplishment Report</h2>
          <p className="text-xs text-gray-500 mt-1">In Compliance with the CSC Work-from-Home Arrangement</p>
          {lastSavedAt && <p className="text-[11px] text-gray-400 mt-0.5">Last saved: {new Date(lastSavedAt).toLocaleString()}</p>}
        </div>
        {!readOnly && (
          <div className="flex gap-2 flex-wrap">
            <button onClick={() => setShowPrint(true)} className="flex items-center gap-1.5 px-3 py-2 border border-gray-200 text-gray-700 rounded-xl text-sm hover:bg-gray-50">
              <Printer className="w-4 h-4" /> Print
            </button>
            <button onClick={() => handleSave('draft')} disabled={saving || status === 'submitted'} className="flex items-center gap-1.5 px-3 py-2 border border-blue-200 text-blue-700 bg-blue-50 rounded-xl text-sm hover:bg-blue-100 disabled:opacity-50">
              <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save Draft'}
            </button>
            <button onClick={() => handleSave('submitted')} disabled={saving || status === 'submitted'} className="flex items-center gap-1.5 px-3 py-2 bg-[#1E3A8A] text-white rounded-xl text-sm hover:bg-[#1E40AF] disabled:opacity-50">
              <Send className="w-4 h-4" /> {status === 'submitted' ? 'Submitted ✓' : 'Submit to Dean'}
            </button>
          </div>
        )}
      </div>

      {/* Header Info Details */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
        <h3 className="font-semibold text-gray-800 text-sm border-b border-gray-100 pb-2">Faculty Information</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
          <div>
            <label className="block font-medium text-gray-600 mb-1">Reporting Period</label>
            <input type="text" value={reportingPeriod} onChange={e => setReportingPeriod(e.target.value)} disabled={readOnly || status === 'submitted'} placeholder="e.g. August 7 and 14, 2026" className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-1 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block font-medium text-gray-600 mb-1">Faculty Name</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} disabled={readOnly || status === 'submitted'} placeholder="Full Name" className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-1 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block font-medium text-gray-600 mb-1">Position / Academic Rank</label>
            <input type="text" value={positionRank} onChange={e => setPositionRank(e.target.value)} disabled={readOnly || status === 'submitted'} placeholder="e.g. Instructor I" className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-1 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block font-medium text-gray-600 mb-1">College / Office</label>
            <input type="text" value={collegeOffice} onChange={e => setCollegeOffice(e.target.value)} disabled={readOnly || status === 'submitted'} placeholder="e.g. College of Technology and Engineering" className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-1 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block font-medium text-gray-600 mb-1">Program / Unit</label>
            <input type="text" value={programUnit} onChange={e => setProgramUnit(e.target.value)} disabled={readOnly || status === 'submitted'} placeholder="e.g. BIT-CT" className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-1 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block font-medium text-gray-600 mb-1">Administrative Designation (if any)</label>
            <input type="text" value={adminDesignation} onChange={e => setAdminDesignation(e.target.value)} disabled={readOnly || status === 'submitted'} placeholder="N/A or Designation" className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-1 focus:ring-blue-500" />
          </div>
          <div className="sm:col-span-2 md:col-span-3">
            <label className="block font-medium text-gray-600 mb-1">Official Working Hours</label>
            <input type="text" value={workingHours} onChange={e => setWorkingHours(e.target.value)} disabled={readOnly || status === 'submitted'} placeholder="8:00 A.M. – 12:00 NOON | 1:00 P.M. – 5:00 P.M." className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-1 focus:ring-blue-500" />
          </div>
        </div>
      </div>

      {/* Section I: Daily Accomplishments */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-800 text-sm">I. Daily Accomplishments</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[650px] text-xs border-collapse">
            <thead>
              <tr className="bg-[#1E3A8A] text-white">
                <th className="px-3 py-2 text-left w-36">Date</th>
                <th className="px-3 py-2 text-left">Activities Accomplished</th>
                <th className="px-3 py-2 text-left">Output / Deliverable</th>
                {!readOnly && status !== 'submitted' && <th className="px-2 py-2 w-8" />}
              </tr>
            </thead>
            <tbody>
              {dailyAccomplishments.map((item, idx) => (
                <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="p-1 border border-gray-200 align-top">
                    <input type="text" value={item.date} onChange={e => updateRow(idx, 'date', e.target.value)} disabled={readOnly || status === 'submitted'} placeholder="Date" className="w-full p-1.5 rounded border border-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-transparent" />
                  </td>
                  <td className="p-1 border border-gray-200 align-top">
                    <textarea rows={2} value={item.activities} onChange={e => updateRow(idx, 'activities', e.target.value)} disabled={readOnly || status === 'submitted'} placeholder="Describe activities accomplished..." className="w-full p-1.5 rounded border border-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-transparent resize-none" />
                  </td>
                  <td className="p-1 border border-gray-200 align-top">
                    <textarea rows={2} value={item.output} onChange={e => updateRow(idx, 'output', e.target.value)} disabled={readOnly || status === 'submitted'} placeholder="Output or deliverable produced..." className="w-full p-1.5 rounded border border-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-transparent resize-none" />
                  </td>
                  {!readOnly && status !== 'submitted' && (
                    <td className="p-1 border border-gray-200 text-center align-middle">
                      <button onClick={() => deleteRow(idx)} className="p-1 text-red-400 hover:bg-red-50 rounded">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!readOnly && status !== 'submitted' && (
          <button onClick={addRow} className="flex items-center gap-1 text-xs text-[#1E3A8A] bg-blue-50 hover:bg-blue-100 font-semibold px-3 py-1.5 rounded-lg transition-colors">
            <Plus className="w-3.5 h-3.5" /> Add Date
          </button>
        )}
      </div>

      {/* Section II: Supporting Documents Checklist */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
        <h3 className="font-semibold text-gray-800 text-sm">II. Supporting Documents Attached</h3>
        <p className="text-xs text-gray-400 italic -mt-2">(Check all applicable.)</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
          {SUPPORTING_DOC_OPTIONS.map(doc => (
            <label key={doc.key} className="flex items-center gap-2 cursor-pointer select-none">
              <input type="checkbox" checked={!!supportingDocs[doc.key]} onChange={() => handleCheckboxChange(doc.key)} disabled={readOnly || status === 'submitted'} className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500" />
              <span className="text-gray-700">{doc.label}</span>
            </label>
          ))}
          <div className="sm:col-span-2 md:col-span-3 flex items-center gap-2 pt-2">
            <label className="flex items-center gap-2 cursor-pointer select-none shrink-0">
              <input type="checkbox" checked={!!supportingDocs.other} onChange={() => handleCheckboxChange('other')} disabled={readOnly || status === 'submitted'} className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500" />
              <span className="text-gray-700 font-medium">Other:</span>
            </label>
            <input type="text" value={otherDocsSpecify} onChange={e => setOtherDocsSpecify(e.target.value)} disabled={readOnly || status === 'submitted' || !supportingDocs.other} placeholder="Specify other supporting document" className="flex-1 px-2 py-1 border-b border-gray-300 focus:border-blue-600 outline-none text-xs disabled:bg-gray-50" />
          </div>
        </div>
      </div>

      {/* Section III: Photos / Visual Evidences */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-800 text-sm">Evidence Screenshots & Photos</h3>
          {!readOnly && status !== 'submitted' && (
            <div>
              <input ref={fileInputRef} type="file" multiple accept="image/*" className="hidden" id="wfh-photo-upload" onChange={handlePhotoUpload} />
              <label htmlFor="wfh-photo-upload" className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-xl text-xs font-semibold cursor-pointer">
                {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                {uploading ? 'Uploading...' : 'Upload Screenshot'}
              </label>
            </div>
          )}
        </div>

        {photos.length === 0 ? (
          <div className="text-center py-6 text-gray-400 text-xs flex flex-col items-center gap-2">
            <ImageIcon className="w-6 h-6 text-gray-300" />
            No screenshot evidences attached yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {photos.map((item, idx) => (
              <div key={idx} className="relative group border border-gray-200 rounded-xl overflow-hidden bg-gray-50">
                <img src={item.url} alt={`Evidence ${idx + 1}`} className="w-full h-44 object-contain bg-white" />
                {!readOnly && status !== 'submitted' && (
                  <button onClick={() => removePhoto(idx)} className="absolute top-2 right-2 p-1 bg-black/60 hover:bg-red-600 text-white rounded-full transition-colors">
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
                <input
                  type="text"
                  value={item.caption || ''}
                  onChange={e => {
                    const val = e.target.value;
                    setPhotos(prev => prev.map((p, i) => (i === idx ? { ...p, caption: val } : p)));
                  }}
                  disabled={readOnly || status === 'submitted'}
                  placeholder="Caption (optional)"
                  className="w-full text-[11px] px-2 py-1.5 border-t border-gray-200 outline-none focus:ring-1 focus:ring-blue-400 bg-white"
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Certification & Signatures */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
        <h3 className="font-bold text-gray-900 text-xs uppercase tracking-wide">Certification</h3>
        <p className="text-xs text-gray-600 leading-relaxed italic border-l-2 border-[#1E3A8A] pl-3">
          I hereby certify that the foregoing information is true and correct and that I performed my official duties during the approved Work-from-Home arrangement in accordance with the Civil Service Commission guidelines and the policies of Cebu Technological University.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 text-xs">
          {/* Prepared by */}
          <div className="space-y-2 bg-gray-50/70 p-3 rounded-xl border border-gray-100">
            <p className="font-semibold text-gray-700">Prepared by:</p>
            <input type="text" value={preparedByName} onChange={e => setPreparedByName(e.target.value)} disabled={readOnly || status === 'submitted'} placeholder="Faculty Name" className="w-full px-2 py-1.5 border border-gray-200 rounded text-xs bg-white" />
            <p className="text-[11px] text-gray-500">Signature Over Printed Name</p>
            <input type="date" value={preparedByDate} onChange={e => setPreparedByDate(e.target.value)} disabled={readOnly || status === 'submitted'} className="w-full px-2 py-1 border border-gray-200 rounded text-xs bg-white" />
          </div>

          {/* Verified by */}
          <div className="space-y-2 bg-gray-50/70 p-3 rounded-xl border border-gray-100">
            <p className="font-semibold text-gray-700">Verified by:</p>
            <input type="text" value={verifiedByName} onChange={e => setVerifiedByName(e.target.value)} disabled={readOnly || status === 'submitted'} placeholder="Chairperson / Supervisor Name" className="w-full px-2 py-1.5 border border-gray-200 rounded text-xs bg-white" />
            <input type="text" value={verifiedByTitle} onChange={e => setVerifiedByTitle(e.target.value)} disabled={readOnly || status === 'submitted'} placeholder="Position / Designation" className="w-full px-2 py-1 border border-gray-200 rounded text-xs bg-white" />
            <input type="date" value={verifiedByDate} onChange={e => setVerifiedByDate(e.target.value)} disabled={readOnly || status === 'submitted'} className="w-full px-2 py-1 border border-gray-200 rounded text-xs bg-white" />
          </div>

          {/* Noted by */}
          <div className="space-y-2 bg-gray-50/70 p-3 rounded-xl border border-gray-100">
            <p className="font-semibold text-gray-700">Noted by:</p>
            <input type="text" value={notedByName} onChange={e => setNotedByName(e.target.value)} disabled={readOnly || status === 'submitted'} placeholder="Dean Name" className="w-full px-2 py-1.5 border border-gray-200 rounded text-xs bg-white" />
            <input type="text" value={notedByTitle} onChange={e => setNotedByTitle(e.target.value)} disabled={readOnly || status === 'submitted'} placeholder="Position / Designation" className="w-full px-2 py-1 border border-gray-200 rounded text-xs bg-white" />
            <input type="date" value={notedByDate} onChange={e => setNotedByDate(e.target.value)} disabled={readOnly || status === 'submitted'} className="w-full px-2 py-1 border border-gray-200 rounded text-xs bg-white" />
          </div>
        </div>
      </div>

      {/* Print Preview Modal */}
      {showPrint && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-start justify-center overflow-y-auto py-8 px-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl">
            <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-white z-10">
              <h3 className="font-bold text-gray-900 text-sm">Print Preview — WFH Accomplishment Report</h3>
              <div className="flex gap-2">
                <button onClick={() => window.print()} className="flex items-center gap-1.5 px-4 py-2 bg-[#1E3A8A] text-white rounded-xl text-sm">
                  <Printer className="w-4 h-4" /> Print
                </button>
                <button onClick={() => setShowPrint(false)} className="p-2 hover:bg-gray-100 rounded-xl">
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            </div>

            <div className="p-8 text-xs font-serif leading-relaxed" id="print-area">
              <div className="mb-4">
                <img src="/header-pics/ctu-header.png" alt="CTU Header" className="w-full object-contain" />
              </div>

              <div className="text-center mb-5">
                <h1 className="font-bold text-sm uppercase">WORK-FROM-HOME (WFH) ACCOMPLISHMENT REPORT</h1>
                <p className="italic text-[11px]">(In Compliance with the CSC Work-from-Home Arrangement)</p>
              </div>

              <div className="grid grid-cols-2 gap-x-6 gap-y-1 mb-4 text-[11px]">
                <p><strong>Reporting Period:</strong> {reportingPeriod || '____________________'}</p>
                <p><strong>Program/Unit:</strong> {programUnit || '____________________'}</p>
                <p><strong>Name:</strong> {name || '____________________'}</p>
                <p><strong>Administrative Designation (if any):</strong> {adminDesignation || 'N/A'}</p>
                <p><strong>Position/Academic Rank:</strong> {positionRank || '____________________'}</p>
                <p><strong>Official Working Hours:</strong> {workingHours || '____________________'}</p>
                <p className="col-span-2"><strong>College/Office:</strong> {collegeOffice || '____________________'}</p>
              </div>

              {/* I. Daily Accomplishments */}
              <div className="mb-4">
                <p className="font-bold mb-1.5">I. DAILY ACCOMPLISHMENTS</p>
                <table className="w-full border-collapse border border-black text-[10.5px]">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border border-black px-2 py-1 text-left w-28">Date</th>
                      <th className="border border-black px-2 py-1 text-left">Activities Accomplished</th>
                      <th className="border border-black px-2 py-1 text-left">Output/Deliverable</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dailyAccomplishments.map((r, i) => (
                      <tr key={i}>
                        <td className="border border-black px-2 py-2 align-top">{r.date}</td>
                        <td className="border border-black px-2 py-2 align-top">{r.activities}</td>
                        <td className="border border-black px-2 py-2 align-top">{r.output}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* II. Supporting Documents Attached */}
              <div className="mb-4">
                <p className="font-bold mb-1">II. SUPPORTING DOCUMENTS ATTACHED</p>
                <p className="italic text-[10px] mb-2">(Check all applicable.)</p>
                <div className="grid grid-cols-2 gap-y-1 text-[10.5px]">
                  {SUPPORTING_DOC_OPTIONS.map(d => (
                    <div key={d.key} className="flex items-center gap-1.5">
                      <span>{supportingDocs[d.key] ? '☒' : '☐'}</span>
                      <span>{d.label}</span>
                    </div>
                  ))}
                  <div className="col-span-2 flex items-center gap-1.5 mt-1">
                    <span>{supportingDocs.other ? '☒' : '☐'}</span>
                    <span>Other: <u>&nbsp;{otherDocsSpecify || '___________________________'}&nbsp;</u></span>
                  </div>
                </div>
              </div>

              {/* Photos in print */}
              {photos.length > 0 && (
                <div className="my-6 break-before-auto">
                  <p className="font-bold mb-3">ATTACHMENTS / EVIDENCES</p>
                  <div className="space-y-4">
                    {photos.map((p, i) => (
                      <div key={i} className="border border-black p-2 flex flex-col items-center">
                        <img src={p.url} alt={`Evidence ${i + 1}`} className="max-h-72 object-contain" />
                        {p.caption && <p className="text-[10px] mt-1 font-sans">{p.caption}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Certification */}
              <div className="mt-6">
                <p className="font-bold mb-1">CERTIFICATION</p>
                <p className="text-justify text-[10.5px] leading-relaxed mb-8">
                  I hereby certify that the foregoing information is true and correct and that I performed my official duties during the approved Work-from-Home arrangement in accordance with the Civil Service Commission guidelines and the policies of Cebu Technological University.
                </p>

                <div className="grid grid-cols-3 gap-6 text-center text-[10.5px]">
                  <div>
                    <p className="text-left font-semibold mb-8">Prepared by:</p>
                    <div className="border-b border-black mx-auto mb-1" />
                    <p className="font-bold uppercase">{preparedByName || '____________________'}</p>
                    <p className="text-[9.5px]">Faculty Member</p>
                    <p className="text-[9.5px] mt-1">Date: {preparedByDate || '____________'}</p>
                  </div>

                  <div>
                    <p className="text-left font-semibold mb-8">Verified by:</p>
                    <div className="border-b border-black mx-auto mb-1" />
                    <p className="font-bold uppercase">{verifiedByName || '____________________'}</p>
                    <p className="text-[9.5px]">{verifiedByTitle}</p>
                    <p className="text-[9.5px] mt-1">Date: {verifiedByDate || '____________'}</p>
                  </div>

                  <div>
                    <p className="text-left font-semibold mb-8">Noted by:</p>
                    <div className="border-b border-black mx-auto mb-1" />
                    <p className="font-bold uppercase">{notedByName || '____________________'}</p>
                    <p className="text-[9.5px]">{notedByTitle}</p>
                    <p className="text-[9.5px] mt-1">Date: {notedByDate || '____________'}</p>
                  </div>
                </div>
              </div>

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