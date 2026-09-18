// ─── Sidebar.tsx ─────────────────────────────────────────────────────────────
import type { LucideIcon } from 'lucide-react';
import { LogOut } from 'lucide-react';

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
  onLogout?: () => void;
  isOpen: boolean;       
  onClose: () => void;
}

export function Sidebar({ menuItems, activeItem, onItemClick, userRole: _userRole, onLogout, isOpen, onClose }: SidebarProps) {
  const handleLogout = () => {
    if (onLogout) {
      onLogout();
    } else {
      window.location.href = '/';
    }
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 lg:hidden backdrop-blur-sm"
          onClick={onClose}
        />
      )}

      <aside className={`
        fixed left-0 top-0 h-screen w-64 bg-white text-gray-600 z-40 flex flex-col overflow-hidden border-r border-gray-200/60
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0
      `}>

        {/* Header Section — Perfectly flush with the header height */}
        <div className="flex-shrink-0 px-6 border-b border-gray-200/60 bg-white flex items-center h-[73px]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center shadow-sm overflow-hidden flex-shrink-0 border border-blue-100">
              <img
                src="/COED LOGO.png"
                alt="COED Logo"
                className="w-7 h-7 object-contain"
              />
            </div>
            <div>
              <h1 className="font-extrabold text-xs text-blue-700 tracking-wider leading-tight">COED</h1>
              <p className="text-[10px] text-gray-400 font-semibold tracking-tight leading-tight">Information System</p>
            </div>
          </div>
        </div>

        {/* Navigation List with Clean Active State */}
        <nav className="flex-1 min-h-0 overflow-y-auto px-4 py-4 flex flex-col gap-1.5 scrollbar-thin">
          {menuItems.map((item) => {
            const isActive = activeItem === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onItemClick(item.id);
                  onClose();
                }}
                className={`
                  group relative w-full flex items-center gap-3 px-4 py-3 rounded-2xl
                  transition-all duration-200 text-left text-xs font-semibold
                  ${isActive
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20 font-bold'
                    : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                  }
                `}
              >
                <div className={`flex-shrink-0 transition-colors ${isActive ? 'text-white' : 'text-gray-400 group-hover:text-gray-700'}`}>
                  <item.icon className="w-4 h-4" />
                </div>
                <span className="flex-1 leading-tight">
                  {item.label}
                </span>
              </button>
            );
          })}
        </nav>

        {/* Bottom Logout Area */}
        <div className="flex-shrink-0 p-4 bg-white border-t border-gray-200/60">
          <button
            onClick={handleLogout}
            className="group w-full flex items-center gap-2.5 px-3.5 py-3 rounded-2xl text-gray-400 hover:text-red-600 hover:bg-red-50 transition-all text-xs font-semibold"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            <span>Log Out</span>
          </button>
        </div>

      </aside>
    </>
  );
}