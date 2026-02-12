'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { authApi, verificationApi } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import {
  User,
  Mail,
  Lock,
  ArrowLeft,
  Loader2,
  Plane,
  Check,
  Shield,
  Timer,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  CheckCircle,
  Info,
} from 'lucide-react';

const emailSchema = z.object({
  email: z.string().email('Invalid email address'),
});

const verificationSchema = z.object({
  code: z.string().length(6, 'Code must be 6 digits'),
});

const registerSchema = z
  .object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

type EmailFormData = z.infer<typeof emailSchema>;
type VerificationFormData = z.infer<typeof verificationSchema>;
type RegisterFormData = z.infer<typeof registerSchema>;

// Helper to extract error message from unknown error
function getErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof Error && 'response' in err) {
    const axiosError = err as {
      response?: { data?: { message?: string } };
    };
    return axiosError.response?.data?.message || fallback;
  }
  return fallback;
}

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
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Failed to send verification code'));
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
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Invalid verification code'));
    } finally {
      setLoading(false);
    }
  };

  const onRegisterSubmit = async (data: RegisterFormData) => {
    try {
      setLoading(true);
      setError('');
      const { confirmPassword: _, ...registerData } = data;
      const response = await authApi.register({
        email,
        code,
        ...registerData,
      });
      const { user, token } = response.data;
      setAuth(user, token);
      router.push('/dashboard');
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Registration failed'));
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
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Failed to resend code'));
    } finally {
      setLoading(false);
    }
  };

  const stepTitles = {
    1: 'Create Account',
    2: 'Verify Email',
    3: 'Complete Profile',
  };

  const stepDescriptions = {
    1: 'Enter your email to get started',
    2: 'Check your email for the verification code',
    3: 'Just a few more details',
  };

  return (
    <div className="min-h-screen bg-slate-50 relative overflow-hidden">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-100 rounded-full blur-3xl opacity-60 motion-safe:animate-pulse" />
        <div className="absolute top-1/2 -left-40 w-96 h-96 bg-blue-50 rounded-full blur-3xl opacity-50 motion-safe:animate-pulse" />
      </div>

      <div className="min-h-screen flex items-center justify-center px-4 py-12 relative z-10">
        <div className="w-full max-w-md">
          {/* Back to home button */}
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-slate-600 hover:text-blue-600 mb-8 transition-colors duration-200 cursor-pointer group"
            aria-label="Go back to home page"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 motion-safe:transition-transform duration-200" />
            <span className="font-medium">Back to home</span>
          </Link>

          {/* Register Card */}
          <div className="bg-white rounded-2xl shadow-lg p-8 md:p-10 border border-slate-200">
            {/* Logo and Title */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl mb-4">
                <Plane className="w-8 h-8 text-white" aria-hidden="true" />
              </div>
              <h1 className="text-3xl font-bold text-slate-900 mb-2">
                {stepTitles[step as keyof typeof stepTitles]}
              </h1>
              <p className="text-slate-600">
                {stepDescriptions[step as keyof typeof stepDescriptions]}
              </p>
            </div>

            {/* Progress Steps */}
            <nav
              className="flex items-center justify-center mb-8"
              aria-label="Registration progress"
            >
              <ol className="flex items-center gap-2">
                <li>
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm ${
                      step >= 1
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-200 text-slate-500'
                    }`}
                    aria-current={step === 1 ? 'step' : undefined}
                  >
                    {step > 1 ? (
                      <Check className="w-4 h-4" aria-hidden="true" />
                    ) : (
                      '1'
                    )}
                  </div>
                </li>
                <li aria-hidden="true">
                  <div
                    className={`w-12 h-1 rounded ${
                      step >= 2 ? 'bg-blue-600' : 'bg-slate-200'
                    }`}
                  />
                </li>
                <li>
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm ${
                      step >= 2
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-200 text-slate-500'
                    }`}
                    aria-current={step === 2 ? 'step' : undefined}
                  >
                    {step > 2 ? (
                      <Check className="w-4 h-4" aria-hidden="true" />
                    ) : (
                      '2'
                    )}
                  </div>
                </li>
                <li aria-hidden="true">
                  <div
                    className={`w-12 h-1 rounded ${
                      step >= 3 ? 'bg-blue-600' : 'bg-slate-200'
                    }`}
                  />
                </li>
                <li>
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm ${
                      step >= 3
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-200 text-slate-500'
                    }`}
                    aria-current={step === 3 ? 'step' : undefined}
                  >
                    3
                  </div>
                </li>
              </ol>
            </nav>

            {/* Error Message */}
            {error && (
              <div
                className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-start gap-3"
                role="alert"
                aria-live="polite"
              >
                <AlertCircle
                  className="w-5 h-5 flex-shrink-0 mt-0.5"
                  aria-hidden="true"
                />
                <p className="text-sm">{error}</p>
              </div>
            )}

            {/* Step 1: Email */}
            {step === 1 && (
              <form
                onSubmit={emailForm.handleSubmit(onEmailSubmit)}
                className="space-y-5"
              >
                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-semibold text-slate-700 mb-2"
                  >
                    Email Address
                  </label>
                  <div className="relative">
                    <div
                      className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"
                      aria-hidden="true"
                    >
                      <Mail className="h-5 w-5 text-slate-400" />
                    </div>
                    <input
                      {...emailForm.register('email')}
                      id="email"
                      type="email"
                      autoComplete="email"
                      aria-invalid={
                        emailForm.formState.errors.email ? 'true' : 'false'
                      }
                      aria-describedby={
                        emailForm.formState.errors.email
                          ? 'email-error'
                          : undefined
                      }
                      className="w-full pl-12 pr-4 py-3 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 outline-none text-slate-900 placeholder:text-slate-400"
                      placeholder="your@email.com"
                    />
                  </div>
                  {emailForm.formState.errors.email && (
                    <p
                      id="email-error"
                      className="mt-2 text-sm text-red-600 flex items-center gap-1.5"
                      role="alert"
                    >
                      <span
                        className="w-1 h-1 bg-red-600 rounded-full"
                        aria-hidden="true"
                      />
                      {emailForm.formState.errors.email.message}
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  aria-busy={loading}
                  className="w-full py-3.5 bg-blue-600 text-white rounded-xl font-semibold text-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 flex items-center justify-center gap-2 cursor-pointer focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  {loading ? (
                    <>
                      <Loader2
                        className="w-5 h-5 animate-spin"
                        aria-hidden="true"
                      />
                      <span>Sending code...</span>
                    </>
                  ) : (
                    <>
                      <span>Send Verification Code</span>
                      <Shield className="w-5 h-5" aria-hidden="true" />
                    </>
                  )}
                </button>
              </form>
            )}

            {/* Step 2: Verification */}
            {step === 2 && (
              <form
                onSubmit={verificationForm.handleSubmit(onVerificationSubmit)}
                className="space-y-5"
              >
                <div
                  className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4 flex items-start gap-3"
                  role="status"
                >
                  <Info
                    className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5"
                    aria-hidden="true"
                  />
                  <p className="text-sm text-blue-800">
                    We sent a 6-digit code to <strong>{email}</strong>
                  </p>
                </div>

                <div>
                  <label
                    htmlFor="code"
                    className="block text-sm font-semibold text-slate-700 mb-2"
                  >
                    Verification Code
                  </label>
                  <div className="relative">
                    <div
                      className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"
                      aria-hidden="true"
                    >
                      <Shield className="h-5 w-5 text-slate-400" />
                    </div>
                    <input
                      {...verificationForm.register('code')}
                      id="code"
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={6}
                      autoComplete="one-time-code"
                      aria-invalid={
                        verificationForm.formState.errors.code ? 'true' : 'false'
                      }
                      aria-describedby={
                        verificationForm.formState.errors.code
                          ? 'code-error'
                          : 'code-hint'
                      }
                      className="w-full pl-12 pr-4 py-3 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 outline-none text-slate-900 placeholder:text-slate-400 text-center text-2xl tracking-widest font-mono"
                      placeholder="000000"
                    />
                  </div>
                  {verificationForm.formState.errors.code && (
                    <p
                      id="code-error"
                      className="mt-2 text-sm text-red-600 flex items-center gap-1.5"
                      role="alert"
                    >
                      <span
                        className="w-1 h-1 bg-red-600 rounded-full"
                        aria-hidden="true"
                      />
                      {verificationForm.formState.errors.code.message}
                    </p>
                  )}
                </div>

                <div
                  id="code-hint"
                  className="flex items-center justify-center gap-2 text-slate-600"
                >
                  <Timer className="w-4 h-4" aria-hidden="true" />
                  <span className="text-sm">
                    Code expires in{' '}
                    <strong
                      className={timeLeft <= 60 ? 'text-red-600' : ''}
                      aria-live="polite"
                    >
                      {formatTime(timeLeft)}
                    </strong>
                  </span>
                </div>

                <button
                  type="submit"
                  disabled={loading || timeLeft === 0}
                  aria-busy={loading}
                  className="w-full py-3.5 bg-blue-600 text-white rounded-xl font-semibold text-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 flex items-center justify-center gap-2 cursor-pointer focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  {loading ? (
                    <>
                      <Loader2
                        className="w-5 h-5 animate-spin"
                        aria-hidden="true"
                      />
                      <span>Verifying...</span>
                    </>
                  ) : (
                    <>
                      <span>Verify Code</span>
                      <Check className="w-5 h-5" aria-hidden="true" />
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleResendCode}
                  disabled={!canResend || loading}
                  className="w-full py-2 text-blue-600 font-semibold hover:text-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 cursor-pointer"
                >
                  {canResend ? 'Resend Code' : 'Resend available in 60s'}
                </button>

                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="w-full py-2 text-slate-600 hover:text-slate-700 transition-colors duration-200 cursor-pointer"
                >
                  Change Email
                </button>
              </form>
            )}

            {/* Step 3: Complete Profile */}
            {step === 3 && (
              <form
                onSubmit={registerForm.handleSubmit(onRegisterSubmit)}
                className="space-y-5"
              >
                <div
                  className="bg-green-50 border border-green-200 rounded-xl p-4 mb-4 flex items-center gap-3"
                  role="status"
                >
                  <CheckCircle
                    className="w-5 h-5 text-green-600 flex-shrink-0"
                    aria-hidden="true"
                  />
                  <p className="text-sm text-green-800">
                    Email verified! Complete your profile below.
                  </p>
                </div>

                <div>
                  <label
                    htmlFor="name"
                    className="block text-sm font-semibold text-slate-700 mb-2"
                  >
                    Full Name
                  </label>
                  <div className="relative">
                    <div
                      className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"
                      aria-hidden="true"
                    >
                      <User className="h-5 w-5 text-slate-400" />
                    </div>
                    <input
                      {...registerForm.register('name')}
                      id="name"
                      type="text"
                      autoComplete="name"
                      aria-invalid={
                        registerForm.formState.errors.name ? 'true' : 'false'
                      }
                      aria-describedby={
                        registerForm.formState.errors.name
                          ? 'name-error'
                          : undefined
                      }
                      className="w-full pl-12 pr-4 py-3 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 outline-none text-slate-900 placeholder:text-slate-400"
                      placeholder="John Doe"
                    />
                  </div>
                  {registerForm.formState.errors.name && (
                    <p
                      id="name-error"
                      className="mt-2 text-sm text-red-600 flex items-center gap-1.5"
                      role="alert"
                    >
                      <span
                        className="w-1 h-1 bg-red-600 rounded-full"
                        aria-hidden="true"
                      />
                      {registerForm.formState.errors.name.message}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="password"
                    className="block text-sm font-semibold text-slate-700 mb-2"
                  >
                    Password
                  </label>
                  <div className="relative">
                    <div
                      className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"
                      aria-hidden="true"
                    >
                      <Lock className="h-5 w-5 text-slate-400" />
                    </div>
                    <input
                      {...registerForm.register('password')}
                      id="password"
                      type="password"
                      autoComplete="new-password"
                      aria-invalid={
                        registerForm.formState.errors.password ? 'true' : 'false'
                      }
                      aria-describedby={
                        registerForm.formState.errors.password
                          ? 'password-error'
                          : undefined
                      }
                      className="w-full pl-12 pr-4 py-3 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 outline-none text-slate-900 placeholder:text-slate-400"
                      placeholder="Create a strong password"
                    />
                  </div>
                  {registerForm.formState.errors.password && (
                    <p
                      id="password-error"
                      className="mt-2 text-sm text-red-600 flex items-center gap-1.5"
                      role="alert"
                    >
                      <span
                        className="w-1 h-1 bg-red-600 rounded-full"
                        aria-hidden="true"
                      />
                      {registerForm.formState.errors.password.message}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="confirmPassword"
                    className="block text-sm font-semibold text-slate-700 mb-2"
                  >
                    Confirm Password
                  </label>
                  <div className="relative">
                    <div
                      className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"
                      aria-hidden="true"
                    >
                      <Check className="h-5 w-5 text-slate-400" />
                    </div>
                    <input
                      {...registerForm.register('confirmPassword')}
                      id="confirmPassword"
                      type="password"
                      autoComplete="new-password"
                      aria-invalid={
                        registerForm.formState.errors.confirmPassword
                          ? 'true'
                          : 'false'
                      }
                      aria-describedby={
                        registerForm.formState.errors.confirmPassword
                          ? 'confirmPassword-error'
                          : undefined
                      }
                      className="w-full pl-12 pr-4 py-3 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 outline-none text-slate-900 placeholder:text-slate-400"
                      placeholder="Confirm your password"
                    />
                  </div>
                  {registerForm.formState.errors.confirmPassword && (
                    <p
                      id="confirmPassword-error"
                      className="mt-2 text-sm text-red-600 flex items-center gap-1.5"
                      role="alert"
                    >
                      <span
                        className="w-1 h-1 bg-red-600 rounded-full"
                        aria-hidden="true"
                      />
                      {registerForm.formState.errors.confirmPassword.message}
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  aria-busy={loading}
                  className="w-full py-3.5 bg-blue-600 text-white rounded-xl font-semibold text-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 flex items-center justify-center gap-2 cursor-pointer focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  {loading ? (
                    <>
                      <Loader2
                        className="w-5 h-5 animate-spin"
                        aria-hidden="true"
                      />
                      <span>Creating account...</span>
                    </>
                  ) : (
                    <>
                      <span>Create Account</span>
                      <ArrowRight className="w-5 h-5" aria-hidden="true" />
                    </>
                  )}
                </button>
              </form>
            )}

            {/* Sign In Link */}
            <div className="mt-8 text-center">
              <p className="text-slate-600">
                Already have an account?{' '}
                <Link
                  href="/login"
                  className="text-blue-600 font-semibold hover:text-blue-700 hover:underline transition-colors duration-200 cursor-pointer"
                >
                  Sign in
                </Link>
              </p>
            </div>
          </div>

          {/* Footer Text */}
          <p className="text-center text-slate-500 text-sm mt-6 flex items-center justify-center gap-2">
            <ShieldCheck className="w-4 h-4" aria-hidden="true" />
            <span>We respect your privacy and keep your data secure</span>
          </p>
        </div>
      </div>
    </div>
  );
}
