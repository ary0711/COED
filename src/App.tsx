import { useState } from 'react';
import { CollegeDeanDashboard } from './components/CollegeDeanDashboard';
import { DepartmentChairDashboard } from './components/DepartmentChairDashboard';
import { FacultyDashboard } from './components/dashboards/FacultyDashboard';
import { StudentDashboard } from './components/dashboards/StudentDashboard';
import { AlumniDashboard } from './components/dashboards/AlumniDashboard';
import { Header } from './components/coed/Header';
import { Footer } from './components/coed/Footer';
import { HomePage } from './components/coed/HomePage';
import { AboutPage } from './components/coed/AboutPage';
import { DepartmentsPage } from './components/coed/DepartmentsPage';
import { ClubsPage } from './components/coed/ClubsPage'; // ✅ Added ClubsPage import
import { ResearchPage } from './components/coed/ResearchPage';
import { AchievementsPage } from './components/coed/AchievementsPage';
import { AccreditationPage } from './components/coed/AccreditationPage';
import { ContactPage } from './components/coed/ContactPage';
import { LoginPage } from './components/coed/LoginPage';

/**
 * College of Education (COED) Website & Management System
 * * This application provides:
 * * PUBLIC WEBSITE:
 * - Home page with college overview
 * - About COED (history, vision, mission)
 * - Departments & Programs
 * - Clubs & Organizations
 * - Research & Extension activities
 * - Achievements & Accreditation
 * - Contact information
 * * ROLE-BASED DASHBOARDS (after login):
 * 1. College Dean - Full system access
 * 2. Department Chair - Department-level admin
 * 3. Faculty - Faculty portal (placeholder)
 * 4. Student - Student portal (placeholder)
 */

type AppMode = 'public' | 'dashboard';
type UserRole = 'dean' | 'chair' | 'faculty' | 'student' | 'alumni' | null;
// ✅ Added 'clubs' to the PublicPage type
type PublicPage = 'home' | 'about' | 'departments' | 'clubs' | 'research' | 'achievements' | 'accreditation' | 'contact' | 'login';

export default function App() {
  const [appMode, setAppMode] = useState<AppMode>('public');
  const [currentRole, setCurrentRole] = useState<UserRole>(null);
  const [currentPage, setCurrentPage] = useState<PublicPage>('home');
  const [activeMenuItem, setActiveMenuItem] = useState('dashboard');

  const handleLogin = (role: string) => {
    setCurrentRole(role as UserRole);
    setAppMode('dashboard');
    setActiveMenuItem('dashboard');
  };

  const handleLogout = () => {
    setAppMode('public');
    setCurrentRole(null);
    setCurrentPage('home');
  };

  const toggleRole = () => {
    if (currentRole === 'dean') {
      setCurrentRole('chair');
    } else {
      setCurrentRole('dean');
    }
    setActiveMenuItem('dashboard');
  };

  const handleNavigate = (page: string) => {
    setCurrentPage(page as PublicPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Public Website Mode
  if (appMode === 'public') {
    return (
      <div className="min-h-screen bg-white">
        {currentPage !== 'login' && (
          <Header onNavigate={handleNavigate} currentPage={currentPage} />
        )}
        
        {/* Remove padding-top for home page to fit perfectly with header */}
        <div className={currentPage !== 'login' && currentPage !== 'home' ? 'pt-20' : ''}>
          {currentPage === 'home' && <HomePage onNavigate={handleNavigate} />}
          {currentPage === 'about' && <AboutPage />}
          {currentPage === 'departments' && <DepartmentsPage />}
          {currentPage === 'clubs' && <ClubsPage />} {/* ✅ Added ClubsPage route */}
          {currentPage === 'research' && <ResearchPage />}
          {currentPage === 'achievements' && <AchievementsPage />}
          {currentPage === 'accreditation' && <AccreditationPage />}
          {currentPage === 'contact' && <ContactPage />}
          {currentPage === 'login' && (
            <LoginPage
              onLogin={handleLogin}
              onBack={() => handleNavigate('home')}
            />
          )}
        </div>

        {currentPage !== 'login' && <Footer />}
      </div>
    );
  }

  // Dashboard Mode (after login)
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/20">
      {currentRole === 'dean' && (
        <CollegeDeanDashboard
          onRoleChange={toggleRole}
          activeMenuItem={activeMenuItem}
          setActiveMenuItem={setActiveMenuItem}
        />
      )}
      {currentRole === 'chair' && (
        <DepartmentChairDashboard
          onRoleChange={toggleRole}
          activeMenuItem={activeMenuItem}
          setActiveMenuItem={setActiveMenuItem}
        />
      )}
      {currentRole === 'faculty' && (
        <FacultyDashboard
          onRoleChange={toggleRole}
          activeMenuItem={activeMenuItem}
          setActiveMenuItem={setActiveMenuItem}
        />
      )}
      {currentRole === 'student' && (
        <StudentDashboard
          onRoleChange={toggleRole}
          activeMenuItem={activeMenuItem}
          setActiveMenuItem={setActiveMenuItem}
        />
      )}
      {currentRole === 'alumni' && (
        <AlumniDashboard
          onRoleChange={toggleRole}
          activeMenuItem={activeMenuItem}
          setActiveMenuItem={setActiveMenuItem}
        />
      )}
      
      {/* Logout Button - Elegant fixed button */}
      <button
        onClick={handleLogout}
        className="fixed bottom-8 right-8 px-8 py-4 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-2xl hover:from-red-600 hover:to-red-700 transition-all shadow-xl hover:shadow-2xl font-semibold z-50 hover:scale-105 flex items-center gap-2"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
        </svg>
        Logout
      </button>
    </div>
  );
}