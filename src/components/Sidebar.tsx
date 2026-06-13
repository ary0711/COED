import type { LucideIcon } from 'lucide-react';
import { ChevronRight, LogOut } from 'lucide-react';

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
  // Mobile support — optional so other roles are unaffected
  isOpen?: boolean;
  onClose?: () => void;
}

export function Sidebar({ menuItems, activeItem, onItemClick, userRole, onLogout, isOpen, onClose }: SidebarProps) {
  const handleLogout = () => {
    if (onLogout) {
      onLogout();
    } else {
      window.location.href = '/';
    }
  };

  const handleItemClick = (id: string) => {
    onItemClick(id);
    // Close sidebar on mobile after selecting an item
    if (onClose) onClose();
  };

  return (
    <>
      {/* ── Mobile overlay — only rendered when isOpen prop is used ── */}
      {onClose && isOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`
          fixed left-0 top-0 h-screen w-64 bg-white text-gray-700 shadow-lg z-50
          flex flex-col overflow-hidden border-r border-gray-100
          transition-transform duration-300 ease-in-out
          ${onClose
            ? isOpen
              ? 'translate-x-0'
              : '-translate-x-full lg:translate-x-0'
            : 'translate-x-0'
          }
        `}
      >
        {/* Header — Logo */}
        <div className="flex-shrink-0 px-5 py-5 border-b border-blue-100 bg-white">
          <div className="flex items-center gap-3">

            {/* COED LOGO */}
            <div className="w-11 h-11 rounded-xl bg-blue-100 flex items-center justify-center shadow-sm overflow-hidden flex-shrink-0">
              <img
                src="/COED LOGO.png"
                alt="COED Logo"
                className="w-9 h-9 object-contain"
              />
            </div>

            {/* TEXT */}
            <div>
              <h1 className="font-bold text-sm text-blue-700 tracking-wide">
                COED
              </h1>
              <p className="text-[11px] text-blue-400 font-medium">
                Information System
              </p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 min-h-0 overflow-hidden px-3 py-3 flex flex-col gap-0.5">
          {menuItems.map((item) => {
            const isActive = activeItem === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleItemClick(item.id)}
                className={`
                  group relative w-full flex items-center gap-3 px-3 py-2.5 rounded-xl
                  transition-all duration-200 text-left
                ${isActive
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-500 hover:text-blue-700 hover:bg-blue-50'
                  }
                `}
              >
                {/* Active left bar */}
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-blue-600 rounded-r-full" />
                )}

                {/* Icon */}
                <div
                  className={`flex-shrink-0 transition-all duration-200 ${
                    isActive
                      ? 'text-blue-700'
                      : 'text-gray-400 group-hover:text-blue-600'
                  }`}
                >
                  <item.icon className="w-4 h-4" />
                </div>

                {/* Label */}
                <span className={`flex-1 text-xs font-medium leading-tight ${isActive ? 'font-semibold' : ''}`}>
                  {item.label}
                </span>

<<<<<<< HEAD
      {/* Bottom — Logout */}
      <div className="flex-shrink-0 px-3 py-4 border-t border-gray-100">
        <button
          onClick={handleLogout}
          className="group w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-400 hover:text-red-500 hover:bg-red-100 transition-all duration-200 text-left"
        >
          <LogOut className="w-4 h-4 flex-shrink-0 group-hover:text-red-500 transition-colors" />
          <span className="text-xs font-medium">Log Out</span>
        </button>
      </div>
=======
                {/* Arrow on active */}
                {isActive && (
                  <ChevronRight className="w-3 h-3 text-[#16A34A] flex-shrink-0" />
                )}
              </button>
            );
          })}
        </nav>
>>>>>>> 088da9838c2ae95a441e26ea0dfde4528413c254

        {/* Bottom — Logout */}
        <div className="flex-shrink-0 px-3 py-4 border-t border-gray-100">
          <button
            onClick={handleLogout}
            className="group w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all duration-200 text-left"
          >
            <LogOut className="w-4 h-4 flex-shrink-0 group-hover:text-red-500 transition-colors" />
            <span className="text-xs font-medium">Log Out</span>
          </button>
        </div>

      </aside>
    </>
  );
}