import { useState, useEffect } from 'react';
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
import { ClubsPage } from './components/coed/ClubsPage';
import { ResearchPage } from './components/coed/ResearchPage';
import { AchievementsPage } from './components/coed/AchievementsPage';
import { AccreditationPage } from './components/coed/AccreditationPage';
import { ContactPage } from './components/coed/ContactPage';
import { LoginPage } from './components/coed/LoginPage';
import { ForgotPasswordPage } from './components/coed/ForgotPasswordPage';
import { ResetPasswordPage } from './components/coed/ResetPasswordPage';

type AppMode = 'public' | 'dashboard';
type UserRole = 'dean' | 'chair' | 'faculty' | 'student' | 'alumni' | null;

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
  const [initializing, setInitializing] = useState(true);
  const [appMode, setAppMode] = useState<AppMode>('public');
  const [currentRole, setCurrentRole] = useState<UserRole>(null);
  const [currentPage, setCurrentPage] = useState<PublicPage>('home');
  const [activeMenuItem, setActiveMenuItem] = useState('dashboard');

  const [currentUser, setCurrentUser] = useState<{
    username: string;
    role: string;
    idNumber?: string;
  } | null>(null);

  // =====================================================
  // RESTORE SESSION ON BROWSER REFRESH
  // =====================================================
  useEffect(() => {
    // 1. Handle Password Reset Route
    if (window.location.pathname === '/reset-password') {
      setAppMode('public');
      setCurrentPage('reset-password');
      setInitializing(false);
      return;
    }

    // 2. Restore User & Dashboard State from stored session token
    const token = localStorage.getItem('token');
    const savedRole = localStorage.getItem('user_role') as UserRole;

    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const rawRole = (payload.role || savedRole || '').toLowerCase();
        
        let normalizedRole: UserRole = null;
        if (rawRole === 'dean') normalizedRole = 'dean';
        else if (rawRole === 'chair' || rawRole === 'department_chair') normalizedRole = 'chair';
        else if (rawRole === 'faculty') normalizedRole = 'faculty';
        else if (rawRole === 'student') normalizedRole = 'student';
        else if (rawRole === 'alumni') normalizedRole = 'alumni';

        if (normalizedRole) {
          setCurrentUser({
            username: payload.fullName ?? payload.username ?? 'User',
            role: payload.role,
            idNumber: payload.idNumber ?? '',
          });
          setCurrentRole(normalizedRole);
          setAppMode('dashboard');
        } else {
          setAppMode('public');
        }
      } catch (error) {
        console.error('Failed to parse active session:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('user_role');
        setAppMode('public');
      }
    } else {
      setAppMode('public');
    }

    setInitializing(false);
  }, []);

  // =====================================================
  // LOGIN
  // =====================================================
  const handleLogin = (role: string) => {
    const token = localStorage.getItem('token');
    let normalizedRole: UserRole = null;
    const rawRole = role.toLowerCase();

    if (rawRole === 'dean') normalizedRole = 'dean';
    else if (rawRole === 'chair' || rawRole === 'department_chair') normalizedRole = 'chair';
    else if (rawRole === 'faculty') normalizedRole = 'faculty';
    else if (rawRole === 'student') normalizedRole = 'student';
    else if (rawRole === 'alumni') normalizedRole = 'alumni';

    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setCurrentUser({
          username: payload.fullName ?? payload.username ?? 'User',
          role: payload.role,
          idNumber: payload.idNumber ?? '',
        });
      } catch (error) {
        console.error('Failed to decode login token:', error);
      }
    }

    if (normalizedRole) {
      localStorage.setItem('user_role', normalizedRole);
    }
    
    setCurrentRole(normalizedRole);
    setAppMode('dashboard');
    setActiveMenuItem('dashboard');
  };

  // =====================================================
  // LOGOUT
  // =====================================================
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user_role');
    setCurrentUser(null);
    setCurrentRole(null);
    setAppMode('public');
    setCurrentPage('home');
  };

  // =====================================================
  // TOGGLE ROLE (DEV HELPER)
  // =====================================================
  const toggleRole = () => {
    const nextRole = currentRole === 'dean' ? 'chair' : 'dean';
    setCurrentRole(nextRole);
    localStorage.setItem('user_role', nextRole);
    setActiveMenuItem('dashboard');
  };

  // =====================================================
  // PUBLIC NAVIGATION
  // =====================================================
  const handleNavigate = (page: string) => {
    setCurrentPage(page as PublicPage);
    setTimeout(() => {
      window.scrollTo({
        top: 0,
        behavior: 'smooth',
      });
    }, 0);
  };

  // Prevent flicker during initial session restore
  if (initializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // =====================================================
  // PUBLIC WEBSITE MODE
  // =====================================================
  if (appMode === 'public') {
    if (currentPage === 'reset-password') {
      return (
        <ResetPasswordPage
          onReturnToLogin={() => {
            window.history.replaceState({}, '', '/');
            setCurrentPage('login');
          }}
        />
      );
    }

    return (
      <div className="min-h-screen bg-white">
        {currentPage !== 'login' && currentPage !== 'forgot-password' && (
          <Header onNavigate={handleNavigate} currentPage={currentPage} />
        )}

        <div
          className={
            currentPage !== 'login' &&
            currentPage !== 'forgot-password' &&
            currentPage !== 'home'
              ? 'pt-20'
              : ''
          }
        >
          {currentPage === 'home' && <HomePage onNavigate={handleNavigate} />}
          {currentPage === 'about' && <AboutPage />}
          {currentPage === 'departments' && <DepartmentsPage onNavigate={handleNavigate} />}
          {currentPage === 'clubs' && <ClubsPage />}
          {currentPage === 'research' && <ResearchPage />}
          {currentPage === 'achievements' && <AchievementsPage />}
          {currentPage === 'accreditation' && <AccreditationPage />}
          {currentPage === 'contact' && <ContactPage />}
          {currentPage === 'login' && (
            <LoginPage
              onLogin={handleLogin}
              onBack={() => handleNavigate('home')}
              onForgotPassword={() => handleNavigate('forgot-password')}
            />
          )}
          {currentPage === 'forgot-password' && (
            <ForgotPasswordPage
              onBack={() => handleNavigate('home')}
              onReturnToLogin={() => handleNavigate('login')}
            />
          )}
        </div>

        {currentPage !== 'login' && currentPage !== 'forgot-password' && (
          <Footer onNavigate={handleNavigate} />
        )}
      </div>
    );
  }

  // =====================================================
  // DASHBOARD MODE
  // =====================================================
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/20">
      {/* COLLEGE DEAN */}
      {currentRole === 'dean' && (
        <CollegeDeanDashboard
          onRoleChange={toggleRole}
          activeMenuItem={activeMenuItem}
          setActiveMenuItem={setActiveMenuItem}
          onLogout={handleLogout}
        />
      )}

      {/* DEPARTMENT CHAIR */}
      {currentRole === 'chair' && (
        <DepartmentChairDashboard
          onRoleChange={toggleRole}
          activeMenuItem={activeMenuItem}
          setActiveMenuItem={setActiveMenuItem}
          onLogout={handleLogout}
        />
      )}

      {/* FACULTY */}
      {currentRole === 'faculty' && (
        <FacultyDashboard
          onRoleChange={toggleRole}
          activeMenuItem={activeMenuItem}
          setActiveMenuItem={setActiveMenuItem}
          onLogout={handleLogout}
          userName={currentUser?.username ?? 'Faculty'}
        />
      )}

      {/* STUDENT */}
      {currentRole === 'student' && (
        <StudentDashboard
          onRoleChange={toggleRole}
          activeMenuItem={activeMenuItem}
          setActiveMenuItem={setActiveMenuItem}
          onLogout={handleLogout}
          userName={currentUser?.username ?? 'Student'}
        />
      )}

      {/* ALUMNI */}
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