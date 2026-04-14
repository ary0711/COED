import { useState } from 'react';
import { FileText, Send, Printer, CheckCircle, Download } from 'lucide-react';

export function ReportingSubmissionSystem() {
  const [selectedTemplate, setSelectedTemplate] = useState('quarterly');
  const [reportData, setReportData] = useState({
    quarter: 'Q4',
    year: '2025',
    accomplishments: '',
    challenges: '',
    recommendations: '',
  });

  const templates = [
    { id: 'quarterly', name: 'Quarterly Report', description: 'Standard quarterly performance report' },
    { id: 'research', name: 'Research Output', description: 'Research publication and activities' },
    { id: 'extension', name: 'Extension Activity', description: 'Community extension report' },
    { id: 'annual', name: 'Annual Report', description: 'Comprehensive annual summary' },
  ];

  const handleSubmit = () => {
    alert('Report submitted successfully to the Dean!');
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">Reporting & Submission System</h2>
        <p className="text-gray-600">Input reports directly with auto-formatted templates</p>
      </div>

      {/* Template Selection */}
      <div className="bg-white rounded-xl shadow-md p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Select Report Template</h3>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {templates.map((template) => (
            <button
              key={template.id}
              onClick={() => setSelectedTemplate(template.id)}
              className={`p-4 rounded-lg border-2 transition-all text-left ${
                selectedTemplate === template.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-blue-300'
              }`}
            >
              <FileText className={`w-6 h-6 mb-2 ${
                selectedTemplate === template.id ? 'text-blue-600' : 'text-gray-400'
              }`} />
              <div className="font-semibold text-gray-900 mb-1">{template.name}</div>
              <div className="text-xs text-gray-600">{template.description}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Report Form */}
      <div className="bg-white rounded-xl shadow-md p-6 mb-6">
        <div className="border-b border-gray-200 pb-4 mb-6">
          <h3 className="text-xl font-semibold text-gray-900">Faculty Quarterly Report</h3>
          <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
            <span>Template: <strong>{templates.find(t => t.id === selectedTemplate)?.name}</strong></span>
            <span>•</span>
            <span>Faculty: <strong>Prof. Sarah Johnson</strong></span>
          </div>
        </div>

        <div className="space-y-6">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Quarter</label>
              <select
                value={reportData.quarter}
                onChange={(e) => setReportData({ ...reportData, quarter: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Q1">Q1 - First Quarter</option>
                <option value="Q2">Q2 - Second Quarter</option>
                <option value="Q3">Q3 - Third Quarter</option>
                <option value="Q4">Q4 - Fourth Quarter</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Academic Year</label>
              <select
                value={reportData.year}
                onChange={(e) => setReportData({ ...reportData, year: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="2025">2025-2026</option>
                <option value="2024">2024-2025</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              I. Major Accomplishments
            </label>
            <textarea
              value={reportData.accomplishments}
              onChange={(e) => setReportData({ ...reportData, accomplishments: e.target.value })}
              rows={5}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              placeholder="List your major accomplishments for this quarter..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              II. Challenges Encountered
            </label>
            <textarea
              value={reportData.challenges}
              onChange={(e) => setReportData({ ...reportData, challenges: e.target.value })}
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              placeholder="Describe any challenges or issues faced..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              III. Recommendations
            </label>
            <textarea
              value={reportData.recommendations}
              onChange={(e) => setReportData({ ...reportData, recommendations: e.target.value })}
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              placeholder="Provide recommendations for improvement..."
            />
          </div>

          <div className="pt-4 border-t border-gray-200">
            <div className="flex flex-wrap gap-3">
              <button
                onClick={handleSubmit}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 font-semibold"
              >
                <Send className="w-5 h-5" />
                Submit to Dean
              </button>
              <button
                onClick={handlePrint}
                className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 font-semibold"
              >
                <Printer className="w-5 h-5" />
                Print Report
              </button>
              <button className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors flex items-center gap-2 font-semibold">
                <Download className="w-5 h-5" />
                Save as PDF
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Submission History */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Submissions</h3>
        <div className="space-y-3">
          {[
            { quarter: 'Q3 2025', date: 'Dec 15, 2025', status: 'Approved' },
            { quarter: 'Q2 2025', date: 'Sep 20, 2025', status: 'Approved' },
            { quarter: 'Q1 2025', date: 'Jun 18, 2025', status: 'Approved' },
          ].map((submission, index) => (
            <div key={index} className="p-4 bg-gray-50 rounded-lg flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-blue-600" />
                <div>
                  <div className="font-medium text-gray-900">Quarterly Report - {submission.quarter}</div>
                  <div className="text-sm text-gray-600">Submitted: {submission.date}</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium flex items-center gap-1">
                  <CheckCircle className="w-4 h-4" />
                  {submission.status}
                </span>
                <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                  View
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Info Box */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-gray-700">
            <p className="font-semibold text-gray-900 mb-1">Auto-Formatted Templates</p>
            <p>
              All reports are automatically formatted according to official templates. Simply fill in the content and submit.
              Your report will be sent directly to the Dean's dashboard for review.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
