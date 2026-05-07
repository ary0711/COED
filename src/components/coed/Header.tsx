import { Menu, X } from 'lucide-react';
import { useState } from 'react';

interface HeaderProps {
  onNavigate: (page: string) => void;
  currentPage: string;
}

export function Header({ onNavigate, currentPage }: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { id: 'home', label: 'Home' },
    { id: 'about', label: 'About' },
    { id: 'departments', label: 'Departments' },
    { id: 'clubs', label: 'Organizations' },
    { id: 'research', label: 'Research' },
    { id: 'achievements', label: 'Achievements' },
    { id: 'accreditation', label: 'Accreditation' },
    { id: 'contact', label: 'Contact' },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50">
      {/* Full Width Navbar */}
      <div className="w-full bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 py-5">
          <div className="flex items-center justify-between">

            {/* Logo */}
            <button
              onClick={() => onNavigate('home')}
              className="flex items-center gap-3"
            >
              {/* Replace filename if needed */}
              <img
                src="/coed-logo.png"
                alt="COED Logo"
                className="w-11 h-11 object-contain"
              />

              <div className="text-left">
                <h1 className="text-[20px] font-bold text-gray-800 tracking-wide">
                  COED
                </h1>
                <p className="text-[11px] text-gray-500 leading-tight">
                  Cebu Technological University
                </p>
              </div>
            </button>

            {/* Desktop Nav */}
            <nav className="hidden lg:flex items-center gap-8">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  className={`text-[13px] font-medium transition-all duration-200 ${
                    currentPage === item.id
                      ? 'text-[#2563EB]'
                      : 'text-gray-500 hover:text-[#2563EB]'
                  }`}
                >
                  {item.label}
                </button>
              ))}

              {/* Login Button */}
              <button
                onClick={() => onNavigate('login')}
                className="px-6 py-2 border border-[#2563EB] text-[#2563EB] text-sm font-semibold hover:bg-[#2563EB] hover:text-white transition-all duration-300"
              >
                Login
              </button>
            </nav>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden"
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6 text-gray-700" />
              ) : (
                <Menu className="w-6 h-6 text-gray-700" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-white border-b border-gray-100 shadow-md">
          <div className="px-6 py-5 space-y-3">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  onNavigate(item.id);
                  setMobileMenuOpen(false);
                }}
                className={`block w-full text-left text-sm py-2 transition-all ${
                  currentPage === item.id
                    ? 'text-[#2563EB] font-semibold'
                    : 'text-gray-600 hover:text-[#2563EB]'
                }`}
              >
                {item.label}
              </button>
            ))}

            <button
              onClick={() => {
                onNavigate('login');
                setMobileMenuOpen(false);
              }}
              className="w-full mt-3 px-4 py-3 border border-[#2563EB] text-[#2563EB] font-semibold hover:bg-[#2563EB] hover:text-white transition-all"
            >
              Login
            </button>
          </div>
        </div>
      )}
    </header>
  );
}