import { useState, useEffect  } from 'react';
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
import  { ForgotPasswordPage } from './components/coed/ForgotPasswordPage';
import { ResetPasswordPage } from './components/coed/ResetPasswordPage';


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
type PublicPage =
  | 'home'
  | 'about'
  | 'departments'
  | 'clubs'
  | 'research'
  | 'achievements'
  | 'accreditation'
  | 'contact'
  | 'login'
  | 'forgot-password'
  | 'reset-password';

export default function App() {
  const [appMode, setAppMode] = useState<AppMode>('public');
  const [currentRole, setCurrentRole] = useState<UserRole>(null);
  const [currentPage, setCurrentPage] = useState<PublicPage>('home');
  const [activeMenuItem, setActiveMenuItem] = useState('dashboard');
  useEffect(() => {
  if (window.location.pathname === '/reset-password') {
    setCurrentPage('reset-password');
  }
}, []);

  const [currentUser, setCurrentUser] = useState<{ username: string; role: string; idNumber?: string } | null>(null);

const handleLogin = (role: string) => {
    const token = localStorage.getItem('token');
    if (token) {
      const payload = JSON.parse(atob(token.split('.')[1]));
      setCurrentUser({
        username: payload.fullName ?? payload.username,
        role: payload.role,
        idNumber: payload.idNumber ?? '',
      });
    }
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
  console.log('Current page changing to:', page);
  setCurrentPage(page as PublicPage);
  window.scrollTo({ top: 0, behavior: 'smooth' });
};
  

  // Public Website Mode
  if (appMode === 'public') {
    return (
      <div className="min-h-screen bg-white">
        {currentPage !== 'login' &&
 currentPage !== 'forgot-password' && (
  <Header
    onNavigate={handleNavigate}
    currentPage={currentPage}
  />
)}
        
        {/* Remove padding-top for home page to fit perfectly with header */}
        <div
  className={
    currentPage !== 'login' &&
    currentPage !== 'forgot-password' &&
    currentPage !== 'reset-password' &&
    currentPage !== 'home'
      ? 'pt-20'
      : ''
  }
>
          {currentPage === 'home' && <HomePage onNavigate={handleNavigate} />}
          {currentPage === 'about' && <AboutPage />}
          {currentPage === 'departments' && (
  <DepartmentsPage
    onNavigate={handleNavigate}
  />
)}
          {currentPage === 'clubs' && <ClubsPage />} {/* ✅ Added ClubsPage route */}
          {currentPage === 'research' && <ResearchPage />}
          {currentPage === 'achievements' && <AchievementsPage />}
          {currentPage === 'accreditation' && <AccreditationPage />}
          {currentPage === 'contact' && <ContactPage />}
          {currentPage === 'login' && (
  <LoginPage
    onLogin={handleLogin}
    onBack={() => handleNavigate('home')}
    onForgotPassword={() => {
  console.log('Navigate to forgot-password');
  handleNavigate('forgot-password');
}}
  />
)}

{currentPage === 'forgot-password' && (
  <ForgotPasswordPage
    onBack={() => handleNavigate('home')}
    onReturnToLogin={() => handleNavigate('login')}
  />
)}
        </div>

       {currentPage !== 'login' &&
 currentPage !== 'forgot-password' && (
  <Footer />
)}
      </div>
    );
    
  }
  {currentPage === 'reset-password' && (
  <ResetPasswordPage
    onBack={() => handleNavigate('home')}
    onReturnToLogin={() => handleNavigate('login')}
  />
)}

  // Dashboard Mode (after login)
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/20">
      {currentRole === 'dean' && (
        <CollegeDeanDashboard
          onRoleChange={toggleRole}
          activeMenuItem={activeMenuItem}
          setActiveMenuItem={setActiveMenuItem}
           onLogout={handleLogout} 
        />
      )}
      {currentRole === 'chair' && (
        <DepartmentChairDashboard
          onRoleChange={toggleRole}
          activeMenuItem={activeMenuItem}
          setActiveMenuItem={setActiveMenuItem}
           onLogout={handleLogout} 
        />
      )}
      {currentRole === 'faculty' && (
        <FacultyDashboard
          onRoleChange={toggleRole}
          activeMenuItem={activeMenuItem}
          setActiveMenuItem={setActiveMenuItem}
          onLogout={handleLogout}
          userName={currentUser?.username ?? 'Faculty'}
        />
      )}
      {currentRole === 'student' && (
        <StudentDashboard
          onRoleChange={toggleRole}
          activeMenuItem={activeMenuItem}
          setActiveMenuItem={setActiveMenuItem}
          onLogout={handleLogout}
          userName={currentUser?.username ?? 'Student'}
        />
      )}
      {currentRole === 'alumni' && (
        <AlumniDashboard
          onRoleChange={toggleRole}
          activeMenuItem={activeMenuItem}
          setActiveMenuItem={setActiveMenuItem}
          onLogout={handleLogout}
          userName={currentUser?.username ?? 'Alumni'}
          idNumber={currentUser?.idNumber ?? ''}
        />
      )}
      

    </div>
  );
}