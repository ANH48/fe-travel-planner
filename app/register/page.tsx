'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { authApi, verificationApi } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import { User, Mail, Lock, ArrowLeft, Loader2, Plane, Check, Shield, Timer } from 'lucide-react';

const emailSchema = z.object({
  email: z.string().email('Invalid email address'),
});

const verificationSchema = z.object({
  code: z.string().length(6, 'Code must be 6 digits'),
});

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

type EmailFormData = z.infer<typeof emailSchema>;
type VerificationFormData = z.infer<typeof verificationSchema>;
type RegisterFormData = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(300);
  const [canResend, setCanResend] = useState(false);

  const emailForm = useForm<EmailFormData>({
    resolver: zodResolver(emailSchema),
  });

  const verificationForm = useForm<VerificationFormData>({
    resolver: zodResolver(verificationSchema),
  });

  const registerForm = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  useEffect(() => {
    if (step === 2 && timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setError('Verification code has expired. Please request a new one.');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [step, timeLeft]);

  useEffect(() => {
    if (step === 2) {
      const resendTimer = setTimeout(() => {
        setCanResend(true);
      }, 60000);
      return () => clearTimeout(resendTimer);
    }
  }, [step]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const onEmailSubmit = async (data: EmailFormData) => {
    try {
      setLoading(true);
      setError('');
      await verificationApi.sendCode(data.email);
      setEmail(data.email);
      setStep(2);
      setTimeLeft(300);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to send verification code');
    } finally {
      setLoading(false);
    }
  };

  const onVerificationSubmit = async (data: VerificationFormData) => {
    try {
      setLoading(true);
      setError('');
      await verificationApi.verifyCode(email, data.code);
      setCode(data.code);
      setStep(3);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid verification code');
    } finally {
      setLoading(false);
    }
  };

  const onRegisterSubmit = async (data: RegisterFormData) => {
    try {
      setLoading(true);
      setError('');
      const { confirmPassword, ...registerData } = data;
      const response = await authApi.register({
        email,
        code,
        ...registerData,
      });
      const { user, token } = response.data;
      setAuth(user, token);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    try {
      setLoading(true);
      setError('');
      await verificationApi.resendCode(email);
      setTimeLeft(300);
      setCanResend(false);
      setTimeout(() => setCanResend(true), 60000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to resend code');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-1/2 -left-40 w-96 h-96 bg-white/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute bottom-0 right-1/4 w-72 h-72 bg-white/10 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      <div className="min-h-screen flex items-center justify-center px-4 py-12 relative z-10">
        <div className="w-full max-w-md">
          <Link 
            href="/"
            className="inline-flex items-center gap-2 text-white/90 hover:text-white mb-8 transition-colors group"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            <span>Back to home</span>
          </Link>

          <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl p-8 md:p-10 border border-white/20">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl mb-4 shadow-lg">
                <Plane className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">
                {step === 1 && 'Create Account'}
                {step === 2 && 'Verify Email'}
                {step === 3 && 'Complete Profile'}
              </h1>
              <p className="text-gray-600">
                {step === 1 && 'Enter your email to get started'}
                {step === 2 && 'Check your email for the verification code'}
                {step === 3 && 'Just a few more details'}
              </p>
            </div>

            <div className="flex items-center justify-center mb-8">
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${step >= 1 ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-500'}`}>
                  1
                </div>
                <div className={`w-12 h-1 ${step >= 2 ? 'bg-purple-600' : 'bg-gray-200'}`}></div>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${step >= 2 ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-500'}`}>
                  2
                </div>
                <div className={`w-12 h-1 ${step >= 3 ? 'bg-purple-600' : 'bg-gray-200'}`}></div>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${step >= 3 ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-500'}`}>
                  3
                </div>
              </div>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-start gap-3">
                <div className="flex-shrink-0 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white text-xs font-bold mt-0.5">
                  !
                </div>
                <p className="text-sm">{error}</p>
              </div>
            )}

            {step === 1 && (
              <form onSubmit={emailForm.handleSubmit(onEmailSubmit)} className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      {...emailForm.register('email')}
                      type="email"
                      className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all outline-none text-gray-900 placeholder:text-gray-400"
                      placeholder="your@email.com"
                    />
                  </div>
                  {emailForm.formState.errors.email && (
                    <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                      <span className="w-1 h-1 bg-red-600 rounded-full"></span>
                      {emailForm.formState.errors.email.message}
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-bold text-lg hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Sending code...</span>
                    </>
                  ) : (
                    <>
                      <span>Send Verification Code</span>
                      <Shield className="w-5 h-5" />
                    </>
                  )}
                </button>
              </form>
            )}

            {step === 2 && (
              <form onSubmit={verificationForm.handleSubmit(onVerificationSubmit)} className="space-y-5">
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4">
                  <p className="text-sm text-blue-800">
                    We sent a 6-digit code to <strong>{email}</strong>
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Verification Code
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Shield className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      {...verificationForm.register('code')}
                      type="text"
                      maxLength={6}
                      className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all outline-none text-gray-900 placeholder:text-gray-400 text-center text-2xl tracking-widest font-mono"
                      placeholder="000000"
                    />
                  </div>
                  {verificationForm.formState.errors.code && (
                    <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                      <span className="w-1 h-1 bg-red-600 rounded-full"></span>
                      {verificationForm.formState.errors.code.message}
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-center gap-2 text-gray-600">
                  <Timer className="w-4 h-4" />
                  <span className="text-sm">
                    Code expires in <strong>{formatTime(timeLeft)}</strong>
                  </span>
                </div>

                <button
                  type="submit"
                  disabled={loading || timeLeft === 0}
                  className="w-full py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-bold text-lg hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Verifying...</span>
                    </>
                  ) : (
                    <>
                      <span>Verify Code</span>
                      <Check className="w-5 h-5" />
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleResendCode}
                  disabled={!canResend || loading}
                  className="w-full py-2 text-purple-600 font-semibold hover:text-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {canResend ? 'Resend Code' : 'Resend available in 60s'}
                </button>

                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="w-full py-2 text-gray-600 hover:text-gray-700 transition-colors"
                >
                  Change Email
                </button>
              </form>
            )}

            {step === 3 && (
              <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-5">
                <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-4 flex items-center gap-2">
                  <Check className="w-5 h-5 text-green-600" />
                  <p className="text-sm text-green-800">
                    Email verified! Complete your profile below.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Full Name
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <User className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      {...registerForm.register('name')}
                      type="text"
                      className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all outline-none text-gray-900 placeholder:text-gray-400"
                      placeholder="John Doe"
                    />
                  </div>
                  {registerForm.formState.errors.name && (
                    <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                      <span className="w-1 h-1 bg-red-600 rounded-full"></span>
                      {registerForm.formState.errors.name.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      {...registerForm.register('password')}
                      type="password"
                      className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all outline-none text-gray-900 placeholder:text-gray-400"
                      placeholder="Create a strong password"
                    />
                  </div>
                  {registerForm.formState.errors.password && (
                    <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                      <span className="w-1 h-1 bg-red-600 rounded-full"></span>
                      {registerForm.formState.errors.password.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Check className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      {...registerForm.register('confirmPassword')}
                      type="password"
                      className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all outline-none text-gray-900 placeholder:text-gray-400"
                      placeholder="Confirm your password"
                    />
                  </div>
                  {registerForm.formState.errors.confirmPassword && (
                    <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                      <span className="w-1 h-1 bg-red-600 rounded-full"></span>
                      {registerForm.formState.errors.confirmPassword.message}
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-bold text-lg hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Creating account...</span>
                    </>
                  ) : (
                    <>
                      <span>Create Account</span>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </>
                  )}
                </button>
              </form>
            )}

            <div className="mt-8 text-center">
              <p className="text-gray-600">
                Already have an account?{' '}
                <Link 
                  href="/login" 
                  className="text-purple-600 font-bold hover:text-purple-700 hover:underline transition-colors"
                >
                  Sign in
                </Link>
              </p>
            </div>
          </div>

          <p className="text-center text-white/70 text-sm mt-6">
            🔒 We respect your privacy and keep your data secure
          </p>
        </div>
      </div>
    </div>
  );
}
