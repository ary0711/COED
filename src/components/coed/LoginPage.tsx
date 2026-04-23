import { useState } from 'react';
import { User, Lock, GraduationCap, ArrowLeft, Mail, IdCard, Eye, EyeOff } from 'lucide-react';

interface LoginPageProps {
  onLogin: (role: string) => void;
  onBack?: () => void;
}

export function LoginPage({ onLogin, onBack }: LoginPageProps) {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');

  // Login form state
  const [loginIdNumber, setLoginIdNumber] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Registration form state
  const [regFullName, setRegFullName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regUserType, setRegUserType] = useState('');
  const [regIdNumber, setRegIdNumber] = useState('');
  const [regYearGraduated, setRegYearGraduated] = useState('');
  const [regCourse, setRegCourse] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');

  const userTypes = [
    { id: 'student', label: 'Student', icon: '🎓', description: 'Student Portal Access' },
    { id: 'faculty', label: 'Faculty/Employee', icon: '👨‍🏫', description: 'Faculty & Staff Portal' },
    { id: 'alumni', label: 'Alumni', icon: '🎖️', description: 'Alumni Services' },
  ];

  // ====================== ROLE DETECTION ======================
  const detectRole = (input: string): string => {
    const id = input.trim();

    // STUDENT: 723xxxx (7 digits)
    if (/^723\d{4}$/.test(id)) return 'student';

    // FACULTY: 72xxxx (6 digits) ← FIXED
    if (/^72\d{4}$/.test(id)) return 'faculty';

    // DEAN
    const lower = id.toLowerCase();
    if (lower === 'dean@school.com' || lower === 'dean@ctu.edu.ph') return 'dean';

    // CHAIRMAN
    if (lower === 'chair@school.com' || lower === 'chair@ctu.edu.ph') return 'chair';

    // ALUMNI: any email
    if (id.includes('@')) return 'alumni';

    return '';
  };

  // ====================== HANDLE LOGIN ======================
  const handleLogin = () => {
    setError('');

    if (!loginIdNumber.trim() || !loginPassword.trim()) {
      setError('Please enter ID/Email and password');
      return;
    }

    const detectedRole = detectRole(loginIdNumber);

    if (!detectedRole) {
      setError('Invalid format. Student: 723xxxx | Faculty: 72xxxx | Alumni: email');
      return;
    }

    console.log(`✅ Login successful → Role: ${detectedRole} | Input: ${loginIdNumber}`);
    onLogin(detectedRole);
  };

  // ====================== HANDLE REGISTER ======================
  const handleRegister = () => {
    setError('');

    if (!regFullName || !regEmail || !regUserType || !regPassword || !regConfirmPassword) {
      setError('Please fill in all required fields');
      return;
    }

    if (regPassword !== regConfirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (regUserType === 'alumni') {
      if (!regYearGraduated || !regCourse) {
        setError('Year Graduated and Course are required for Alumni');
        return;
      }
    } else if (!regIdNumber.trim()) {
      setError('ID Number is required for Student and Faculty');
      return;
    }

    console.log('📝 Registration successful:', {
      fullName: regFullName,
      email: regEmail,
      role: regUserType,
      idNumber: regUserType !== 'alumni' ? regIdNumber : null,
      yearGraduated: regUserType === 'alumni' ? regYearGraduated : null,
      course: regUserType === 'alumni' ? regCourse : null,
    });

    onLogin(regUserType);
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-[#1E3A8A] via-[#2563EB] to-[#60A5FA]">
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

          {/* Left side - Branding (unchanged) */}
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
                <span className="block text-blue-100 mt-2">Information System</span>
              </h2>
              
              <p className="text-xl text-blue-100 leading-relaxed">
                Cebu Technological University – Argao Campus
              </p>
            </div>
          </div>

          {/* Right side - Form (UI preserved) */}
          <div className="relative">
            <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl p-6 lg:p-8 border border-white/20">
              
              {/* Mode Toggle */}
              <div className="flex items-center gap-2 p-1 bg-gray-100 rounded-2xl mb-6">
                <button
                  onClick={() => { setMode('signin'); setError(''); }}
                  className={`flex-1 py-2.5 rounded-xl font-semibold transition-all ${
                    mode === 'signin' ? 'bg-[#1E3A8A] text-white shadow-lg' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Sign In
                </button>
                <button
                  onClick={() => { setMode('signup'); setError(''); }}
                  className={`flex-1 py-2.5 rounded-xl font-semibold transition-all ${
                    mode === 'signup' ? 'bg-[#1E3A8A] text-white shadow-lg' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Register
                </button>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-sm">
                  {error}
                </div>
              )}

              {/* ====================== SIGN IN FORM ====================== */}
              {mode === 'signin' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">Welcome Back!</h3>
                    <p className="text-gray-600">Enter your ID number or email</p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">ID Number or Email</label>
                      <div className="relative">
                        <IdCard className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="text"
                          placeholder="Enter your ID Number or Email"
                          value={loginIdNumber}
                          onChange={(e) => setLoginIdNumber(e.target.value)}
                          className="w-full pl-12 pr-4 py-4 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:outline-none transition-colors bg-white"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Password</label>
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
                  </div>

                  <button
                    onClick={handleLogin}
                    className="w-full py-4 bg-[#1E3A8A] text-white rounded-xl font-semibold shadow-lg hover:bg-[#1E40AF] transition-all hover:scale-[1.02]"
                  >
                    Sign In
                  </button>
                </div>
              )}

              {/* ====================== REGISTER FORM ====================== */}
              {mode === 'signup' && (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-1">Create Account</h3>
                    <p className="text-sm text-gray-600">Fill in your details</p>
                  </div>

                  <div className="space-y-3">
                    {/* Full Name */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1.5">Full Name <span className="text-red-500">*</span></label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input type="text" placeholder="Juan Dela Cruz" value={regFullName} onChange={(e) => setRegFullName(e.target.value)}
                          className="w-full pl-10 pr-3 py-2.5 rounded-lg border-2 border-gray-200 focus:border-blue-500 focus:outline-none transition-colors bg-white text-sm" />
                      </div>
                    </div>

                    {/* Email */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1.5">Email Address <span className="text-red-500">*</span></label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input type="email" placeholder="your.email@ctu.edu.ph" value={regEmail} onChange={(e) => setRegEmail(e.target.value)}
                          className="w-full pl-10 pr-3 py-2.5 rounded-lg border-2 border-gray-200 focus:border-blue-500 focus:outline-none transition-colors bg-white text-sm" />
                      </div>
                    </div>

                    {/* User Type */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-2">User Type <span className="text-red-500">*</span></label>
                      <div className="grid grid-cols-3 gap-2">
                        {userTypes.map((type) => (
                          <button
                            key={type.id}
                            onClick={() => setRegUserType(type.id)}
                            className={`p-3 rounded-lg border-2 transition-all text-center ${
                              regUserType === type.id ? 'border-[#2563EB] bg-blue-50 scale-105' : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                            }`}
                          >
                            <div className="text-2xl mb-1">{type.icon}</div>
                            <div className="text-xs font-semibold text-gray-900">{type.label}</div>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* ID Number for Student & Faculty */}
                    {(regUserType === 'student' || regUserType === 'faculty') && (
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1.5">ID Number <span className="text-red-500">*</span></label>
                        <div className="relative">
                          <IdCard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <input
                            type="text"
                            placeholder={regUserType === 'student' ? 'e.g., 7234567' : 'e.g., 721234'}
                            value={regIdNumber}
                            onChange={(e) => setRegIdNumber(e.target.value)}
                            className="w-full pl-10 pr-3 py-2.5 rounded-lg border-2 border-gray-200 focus:border-blue-500 focus:outline-none transition-colors bg-white text-sm"
                          />
                        </div>
                      </div>
                    )}

                    {/* Alumni - Year & Course */}
                    {regUserType === 'alumni' && (
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 mb-1.5">Year Graduated <span className="text-red-500">*</span></label>
                          <input
                            type="number"
                            placeholder="e.g., 2020"
                            min="1950"
                            max={new Date().getFullYear()}
                            value={regYearGraduated}
                            onChange={(e) => setRegYearGraduated(e.target.value)}
                            className="w-full px-4 py-2.5 rounded-lg border-2 border-gray-200 focus:border-blue-500 focus:outline-none transition-colors bg-white text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 mb-1.5">Course/Program <span className="text-red-500">*</span></label>
                          <select
                            value={regCourse}
                            onChange={(e) => setRegCourse(e.target.value)}
                            className="w-full px-4 py-2.5 rounded-lg border-2 border-gray-200 focus:border-blue-500 focus:outline-none transition-colors bg-white text-sm"
                          >
                            <option value="">Select Course</option>
                            <option value="BSED">BSED - Bachelor of Secondary Education</option>
                            <option value="BEED">BEED - Bachelor of Elementary Education</option>
                            <option value="BPE">BPE - Bachelor of Physical Education</option>
                            <option value="BTLED">BTLED - Bachelor of Technical-Vocational Teacher Education</option>
                          </select>
                        </div>
                      </div>
                    )}

                    {/* Password & Confirm Password */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1.5">Password <span className="text-red-500">*</span></label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <input type={showPassword ? 'text' : 'password'} placeholder="Password" value={regPassword}
                            onChange={(e) => setRegPassword(e.target.value)}
                            className="w-full pl-10 pr-9 py-2.5 rounded-lg border-2 border-gray-200 focus:border-blue-500 focus:outline-none transition-colors bg-white text-sm" />
                          <button type="button" onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1.5">Confirm Password <span className="text-red-500">*</span></label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <input type={showConfirmPassword ? 'text' : 'password'} placeholder="Confirm" value={regConfirmPassword}
                            onChange={(e) => setRegConfirmPassword(e.target.value)}
                            className="w-full pl-10 pr-9 py-2.5 rounded-lg border-2 border-gray-200 focus:border-blue-500 focus:outline-none transition-colors bg-white text-sm" />
                          <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                            {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={handleRegister}
                    className="w-full py-3 bg-[#1E3A8A] text-white rounded-xl font-semibold shadow-lg hover:bg-[#1E40AF] transition-all hover:scale-[1.02]"
                  >
                    Create Account
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