import type { LucideIcon } from 'lucide-react';
import { ChevronRight, GraduationCap } from 'lucide-react';

interface MenuItem {
  icon: LucideIcon;
  label: string;
  id: string;
}

interface SidebarProps {
  menuItems: MenuItem[];
  activeItem: string;
  onItemClick: (id: string) => void;
  userRole: string;
}

export function Sidebar({ menuItems, activeItem, onItemClick, userRole }: SidebarProps) {
  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-gradient-to-b from-[#0F172A] via-[#1E293B] to-[#0F172A] text-white shadow-2xl z-50 overflow-y-auto">
      {/* Elegant header with logo */}
      <div className="p-6 border-b border-white/10">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#2563EB] to-[#60A5FA] flex items-center justify-center shadow-lg">
            <GraduationCap className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-lg tracking-tight">COED</h1>
            <p className="text-xs text-blue-200">Management System</p>
          </div>
        </div>
        <div className="px-3 py-2 rounded-lg bg-white/5 backdrop-blur-sm border border-white/10">
          <p className="text-xs font-medium text-blue-200">Current Role</p>
          <p className="text-sm font-semibold text-white truncate">{userRole}</p>
        </div>
      </div>

      {/* Navigation menu with unique styling */}
      <nav className="p-4 space-y-2 mb-8">
        {menuItems.map((item) => {
          const isActive = activeItem === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onItemClick(item.id)}
              className={`
                group relative w-full flex items-center gap-3 px-4 py-3.5 rounded-xl
                transition-all duration-300 text-left font-medium text-sm
                ${isActive
                  ? 'bg-gradient-to-r from-[#2563EB] to-[#3B82F6] text-white shadow-lg shadow-blue-500/30 scale-105'
                  : 'text-gray-300 hover:text-white hover:bg-white/5'
                }
              `}
            >
              {/* Active indicator */}
              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-white rounded-r-full"></div>
              )}
              
              {/* Icon with animation */}
              <div className={`
                p-2 rounded-lg transition-all duration-300
                ${isActive 
                  ? 'bg-white/20' 
                  : 'bg-white/5 group-hover:bg-white/10'
                }
              `}>
                <item.icon className={`w-5 h-5 transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`} />
              </div>
              
              {/* Label */}
              <span className="flex-1">{item.label}</span>
              
              {/* Arrow indicator */}
              <ChevronRight className={`w-4 h-4 transition-all duration-300 ${
                isActive ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0'
              }`} />
            </button>
          );
        })}
      </nav>
    </aside>
  );
}