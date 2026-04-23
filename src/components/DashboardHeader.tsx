import { Bell, Settings } from 'lucide-react';

interface DashboardHeaderProps {
  userRole: string;
  userName: string;
}

export function DashboardHeader({ userRole, userName }: DashboardHeaderProps) {
  return (
    <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-gray-200/50 shadow-sm">
      <div className="px-8 py-4">
        <div className="flex items-center justify-between">
          
          {/* Left side - User info */}
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#1E3A8A] to-[#2563EB] flex items-center justify-center text-white font-bold text-lg shadow-lg">
                {userName.split(' ').map(n => n[0]).join('').slice(0, 2)}
              </div>
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">{userName}</h2>
              <div className="flex items-center gap-2">
                <span className="px-3 py-0.5 rounded-full text-xs font-semibold bg-gradient-to-r from-blue-100 to-purple-100 text-blue-700">
                  {userRole}
                </span>
              </div>
            </div>
          </div>

          {/* Right side - Actions */}
          <div className="flex items-center gap-3">
            <button className="relative p-3 rounded-xl hover:bg-gray-100 transition-all duration-300 group">
              <Bell className="w-5 h-5 text-gray-600 group-hover:text-blue-600 transition-colors" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>
            
            <button className="p-3 rounded-xl hover:bg-gray-100 transition-all duration-300 group">
              <Settings className="w-5 h-5 text-gray-600 group-hover:text-blue-600 transition-colors" />
            </button>

            {/* Removed Switch Role Button */}
          </div>
        </div>
      </div>
    </div>
  );
}