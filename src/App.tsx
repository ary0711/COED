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
  const [currentPage, setCurrentPage] =
    useState<PublicPage>('home');

  const [activeMenuItem, setActiveMenuItem] =
    useState('dashboard');

  const [currentUser, setCurrentUser] = useState<{
    username: string;
    role: string;
    idNumber?: string;
  } | null>(null);

  // =====================================================
  // CHECK PASSWORD RESET URL
  // =====================================================
  useEffect(() => {
    if (window.location.pathname === '/reset-password') {
      setAppMode('public');
      setCurrentPage('reset-password');
    }
  }, []);

  // =====================================================
  // LOGIN
  // =====================================================
  const handleLogin = (role: string) => {
    const token = localStorage.getItem('token');

    if (token) {
      try {
        const payload = JSON.parse(
          atob(token.split('.')[1])
        );

        setCurrentUser({
          username:
            payload.fullName ??
            payload.username,
          role: payload.role,
          idNumber: payload.idNumber ?? '',
        });
      } catch (error) {
        console.error(
          'Failed to decode login token:',
          error
        );
      }
    }

    setCurrentRole(role as UserRole);
    setAppMode('dashboard');
    setActiveMenuItem('dashboard');
  };

  // =====================================================
  // LOGOUT
  // =====================================================
  const handleLogout = () => {
    setAppMode('public');
    setCurrentRole(null);
    setCurrentPage('home');
  };

  // =====================================================
  // TOGGLE ROLE
  // =====================================================
  const toggleRole = () => {
    if (currentRole === 'dean') {
      setCurrentRole('chair');
    } else {
      setCurrentRole('dean');
    }

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
  // PUBLIC WEBSITE MODE
  // =====================================================
  if (appMode === 'public') {

    // ===================================================
    // PASSWORD RESET PAGE
    // This MUST be checked before the normal public page
    // ===================================================
    if (currentPage === 'reset-password') {
      return (
        <ResetPasswordPage
          onReturnToLogin={() => {
            // Remove the reset-password URL
            window.history.replaceState(
              {},
              '',
              '/'
            );

            setCurrentPage('login');
          }}
        />
      );
    }

    return (
      <div className="min-h-screen bg-white">

        {/* ==============================================
            HEADER
        ============================================== */}
        {currentPage !== 'login' &&
          currentPage !== 'forgot-password' && (
            <Header
              onNavigate={handleNavigate}
              currentPage={currentPage}
            />
          )}

        {/* ==============================================
            PUBLIC CONTENT
        ============================================== */}
        <div
          className={
            currentPage !== 'login' &&
            currentPage !== 'forgot-password' &&
            currentPage !== 'home'
              ? 'pt-20'
              : ''
          }
        >

          {/* HOME */}
          {currentPage === 'home' && (
            <HomePage
              onNavigate={handleNavigate}
            />
          )}

          {/* ABOUT */}
          {currentPage === 'about' && (
            <AboutPage />
          )}

          {/* DEPARTMENTS */}
          {currentPage === 'departments' && (
            <DepartmentsPage
              onNavigate={handleNavigate}
            />
          )}

          {/* CLUBS */}
          {currentPage === 'clubs' && (
            <ClubsPage />
          )}

          {/* RESEARCH */}
          {currentPage === 'research' && (
            <ResearchPage />
          )}

          {/* ACHIEVEMENTS */}
          {currentPage === 'achievements' && (
            <AchievementsPage />
          )}

          {/* ACCREDITATION */}
          {currentPage === 'accreditation' && (
            <AccreditationPage />
          )}

          {/* CONTACT */}
          {currentPage === 'contact' && (
            <ContactPage />
          )}

          {/* LOGIN */}
          {currentPage === 'login' && (
            <LoginPage
              onLogin={handleLogin}
              onBack={() =>
                handleNavigate('home')
              }
              onForgotPassword={() =>
                handleNavigate(
                  'forgot-password'
                )
              }
            />
          )}

          {/* FORGOT PASSWORD */}
          {currentPage === 'forgot-password' && (
            <ForgotPasswordPage
              onBack={() =>
                handleNavigate('home')
              }
              onReturnToLogin={() =>
                handleNavigate('login')
              }
            />
          )}

        </div>

        {/* ==============================================
            FOOTER
        ============================================== */}
        {currentPage !== 'login' &&
          currentPage !== 'forgot-password' && (
            <Footer
              onNavigate={handleNavigate}
            />
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
          userName={
            currentUser?.username ?? 'Faculty'
          }
        />
      )}

      {/* STUDENT */}
      {currentRole === 'student' && (
        <StudentDashboard
          onRoleChange={toggleRole}
          activeMenuItem={activeMenuItem}
          setActiveMenuItem={setActiveMenuItem}
          onLogout={handleLogout}
          userName={
            currentUser?.username ?? 'Student'
          }
        />
      )}

      {/* ALUMNI */}
      {currentRole === 'alumni' && (
        <AlumniDashboard
          onRoleChange={toggleRole}
          activeMenuItem={activeMenuItem}
          setActiveMenuItem={setActiveMenuItem}
          onLogout={handleLogout}
          userName={
            currentUser?.username ?? 'Alumni'
          }
          idNumber={
            currentUser?.idNumber ?? ''
          }
        />
      )}

    </div>
  );
}