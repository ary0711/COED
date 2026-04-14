import { useState } from 'react';
import { Upload, Download, CheckCircle, AlertCircle, Printer } from 'lucide-react';

export function AutomatedDeansList() {
  const [uploadStep, setUploadStep] = useState<'upload' | 'processing' | 'complete'>('upload');
  const [generatedList, setGeneratedList] = useState<any[]>([]);

  const handleFileUpload = () => {
    setUploadStep('processing');
    // Simulate processing
    setTimeout(() => {
      setGeneratedList([
        { id: 1, studentId: '2021-0045', name: 'Maria Santos', program: 'BEEd', year: '3rd Year', gpa: 3.89, semester: 'First Semester 2025-2026' },
        { id: 2, studentId: '2021-0123', name: 'John Cruz', program: 'BSEd-Math', year: '3rd Year', gpa: 3.92, semester: 'First Semester 2025-2026' },
        { id: 3, studentId: '2021-0234', name: 'Ana Reyes', program: 'BSEd-English', year: '2nd Year', gpa: 3.85, semester: 'First Semester 2025-2026' },
        { id: 4, studentId: '2021-0345', name: 'Rafael Lopez', program: 'BSNEd', year: '4th Year', gpa: 3.95, semester: 'First Semester 2025-2026' },
      ]);
      setUploadStep('complete');
    }, 2000);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">Automated Dean's List Generator</h2>
          <p className="text-sm text-gray-600 mt-1">Upload final grades and automatically generate the Dean's List</p>
        </div>
      </div>

      {uploadStep === 'upload' && (
        <div className="bg-white rounded-xl shadow-md p-8 text-center">
          <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Upload className="w-12 h-12 text-blue-600" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Upload Final Grades</h3>
          <p className="text-gray-600 mb-6">Upload grade sheets in CSV or Excel format</p>
          
          <div className="max-w-md mx-auto">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 mb-4 hover:border-blue-500 transition-colors cursor-pointer">
              <input type="file" className="hidden" id="grade-upload" accept=".csv,.xlsx,.xls" />
              <label htmlFor="grade-upload" className="cursor-pointer">
                <div className="text-center">
                  <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">Click to upload or drag and drop</p>
                  <p className="text-xs text-gray-500 mt-1">CSV, XLSX (Max 10MB)</p>
                </div>
              </label>
            </div>
            <button
              onClick={handleFileUpload}
              className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
            >
              Process Grades & Generate List
            </button>
          </div>

          <div className="mt-6 p-4 bg-blue-50 rounded-lg max-w-md mx-auto">
            <p className="text-sm text-gray-700 flex items-start gap-2">
              <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <span>System automatically calculates GPA and identifies students with 3.5 or higher for Dean's List</span>
            </p>
          </div>
        </div>
      )}

      {uploadStep === 'processing' && (
        <div className="bg-white rounded-xl shadow-md p-8 text-center">
          <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
            <CheckCircle className="w-12 h-12 text-blue-600" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Processing Grades...</h3>
          <p className="text-gray-600">Please wait while we generate the Dean's List</p>
          <div className="max-w-md mx-auto mt-6">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-blue-600 h-2 rounded-full animate-pulse" style={{ width: '60%' }}></div>
            </div>
          </div>
        </div>
      )}

      {uploadStep === 'complete' && (
        <div>
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6 flex items-center gap-3">
            <CheckCircle className="w-6 h-6 text-green-600" />
            <div>
              <p className="font-semibold text-green-900">Dean's List Generated Successfully!</p>
              <p className="text-sm text-green-700">Found {generatedList.length} students eligible for Dean's List</p>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-gray-900">Dean's List - First Semester 2025-2026</h3>
              <div className="flex gap-2">
                <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2">
                  <Download className="w-4 h-4" />
                  Export PDF
                </button>
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2">
                  <Printer className="w-4 h-4" />
                  Print List
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Student ID</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Name</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Program</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Year Level</th>
                    <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">GPA</th>
                  </tr>
                </thead>
                <tbody>
                  {generatedList.map((student) => (
                    <tr key={student.id} className="border-t border-gray-200 hover:bg-gray-50">
                      <td className="py-3 px-4 font-medium text-gray-900">{student.studentId}</td>
                      <td className="py-3 px-4 text-gray-700">{student.name}</td>
                      <td className="py-3 px-4 text-gray-700">{student.program}</td>
                      <td className="py-3 px-4 text-gray-700">{student.year}</td>
                      <td className="py-3 px-4 text-center">
                        <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-bold">
                          {student.gpa}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <button
            onClick={() => setUploadStep('upload')}
            className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Generate New List
          </button>
        </div>
      )}
    </div>
  );
}
