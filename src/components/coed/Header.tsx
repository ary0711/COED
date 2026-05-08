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
     <div className="w-full bg-gray-100 border-b border-gray-300 shadow-sm">
        
        {/* Fixed Height Navbar */}
        <div className="w-full px-4 lg:px-6 h-[72px]">
          <div className="flex items-center justify-between h-full">

            {/* Logo Section */}
            <button
              onClick={() => onNavigate('home')}
              className="flex items-center gap-2 shrink-0"
            >
              <img
                src="/COED LOGO.png"
                alt="COED Logo"
                className="w-14 h-14 object-contain"
              />

              <div className="text-left leading-tight">
                <h1 className="text-[18px] font-bold text-gray-800 tracking-wide">
                  College of Education
                </h1>

                <p className="text-[11px] text-gray-500">
                  Cebu Technological University - Argao Campus
                </p>
              </div>
            </button>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-9">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  className={`text-[14px] font-medium transition-all duration-200 ${
                    currentPage === item.id
                      ? 'text-[#2563EB]'
                      : 'text-black-500 hover:text-[#2563EB]'
                  }`}
                >
                  {item.label}
                </button>
              ))}
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

          </div>
        </div>
      )}
    </header>
  );
} 