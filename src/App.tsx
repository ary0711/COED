import { supabase } from './supabaseClient';
import { useState, useEffect } from 'react';
import { LogOut } from 'lucide-react';
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
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const [currentUser, setCurrentUser] = useState<{
    username: string;
    role: string;
    idNumber?: string;
  } | null>(null);
const normalizeRole = (role: string | null | undefined): UserRole => {
  const normalized = role?.trim().toLowerCase();

  switch (normalized) {
    case 'dean':
      return 'dean';
    case 'chair':
    case 'department_chair':
      return 'chair';
    case 'faculty':
      return 'faculty';
    case 'student':
      return 'student';
    case 'alumni':
      return 'alumni';
    default:
      return null;
  }
};
  
  // =====================================================
  // RESTORE SESSION ON BROWSER REFRESH
  // Always read the latest role from Supabase profiles.
  // =====================================================
  useEffect(() => {
    let cancelled = false;

    const restoreSession = async () => {
      if (window.location.pathname === '/reset-password') {
        setAppMode('public');
        setCurrentPage('reset-password');
        setInitializing(false);
        return;
      }

      const token = localStorage.getItem('token');

      if (!token) {
        setAppMode('public');
        setInitializing(false);
        return;
      }

      try {
        const payload = JSON.parse(atob(token.split('.')[1]));

        // Find the current profile using the profile ID in the token.
        let profileQuery = supabase
          .from('profiles')
          .select('id, full_name, id_number, role, status');

        if (payload.profileId) {
          profileQuery = profileQuery.eq('id', payload.profileId);
        } else if (payload.email) {
          profileQuery = profileQuery.eq('email', payload.email);
        } else {
          throw new Error(
            'The login token has no profile ID or email. Please log in again.'
          );
        }

        const { data: profile, error } = await profileQuery.maybeSingle();

        if (error) throw error;

        if (cancelled) return;

        if (!profile || profile.status !== 'active') {
          localStorage.removeItem('token');
          localStorage.removeItem('user_role');
          setCurrentUser(null);
          setCurrentRole(null);
          setAppMode('public');
          return;
        }

        // profiles.role is the current role, not the potentially stale JWT role.
        const latestRole = normalizeRole(profile.role);

        if (!latestRole) {
          localStorage.removeItem('token');
          localStorage.removeItem('user_role');
          setCurrentUser(null);
          setCurrentRole(null);
          setAppMode('public');
          return;
        }

        setCurrentUser({
          username: profile.full_name || payload.fullName || payload.username || 'User',
          role: latestRole,
          idNumber: profile.id_number || payload.idNumber || '',
        });

        setCurrentRole(latestRole);
        localStorage.setItem('user_role', latestRole);
        setAppMode('dashboard');
      } catch (error) {
        console.error('Failed to restore session:', error);

        if (!cancelled) {
          setCurrentUser(null);
          setCurrentRole(null);
          setAppMode('public');
        }
      } finally {
        if (!cancelled) {
          setInitializing(false);
        }
      }
    };

    void restoreSession();

    return () => {
      cancelled = true;
    };
  }, []);


  // =====================================================
  // LOGIN
  // =====================================================
  const handleLogin = (role: string) => {
    const token = localStorage.getItem('token');
    let normalizedRole = normalizeRole(role);

    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));

        // Prefer the role supplied by the login token.
        normalizedRole = normalizeRole(payload.role) ?? normalizedRole;

        setCurrentUser({
          username: payload.fullName ?? payload.username ?? 'User',
          role: payload.role ?? role,
          idNumber: payload.idNumber ?? '',
        });
      } catch (error) {
        console.error('Failed to decode login token:', error);
      }
    }

    if (!normalizedRole) {
      setCurrentUser(null);
      setCurrentRole(null);
      setAppMode('public');
      localStorage.removeItem('user_role');
      return;
    }

    localStorage.setItem('user_role', normalizedRole);
    setCurrentRole(normalizedRole);
    setAppMode('dashboard');
    setActiveMenuItem('dashboard');
  };


  // =====================================================
  // LOGOUT
  // =====================================================
  const handleLogout = () => {
    setShowLogoutModal(true);
  };

  const confirmLogout = () => {
    localStorage.clear();
    setCurrentUser(null);
    setCurrentRole(null);
    setAppMode('public');
    setCurrentPage('home');
    setShowLogoutModal(false);
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

  // =====================================================
  // PROFILE UPDATE
  // Keeps the dashboard/header name synchronized after saving
  // the profile from System Settings.
  // =====================================================
  const handleProfileUpdate = (updatedProfile: {
    fullName: string;
    email: string;
  }) => {
    setCurrentUser((prev) =>
      prev
        ? {
            ...prev,
            username: updatedProfile.fullName,
          }
        : prev
    );

    // Keep localStorage synchronized with the React state as well.
    localStorage.setItem('userFullName', updatedProfile.fullName);
    localStorage.setItem('userEmail', updatedProfile.email);
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
         {currentPage === 'achievements' && (
  <AchievementsPage onNavigate={handleNavigate} />
)}
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
          userName={currentUser?.username ?? 'Dean'}
        />
      )}

      {/* DEPARTMENT CHAIR */}
      {currentRole === 'chair' && (
        <DepartmentChairDashboard
  onRoleChange={toggleRole}
  activeMenuItem={activeMenuItem}
  setActiveMenuItem={setActiveMenuItem}
  onLogout={handleLogout}
  userName={currentUser?.username ?? 'Chair'}
  onProfileUpdate={(updatedProfile) => {
    setCurrentUser((prev) =>
      prev
        ? { ...prev, username: updatedProfile.fullName }
        : prev
    );
  }}
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

      {/* GLOBAL LOGOUT CONFIRMATION MODAL */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
            <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
              <LogOut className="w-7 h-7 text-red-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-1">Confirm Sign Out</h3>
            <p className="text-sm text-gray-500 mb-6">
              Are you sure you want to end your current session and return to the home page?
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowLogoutModal(false)}
                className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmLogout}
                className="flex-1 py-2.5 bg-red-600 text-white rounded-xl text-sm font-semibold hover:bg-red-700 transition-colors shadow-sm"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
