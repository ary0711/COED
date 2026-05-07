import { useState } from 'react';
import { User, Lock, GraduationCap, ArrowLeft, Mail, IdCard, Eye, EyeOff } from 'lucide-react';
import { supabase } from '../../supabaseClient';

// ─── Role mappings ───────────────────────────────────────────────────────────
// Maps UI role keys → DB role values in profiles.role
const UI_TO_DB_ROLE: Record<string, string> = {
  dean: 'dean',
  chair: 'department_chair',
  faculty: 'faculty',
  student: 'student',
  alumni: 'alumni',
};

// Maps DB role values → UI role keys (used after login to call onLogin)
const DB_TO_UI_ROLE: Record<string, string> = {
  dean: 'dean',
  department_chair: 'chair',
  faculty: 'faculty',
  staff: 'faculty',
  student: 'student',
  alumni: 'alumni',
  admin: 'dean', // fallback for admin
};

// ─── Props ───────────────────────────────────────────────────────────────────
interface LoginPageProps {
  onLogin: (role: string) => void;
  onBack?: () => void;
}

// ─── Component ───────────────────────────────────────────────────────────────
export function LoginPage({ onLogin, onBack }: LoginPageProps) {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Async state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Login form state
  const [loginIdNumber, setLoginIdNumber] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginRole, setLoginRole] = useState('');

  // Registration form state
  const [regFullName, setRegFullName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regUserType, setRegUserType] = useState('');
  const [regIdNumber, setRegIdNumber] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');

  const loginRoles = [
    { id: 'dean', label: 'College Dean', icon: '👨‍💼' },
    { id: 'chair', label: 'Dept. Chair', icon: '👔' },
    { id: 'faculty', label: 'Faculty/Staff', icon: '👨‍🏫' },
    { id: 'student', label: 'Student', icon: '🎓' },
    { id: 'alumni', label: 'Alumni', icon: '🎖️' },
  ];

  const userTypes = [
    { id: 'student', label: 'Student', icon: '🎓', description: 'Student Portal Access' },
    { id: 'faculty', label: 'Faculty/Employee', icon: '👨‍🏫', description: 'Faculty & Staff Portal' },
    { id: 'alumni', label: 'Alumni', icon: '🎖️', description: 'Alumni Services' },
  ];

  // ─── Sign In ───────────────────────────────────────────────────────────────
  const handleLogin = async () => {
    setError('');

    if (!loginRole) {
      setError('Please select a role before signing in.');
      return;
    }
    if (!loginIdNumber.trim()) {
      setError('Please enter your ID number.');
      return;
    }
    if (!loginPassword) {
      setError('Please enter your password.');
      return;
    }

    setLoading(true);
    try {
      // 1. Look up email by id_number via secure function (bypasses RLS safely)
      const { data, error: profileError } = await supabase
        .rpc('get_login_info', { p_id_number: loginIdNumber.trim() });

      const profile = data?.[0];

      if (profileError || !profile) {
        setError('No account found with that ID number.');
        return;
      }

      if (profile.status === 'inactive') {
        setError('Your account has been deactivated. Contact the administrator.');
        return;
      }

      if (profile.status === 'pending') {
        setError('Your account is pending approval. Please wait for activation.');
        return;
      }

      // 2. Verify the selected role matches the stored role
      const expectedDbRole = UI_TO_DB_ROLE[loginRole];
      // Allow 'faculty' UI role to match both 'faculty' and 'staff' DB roles
      const roleMatches =
        profile.role === expectedDbRole ||
        (loginRole === 'faculty' && profile.role === 'staff');

      if (!roleMatches) {
        setError('Selected role does not match your account. Please choose the correct role.');
        return;
      }

      // 3. Sign in with Supabase Auth using the retrieved email
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: profile.email,
        password: loginPassword,
      });

      if (authError) {
        if (authError.message.toLowerCase().includes('invalid')) {
          setError('Incorrect password. Please try again.');
        } else {
          setError(authError.message);
        }
        return;
      }

      // 4. Navigate to the appropriate dashboard
      const uiRole = DB_TO_UI_ROLE[profile.role] ?? loginRole;
      onLogin(uiRole);
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // ─── Register ──────────────────────────────────────────────────────────────
  const handleRegister = async () => {
    setError('');

    if (!regFullName.trim()) { setError('Full name is required.'); return; }
    if (!regEmail.trim()) { setError('Email address is required.'); return; }
    if (!regUserType) { setError('Please select a user type.'); return; }
    if (!regIdNumber.trim()) { setError('ID number is required.'); return; }
    if (!regPassword) { setError('Password is required.'); return; }
    if (regPassword.length < 6) { setError('Password must be at least 6 characters.'); return; }
    if (regPassword !== regConfirmPassword) { setError('Passwords do not match.'); return; }

    setLoading(true);
    try {
      // 1. Create auth user (status defaults to 'pending' in profiles)
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: regEmail.trim(),
        password: regPassword,
      });

      if (signUpError) {
        setError(signUpError.message);
        return;
      }

      const userId = authData.user?.id;
      if (!userId) {
        setError('Registration failed. Please try again.');
        return;
      }

      // 2. Map UI user type to DB role
      // 'faculty' in registration maps to 'faculty'; students/alumni map directly
      const dbRole = regUserType === 'faculty' ? 'faculty' : regUserType;

      // 3. Insert profile row
      const { error: insertError } = await supabase.from('profiles').insert({
        id: userId,
        full_name: regFullName.trim(),
        email: regEmail.trim(),
        role: dbRole,
        id_number: regIdNumber.trim(),
        status: 'pending', // requires admin approval
      });

      if (insertError) {
        // Clean up auth user if profile insert fails
        await supabase.auth.signOut();
        if (insertError.message.includes('profiles_email_key')) {
          setError('An account with that email already exists.');
        } else if (insertError.message.includes('profiles_id_number_key')) {
          setError('An account with that ID number already exists.');
        } else {
          setError(insertError.message);
        }
        return;
      }

      // 4. Success — switch to sign in with a helpful message
      setMode('signin');
      setError('');
      // Show success feedback via the error field styled differently (handled below via successMsg)
      setSuccessMsg('Account created! Please wait for admin approval before signing in.');
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Success message state (separate from error)
  const [successMsg, setSuccessMsg] = useState('');

  // Clear messages when switching modes
  const switchMode = (m: 'signin' | 'signup') => {
    setMode(m);
    setError('');
    setSuccessMsg('');
  };

  // ─── Demo credentials ──────────────────────────────────────────────────────
  const DEMO_CREDENTIALS: Record<string, { email: string; password: string }> = {
    dean: { email: 'coed_dean94@gmail.com', password: 'your_dean_password_here' },
  };

  // ─── Quick Demo ────────────────────────────────────────────────────────────
  const handleDemoLogin = async (role: string) => {
    const creds = DEMO_CREDENTIALS[role];
    if (!creds) {
      // No real credentials stored for this demo role — bypass directly
      onLogin(role);
      return;
    }

    setError('');
    setLoading(true);
    try {
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: creds.email,
        password: creds.password,
      });

      if (authError) {
        setError(`Demo login failed: ${authError.message}`);
        return;
      }

      onLogin(role);
    } catch (err) {
      setError('Demo login failed. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-[#1E3A8A] via-[#2563EB] to-[#60A5FA]">
      {/* Back to Home Button */}
      {onBack && (
        <button
          onClick={onBack}
          className="absolute top-6 left-6 z-10 flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-md text-white rounded-xl hover:bg-white/30 transition-all border border-white/30 shadow-lg"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="font-semibold">Back to Home</span>
        </button>
      )}

      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-20 w-96 h-96 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-white/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-white/5 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      <div className="relative min-h-screen flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-12 items-center">
          {/* Left side - Branding */}
          <div className="text-white space-y-8 hidden lg:block">
            <div className="space-y-4">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-2xl border border-white/30">
                  <GraduationCap className="w-9 h-9 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold">COED</h1>
                  <p className="text-blue-100">Management System</p>
                </div>
              </div>

              <h2 className="text-4xl font-bold leading-tight">
                College of Education
                <span className="block text-blue-100 mt-2">
                  Information System
                </span>
              </h2>

              <p className="text-xl text-blue-100 leading-relaxed">
                Cebu Technological University – Argao Campus
              </p>
            </div>
          </div>

          {/* Right side - Login/Register Form */}
          <div className="relative">
            <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl p-6 lg:p-7 border border-white/20">
              {/* Mode Toggle */}
              <div className="flex items-center gap-2 p-1 bg-gray-100 rounded-2xl mb-6">
                <button
                  onClick={() => switchMode('signin')}
                  className={`flex-1 py-2.5 rounded-xl font-semibold transition-all ${
                    mode === 'signin'
                      ? 'bg-[#1E3A8A] text-white shadow-lg'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Sign In
                </button>
                <button
                  onClick={() => switchMode('signup')}
                  className={`flex-1 py-2.5 rounded-xl font-semibold transition-all ${
                    mode === 'signup'
                      ? 'bg-[#1E3A8A] text-white shadow-lg'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Register
                </button>
              </div>

              {/* ── Inline feedback banners (error / success) ── */}
              {error && (
                <div className="mb-4 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm font-medium">
                  {error}
                </div>
              )}
              {successMsg && (
                <div className="mb-4 px-4 py-3 rounded-xl bg-green-50 border border-green-200 text-green-700 text-sm font-medium">
                  {successMsg}
                </div>
              )}

              {/* ── SIGN IN FORM ── */}
              {mode === 'signin' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">
                      Welcome Back!
                    </h3>
                    <p className="text-gray-600">
                      Enter your ID number and password to continue
                    </p>
                  </div>

                  <div className="space-y-4">
                    {/* ID Number */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        ID Number
                      </label>
                      <div className="relative">
                        <IdCard className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="text"
                          placeholder="Student ID / Employee ID / Alumni ID"
                          value={loginIdNumber}
                          onChange={(e) => setLoginIdNumber(e.target.value)}
                          className="w-full pl-12 pr-4 py-4 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:outline-none transition-colors bg-white"
                        />
                      </div>
                    </div>

                    {/* Password */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Password
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type={showPassword ? 'text' : 'password'}
                          placeholder="Enter your password"
                          value={loginPassword}
                          onChange={(e) => setLoginPassword(e.target.value)}
                          className="w-full pl-12 pr-12 py-4 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:outline-none transition-colors bg-white"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>

                    {/* Role Selection */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Role <span className="text-red-500">*</span>
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {loginRoles.map((role) => (
                          <button
                            key={role.id}
                            onClick={() => setLoginRole(role.id)}
                            className={`p-2 rounded-lg border-2 transition-all text-center ${
                              loginRole === role.id
                                ? 'border-[#2563EB] bg-blue-50 scale-105'
                                : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                            }`}
                          >
                            <div className="text-xl mb-0.5">{role.icon}</div>
                            <div className="text-xs font-semibold text-gray-900 leading-tight">
                              {role.label}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Remember me & Forgot password */}
                    <div className="flex items-center justify-between text-sm">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" className="w-4 h-4 rounded accent-blue-600" />
                        <span className="text-gray-600">Remember me</span>
                      </label>
                      <button className="text-blue-600 font-semibold hover:text-blue-700">
                        Forgot Password?
                      </button>
                    </div>
                  </div>

                  {/* Sign In Button */}
                  <button
                    onClick={handleLogin}
                    disabled={loading}
                    className="w-full py-4 bg-[#1E3A8A] text-white rounded-xl font-semibold shadow-lg hover:bg-[#1E40AF] transition-all hover:scale-105 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
                  >
                    {loading ? 'Signing in…' : 'Sign In'}
                  </button>

                  {/* Quick Demo */}
                  <div className="pt-6 border-t border-gray-200">
                    <p className="text-sm text-gray-600 text-center mb-3">Quick Demo Access</p>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => handleDemoLogin('dean')}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                      >
                        👨‍💼 Dean Demo
                      </button>
                      <button
                        onClick={() => handleDemoLogin('student')}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                      >
                        🎓 Student Demo
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* ── REGISTER FORM ── */}
              {mode === 'signup' && (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-1">
                      Create Account
                    </h3>
                    <p className="text-sm text-gray-600">
                      Fill in your details to get started
                    </p>
                  </div>

                  <div className="space-y-3">
                    {/* Full Name */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                        Full Name <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="text"
                          placeholder="Juan Dela Cruz"
                          value={regFullName}
                          onChange={(e) => setRegFullName(e.target.value)}
                          className="w-full pl-10 pr-3 py-2.5 rounded-lg border-2 border-gray-200 focus:border-blue-500 focus:outline-none transition-colors bg-white text-sm"
                        />
                      </div>
                    </div>

                    {/* Email */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                        Email Address <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="text"
                          placeholder="your.email@example.com"
                          value={regEmail}
                          onChange={(e) => setRegEmail(e.target.value)}
                          className="w-full pl-10 pr-3 py-2.5 rounded-lg border-2 border-gray-200 focus:border-blue-500 focus:outline-none transition-colors bg-white text-sm"
                        />
                      </div>
                    </div>

                    {/* User Type Selection */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-2">
                        User Type <span className="text-red-500">*</span>
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {userTypes.map((type) => (
                          <button
                            key={type.id}
                            onClick={() => setRegUserType(type.id)}
                            className={`p-2 rounded-lg border-2 transition-all text-center ${
                              regUserType === type.id
                                ? 'border-[#2563EB] bg-blue-50 scale-105'
                                : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                            }`}
                          >
                            <div className="text-xl mb-0.5">{type.icon}</div>
                            <div className="text-xs font-semibold text-gray-900 leading-tight">
                              {type.label}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* ID Number */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                        ID Number <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <IdCard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="text"
                          placeholder={
                            regUserType === 'student' ? 'e.g., 2024-12345' :
                            regUserType === 'faculty' ? 'e.g., EMP-001' :
                            regUserType === 'alumni' ? 'e.g., ALU-001' :
                            'Your ID Number'
                          }
                          value={regIdNumber}
                          onChange={(e) => setRegIdNumber(e.target.value)}
                          className="w-full pl-10 pr-3 py-2.5 rounded-lg border-2 border-gray-200 focus:border-blue-500 focus:outline-none transition-colors bg-white text-sm"
                        />
                      </div>
                    </div>

                    {/* Password & Confirm Password - Side by side */}
                    <div className="grid grid-cols-2 gap-2">
                      {/* Password */}
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                          Password <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <input
                            type={showPassword ? 'text' : 'password'}
                            placeholder="Password"
                            value={regPassword}
                            onChange={(e) => setRegPassword(e.target.value)}
                            className="w-full pl-10 pr-9 py-2.5 rounded-lg border-2 border-gray-200 focus:border-blue-500 focus:outline-none transition-colors bg-white text-sm"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          >
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      {/* Confirm Password */}
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                          Confirm <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <input
                            type={showConfirmPassword ? 'text' : 'password'}
                            placeholder="Confirm"
                            value={regConfirmPassword}
                            onChange={(e) => setRegConfirmPassword(e.target.value)}
                            className="w-full pl-10 pr-9 py-2.5 rounded-lg border-2 border-gray-200 focus:border-blue-500 focus:outline-none transition-colors bg-white text-sm"
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          >
                            {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Register Button */}
                  <button
                    onClick={handleRegister}
                    disabled={loading}
                    className="w-full py-3 bg-[#1E3A8A] text-white rounded-xl font-semibold shadow-lg hover:bg-[#1E40AF] transition-all hover:scale-105 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
                  >
                    {loading ? 'Creating account…' : 'Create Account'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}