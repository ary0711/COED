import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  GraduationCap,
  Users,
  Search,
  RefreshCw,
  Mail,
  Building2,
  Calendar,
  X,
  User,
  ShieldCheck,
  Award,
} from 'lucide-react';

export interface FacultyMemberProfile {
  id: string;
  full_name: string;
  email: string;
  role: string;
  id_number?: string;
  department?: string | null;
  program?: string | null;
  status?: string;
  created_at?: string;
  position?: string;
  phone?: string;
  contact_no?: string;
  specialization?: string;
}

export function FacultyStaffManagement() {
  const [facultyList, setFacultyList] = useState<FacultyMemberProfile[]>([]);
  const [chairList, setChairList] = useState<FacultyMemberProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedFaculty, setSelectedFaculty] = useState<FacultyMemberProfile | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:5000/api/auth/faculty');
      const result = await res.json();
      const allPersonnel: FacultyMemberProfile[] =
        result.success && Array.isArray(result.data) ? result.data : [];

      const chairs: FacultyMemberProfile[] = [];
      const faculties: FacultyMemberProfile[] = [];

      allPersonnel.forEach((person) => {
        const role = (person.role || '').toLowerCase();
        const pos = (person.position || '').toLowerCase();

        const isLeadership =
          role === 'department_chair' ||
          role === 'dept_chair' ||
          role === 'dean' ||
          role === 'college_dean' ||
          pos.includes('chair') ||
          pos.includes('dean') ||
          pos.includes('head');

        if (isLeadership) {
          chairs.push(person);
        } else {
          faculties.push(person);
        }
      });

      setChairList(chairs);
      setFacultyList(faculties);
    } catch (err) {
      console.error('Failed to load faculty from backend:', err);
      setChairList([]);
      setFacultyList([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filterPerson = (person: FacultyMemberProfile) => {
    if (!search.trim()) return true;
    const searchText = search.toLowerCase().trim();
    return (
      (person.full_name ?? '').toLowerCase().includes(searchText) ||
      (person.email ?? '').toLowerCase().includes(searchText) ||
      (person.id_number ?? '').toLowerCase().includes(searchText) ||
      (person.department ?? '').toLowerCase().includes(searchText) ||
      (person.program ?? '').toLowerCase().includes(searchText) ||
      (person.position ?? '').toLowerCase().includes(searchText)
    );
  };

  const filteredChairs = chairList.filter(filterPerson);
  const filteredFaculty = facultyList.filter(filterPerson);

  const formatDate = (isoString?: string) => {
    if (!isoString) return '—';
    return new Date(isoString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const renderList = (
    list: FacultyMemberProfile[],
    type: 'chair' | 'faculty',
    emptyMessage: string
  ) => {
    const isChair = type === 'chair';
    const accent = isChair ? '#D97706' : '#2563EB';
    const accentBg = isChair ? '#FEF3C7' : '#DBEAFE';

    if (loading) {
      return (
        <div className="flex flex-col items-center justify-center h-48 text-gray-400">
          <div
            className={`w-7 h-7 border-2 border-gray-200 rounded-full animate-spin mb-3 ${
              isChair ? 'border-t-amber-600' : 'border-t-blue-600'
            }`}
          />
          <p className="text-sm">Loading {isChair ? 'chairs' : 'faculty'}...</p>
        </div>
      );
    }

    if (list.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center h-48 text-gray-300">
          <Users className="w-10 h-10 mb-2 opacity-40" />
          <p className="text-sm text-gray-400">
            {search ? `No ${type} found matching "${search}"` : emptyMessage}
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-3 overflow-y-auto max-h-[600px] pr-2">
        {list.map((person) => {
          const name = person.full_name || 'Unnamed Personnel';
          const deptOrRole =
            person.department ||
            person.program ||
            (isChair ? 'Department Chair' : 'Faculty Member');
          const initial = name.charAt(0).toUpperCase();

          return (
            <div
              key={person.id}
              onClick={() => setSelectedFaculty(person)}
              className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:border-gray-300 hover:bg-gray-50/80 transition-all shadow-xs cursor-pointer group"
            >
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0 group-hover:scale-105 transition-transform"
                style={{ background: accentBg, color: accent }}
              >
                {initial}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-gray-900 text-sm truncate group-hover:text-[#1E3A8A] transition-colors">
                  {name}
                </p>
                <p className="text-xs font-medium text-gray-600 truncate">{deptOrRole}</p>
                {person.id_number && (
                  <p className="text-[11px] text-gray-400 truncate mt-0.5">
                    ID: <span className="font-mono">{person.id_number}</span>
                  </p>
                )}
                {person.email && (
                  <p className="text-[11px] text-gray-400 truncate">{person.email}</p>
                )}
              </div>
              <span
                className="flex-shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize"
                style={{ backgroundColor: accentBg, color: accent }}
              >
                {isChair ? 'Chair / Dean' : 'Faculty'}
              </span>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full space-y-6">
      {/* Header & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-3xl font-semibold text-gray-900">
            Faculty & Department Chairs
          </h1>
          <p className="text-sm text-gray-500 mt-1">
           
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name, ID, email, dept..."
              className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A8A] bg-white shadow-xs"
            />
          </div>
          <button
            onClick={loadData}
            className="p-2.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors bg-white shadow-xs"
            title="Refresh List"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Main Side-by-Side Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 min-h-0">
        {/* Left Column: Department Chairs & Deans */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-amber-50/40">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-amber-100 text-amber-800 rounded-lg">
                <Award className="w-4 h-4" />
              </div>
              <h2 className="text-base font-bold text-gray-900">Program Chairman</h2>
            </div>
          </div>
          <div className="p-4 sm:p-5 flex-1 overflow-hidden">
            {renderList(
              filteredChairs,
              'chair',
              'No department chairs or deans returned by backend'
            )}
          </div>
        </div>

        {/* Right Column: Faculty Members */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-blue-50/40">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-blue-100 text-[#1E3A8A] rounded-lg">
                <GraduationCap className="w-4 h-4" />
              </div>
              <h2 className="text-base font-bold text-gray-900">Faculty Members</h2>
            </div>
            <span className="text-xs font-bold px-2.5 py-1 bg-blue-100 text-[#1E3A8A] rounded-full">
              {filteredFaculty.length} {filteredFaculty.length === 1 ? 'Member' : 'Members'}
            </span>
          </div>
          <div className="p-4 sm:p-5 flex-1 overflow-hidden">
            {renderList(
              filteredFaculty,
              'faculty',
              'No faculty members returned by backend'
            )}
          </div>
        </div>
      </div>

      {/* Modal Popup for Details */}
      {selectedFaculty && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg border border-gray-100 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="relative p-6 bg-gradient-to-r from-blue-900 to-[#1E3A8A] text-white">
              <button
                onClick={() => setSelectedFaculty(null)}
                className="absolute top-4 right-4 p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center text-2xl font-bold text-white border border-white/20 shadow-inner flex-shrink-0">
                  {(selectedFaculty.full_name || 'U').charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 pr-8">
                  <h3 className="text-lg sm:text-xl font-bold truncate">
                    {selectedFaculty.full_name}
                  </h3>
                  <p className="text-xs sm:text-sm text-blue-200 truncate mt-0.5">
                    {selectedFaculty.position || selectedFaculty.role || 'Personnel'}
                  </p>
                  <span className="inline-block mt-2 px-2.5 py-0.5 text-[10px] font-bold rounded-full uppercase bg-emerald-400/20 text-emerald-200 border border-emerald-400/30">
                    {selectedFaculty.status || 'Active'}
                  </span>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto">
              <div>
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2.5">
                  Academic Information
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                    <div className="flex items-center gap-2 text-gray-400 text-xs mb-1">
                      <Building2 className="w-3.5 h-3.5" /> Department / Program
                    </div>
                    <p className="text-xs sm:text-sm font-semibold text-gray-900 truncate">
                      {selectedFaculty.department || selectedFaculty.program || 'Not assigned'}
                    </p>
                  </div>

                  <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                    <div className="flex items-center gap-2 text-gray-400 text-xs mb-1">
                      <ShieldCheck className="w-3.5 h-3.5" /> Personnel ID
                    </div>
                    <p className="text-xs sm:text-sm font-mono font-semibold text-gray-900 truncate">
                      {selectedFaculty.id_number || '—'}
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2.5">
                  Contact Information
                </h4>
                <div className="space-y-2">
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                    <Mail className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-[11px] text-gray-400">Email Address</p>
                      <p className="text-xs sm:text-sm font-medium text-gray-900 truncate">
                        {selectedFaculty.email || '—'}
                      </p>
                    </div>
                  </div>

                  {(selectedFaculty.phone || selectedFaculty.contact_no) && (
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                      <User className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="text-[11px] text-gray-400">Contact Number</p>
                        <p className="text-xs sm:text-sm font-medium text-gray-900 truncate">
                          {selectedFaculty.phone || selectedFaculty.contact_no}
                        </p>
                      </div>
                    </div>
                  )}

                  {selectedFaculty.created_at && (
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                      <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="text-[11px] text-gray-400">Date Registered</p>
                        <p className="text-xs sm:text-sm font-medium text-gray-900 truncate">
                          {formatDate(selectedFaculty.created_at)}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {selectedFaculty.specialization && (
                <div>
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                    Field of Specialization
                  </h4>
                  <p className="text-xs sm:text-sm text-gray-700 bg-gray-50 p-3 rounded-xl border border-gray-100">
                    {selectedFaculty.specialization}
                  </p>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-gray-100 bg-gray-50/50 flex justify-end">
              
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

export default FacultyStaffManagement;