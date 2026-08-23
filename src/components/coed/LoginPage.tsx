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

// Maps each program code to its exact department name in the `departments`
// table. BSEd is split into two separate, independently-selectable
// programs — Math and English — because department_id is a single value
// on student_profiles/faculty_profiles/alumni_profiles, so a combined
// "Math & English" option could never map to exactly one department row.
// Used for ALL registering roles (student, faculty, alumni) so that
// every role ends up scoped to a real department_id at signup — this is
// what lets a Department Chair's approval queue filter correctly by
// department for every account type, not just students.
const PROGRAM_TO_DEPARTMENT: Record<string, string> = {
  'BEEd':         'Bachelor of Elementary Education Program',
  'BTLEd':        'Bachelor of Technology and Livelihood Education Program',
  // Math and English are two majors under one combined BSEd department
  // (one chair oversees both) — there is only one row for this in
  // `departments`, so both program codes map to the same name.
  'BSEd-Math':    'Bachelor of Secondary Education Major in Mathematics & English Program',
  'BSEd-English': 'Bachelor of Secondary Education Major in Mathematics & English Program',
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
    graduationYear?: string;
  }>({});
  const [checkingUsername, setCheckingUsername] = useState(false);

  const userTypes = [
    { id: 'student', label: 'Student',          icon: '🎓' },
    { id: 'faculty', label: 'Faculty/Employee', icon: '👨‍🏫' },
    { id: 'alumni',  label: 'Alumni',           icon: '🎖️' },
  ];

  const programs = [
    { id: 'BEEd',         label: 'Bachelor of Elementary Education' },
    { id: 'BTLEd',        label: 'Bachelor of Technology and Livelihood Education' },
    { id: 'BSEd-Math',    label: 'Bachelor of Secondary Education - Major in Mathematics' },
    { id: 'BSEd-English', label: 'Bachelor of Secondary Education - Major in English' },
  ];

  const passwordChecks = {
    length:    regPassword.length >= 8,
    uppercase: /[A-Z]/.test(regPassword),
    lowercase: /[a-z]/.test(regPassword),
    number:    /\d/.test(regPassword),
    special:   /[@$!%*?&.#_-]/.test(regPassword),
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

  const isValidIdNumber = (value: string, userType: string) => {
    const trimmed = value.trim();
    if (!trimmed) return false;
    if (userType === 'student') {
      return /^\d+$/.test(trimmed);
    }
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
        .eq('username', trimmed)
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

  const rollbackRegistration = async (userId: string) => {
    try {
      await supabase.from('profiles').delete().eq('id', userId);
    } catch (err) {
      console.error('Failed to roll back profiles row:', err);
    }
    try {
      await fetch('http://localhost:5000/api/auth/cleanup-failed-registration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
    } catch (err) {
      console.error('Failed to roll back auth user:', err);
    }
  };

  // Looks up the departments.id row matching a program code. Shared by
  // student, faculty, and alumni registration so every role gets scoped
  // to a real department, not just students.
  const lookupDepartmentId = async (program: string): Promise<{ id: string } | null> => {
    const departmentName = PROGRAM_TO_DEPARTMENT[program];
    if (!departmentName) return null;

    const { data: deptRow, error: deptError } = await supabase
      .from('departments')
      .select('id')
      .eq('name', departmentName)
      .maybeSingle();

    if (deptError || !deptRow) return null;
    return deptRow;
  };

  const handleLogin = async () => {
    setError('');
    if (!loginUsername.trim()) { setError('Please enter your username.'); return; }
    if (!loginPassword)        { setError('Please enter your password.'); return; }

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
      newFieldErrors.idNumber = 'ID number should contain numbers only.';
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

    setFieldErrors(newFieldErrors);
    if (Object.keys(newFieldErrors).length > 0) return;

    if (!regUserType) { setError('Please select a user type.'); return; }
    if (!regProgram)  { setError('Please select your program.'); return; }
    if (!regPassword) { setError('Please enter a password.'); return; }

    const passwordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&.#_-])[A-Za-z\d@$!%*?&.#_-]{8,}$/;
    if (!passwordRegex.test(regPassword)) {
      setError('Your password needs at least 8 characters, with an uppercase letter, a lowercase letter, a number, and a special character.');
      return;
    }
    if (regPassword !== regConfirmPassword) { setError('Passwords do not match.'); return; }

    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('username', regUsername.trim())
      .maybeSingle();

    if (existingUser) {
      setFieldErrors((prev) => ({ ...prev, username: 'This username is already taken. Please choose another.' }));
      return;
    }

    setLoading(true);
    try {
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: regEmail.trim(),
        password: regPassword,
      });

      if (signUpError) {
        const msg = signUpError.message.toLowerCase();
        if (msg.includes('already registered') || msg.includes('already exists')) {
          setFieldErrors((prev) => ({ ...prev, email: 'An account with this email already exists.' }));
        } else if (msg.includes('email') && (msg.includes('invalid') || msg.includes('format'))) {
          setFieldErrors((prev) => ({ ...prev, email: 'Please enter a valid email address.' }));
        } else if (msg.includes('password')) {
          setFieldErrors((prev) => ({ ...prev, password: 'Please choose a stronger password and try again.' }));
        } else if (msg.includes('rate limit')) {
          setError('Too many attempts. Please wait a few minutes and try again.');
        } else {
          console.error(signUpError.message);
          setError("We couldn't create your account. Please check your details and try again.");
        }
        return;
      }

      const userId = authData.user?.id;
      if (!userId) { setError('Registration failed. Please try again.'); return; }

      const { error: insertError } = await supabase.from('profiles').insert({
        id: userId,
        full_name: regFullName.trim(),
        email: regEmail.trim(),
        role: regUserType === 'faculty' ? 'faculty' : regUserType,
        program: regProgram,
        id_number: regIdNumber.trim(),
        status: 'pending',
      });

      if (insertError) {
        await supabase.auth.signOut();
        const msg = insertError.message.toLowerCase();
        if (msg.includes('profiles_email_key')) {
          setFieldErrors((prev) => ({ ...prev, email: 'An account with this email already exists.' }));
        } else if (msg.includes('profiles_id_number_key')) {
          setFieldErrors((prev) => ({ ...prev, idNumber: 'This ID number is already registered.' }));
        } else if (msg.includes('null value') && msg.includes('full_name')) {
          setFieldErrors((prev) => ({ ...prev, fullName: 'Please enter your full name.' }));
        } else if (msg.includes('null value') && msg.includes('email')) {
          setFieldErrors((prev) => ({ ...prev, email: 'Please enter your email address.' }));
        } else if (msg.includes('null value') && msg.includes('id_number')) {
          setFieldErrors((prev) => ({ ...prev, idNumber: 'Please enter your ID number.' }));
        } else if (msg.includes('null value') && msg.includes('program')) {
          setError('Please select your program.');
        } else if (msg.includes('check constraint') || msg.includes('invalid input value')) {
          setError('One of the details you entered is not valid. Please review your information and try again.');
        } else {
          console.error(insertError.message);
          setError('Something went wrong saving your details. Please check your information and try again.');
        }
        return;
      }

      // Every role's own profile table now gets a department_id derived
      // from the selected program (each program maps to exactly one
      // department) — this is what lets a Department Chair's approval
      // queue filter students, faculty, AND alumni by their own
      // department(s), instead of only students.
      const deptRow = await lookupDepartmentId(regProgram);
      if (!deptRow) {
        await rollbackRegistration(userId);
        await supabase.auth.signOut();
        console.error('No matching department found for program: ' + regProgram);
        setError('Could not match your selected program to a department. Please contact the registrar.');
        return;
      }

      if (regUserType === 'student') {
        const { error: studentProfileError } = await supabase.from('student_profiles').insert({
          user_id: userId,
          department_id: deptRow.id,
          full_name: regFullName.trim(),
          student_no: regIdNumber.trim(),
          year_level: 1,
          program: regProgram,
        });

        if (studentProfileError) {
          await rollbackRegistration(userId);
          await supabase.auth.signOut();
          const msg = studentProfileError.message.toLowerCase();
          if (msg.includes('student_profiles_student_no_key')) {
            setFieldErrors((prev) => ({ ...prev, idNumber: 'This student number is already registered.' }));
          } else {
            console.error(studentProfileError.message);
            setError('Something went wrong setting up your student profile. Please try again.');
          }
          return;
        }
      }

      if (regUserType === 'faculty') {
        // status is explicitly 'pending' here — the column defaults to
        // 'Active' in the DB schema, which would silently grant faculty
        // status before any chair approval. profiles.status is the real
        // gate the backend checks; this column should never contradict it.
        const { error: facultyProfileError } = await supabase.from('faculty_profiles').insert({
          user_id: userId,
          full_name: regFullName.trim(),
          contact_email: regEmail.trim(),
          department_id: deptRow.id,
          status: 'pending',
        });

        if (facultyProfileError) {
          await rollbackRegistration(userId);
          await supabase.auth.signOut();
          console.error(facultyProfileError.message);
          setError('Something went wrong setting up your faculty profile. Please try again.');
          return;
        }
      }

      if (regUserType === 'alumni') {
        const { error: alumniProfileError } = await supabase.from('alumni_profiles').insert({
          user_id: userId,
          full_name: regFullName.trim(),
          graduation_year: parseInt(regGraduationYear.trim(), 10),
          program: regProgram,
          department_id: deptRow.id,
          contact_email: regEmail.trim(),
        });

        if (alumniProfileError) {
          await rollbackRegistration(userId);
          await supabase.auth.signOut();
          const msg = alumniProfileError.message.toLowerCase();
          if (msg.includes('graduation_year')) {
            setFieldErrors((prev) => ({ ...prev, graduationYear: 'Please enter a valid graduation year.' }));
          } else if (msg.includes('contact_email')) {
            setFieldErrors((prev) => ({ ...prev, email: 'Please enter a valid email address.' }));
          } else {
            console.error(alumniProfileError.message);
            setError('Something went wrong setting up your alumni profile. Please try again.');
          }
          return;
        }
      }

      const res = await fetch('http://localhost:5000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: regUsername.trim(),
          password: regPassword,
          role: regUserType === 'faculty' ? 'faculty' : regUserType,
          program: regProgram,
          email: regEmail.trim(),
          full_name: regFullName.trim(),
          id_number: regIdNumber.trim(),
          department: regProgram,
          // The Supabase auth user (and profiles/student_profiles rows)
          // were already created above via supabase.auth.signUp(). Pass
          // this along so the backend reuses that same account instead
          // of trying to create a second one for the same email, which
          // always fails since the email is already registered by then.
          userId,
        }),
      });

      const regData = await res.json();
      if (!res.ok) {
        await rollbackRegistration(userId);
        await supabase.auth.signOut();
        const msg: string = regData.error || '';
        const lower = msg.toLowerCase();
        if (lower.includes('username')) {
          setFieldErrors((prev) => ({ ...prev, username: 'This username is already taken. Please choose another.' }));
        } else if (lower.includes('password')) {
          setFieldErrors((prev) => ({ ...prev, password: 'Please check your password and try again.' }));
        } else if (lower.includes('email')) {
          setFieldErrors((prev) => ({ ...prev, email: 'Please check your email address and try again.' }));
        } else if (lower.includes('role') || lower.includes('program')) {
          setError('Please check your user type and program selections and try again.');
        } else if (msg) {
          setError(msg);
        } else {
          setError('Something went wrong creating your account. Please try again.');
        }
        return;
      }

      setMode('signin');
      setError('');
      setSuccessMsg('Account created! Please wait for your department chairman to review and approve your account before you can sign in.');
    } catch (err) {
      console.error(err);
      setError('Something went wrong. Please try again.');
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
          <div className="w-24 h-24 bg-white rounded-3xl flex items-center justify-center shadow-2xl mb-8 overflow-hidden">
            <img src="/COED LOGO.png" alt="COED Logo" className="w-20 h-20 object-contain"
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

                {/* Full Name — full width row */}
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

                {/* Email — full width row */}
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

                {/* User Type — full width row */}
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

                {/* Program — full width row */}
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

                {/* Graduation Year — alumni only, full width row */}
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

                {/* ID Number + Username — paired side by side to use the space better */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">ID Number <span className="text-red-500">*</span></label>
                    <div className="relative">
                      <IdCard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input type="text"
                        inputMode={regUserType === 'student' ? 'numeric' : 'text'}
                        placeholder={
                          regUserType === 'student' ? '202412345' :
                          regUserType === 'faculty' ? 'EMP-001' :
                          regUserType === 'alumni'  ? 'ALU-001' : 'ID Number'
                        }
                        value={regIdNumber}
                        onChange={(e) => {
                          let v = e.target.value;
                          if (regUserType === 'student') v = v.replace(/\D/g, '');
                          setRegIdNumber(v);
                          if (!v.trim()) {
                            setFieldErrors((p) => ({ ...p, idNumber: undefined }));
                          } else if (!isValidIdNumber(v, regUserType)) {
                            setFieldErrors((p) => ({ ...p, idNumber: 'ID number should contain numbers only.' }));
                          } else {
                            setFieldErrors((p) => ({ ...p, idNumber: undefined }));
                          }
                        }}
                        onBlur={() => {
                          if (!regIdNumber.trim()) setFieldErrors((p) => ({ ...p, idNumber: 'Please enter your ID number.' }));
                          else if (!isValidIdNumber(regIdNumber, regUserType)) setFieldErrors((p) => ({ ...p, idNumber: 'ID number should contain numbers only.' }));
                        }}
                        className={`w-full pl-9 pr-8 py-3 rounded-xl border ${fieldErrors.idNumber ? 'border-red-400' : 'border-gray-200'} focus:border-[#1d4ed8] focus:ring-2 focus:ring-blue-100 focus:outline-none transition-all text-sm`} />
                      <span className="absolute right-2.5 top-1/2 -translate-y-1/2">
                        {renderStatusIcon(regIdNumber, !!fieldErrors.idNumber)}
                      </span>
                    </div>
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
                          setRegPassword(e.target.value);
                          if (fieldErrors.password) setFieldErrors((p) => ({ ...p, password: undefined }));
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
                          { ok: passwordChecks.length,    label: 'At least 8 characters' },
                          { ok: passwordChecks.uppercase, label: 'One uppercase letter (A-Z)' },
                          { ok: passwordChecks.lowercase, label: 'One lowercase letter (a-z)' },
                          { ok: passwordChecks.number,    label: 'One number (0-9)' },
                          { ok: passwordChecks.special,   label: 'One special character (@, #, !, etc.)' },
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
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirm <span className="text-red-500">*</span></label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        placeholder="Confirm"
                        value={regConfirmPassword}
                        onChange={(e) => setRegConfirmPassword(e.target.value)}
                        className="w-full pl-10 pr-9 py-3 rounded-xl border border-gray-200 focus:border-[#1d4ed8] focus:ring-2 focus:ring-blue-100 focus:outline-none transition-all text-sm" />
                      <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
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