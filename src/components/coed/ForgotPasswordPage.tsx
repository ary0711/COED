import { useState } from 'react';
import { ArrowLeft, Mail } from 'lucide-react';
import { supabase } from '../../supabaseClient';

interface ForgotPasswordPageProps {
  onBack: () => void;
  onReturnToLogin: () => void;
}

export function ForgotPasswordPage({
  onBack,
  onReturnToLogin,
}: ForgotPasswordPageProps) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleResetPassword = async () => {
    setError('');
    setSuccessMsg('');

    if (!email.trim()) {
      setError('Please enter your email address.');
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(
        email.trim(),
        {
          redirectTo: `${window.location.origin}/reset-password`,
        }
      );

      if (error) {
        setError(error.message);
        return;
      }

      setSuccessMsg(
        'Password reset link has been sent to your email.'
      );
    } catch (err) {
      console.error(err);
      setError('An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 flex overflow-hidden">

      {/* LEFT PANEL */}
      <div className="hidden lg:flex w-5/12 bg-[#0f2a5e] flex-col relative overflow-hidden">

        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full border-[60px] border-white/5" />
          <div className="absolute -bottom-24 -left-24 w-96 h-96 rounded-full border-[60px] border-white/5" />
        </div>

        <button
          onClick={onBack}
          className="absolute top-6 left-6 z-20 w-10 h-10 flex items-center justify-center rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all border border-white/20"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

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

      {/* RIGHT PANEL */}
      <div className="flex-1 bg-white flex flex-col overflow-y-auto">

        

        <div className="flex-1 flex flex-col justify-center px-10 lg:px-16 py-8">
          <div className="w-full max-w-md mx-auto">

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

            <div className="space-y-5">

              <div>
                <h3 className="text-3xl font-bold text-gray-900">
                  Forgot Password?
                </h3>
                <p className="text-gray-500 text-sm mt-1">
                  Enter your email address and we'll send you a password reset link.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Email Address
                </label>

                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />

                  <input
                    type="email"
                    placeholder="your.email@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onKeyDown={(e) =>
                      e.key === 'Enter' && handleResetPassword()
                    }
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:border-[#1d4ed8] focus:ring-2 focus:ring-blue-100 focus:outline-none transition-all text-sm"
                  />
                </div>
              </div>

              <button
                onClick={handleResetPassword}
                disabled={loading}
                className="w-full py-3.5 bg-[#1d4ed8] text-white rounded-xl font-semibold text-sm hover:bg-[#1e40af] transition-all disabled:opacity-60 disabled:cursor-not-allowed shadow-lg shadow-blue-200"
              >
                {loading
                  ? 'Sending reset link...'
                  : 'Send Reset Link →'}
              </button>

              <p className="text-center text-sm text-gray-500">
                Remember your password?{' '}
                <button
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