import { GraduationCap, Menu, X } from 'lucide-react';
import { useState } from 'react';

interface HeaderProps {
  onNavigate: (page: string) => void;
  currentPage: string;
}

export function Header({ onNavigate, currentPage }: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { id: 'home', label: 'Home' },
    { id: 'about', label: 'About COED' },
    { id: 'departments', label: 'Departments & Programs' },
    { id: 'clubs', label: 'Clubs & Organizations' }, // ✅ Added Clubs to nav
    { id: 'research', label: 'Research & Extension' },
    { id: 'achievements', label: 'Achievements' },
    { id: 'accreditation', label: 'Accreditation' },
    { id: 'contact', label: 'Contact' },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 px-4 pt-4">
      <div className="max-w-7xl mx-auto">
        {/* Rounded rectangle container with classy background */}
        <div className="bg-gradient-to-r from-white/90 to-gray-50/90 backdrop-blur-md rounded-3xl shadow-xl border border-gray-200/30 px-6 py-3">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <button
              onClick={() => onNavigate('home')}
              className="flex items-center gap-3 hover:opacity-80 transition-opacity"
            >
              <div className="bg-[#1E3A8A] p-2 rounded-lg">
                <GraduationCap className="w-5 h-5 text-white" /> {/* smaller icon */}
              </div>
              <div className="text-left">
                <div className="font-semibold text-[#1E3A8A] text-md leading-tight">COED</div> {/* decreased 2 sizes */}
                <div className="text-[10px] text-gray-600">Cebu Technological University - Argao Campus</div>
              </div>
            </button>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-1">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  className={`px-4 py-2 rounded-xl text-xs font-medium transition-all ${
                    currentPage === item.id
                      ? 'text-[#1E3A8A] bg-blue-50'
                      : 'text-gray-600 hover:text-[#2563EB] hover:bg-gray-50'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </nav>

            {/* Login Button */}
            <button
              onClick={() => onNavigate('login')}
              className="hidden lg:block px-5 py-2 bg-gradient-to-r from-[#1E3A8A] to-[#2563EB] text-white rounded-xl hover:shadow-lg transition-all font-medium text-sm"
            >
              Login
            </button>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl hover:bg-gray-100 transition-colors"
            >
              {mobileMenuOpen ? (
                <X className="w-5 h-5 text-gray-700" />
              ) : (
                <Menu className="w-5 h-5 text-gray-700" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden mt-2 bg-gradient-to-r from-white/90 to-gray-50/90 backdrop-blur-md rounded-2xl shadow-xl border border-gray-200/30 overflow-hidden">
            <div className="px-4 py-4 space-y-2">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    onNavigate(item.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`block w-full text-left px-4 py-3 rounded-xl text-xs font-medium transition-all ${
                    currentPage === item.id
                      ? 'text-[#1E3A8A] bg-blue-50'
                      : 'text-gray-600 hover:text-[#2563EB] hover:bg-gray-50'
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
                className="block w-full px-4 py-3 bg-gradient-to-r from-[#1E3A8A] to-[#2563EB] text-white rounded-xl hover:shadow-lg transition-all font-medium text-xs"
              >
                Login
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}