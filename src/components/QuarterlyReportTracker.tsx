import { FileText, AlertCircle, Clock, Mail } from 'lucide-react';
import { useState } from 'react';

interface Teacher {
  id: string;
  name: string;
  department: string;
  email: string;
  daysOverdue: number;
  lastReminder: string;
}

export function QuarterlyReportTracker() {
  const [selectedQuarter, setSelectedQuarter] = useState('Q4 2025');
  
  // Mock data for teachers who haven't submitted reports
  const pendingTeachers: Teacher[] = [
    {
      id: '1',
      name: 'Prof. James Wilson',
      department: 'Computer Science',
      email: 'j.wilson@university.edu',
      daysOverdue: 12,
      lastReminder: '2 days ago'
    },
    {
      id: '2',
      name: 'Dr. Sarah Chen',
      department: 'Mathematics',
      email: 's.chen@university.edu',
      daysOverdue: 8,
      lastReminder: '5 days ago'
    },
    {
      id: '3',
      name: 'Prof. Michael Rodriguez',
      department: 'Engineering',
      email: 'm.rodriguez@university.edu',
      daysOverdue: 15,
      lastReminder: '1 day ago'
    },
    {
      id: '4',
      name: 'Dr. Emily Thompson',
      department: 'Biology',
      email: 'e.thompson@university.edu',
      daysOverdue: 5,
      lastReminder: '3 days ago'
    },
    {
      id: '5',
      name: 'Prof. David Park',
      department: 'Physics',
      email: 'd.park@university.edu',
      daysOverdue: 20,
      lastReminder: '1 week ago'
    },
    {
      id: '6',
      name: 'Dr. Lisa Anderson',
      department: 'Chemistry',
      email: 'l.anderson@university.edu',
      daysOverdue: 3,
      lastReminder: '4 days ago'
    },
    {
      id: '7',
      name: 'Prof. Robert Kim',
      department: 'Business Administration',
      email: 'r.kim@university.edu',
      daysOverdue: 18,
      lastReminder: '2 days ago'
    },
    {
      id: '8',
      name: 'Dr. Jennifer Lee',
      department: 'Psychology',
      email: 'j.lee@university.edu',
      daysOverdue: 7,
      lastReminder: '6 days ago'
    }
  ];

  const handleSendReminder = (teacherId: string, teacherName: string) => {
    alert(`Reminder sent to ${teacherName}`);
  };

  const handleSendBulkReminder = () => {
    alert(`Bulk reminder sent to ${pendingTeachers.length} teachers`);
  };

  const getOverdueColor = (days: number) => {
    if (days >= 15) return 'text-red-600 bg-red-100';
    if (days >= 7) return 'text-orange-600 bg-orange-100';
    return 'text-yellow-600 bg-yellow-100';
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-red-100 rounded-lg">
            <AlertCircle className="w-6 h-6 text-red-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Quarterly Report Tracking
            </h2>
            <p className="text-sm text-gray-600">
              Teachers pending submission: <span className="font-semibold text-red-600">{pendingTeachers.length}</span>
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <select
            value={selectedQuarter}
            onChange={(e) => setSelectedQuarter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-sm"
          >
            <option>Q1 2026</option>
            <option>Q4 2025</option>
            <option>Q3 2025</option>
            <option>Q2 2025</option>
          </select>
          
          <button
            onClick={handleSendBulkReminder}
            className="px-4 py-2 bg-[#2563EB] text-white rounded-lg hover:bg-[#1E40AF] transition-colors text-sm font-medium flex items-center gap-2"
          >
            <Mail className="w-4 h-4" />
            Send Bulk Reminder
          </button>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-red-700 font-medium">Critical (15+ days)</p>
              <p className="text-2xl font-semibold text-red-800 mt-1">
                {pendingTeachers.filter(t => t.daysOverdue >= 15).length}
              </p>
            </div>
            <FileText className="w-8 h-8 text-red-600 opacity-50" />
          </div>
        </div>
        
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-orange-700 font-medium">Warning (7-14 days)</p>
              <p className="text-2xl font-semibold text-orange-800 mt-1">
                {pendingTeachers.filter(t => t.daysOverdue >= 7 && t.daysOverdue < 15).length}
              </p>
            </div>
            <Clock className="w-8 h-8 text-orange-600 opacity-50" />
          </div>
        </div>
        
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-yellow-700 font-medium">Recent (&lt;7 days)</p>
              <p className="text-2xl font-semibold text-yellow-800 mt-1">
                {pendingTeachers.filter(t => t.daysOverdue < 7).length}
              </p>
            </div>
            <AlertCircle className="w-8 h-8 text-yellow-600 opacity-50" />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Teacher Name</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Department</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Email</th>
              <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">Days Overdue</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Last Reminder</th>
              <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">Action</th>
            </tr>
          </thead>
          <tbody>
            {pendingTeachers.map((teacher) => (
              <tr
                key={teacher.id}
                className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
              >
                <td className="py-4 px-4">
                  <div className="font-medium text-gray-900">{teacher.name}</div>
                </td>
                <td className="py-4 px-4 text-gray-700">{teacher.department}</td>
                <td className="py-4 px-4 text-gray-600 text-sm">{teacher.email}</td>
                <td className="py-4 px-4 text-center">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getOverdueColor(teacher.daysOverdue)}`}>
                    {teacher.daysOverdue} days
                  </span>
                </td>
                <td className="py-4 px-4 text-gray-600 text-sm">{teacher.lastReminder}</td>
                <td className="py-4 px-4 text-center">
                  <button
                    onClick={() => handleSendReminder(teacher.id, teacher.name)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm font-medium"
                  >
                    <Mail className="w-3.5 h-3.5" />
                    Remind
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer Note */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <p className="text-sm text-gray-600 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-gray-500" />
          Deadline for {selectedQuarter} quarterly reports was February 1, 2026. Automatic reminders are sent every 3 days.
        </p>
      </div>
    </div>
  );
}
