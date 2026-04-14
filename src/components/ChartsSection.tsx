import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend } from 'recharts';

const facultyPerformanceData = [
  { department: 'Engineering', score: 87 },
  { department: 'Science', score: 92 },
  { department: 'Arts', score: 78 },
  { department: 'Business', score: 85 },
  { department: 'Medicine', score: 94 },
];

const alumniEmploymentData = [
  { name: 'Employed', value: 68, color: '#22C55E' },
  { name: 'Self-Employed', value: 15, color: '#60A5FA' },
  { name: 'Further Studies', value: 12, color: '#F59E0B' },
  { name: 'Unemployed', value: 5, color: '#EF4444' },
];

const evaluationTrendsData = [
  { month: 'Aug', score: 78 },
  { month: 'Sep', score: 82 },
  { month: 'Oct', score: 79 },
  { month: 'Nov', score: 85 },
  { month: 'Dec', score: 88 },
  { month: 'Jan', score: 91 },
];

export function ChartsSection() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 mb-6">
      {/* Faculty Performance Bar Chart */}
      <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Faculty Performance</h3>
          <p className="text-sm text-gray-500">Average scores by department</p>
        </div>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={facultyPerformanceData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
            <XAxis 
              dataKey="department" 
              tick={{ fontSize: 12, fill: '#6B7280' }}
              angle={-15}
              textAnchor="end"
              height={60}
            />
            <YAxis tick={{ fontSize: 12, fill: '#6B7280' }} />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'white', 
                border: '1px solid #E5E7EB',
                borderRadius: '8px',
                fontSize: '14px'
              }}
            />
            <Bar dataKey="score" fill="#2563EB" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Alumni Employment Pie Chart */}
      <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Alumni Employment</h3>
          <p className="text-sm text-gray-500">Status distribution</p>
        </div>
        <ResponsiveContainer width="100%" height={250}>
          <PieChart>
            <Pie
              data={alumniEmploymentData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {alumniEmploymentData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'white', 
                border: '1px solid #E5E7EB',
                borderRadius: '8px',
                fontSize: '14px'
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Evaluation Trends Line Chart */}
      <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100 lg:col-span-2 xl:col-span-1">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Evaluation Trends</h3>
          <p className="text-sm text-gray-500">6-month performance trend</p>
        </div>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={evaluationTrendsData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
            <XAxis 
              dataKey="month" 
              tick={{ fontSize: 12, fill: '#6B7280' }}
            />
            <YAxis tick={{ fontSize: 12, fill: '#6B7280' }} domain={[70, 95]} />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'white', 
                border: '1px solid #E5E7EB',
                borderRadius: '8px',
                fontSize: '14px'
              }}
            />
            <Line 
              type="monotone" 
              dataKey="score" 
              stroke="#2563EB" 
              strokeWidth={3}
              dot={{ fill: '#2563EB', r: 5 }}
              activeDot={{ r: 7 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
