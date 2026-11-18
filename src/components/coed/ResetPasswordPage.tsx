import { useEffect, useState } from 'react';
import {
  Lock,
  Eye,
  EyeOff,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import { supabase } from '../../supabaseClient';

interface ResetPasswordPageProps {
  onReturnToLogin: () => void;
}

export function ResetPasswordPage({
  onReturnToLogin,
}: ResetPasswordPageProps) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [recoveryReady, setRecoveryReady] = useState(false);

  // =====================================================
  // CHECK PASSWORD RECOVERY SESSION
  // =====================================================
  useEffect(() => {
    let mounted = true;

    const checkRecoverySession = async () => {
      try {
        const {
          data: sessionData,
          error: sessionError,
        } = await supabase.auth.getSession();

        if (!mounted) return;

        if (sessionError) {
          console.error(
            'Recovery session error:',
            sessionError
          );

          setRecoveryReady(false);
          setCheckingSession(false);
          return;
        }

        if (sessionData.session) {
          console.log(
            'Password recovery session detected.'
          );

          setRecoveryReady(true);
        } else {
          console.warn(
            'No password recovery session found.'
          );

          setRecoveryReady(false);
        }

        setCheckingSession(false);
      } catch (err) {
        console.error(
          'Error checking recovery session:',
          err
        );

        if (mounted) {
          setRecoveryReady(false);
          setCheckingSession(false);
        }
      }
    };

    // Check existing session
    checkRecoverySession();

    // ===================================================
    // LISTEN FOR PASSWORD RECOVERY EVENT
    // ===================================================

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log(
          'Supabase auth event:',
          event
        );

        if (
          event === 'PASSWORD_RECOVERY' &&
          session
        ) {
          console.log(
            'PASSWORD_RECOVERY session detected.'
          );

          setRecoveryReady(true);
          setCheckingSession(false);
        }

        // If a session is established through the
        // recovery link, allow the page to continue.
        if (session && !recoveryReady) {
          setRecoveryReady(true);
          setCheckingSession(false);
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // =====================================================
  // PASSWORD VALIDATION
  // =====================================================
  const validatePassword = (value: string) => {
    const passwordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&.#_-])[A-Za-z\d@$!%*?&.#_-]{8,}$/;

    return passwordRegex.test(value);
  };

  // =====================================================
  // UPDATE PASSWORD
  // =====================================================
  const handleUpdatePassword = async () => {
    setError('');
    setSuccess('');

    // ===================================================
    // CHECK RECOVERY SESSION
    // ===================================================

    if (!recoveryReady) {
      setError(
        'Your password reset link is invalid or has expired. Please request a new reset link.'
      );
      return;
    }

    // ===================================================
    // CHECK PASSWORD
    // ===================================================

    if (!password) {
      setError(
        'Please enter your new password.'
      );
      return;
    }

    // ===================================================
    // PASSWORD REQUIREMENTS
    // ===================================================

    if (!validatePassword(password)) {
      setError(
        'Your password needs at least 8 characters, with an uppercase letter, a lowercase letter, a number, and a special character.'
      );
      return;
    }

    // ===================================================
    // CHECK CONFIRM PASSWORD
    // ===================================================

    if (!confirmPassword) {
      setError(
        'Please confirm your new password.'
      );
      return;
    }

    // ===================================================
    // PASSWORD MATCH
    // ===================================================

    if (password !== confirmPassword) {
      setError(
        'Please make sure your confirm password is the same as your new password.'
      );
      return;
    }

    setLoading(true);

    try {
      // =================================================
      // STEP 1
      // GET CURRENT RECOVERY SESSION
      // =================================================

      const {
        data: sessionData,
        error: sessionError,
      } = await supabase.auth.getSession();

      if (
        sessionError ||
        !sessionData.session
      ) {
        console.error(
          'Recovery session unavailable:',
          sessionError
        );

        setError(
          'Your password reset session has expired. Please request a new reset link.'
        );

        return;
      }

      const accessToken =
        sessionData.session.access_token;

      // =================================================
      // STEP 2
      // VERIFY USER
      // =================================================

      const {
        data: userData,
        error: userError,
      } = await supabase.auth.getUser(
        accessToken
      );

      if (userError || !userData.user) {
        console.error(
          'Recovery user verification failed:',
          userError
        );

        setError(
          'Your password reset session is invalid or has expired. Please request a new reset link.'
        );

        return;
      }

      console.log(
        'Verified recovery user:',
        userData.user.id
      );

      // =================================================
      // STEP 3
      // UPDATE SUPABASE AUTH PASSWORD
      // =================================================

      const {
        error: supabasePasswordError,
      } = await supabase.auth.updateUser({
        password,
      });

      if (supabasePasswordError) {
        console.error(
          'Supabase password update error:',
          supabasePasswordError
        );

        setError(
          'We could not update your password. Please try again.'
        );

        return;
      }

      console.log(
        'Supabase Auth password updated successfully.'
      );

      // =================================================
      // STEP 4
      // SYNCHRONIZE public.users PASSWORD
      // =================================================

      const response = await fetch(
        'https://coed.onrender.com/api/auth/sync-reset-password',
        {
          method: 'POST',

          headers: {
            'Content-Type': 'application/json',
          },

          body: JSON.stringify({
            accessToken,
            password,
          }),
        }
      );

      // =================================================
      // SAFELY READ BACKEND RESPONSE
      // =================================================

      const contentType =
        response.headers.get('content-type') || '';

      let data: any = null;

      if (
        contentType.includes(
          'application/json'
        )
      ) {
        data = await response.json();
      } else {
        const text = await response.text();

        console.error(
          'Backend returned non-JSON response:',
          text
        );

        if (response.status === 404) {
          setError(
            'The password synchronization service could not be found. Please make sure the backend is running and the /sync-reset-password route exists.'
          );

          return;
        }

        if (response.status >= 500) {
          setError(
            'The server encountered an error while synchronizing your password. Please try again.'
          );

          return;
        }

        setError(
          'The server returned an unexpected response. Please try again.'
        );

        return;
      }

      // =================================================
      // BACKEND ERROR
      // =================================================

      if (!response.ok) {
        console.error(
          'Backend password synchronization failed:',
          response.status,
          data
        );

        if (response.status === 401) {
          setError(
            data?.error ||
              'Your password reset session is invalid or has expired. Please request a new reset link.'
          );

          return;
        }

        if (response.status === 404) {
          setError(
            data?.error ||
              'Your application account could not be found.'
          );

          return;
        }

        if (response.status === 400) {
          setError(
            data?.error ||
              'The new password is invalid.'
          );

          return;
        }

        if (response.status >= 500) {
          setError(
            data?.error ||
              'The server could not synchronize your password. Please try again later.'
          );

          return;
        }

        setError(
          data?.error ||
            data?.message ||
            'Password synchronization failed. Please try again.'
        );

        return;
      }

      // =================================================
      // CHECK BACKEND SUCCESS
      // =================================================

      if (!data?.success) {
        console.error(
          'Backend did not confirm password synchronization:',
          data
        );

        setError(
          data?.error ||
            'Your password could not be synchronized with your login account.'
        );

        return;
      }

      // =================================================
      // SUCCESS
      // =================================================

      console.log(
        'Password synchronized successfully.'
      );

      setSuccess(
        'Your password has been successfully updated. You can now sign in with your new password.'
      );

      setPassword('');
      setConfirmPassword('');

      // =================================================
      // SIGN OUT RECOVERY SESSION
      // =================================================

      await supabase.auth.signOut();

      // =================================================
      // RETURN TO LOGIN
      // =================================================

      setTimeout(() => {
        onReturnToLogin();
      }, 2000);

    } catch (err: any) {
      console.error(
        'Unexpected password reset error:',
        err
      );

      // =================================================
      // NETWORK ERROR
      // =================================================

      if (
        err instanceof TypeError &&
        err.message
          ?.toLowerCase()
          .includes('fetch')
      ) {
        setError(
          'Unable to connect to the server. Please make sure the backend server is running.'
        );

        return;
      }

      setError(
        'An unexpected error occurred while resetting your password. Please try again.'
      );

    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // PASSWORD MATCH STATUS
  // =====================================================

  const passwordsMatch =
    confirmPassword.length > 0 &&
    password === confirmPassword;

  const passwordsDoNotMatch =
    confirmPassword.length > 0 &&
    password !== confirmPassword;

  // =====================================================
  // CHECKING RECOVERY SESSION
  // =====================================================

  if (checkingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f1f5f9]">
        <div className="text-center">

          <div className="w-10 h-10 border-4 border-blue-200 border-t-[#1d4ed8] rounded-full animate-spin mx-auto mb-4" />

          <p className="text-gray-600 text-sm">
            Verifying password reset link...
          </p>

        </div>
      </div>
    );
  }

  // =====================================================
  // INVALID / EXPIRED LINK
  // =====================================================

  if (!recoveryReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f1f5f9] px-6">

        <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 text-center">

          <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-5">
            <AlertCircle className="w-7 h-7 text-red-600" />
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Invalid Reset Link
          </h1>

          <p className="text-gray-500 text-sm leading-relaxed mb-6">
            This password reset link is invalid or has
            expired. Please request a new password reset
            link.
          </p>

          <button
            type="button"
            onClick={onReturnToLogin}
            className="w-full py-3.5 bg-[#1d4ed8] text-white rounded-xl font-semibold text-sm hover:bg-[#1e40af] transition-all"
          >
            Return to Sign In
          </button>

        </div>
      </div>
    );
  }

  // =====================================================
  // RESET PASSWORD FORM
  // =====================================================

  return (
    <div className="fixed inset-0 flex overflow-hidden">

      {/* =================================================
          LEFT PANEL
      ================================================= */}

      <div className="hidden lg:flex w-5/12 bg-[#0f2a5e] flex-col relative overflow-hidden">

        <div className="absolute inset-0 pointer-events-none">

          <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full border-[60px] border-white/5" />

          <div className="absolute -bottom-24 -left-24 w-96 h-96 rounded-full border-[60px] border-white/5" />

        </div>

        <div className="relative z-10 flex flex-col items-center justify-center flex-1 px-12 text-center">

          <div className="w-24 h-24 bg-white rounded-3xl flex items-center justify-center shadow-2xl mb-8 overflow-hidden">

            <img
              src="/COED LOGO.png"
              alt="COED Logo"
              className="w-20 h-20 object-contain"
            />

          </div>

          <h1 className="text-white text-3xl font-bold leading-snug mb-3">
            College of Education
          </h1>

          <h2 className="text-blue-300 text-xl font-semibold mb-4">
            Information System
          </h2>

          <p className="text-blue-200 text-sm leading-relaxed max-w-xs">
            Cebu Technological University
            <br />
            Argao Campus
          </p>

        </div>

      </div>

      {/* =================================================
          RIGHT PANEL
      ================================================= */}

      <div className="flex-1 bg-white flex flex-col overflow-y-auto">

        <div className="flex-1 flex flex-col justify-center px-10 lg:px-16 py-8">

          <div className="w-full max-w-md mx-auto">

            {/* ERROR MESSAGE */}

            {error && (
              <div className="mb-5 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm font-medium flex items-start gap-3">

                <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />

                <span>{error}</span>

              </div>
            )}

            {/* SUCCESS MESSAGE */}

            {success && (
              <div className="mb-5 px-4 py-3 rounded-xl bg-green-50 border border-green-200 text-green-700 text-sm font-medium flex items-start gap-3">

                <CheckCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />

                <span>{success}</span>

              </div>
            )}

            <div className="space-y-5">

              {/* =================================================
                  TITLE
              ================================================= */}

              <div>

                <h3 className="text-3xl font-bold text-gray-900">
                  Reset Password
                </h3>

                <p className="text-gray-500 text-sm mt-1">
                  Create a new password for your account.
                </p>

              </div>

              {/* =================================================
                  NEW PASSWORD
              ================================================= */}

              <div>

                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  New Password
                </label>

                <div className="relative">

                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />

                  <input
                    type={
                      showPassword
                        ? 'text'
                        : 'password'
                    }
                    placeholder="Enter new password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setError('');
                      setSuccess('');
                    }}
                    className={`w-full pl-10 pr-10 py-3 rounded-xl border ${
                      password &&
                      !validatePassword(password)
                        ? 'border-red-300 focus:border-red-500 focus:ring-red-100'
                        : 'border-gray-200 focus:border-[#1d4ed8] focus:ring-blue-100'
                    } focus:ring-2 focus:outline-none transition-all text-sm`}
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowPassword(!showPassword)
                    }
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>

                </div>

                <p className="text-gray-400 text-xs mt-1.5">
                  At least 8 characters with uppercase,
                  lowercase, number, and special character.
                </p>

              </div>

              {/* =================================================
                  CONFIRM PASSWORD
              ================================================= */}

              <div>

                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Confirm Password
                </label>

                <div className="relative">

                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />

                  <input
                    type={
                      showConfirmPassword
                        ? 'text'
                        : 'password'
                    }
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(
                        e.target.value
                      );
                      setError('');
                      setSuccess('');
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleUpdatePassword();
                      }
                    }}
                    className={`w-full pl-10 pr-10 py-3 rounded-xl border ${
                      passwordsDoNotMatch
                        ? 'border-red-400 focus:border-red-500 focus:ring-red-100'
                        : passwordsMatch
                        ? 'border-green-400 focus:border-green-500 focus:ring-green-100'
                        : 'border-gray-200 focus:border-[#1d4ed8] focus:ring-blue-100'
                    } focus:ring-2 focus:outline-none transition-all text-sm`}
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowConfirmPassword(
                        !showConfirmPassword
                      )
                    }
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>

                </div>

                {/* PASSWORD MATCH MESSAGE */}

                {passwordsDoNotMatch && (
                  <p className="text-red-600 text-xs mt-1.5 font-medium">
                    Please make sure your confirm password is the same as your new password.
                  </p>
                )}

                {passwordsMatch && (
                  <p className="text-green-600 text-xs mt-1.5 font-medium flex items-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5" />
                    Passwords match.
                  </p>
                )}

              </div>

              {/* =================================================
                  UPDATE PASSWORD BUTTON
              ================================================= */}

              <button
                type="button"
                onClick={handleUpdatePassword}
                disabled={
                  loading ||
                  passwordsDoNotMatch
                }
                className="w-full py-3.5 bg-[#1d4ed8] text-white rounded-xl font-semibold text-sm hover:bg-[#1e40af] transition-all disabled:opacity-60 disabled:cursor-not-allowed shadow-lg shadow-blue-200"
              >

                {loading
                  ? 'Updating password...'
                  : 'Update Password →'}

              </button>

              {/* =================================================
                  RETURN TO LOGIN
              ================================================= */}

              <p className="text-center text-sm text-gray-500">

                Remember your password?{' '}

                <button
                  type="button"
                  onClick={onReturnToLogin}
                  className="text-[#1d4ed8] font-semibold hover:underline"
                >
                  Sign In
                </button>

              </p>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}