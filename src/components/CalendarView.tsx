import { useState } from 'react';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';

interface CalendarEvent {
  id: string;
  title: string;
  date: number;
  type: 'meeting' | 'seminar' | 'deadline' | 'event';
}

const calendarEvents: CalendarEvent[] = [
  { id: '1', title: 'Faculty Meeting', date: 5, type: 'meeting' },
  { id: '2', title: 'Research Seminar', date: 12, type: 'seminar' },
  { id: '3', title: 'Report Deadline', date: 15, type: 'deadline' },
  { id: '4', title: 'Department Event', date: 22, type: 'event' },
  { id: '5', title: 'Evaluation Period', date: 28, type: 'deadline' },
];

export function CalendarView() {
  const [currentDate] = useState(new Date(2026, 1)); // February 2026
  const [showAddModal, setShowAddModal] = useState(false);

  const monthName = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });
  
  // Get first day of month and number of days
  const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  
  const days = Array.from({ length: 42 }, (_, i) => {
    const dayNumber = i - firstDay + 1;
    return dayNumber > 0 && dayNumber <= daysInMonth ? dayNumber : null;
  });

  const getEventColor = (type: string) => {
    switch (type) {
      case 'meeting':
        return 'bg-blue-500';
      case 'seminar':
        return 'bg-green-500';
      case 'deadline':
        return 'bg-red-500';
      case 'event':
        return 'bg-purple-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getEventsForDay = (day: number) => {
    return calendarEvents.filter(event => event.date === day);
  };

  return (
    <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
      {/* Calendar Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Department Calendar</h3>
          <p className="text-sm text-gray-500">{monthName}</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="p-2 hover:bg-[#F1F5F9] rounded-lg transition-colors">
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </button>
          <button className="p-2 hover:bg-[#F1F5F9] rounded-lg transition-colors">
            <ChevronRight className="w-5 h-5 text-gray-600" />
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="ml-2 px-4 py-2 bg-[#2563EB] text-white rounded-lg hover:bg-[#1E3A8A] transition-colors flex items-center gap-2 text-sm"
          >
            <Plus className="w-4 h-4" />
            Add Event
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-2">
        {/* Day headers */}
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
          <div key={day} className="text-center text-sm font-semibold text-gray-600 py-2">
            {day}
          </div>
        ))}

        {/* Calendar days */}
        {days.map((day, index) => {
          const events = day ? getEventsForDay(day) : [];
          const isToday = day === 12; // Mock today as 12th
          
          return (
            <div
              key={index}
              className={`min-h-[80px] p-2 border border-gray-100 rounded-lg ${
                day ? 'bg-white hover:bg-[#F8FAFC] cursor-pointer' : 'bg-gray-50'
              } ${isToday ? 'ring-2 ring-[#2563EB]' : ''} transition-colors`}
            >
              {day && (
                <>
                  <div className={`text-sm font-medium mb-1 ${isToday ? 'text-[#2563EB]' : 'text-gray-900'}`}>
                    {day}
                  </div>
                  <div className="space-y-1">
                    {events.map((event) => (
                      <div
                        key={event.id}
                        className={`text-xs ${getEventColor(event.type)} text-white px-1 py-0.5 rounded truncate`}
                        title={event.title}
                      >
                        {event.title}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>

      {/* Event Legend */}
      <div className="flex items-center gap-4 mt-6 pt-4 border-t border-gray-100">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-blue-500 rounded"></div>
          <span className="text-xs text-gray-600">Meeting</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-green-500 rounded"></div>
          <span className="text-xs text-gray-600">Seminar</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-red-500 rounded"></div>
          <span className="text-xs text-gray-600">Deadline</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-purple-500 rounded"></div>
          <span className="text-xs text-gray-600">Event</span>
        </div>
      </div>

      {/* Add Event Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Add Activity</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Activity Title
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2563EB] focus:border-transparent"
                  placeholder="Enter activity title"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date
                </label>
                <input
                  type="date"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2563EB] focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Type
                </label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2563EB] focus:border-transparent">
                  <option>Meeting</option>
                  <option>Seminar</option>
                  <option>Deadline</option>
                  <option>Event</option>
                </select>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-[#2563EB] text-white rounded-lg hover:bg-[#1E3A8A] transition-colors"
                >
                  Add Activity
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
