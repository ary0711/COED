import { useState } from 'react';
import { User, Lock, ArrowLeft, Mail, IdCard, Eye, EyeOff, CheckCircle, XCircle } from 'lucide-react';
import { supabase } from '../../supabaseClient';

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
  onForgotPassword?: () => void;
}

export function LoginPage({ onLogin, onBack, onForgotPassword }: LoginPageProps) {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  const [regFullName, setRegFullName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regUserType, setRegUserType] = useState('');
  const [regProgram, setRegProgram] = useState('');
  const [regIdNumber, setRegIdNumber] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [regGraduationYear, setRegGraduationYear] = useState('');
  const [passwordFocused, setPasswordFocused] = useState(false);

  const [fieldErrors, setFieldErrors] = useState<{
    fullName?: string;
    email?: string;
    idNumber?: string;
    username?: string;
    password?: string;
    confirmPassword?: string;
    graduationYear?: string;
  }>({});
  const [checkingUsername, setCheckingUsername] = useState(false);

  const userTypes = [
    { id: 'student', label: 'Student', icon: '🎓' },
    { id: 'faculty', label: 'Faculty/Employee', icon: '👨‍🏫' },
    { id: 'alumni', label: 'Alumni', icon: '🎖️' },
  ];

  const programs = [
    { id: 'BEEd', label: 'Bachelor of Elementary Education' },
    { id: 'BTLEd', label: 'Bachelor of Technology and Livelihood Education' },
    { id: 'BSEd-Math', label: 'Bachelor of Secondary Education - Major in Mathematics' },
    { id: 'BSEd-English', label: 'Bachelor of Secondary Education - Major in English' },
  ];

  const passwordChecks = {
    length: regPassword.length >= 8,
    uppercase: /[A-Z]/.test(regPassword),
    lowercase: /[a-z]/.test(regPassword),
    number: /\d/.test(regPassword),
    special: /[@$!%*?&.#_-]/.test(regPassword),
  };

  // --- Validation helpers ---
  const isValidEmail = (value: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());

  const COMMON_EMAIL_DOMAINS = [
    'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com',
    'icloud.com', 'aol.com', 'protonmail.com', 'live.com',
  ];

  const levenshteinDistance = (a: string, b: string) => {
    const dp: number[][] = Array.from({ length: a.length + 1 }, () => new Array(b.length + 1).fill(0));
    for (let i = 0; i <= a.length; i++) dp[i][0] = i;
    for (let j = 0; j <= b.length; j++) dp[0][j] = j;
    for (let i = 1; i <= a.length; i++) {
      for (let j = 1; j <= b.length; j++) {
        dp[i][j] = a[i - 1] === b[j - 1]
          ? dp[i - 1][j - 1]
          : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
      }
    }
    return dp[a.length][b.length];
  };

  const getEmailTypoSuggestion = (value: string): string | null => {
    const trimmed = value.trim().toLowerCase();
    const at = trimmed.lastIndexOf('@');
    if (at === -1) return null;
    const domain = trimmed.slice(at + 1);
    if (!domain || COMMON_EMAIL_DOMAINS.includes(domain)) return null;

    for (const known of COMMON_EMAIL_DOMAINS) {
      if (domain !== known && levenshteinDistance(domain, known) <= 2) {
        return known;
      }
    }
    return null;
  };

  const isValidFullName = (value: string) => {
    const trimmed = value.trim().replace(/\s+/g, ' ');
    return /^[A-Za-zÀ-ÖØ-öø-ÿ.'-]+(\s[A-Za-zÀ-ÖØ-öø-ÿ.'-]+)+$/.test(trimmed);
  };

  const isValidIdNumber = (idNumber: string, userType: string): boolean => {
    if (!/^\d+$/.test(idNumber)) return false;
    if (userType === 'student') return /^\d{7}$/.test(idNumber);
    if (userType === 'alumni') return /^\d{8}$/.test(idNumber);
    if (userType === 'faculty') return /^\d{6}$/.test(idNumber);
    return true;
  };

  const isValidGraduationYear = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return false;
    const year = parseInt(trimmed, 10);
    if (isNaN(year)) return false;
    const maxYear = new Date().getFullYear() + 1;
    return year >= 1900 && year <= maxYear;
  };

  const renderStatusIcon = (value: string, hasError: boolean, checking?: boolean) => {
    if (checking) return null;
    if (!value.trim()) return null;
    return hasError
      ? <XCircle className="w-4 h-4 text-red-500" />
      : <CheckCircle className="w-4 h-4 text-green-500" />;
  };

  const checkUsernameAvailability = async (username: string) => {
    const trimmed = username.trim();
    if (!trimmed) return;
    setCheckingUsername(true);
    try {
      const { data } = await supabase
        .from('users')
        .select('id')
        .eq('username', trimmed.toLowerCase())
        .maybeSingle();

      if (data) {
        setFieldErrors((prev) => ({ ...prev, username: 'This username is already taken. Please choose another.' }));
      } else {
        setFieldErrors((prev) => ({ ...prev, username: undefined }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setCheckingUsername(false);
    }
  };

  const handleLogin = async () => {
    setError('');
    if (!loginUsername.trim()) { setError('Please enter your username.'); return; }
    if (!loginPassword) { setError('Please enter your password.'); return; }

    setLoading(true);
    try {
      const res = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: loginUsername.trim(),
          password: loginPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Invalid username or password.'); return; }

      localStorage.setItem('token', data.token);

      const { profileId, fullName, idNumber, email, role } = data.user ?? {};

      if (profileId) {
        localStorage.setItem('userId', profileId);
      } else {
        localStorage.removeItem('userId');
      }
      localStorage.setItem('userFullName', fullName ?? loginUsername.trim());
      localStorage.setItem('userIdNumber', idNumber ?? '');
      localStorage.setItem('userEmail', email ?? '');

      const uiRole = DB_TO_UI_ROLE[role] ?? 'faculty';
      onLogin(uiRole);

    } catch (err) {
      setError("Incorrect username or password. Verify your details and try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    setError('');
    setSuccessMsg('');

    const newFieldErrors: typeof fieldErrors = {};

    if (!regFullName.trim()) {
      newFieldErrors.fullName = 'Please enter your full name.';
    } else if (!isValidFullName(regFullName)) {
      newFieldErrors.fullName = 'Please enter your first and last name.';
    }

    if (!regEmail.trim()) {
      newFieldErrors.email = 'Please enter your email address.';
    } else if (!isValidEmail(regEmail)) {
      newFieldErrors.email = 'Please enter a valid email address.';
    } else {
      const emailSuggestion = getEmailTypoSuggestion(regEmail);
      if (emailSuggestion) {
        newFieldErrors.email = `This looks like a typo. Did you mean "${emailSuggestion}"?`;
      }
    }

    if (!regIdNumber.trim()) {
      newFieldErrors.idNumber = 'Please enter your ID number.';
    } else if (!isValidIdNumber(regIdNumber, regUserType)) {
      if (regUserType === 'student') {
        newFieldErrors.idNumber = 'Student ID number must contain exactly 7 digits.';
      } else if (regUserType === 'alumni') {
        newFieldErrors.idNumber = 'Alumni ID number must contain exactly 8 digits.';
      } else if (regUserType === 'faculty') {
        newFieldErrors.idNumber = 'Faculty ID number must contain exactly 6 digits.';
      } else {
        newFieldErrors.idNumber = 'ID number should contain numbers only.';
      }
    }

    if (!regUsername.trim()) {
      newFieldErrors.username = 'Please enter a username.';
    } else if (fieldErrors.username) {
      newFieldErrors.username = fieldErrors.username;
    }

    if (regUserType === 'alumni') {
      if (!regGraduationYear.trim()) {
        newFieldErrors.graduationYear = 'Please enter your graduation year.';
      } else if (!isValidGraduationYear(regGraduationYear)) {
        newFieldErrors.graduationYear = `Please enter a valid year (1900–${new Date().getFullYear() + 1}).`;
      }
    }

    if (!regPassword) {
      newFieldErrors.password = 'Please enter a password.';
    } else {
      const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&.#_-])[A-Za-z\d@$!%*?&.#_-]{8,}$/;
      if (!passwordRegex.test(regPassword)) {
        newFieldErrors.password = 'Your password needs at least 8 characters, with an uppercase letter, a lowercase letter, a number, and a special character.';
      }
    }

    if (!regConfirmPassword) {
      newFieldErrors.confirmPassword = 'Please confirm your password.';
    } else if (regPassword !== regConfirmPassword) {
      newFieldErrors.confirmPassword = 'Please make sure your confirm password is the same as your password.';
    }

    setFieldErrors(newFieldErrors);
    if (Object.keys(newFieldErrors).length > 0) return;

    if (!regUserType) { setError('Please select a user type.'); return; }
    if (!regProgram) { setError('Please select your program.'); return; }

    setLoading(true);
    try {
      // Direct call to atomic backend registration endpoint
      const res = await fetch('http://localhost:5000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: regUsername.trim(),
          password: regPassword,
          role: regUserType,
          email: regEmail.trim(),
          full_name: regFullName.trim(),
          id_number: regIdNumber.trim(),
          department: regProgram,
          status: 'pending',
          graduation_year: regUserType === 'alumni' ? parseInt(regGraduationYear.trim(), 10) : undefined,
        }),
      });

      const regData = await res.json();

      if (!res.ok) {
        const msg: string = regData.error || '';
        const lower = msg.toLowerCase();
        if (lower.includes('username')) {
          setFieldErrors((prev) => ({ ...prev, username: msg }));
        } else if (lower.includes('password')) {
          setFieldErrors((prev) => ({ ...prev, password: msg }));
        } else if (lower.includes('email')) {
          setFieldErrors((prev) => ({ ...prev, email: msg }));
        } else if (lower.includes('id number')) {
          setFieldErrors((prev) => ({ ...prev, idNumber: msg }));
        } else {
          setError(msg || 'Something went wrong creating your account. Please try again.');
        }
        return;
      }

      // Reset form states on success
      setRegFullName('');
      setRegEmail('');
      setRegUserType('');
      setRegProgram('');
      setRegIdNumber('');
      setRegUsername('');
      setRegPassword('');
      setRegConfirmPassword('');
      setRegGraduationYear('');
      setFieldErrors({});

      setMode('signin');
      setSuccessMsg('Account created! Please wait for your department chairman to review and approve your account before you can sign in.');
    } catch (err) {
      console.error(err);
      setError('Connection to registration server failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const switchMode = (m: 'signin' | 'signup') => {
    setMode(m);
    setError('');
    setSuccessMsg('');
    setFieldErrors({});
    setPasswordFocused(false);
  };

  return (
    <div className="fixed inset-0 flex overflow-hidden">
      <div className="hidden lg:flex w-5/12 bg-[#0f2a5e] flex-col relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full border-[60px] border-white/5" />
          <div className="absolute -bottom-24 -left-24 w-96 h-96 rounded-full border-[60px] border-white/5" />
        </div>

        <button onClick={onBack}
          className="absolute top-6 left-6 z-20 w-10 h-10 flex items-center justify-center rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all border border-white/20"
          title="Back to Home">
          <ArrowLeft className="w-5 h-5" />
        </button>

        <div className="relative z-10 flex flex-col items-center justify-center flex-1 px-12 text-center">
          <div className="w-40 h-40 bg-white rounded-3xl flex items-center justify-center shadow-2xl mb-8 overflow-hidden">
            <img src="/COED LOGO.png" alt="COED Logo" className="w-36 h-36 object-contain"
              onError={(e) => {
                const el = e.currentTarget;
                el.style.display = 'none';
                const parent = el.parentElement;
                if (parent) parent.innerHTML = `<span class="text-[#0f2a5e] font-black text-2xl">COED</span>`;
              }} />
          </div>
          <h1 className="text-white text-3xl font-bold leading-snug mb-3">College of Education</h1>
          <h2 className="text-blue-300 text-xl font-semibold mb-4">Information System</h2>
          <p className="text-blue-200 text-sm leading-relaxed max-w-xs">
            Cebu Technological University<br />Argao Campus
          </p>
        </div>
      </div>

      <div className="flex-1 bg-white flex flex-col overflow-y-auto">
        <div className="flex items-center justify-between px-10 pt-7 pb-2 flex-shrink-0">
          <button onClick={onBack}
            className="lg:hidden w-9 h-9 flex items-center justify-center rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-100 transition-all"
            title="Back to Home">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="hidden lg:block" />
        </div>

        <div className="flex-1 flex flex-col justify-center px-10 lg:px-16 py-4">
          <div className={mode === 'signup' ? 'w-full max-w-2xl mx-auto' : 'w-full max-w-md mx-auto'}>
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

            {mode === 'signin' && (
              <div className="space-y-5">
                <div>
                  <h3 className="text-3xl font-bold text-gray-900">Welcome back!</h3>
                  <p className="text-gray-500 text-sm mt-1">Please enter your details to sign in</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Username</label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input type="text" placeholder="Enter your username"
                      value={loginUsername}
                      onChange={(e) => setLoginUsername(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:border-[#1d4ed8] focus:ring-2 focus:ring-blue-100 focus:outline-none transition-all text-sm" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter your password"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                      className="w-full pl-10 pr-11 py-3 rounded-xl border border-gray-200 focus:border-[#1d4ed8] focus:ring-2 focus:ring-blue-100 focus:outline-none transition-all text-sm" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" className="w-4 h-4 rounded accent-blue-600" />
                    <span className="text-gray-600">Remember me</span>
                  </label>
                  <button onClick={onForgotPassword} className="text-[#1d4ed8] font-medium hover:underline">
                    Forgot password?
                  </button>
                </div>

                <button onClick={handleLogin} disabled={loading}
                  className="w-full py-3.5 bg-[#1d4ed8] text-white rounded-xl font-semibold text-sm hover:bg-[#1e40af] transition-all disabled:opacity-60 disabled:cursor-not-allowed shadow-lg shadow-blue-200">
                  {loading ? 'Signing in…' : 'Sign In →'}
                </button>

                <p className="text-center text-sm text-gray-500">
                  Don't have an account?{' '}
                  <button onClick={() => switchMode('signup')} className="text-[#1d4ed8] font-semibold hover:underline">
                    Register
                  </button>
                </p>
              </div>
            )}

            {mode === 'signup' && (
              <div className="space-y-3">
                <div>
                  <h3 className="text-3xl font-bold text-gray-900">Create Account</h3>
                  <p className="text-gray-500 text-sm mt-1">Fill in your details to get started</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input type="text" placeholder="Juan Dela Cruz" value={regFullName}
                      onChange={(e) => {
                        const value = e.target.value;
                        setRegFullName(value);
                        if (!value.trim()) {
                          setFieldErrors((p) => ({ ...p, fullName: undefined }));
                        } else if (!isValidFullName(value)) {
                          setFieldErrors((p) => ({ ...p, fullName: 'Please enter your first and last name.' }));
                        } else {
                          setFieldErrors((p) => ({ ...p, fullName: undefined }));
                        }
                      }}
                      onBlur={() => {
                        if (!regFullName.trim()) setFieldErrors((p) => ({ ...p, fullName: 'Please enter your full name.' }));
                        else if (!isValidFullName(regFullName)) setFieldErrors((p) => ({ ...p, fullName: 'Please enter your first and last name.' }));
                      }}
                      className={`w-full pl-10 pr-9 py-3 rounded-xl border ${fieldErrors.fullName ? 'border-red-400' : 'border-gray-200'} focus:border-[#1d4ed8] focus:ring-2 focus:ring-blue-100 focus:outline-none transition-all text-sm`} />
                    <span className="absolute right-3.5 top-1/2 -translate-y-1/2">
                      {renderStatusIcon(regFullName, !!fieldErrors.fullName)}
                    </span>
                  </div>
                  {fieldErrors.fullName && <p className="text-red-500 text-xs mt-1">{fieldErrors.fullName}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Email Address <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input type="text" placeholder="your.email@example.com" value={regEmail}
                      onChange={(e) => {
                        const value = e.target.value;
                        setRegEmail(value);
                        if (!value.trim()) {
                          setFieldErrors((p) => ({ ...p, email: undefined }));
                        } else if (!isValidEmail(value)) {
                          setFieldErrors((p) => ({ ...p, email: 'Please enter a valid email address.' }));
                        } else {
                          const suggestion = getEmailTypoSuggestion(value);
                          setFieldErrors((p) => ({ ...p, email: suggestion ? `This looks like a typo. Did you mean "${suggestion}"?` : undefined }));
                        }
                      }}
                      onBlur={() => {
                        const suggestion = getEmailTypoSuggestion(regEmail);
                        if (!regEmail.trim()) setFieldErrors((p) => ({ ...p, email: 'Please enter your email address.' }));
                        else if (!isValidEmail(regEmail)) setFieldErrors((p) => ({ ...p, email: 'Please enter a valid email address.' }));
                        else if (suggestion) setFieldErrors((p) => ({ ...p, email: `This looks like a typo. Did you mean "${suggestion}"?` }));
                      }}
                      className={`w-full pl-10 pr-9 py-3 rounded-xl border ${fieldErrors.email ? 'border-red-400' : 'border-gray-200'} focus:border-[#1d4ed8] focus:ring-2 focus:ring-blue-100 focus:outline-none transition-all text-sm`} />
                    <span className="absolute right-3.5 top-1/2 -translate-y-1/2">
                      {renderStatusIcon(regEmail, !!fieldErrors.email)}
                    </span>
                  </div>
                  {fieldErrors.email && <p className="text-red-500 text-xs mt-1">{fieldErrors.email}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">User Type <span className="text-red-500">*</span></label>
                  <div className="grid grid-cols-3 gap-2">
                    {userTypes.map((type) => (
                      <button key={type.id} type="button" onClick={() => setRegUserType(type.id)}
                        className={`py-2.5 rounded-xl border-2 transition-all text-center ${
                          regUserType === type.id ? 'border-[#1d4ed8] bg-blue-50' : 'border-gray-200 hover:border-blue-200 hover:bg-gray-50'
                        }`}>
                        <div className="text-xl mb-0.5">{type.icon}</div>
                        <div className="text-xs font-semibold text-gray-700">{type.label}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Program <span className="text-red-500">*</span></label>
                  <select
                    value={regProgram}
                    onChange={(e) => setRegProgram(e.target.value)}
                    className="w-full px-3.5 py-3 rounded-xl border border-gray-200 focus:border-[#1d4ed8] focus:ring-2 focus:ring-blue-100 focus:outline-none transition-all text-sm bg-white text-gray-700">
                    <option value="" disabled>Select your program</option>
                    {programs.map((p) => (
                      <option key={p.id} value={p.id}>{p.label}</option>
                    ))}
                  </select>
                </div>

                {regUserType === 'alumni' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Graduation Year <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      placeholder="2020"
                      value={regGraduationYear}
                      onChange={(e) => {
                        const value = e.target.value;
                        setRegGraduationYear(value);
                        if (!value.trim()) {
                          setFieldErrors((p) => ({ ...p, graduationYear: undefined }));
                        } else if (!isValidGraduationYear(value)) {
                          setFieldErrors((p) => ({ ...p, graduationYear: `Please enter a valid year (1900–${new Date().getFullYear() + 1}).` }));
                        } else {
                          setFieldErrors((p) => ({ ...p, graduationYear: undefined }));
                        }
                      }}
                      onBlur={() => {
                        if (!regGraduationYear.trim()) setFieldErrors((p) => ({ ...p, graduationYear: 'Please enter your graduation year.' }));
                        else if (!isValidGraduationYear(regGraduationYear)) setFieldErrors((p) => ({ ...p, graduationYear: `Please enter a valid year (1900–${new Date().getFullYear() + 1}).` }));
                      }}
                      className={`w-full px-3.5 py-3 rounded-xl border ${fieldErrors.graduationYear ? 'border-red-400' : 'border-gray-200'} focus:border-[#1d4ed8] focus:ring-2 focus:ring-blue-100 focus:outline-none transition-all text-sm`}
                    />
                    {fieldErrors.graduationYear && <p className="text-red-500 text-xs mt-1">{fieldErrors.graduationYear}</p>}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      ID Number <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <IdCard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        inputMode="numeric"
                        placeholder={
                          regUserType === 'student'
                            ? 'Enter 7-digit ID'
                            : regUserType === 'alumni'
                            ? 'Enter 8-digit ID'
                            : 'Enter 6-digit ID'
                        }
                        value={regIdNumber}
                        maxLength={
                          regUserType === 'student'
                            ? 7
                            : regUserType === 'alumni'
                            ? 8
                            : regUserType === 'faculty'
                            ? 6
                            : undefined
                        }
                        onChange={(e) => {
                          let value = e.target.value.replace(/\D/g, '');
                          if (regUserType === 'student') value = value.slice(0, 7);
                          else if (regUserType === 'alumni') value = value.slice(0, 8);
                          else if (regUserType === 'faculty') value = value.slice(0, 6);

                          setRegIdNumber(value);
                          setFieldErrors((prev) => ({ ...prev, idNumber: undefined }));
                        }}
                        onBlur={() => {
                          if (!regIdNumber.trim()) {
                            setFieldErrors((p) => ({ ...p, idNumber: 'Please enter your ID number.' }));
                          } else if (!isValidIdNumber(regIdNumber, regUserType)) {
                            if (regUserType === 'student') {
                              setFieldErrors((p) => ({ ...p, idNumber: 'Student ID number must contain exactly 7 digits.' }));
                            } else if (regUserType === 'alumni') {
                              setFieldErrors((p) => ({ ...p, idNumber: 'Alumni ID number must contain exactly 8 digits.' }));
                            } else if (regUserType === 'faculty') {
                              setFieldErrors((p) => ({ ...p, idNumber: 'Faculty ID number must contain exactly 6 digits.' }));
                            } else {
                              setFieldErrors((p) => ({ ...p, idNumber: 'ID number should contain numbers only.' }));
                            }
                          }
                        }}
                        className={`w-full pl-9 pr-8 py-3 rounded-xl border ${
                          fieldErrors.idNumber ? 'border-red-400' : 'border-gray-200'
                        } focus:border-[#1d4ed8] focus:ring-2 focus:ring-blue-100 focus:outline-none transition-all text-sm`}
                      />
                      <span className="absolute right-2.5 top-1/2 -translate-y-1/2">
                        {renderStatusIcon(regIdNumber, !!fieldErrors.idNumber)}
                      </span>
                    </div>
                    {regUserType === 'student' && <p className="text-gray-400 text-xs mt-1">Student ID must be exactly 7 digits.</p>}
                    {regUserType === 'alumni' && <p className="text-gray-400 text-xs mt-1">Alumni ID must be exactly 8 digits.</p>}
                    {regUserType === 'faculty' && <p className="text-gray-400 text-xs mt-1">Faculty ID must be exactly 6 digits.</p>}
                    {fieldErrors.idNumber && <p className="text-red-500 text-xs mt-1">{fieldErrors.idNumber}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Username <span className="text-red-500">*</span></label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input type="text" placeholder="juan.delacruz"
                        value={regUsername}
                        onChange={(e) => {
                          setRegUsername(e.target.value);
                          if (fieldErrors.username) setFieldErrors((p) => ({ ...p, username: undefined }));
                        }}
                        onBlur={() => {
                          if (!regUsername.trim()) {
                            setFieldErrors((p) => ({ ...p, username: 'Please enter a username.' }));
                            return;
                          }
                          checkUsernameAvailability(regUsername);
                        }}
                        className={`w-full pl-9 pr-8 py-3 rounded-xl border ${fieldErrors.username ? 'border-red-400' : 'border-gray-200'} focus:border-[#1d4ed8] focus:ring-2 focus:ring-blue-100 focus:outline-none transition-all text-sm`} />
                      <span className="absolute right-2.5 top-1/2 -translate-y-1/2">
                        {renderStatusIcon(regUsername, !!fieldErrors.username, checkingUsername)}
                      </span>
                    </div>
                    {checkingUsername && !fieldErrors.username && (
                      <p className="text-gray-400 text-xs mt-1">Checking availability…</p>
                    )}
                    {fieldErrors.username && <p className="text-red-500 text-xs mt-1">{fieldErrors.username}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="relative">
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Password <span className="text-red-500">*</span></label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Min 8 chars, Aa1@"
                        value={regPassword}
                        onChange={(e) => {
                          const value = e.target.value;
                          setRegPassword(value);
                          if (fieldErrors.password) setFieldErrors((p) => ({ ...p, password: undefined }));

                          if (regConfirmPassword) {
                            if (value !== regConfirmPassword) {
                              setFieldErrors((p) => ({ ...p, confirmPassword: 'Please make sure your confirm password is the same as your password.' }));
                            } else {
                              setFieldErrors((p) => ({ ...p, confirmPassword: undefined }));
                            }
                          }
                        }}
                        onFocus={() => setPasswordFocused(true)}
                        onBlur={() => setTimeout(() => setPasswordFocused(false), 150)}
                        className={`w-full pl-10 pr-9 py-3 rounded-xl border ${fieldErrors.password ? 'border-red-400' : 'border-gray-200'} focus:border-[#1d4ed8] focus:ring-2 focus:ring-blue-100 focus:outline-none transition-all text-sm`} />
                      <button type="button" onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {fieldErrors.password && <p className="text-red-500 text-xs mt-1">{fieldErrors.password}</p>}

                    {passwordFocused && (
                      <div className="absolute left-0 right-0 top-full mt-2 z-20 bg-[#241f1a] rounded-xl shadow-xl p-3 space-y-1.5">
                        <div className="absolute -top-1.5 left-6 w-3 h-3 bg-[#241f1a] rotate-45" />
                        {[
                          { ok: passwordChecks.length, label: 'At least 8 characters' },
                          { ok: passwordChecks.uppercase, label: 'One uppercase letter (A-Z)' },
                          { ok: passwordChecks.lowercase, label: 'One lowercase letter (a-z)' },
                          { ok: passwordChecks.number, label: 'One number (0-9)' },
                          { ok: passwordChecks.special, label: 'One special character (@, #, !, etc.)' },
                        ].map((c, i) => (
                          <p key={i} className={`text-xs flex items-center gap-1.5 ${c.ok ? 'text-green-400' : 'text-gray-300'}`}>
                            <span className={c.ok ? 'text-green-400' : 'text-gray-500'}>{c.ok ? '✓' : '✗'}</span>
                            {c.label}
                          </p>
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Confirm <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        placeholder="Confirm password"
                        value={regConfirmPassword}
                        onChange={(e) => {
                          const value = e.target.value;
                          setRegConfirmPassword(value);
                          if (!value) {
                            setFieldErrors((p) => ({ ...p, confirmPassword: 'Please confirm your password.' }));
                          } else if (value !== regPassword) {
                            setFieldErrors((p) => ({ ...p, confirmPassword: 'Please make sure your confirm password is the same as your password.' }));
                          } else {
                            setFieldErrors((p) => ({ ...p, confirmPassword: undefined }));
                          }
                        }}
                        className={`w-full pl-10 pr-9 py-3 rounded-xl border ${
                          fieldErrors.confirmPassword ? 'border-red-400' : 'border-gray-200'
                        } focus:border-[#1d4ed8] focus:ring-2 focus:ring-blue-100 focus:outline-none transition-all text-sm`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {fieldErrors.confirmPassword && (
                      <p className="text-red-500 text-xs mt-1">{fieldErrors.confirmPassword}</p>
                    )}
                  </div>
                </div>

                <button onClick={handleRegister} disabled={loading || checkingUsername}
                  className="w-full py-3.5 bg-[#1d4ed8] text-white rounded-xl font-semibold text-sm hover:bg-[#1e40af] transition-all disabled:opacity-60 disabled:cursor-not-allowed shadow-lg shadow-blue-200">
                  {loading ? 'Creating account…' : checkingUsername ? 'Checking username…' : 'Create Account →'}
                </button>

                <p className="text-center text-sm text-gray-500">
                  Already have an account?{' '}
                  <button onClick={() => switchMode('signin')} className="text-[#1d4ed8] font-semibold hover:underline">
                    Sign In
                  </button>
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}