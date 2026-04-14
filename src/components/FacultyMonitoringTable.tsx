import { CheckCircle, Clock, AlertTriangle } from 'lucide-react';

interface FacultyMember {
  id: string;
  name: string;
  status: 'submitted' | 'pending' | 'overdue';
  lastSubmission: string;
  email: string;
}

const facultyData: FacultyMember[] = [
  {
    id: '1',
    name: 'Dr. Maria Santos',
    status: 'submitted',
    lastSubmission: 'Feb 10, 2026',
    email: 'maria.santos@university.edu'
  },
  {
    id: '2',
    name: 'Prof. John Rodriguez',
    status: 'submitted',
    lastSubmission: 'Feb 11, 2026',
    email: 'john.rodriguez@university.edu'
  },
  {
    id: '3',
    name: 'Dr. Lisa Chen',
    status: 'pending',
    lastSubmission: 'Jan 15, 2026',
    email: 'lisa.chen@university.edu'
  },
  {
    id: '4',
    name: 'Prof. Michael Brown',
    status: 'submitted',
    lastSubmission: 'Feb 09, 2026',
    email: 'michael.brown@university.edu'
  },
  {
    id: '5',
    name: 'Dr. Sarah Johnson',
    status: 'pending',
    lastSubmission: 'Jan 20, 2026',
    email: 'sarah.johnson@university.edu'
  },
  {
    id: '6',
    name: 'Prof. David Martinez',
    status: 'overdue',
    lastSubmission: 'Dec 28, 2025',
    email: 'david.martinez@university.edu'
  },
  {
    id: '7',
    name: 'Dr. Emily Wilson',
    status: 'submitted',
    lastSubmission: 'Feb 12, 2026',
    email: 'emily.wilson@university.edu'
  },
  {
    id: '8',
    name: 'Prof. Robert Taylor',
    status: 'pending',
    lastSubmission: 'Jan 25, 2026',
    email: 'robert.taylor@university.edu'
  }
];

export function FacultyMonitoringTable() {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'submitted':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
            <CheckCircle className="w-3 h-3" />
            Submitted
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium">
            <Clock className="w-3 h-3" />
            Pending
          </span>
        );
      case 'overdue':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">
            <AlertTriangle className="w-3 h-3" />
            Overdue
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Faculty Monitoring</h3>
            <p className="text-sm text-gray-500">Report submission status</p>
          </div>
          <button className="px-4 py-2 bg-[#2563EB] text-white rounded-lg hover:bg-[#1E3A8A] transition-colors text-sm">
            Send Reminder
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-[#F8FAFC]">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Faculty Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Email
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Last Submission
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {facultyData.map((faculty) => (
              <tr key={faculty.id} className="hover:bg-[#F8FAFC] transition-colors">
                <td className="px-6 py-4">
                  <div className="font-medium text-gray-900 text-sm">{faculty.name}</div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-600">{faculty.email}</div>
                </td>
                <td className="px-6 py-4">
                  {getStatusBadge(faculty.status)}
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-600">{faculty.lastSubmission}</div>
                </td>
                <td className="px-6 py-4">
                  <button className="text-[#2563EB] hover:text-[#1E3A8A] text-sm font-medium transition-colors">
                    View Details
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Summary Footer */}
      <div className="px-6 py-4 bg-[#F8FAFC] border-t border-gray-100">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-gray-600">Submitted: <span className="font-medium text-gray-900">4</span></span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
              <span className="text-gray-600">Pending: <span className="font-medium text-gray-900">3</span></span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <span className="text-gray-600">Overdue: <span className="font-medium text-gray-900">1</span></span>
            </div>
          </div>
          <span className="text-gray-500">Total Faculty: <span className="font-medium text-gray-900">8</span></span>
        </div>
      </div>
    </div>
  );
}
