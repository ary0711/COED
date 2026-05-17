import { useState } from 'react';
import { User, Lock, ArrowLeft, Mail, IdCard, Eye, EyeOff } from 'lucide-react';
import { supabase } from '../../supabaseClient';

// ─── Role mappings ───────────────────────────────────────────────────────────

const DB_TO_UI_ROLE: Record<string, string> = {
  dean: 'dean',
  department_chair: 'chair',
  faculty: 'faculty',
  staff: 'faculty',
  student: 'student',
  alumni: 'alumni',
  admin: 'dean',
};

interface LoginPageProps {
  onLogin: (role: string) => void;
  onBack?: () => void;
}

export function LoginPage({ onLogin, onBack }: LoginPageProps) {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Login fields
  const [loginIdNumber, setLoginIdNumber] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register fields
  const [regFullName, setRegFullName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regUserType, setRegUserType] = useState('');
  const [regIdNumber, setRegIdNumber] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');

  const userTypes = [
    { id: 'student', label: 'Student',          icon: '🎓' },
    { id: 'faculty', label: 'Faculty/Employee', icon: '👨‍🏫' },
    { id: 'alumni',  label: 'Alumni',           icon: '🎖️' },
  ];

  // ─── Sign In (No role selection) ───────────────────────────────────────
  const handleLogin = async () => {
    setError('');
    if (!loginIdNumber.trim()) { setError('Please enter your ID number.'); return; }
    if (!loginPassword)        { setError('Please enter your password.'); return; }

    setLoading(true);
    try {
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

      const { error: authError } = await supabase.auth.signInWithPassword({
        email: profile.email,
        password: loginPassword,
      });

      if (authError) {
        setError(authError.message.toLowerCase().includes('invalid')
          ? 'Incorrect password. Please try again.'
          : authError.message);
        return;
      }

      // Get the correct UI role from database role
      const uiRole = DB_TO_UI_ROLE[profile.role] ?? 'faculty';
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
    if (!regFullName.trim())            { setError('Full name is required.'); return; }
    if (!regEmail.trim())               { setError('Email address is required.'); return; }
    if (!regUserType)                   { setError('Please select a user type.'); return; }
    if (!regIdNumber.trim())            { setError('ID number is required.'); return; }
    if (!regPassword)                   { setError('Password is required.'); return; }
    if (regPassword.length < 6)         { setError('Password must be at least 6 characters.'); return; }
    if (regPassword !== regConfirmPassword) { setError('Passwords do not match.'); return; }

    setLoading(true);
    try {
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: regEmail.trim(),
        password: regPassword,
      });

      if (signUpError) { setError(signUpError.message); return; }

      const userId = authData.user?.id;
      if (!userId) { setError('Registration failed. Please try again.'); return; }

      const { error: insertError } = await supabase.from('profiles').insert({
        id: userId,
        full_name: regFullName.trim(),
        email: regEmail.trim(),
        role: regUserType === 'faculty' ? 'faculty' : regUserType,
        id_number: regIdNumber.trim(),
        status: 'pending',
      });

      if (insertError) {
        await supabase.auth.signOut();
        if (insertError.message.includes('profiles_email_key'))
          setError('An account with that email already exists.');
        else if (insertError.message.includes('profiles_id_number_key'))
          setError('An account with that ID number already exists.');
        else
          setError(insertError.message);
        return;
      }

      setMode('signin');
      setError('');
      setSuccessMsg('Account created! Please wait for admin approval before signing in.');
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const switchMode = (m: 'signin' | 'signup') => {
    setMode(m);
    setError('');
    setSuccessMsg('');
  };

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 flex overflow-hidden">

      {/* ══════════════════════════════════════════
          LEFT PANEL — full height, dark navy
      ══════════════════════════════════════════ */}
      <div className="hidden lg:flex w-5/12 bg-[#0f2a5e] flex-col relative overflow-hidden">

        {/* Decorative circles */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full border-[60px] border-white/5" />
          <div className="absolute -bottom-24 -left-24 w-96 h-96 rounded-full border-[60px] border-white/5" />
        </div>

        {/* Back arrow — absolute top-left of left panel */}
        <button
          onClick={onBack}
          className="absolute top-6 left-6 z-20 w-10 h-10 flex items-center justify-center rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all border border-white/20"
          title="Back to Home"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        {/* Content — vertically centered */}
        <div className="relative z-10 flex flex-col items-center justify-center flex-1 px-12 text-center">

          {/* COED Logo */}
          <div className="w-24 h-24 bg-white rounded-3xl flex items-center justify-center shadow-2xl mb-8 overflow-hidden">
            <img
              src="/COED LOGO.png"
              alt="COED Logo"
              className="w-20 h-20 object-contain"
              onError={(e) => {
                const el = e.currentTarget;
                el.style.display = 'none';
                const parent = el.parentElement;
                if (parent) {
                  parent.innerHTML = `<span class="text-[#0f2a5e] font-black text-2xl">COED</span>`;
                }
              }}
            />
          </div>

          {/* Title */}
          <h1 className="text-white text-3xl font-bold leading-snug mb-3">
            College of Education
          </h1>
          <h2 className="text-blue-300 text-xl font-semibold mb-4">
            Information System
          </h2>
          <p className="text-blue-200 text-sm leading-relaxed max-w-xs">
            Cebu Technological University<br />Argao Campus
          </p>
        </div>

      </div>

      {/* ══════════════════════════════════════════
          RIGHT PANEL — full height, white
      ══════════════════════════════════════════ */}
      <div className="flex-1 bg-white flex flex-col overflow-y-auto">

        {/* Top bar */}
        <div className="flex items-center justify-between px-10 pt-7 pb-2 flex-shrink-0">

          {/* Mobile-only back button (hidden on lg since left panel has it) */}
          <button
            onClick={onBack}
            className="lg:hidden w-9 h-9 flex items-center justify-center rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-100 transition-all"
            title="Back to Home"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="hidden lg:block" />

          {/* "Already have an account?" only shown in signup mode */}
          {mode === 'signup' && (
            <div className="flex items-center gap-1 text-sm">
              <span className="text-gray-500">Already have an account?</span>
              <button
                onClick={() => switchMode('signin')}
                className="text-[#1d4ed8] font-semibold hover:underline ml-1"
              >
                Sign In
              </button>
            </div>
          )}
        </div>

        {/* Form — centered in remaining space */}
        <div className="flex-1 flex flex-col justify-center px-10 lg:px-16 py-8">
          <div className="w-full max-w-md mx-auto">

            {/* Feedback banners */}
            {error && (
              <div className="mb-5 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm font-medium">
                {error}
              </div>
            )}
            {successMsg && (
              <div className="mb-5 px-4 py-3 rounded-xl bg-green-50 border border-green-200 text-green-700 text-sm font-medium">
                {successMsg}
              </div>
            )}

            {/* ── SIGN IN FORM ── */}
            {mode === 'signin' && (
              <div className="space-y-5">
                <div>
                  <h3 className="text-3xl font-bold text-gray-900">Welcome back!</h3>
                  <p className="text-gray-500 text-sm mt-1">Please enter your details to sign in to your account</p>
                </div>

                {/* ID Number */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">ID Number</label>
                  <div className="relative">
                    <IdCard className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Student ID / Employee ID / Alumni ID"
                      value={loginIdNumber}
                      onChange={(e) => setLoginIdNumber(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:border-[#1d4ed8] focus:ring-2 focus:ring-blue-100 focus:outline-none transition-all text-sm"
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="minimum 6 characters"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                      className="w-full pl-10 pr-11 py-3 rounded-xl border border-gray-200 focus:border-[#1d4ed8] focus:ring-2 focus:ring-blue-100 focus:outline-none transition-all text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                

                {/* Remember & Forgot */}
                <div className="flex items-center justify-between text-sm">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" className="w-4 h-4 rounded accent-blue-600" />
                    <span className="text-gray-600">Remember me</span>
                  </label>
                  <button className="text-[#1d4ed8] font-medium hover:underline">
                    Forgot password?
                  </button>
                </div>

                {/* Sign In Button */}
                <button
                  onClick={handleLogin}
                  disabled={loading}
                  className="w-full py-3.5 bg-[#1d4ed8] text-white rounded-xl font-semibold text-sm hover:bg-[#1e40af] transition-all disabled:opacity-60 disabled:cursor-not-allowed shadow-lg shadow-blue-200"
                >
                  {loading ? 'Signing in…' : 'Sign In →'}
                </button>

                {/* Register link — below the sign in button */}
                <p className="text-center text-sm text-gray-500">
                  Don't have an account?{' '}
                  <button
                    onClick={() => switchMode('signup')}
                    className="text-[#1d4ed8] font-semibold hover:underline"
                  >
                    Register
                  </button>
                </p>
              </div>
            )}

            {/* ── REGISTER FORM ── */}
            {mode === 'signup' && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-3xl font-bold text-gray-900">Create Account</h3>
                  <p className="text-gray-500 text-sm mt-1">Fill in your details to get started</p>
                </div>

                {/* Full Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Juan Dela Cruz"
                      value={regFullName}
                      onChange={(e) => setRegFullName(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:border-[#1d4ed8] focus:ring-2 focus:ring-blue-100 focus:outline-none transition-all text-sm"
                    />
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Email Address <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="your.email@example.com"
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:border-[#1d4ed8] focus:ring-2 focus:ring-blue-100 focus:outline-none transition-all text-sm"
                    />
                  </div>
                </div>

                {/* User Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">User Type <span className="text-red-500">*</span></label>
                  <div className="grid grid-cols-3 gap-2">
                    {userTypes.map((type) => (
                      <button
                        key={type.id}
                        onClick={() => setRegUserType(type.id)}
                        className={`py-3 rounded-xl border-2 transition-all text-center ${
                          regUserType === type.id
                            ? 'border-[#1d4ed8] bg-blue-50'
                            : 'border-gray-200 hover:border-blue-200 hover:bg-gray-50'
                        }`}
                      >
                        <div className="text-xl mb-0.5">{type.icon}</div>
                        <div className="text-xs font-semibold text-gray-700">{type.label}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* ID Number */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">ID Number <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <IdCard className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder={
                        regUserType === 'student' ? 'e.g., 2024-12345' :
                        regUserType === 'faculty' ? 'e.g., EMP-001'    :
                        regUserType === 'alumni'  ? 'e.g., ALU-001'    :
                        'Your ID Number'
                      }
                      value={regIdNumber}
                      onChange={(e) => setRegIdNumber(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:border-[#1d4ed8] focus:ring-2 focus:ring-blue-100 focus:outline-none transition-all text-sm"
                    />
                  </div>
                </div>

                {/* Password & Confirm */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Password <span className="text-red-500">*</span></label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Password"
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        className="w-full pl-10 pr-9 py-3 rounded-xl border border-gray-200 focus:border-[#1d4ed8] focus:ring-2 focus:ring-blue-100 focus:outline-none transition-all text-sm"
                      />
                      <button type="button" onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirm <span className="text-red-500">*</span></label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        placeholder="Confirm"
                        value={regConfirmPassword}
                        onChange={(e) => setRegConfirmPassword(e.target.value)}
                        className="w-full pl-10 pr-9 py-3 rounded-xl border border-gray-200 focus:border-[#1d4ed8] focus:ring-2 focus:ring-blue-100 focus:outline-none transition-all text-sm"
                      />
                      <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Register Button */}
                <button
                  onClick={handleRegister}
                  disabled={loading}
                  className="w-full py-3.5 bg-[#1d4ed8] text-white rounded-xl font-semibold text-sm hover:bg-[#1e40af] transition-all disabled:opacity-60 disabled:cursor-not-allowed shadow-lg shadow-blue-200"
                >
                  {loading ? 'Creating account…' : 'Create Account →'}
                </button>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}