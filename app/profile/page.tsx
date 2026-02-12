'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { upload } from '@imagekit/javascript';
import { useAuthStore } from '@/lib/store';
import { profileApi, itineraryImagesApi } from '@/lib/api';
import {
  ArrowLeft,
  User,
  Mail,
  Lock,
  Camera,
  Loader2,
  CheckCircle,
  AlertCircle,
  Eye,
  EyeOff,
} from 'lucide-react';
import { Avatar } from '@/components/OptimizedImage';

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

type PasswordFormData = z.infer<typeof passwordSchema>;

function getErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof Error && 'response' in err) {
    const axiosError = err as {
      response?: { data?: { message?: string } };
    };
    return axiosError.response?.data?.message || fallback;
  }
  return fallback;
}

export default function ProfilePage() {
  const router = useRouter();
  const { user, isAuthenticated, updateUser, _hasHydrated } = useAuthStore();
  const [mounted, setMounted] = useState(false);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const passwordForm = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && _hasHydrated && !isAuthenticated()) {
      router.push('/login');
    }
  }, [mounted, _hasHydrated, isAuthenticated, router]);

  const handleAvatarFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadLoading(true);
      setError('');
      setSuccess('');

      // Get auth params from backend
      const { data: authParams } = await itineraryImagesApi.getAuth();

      // Upload to ImageKit
      const uploadResponse = await upload({
        file,
        fileName: `avatar-${user?.id}-${Date.now()}`,
        folder: '/avatars/',
        signature: authParams.signature,
        token: authParams.token,
        expire: authParams.expire,
        publicKey: authParams.publicKey,
      });

      const avatarUrl = uploadResponse.url ?? '';

      // Save to backend
      await profileApi.updateAvatar(avatarUrl);
      updateUser({ avatar: avatarUrl });
      setSuccess('Avatar updated successfully');
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Failed to update avatar'));
    } finally {
      setUploadLoading(false);
      // Reset input so the same file can be selected again
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handlePasswordChange = async (data: PasswordFormData) => {
    try {
      setPasswordLoading(true);
      setError('');
      setSuccess('');
      await profileApi.changePassword({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
      setSuccess('Password changed successfully');
      passwordForm.reset();
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Failed to change password'));
    } finally {
      setPasswordLoading(false);
    }
  };

  if (!mounted || !_hasHydrated) {
    return (
      <div
        className="min-h-screen bg-slate-50 flex items-center justify-center"
        role="status"
        aria-label="Loading profile"
      >
        <div className="text-center">
          <Loader2
            className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4"
            aria-hidden="true"
          />
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated()) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Navbar */}
      <nav
        className="bg-white border-b border-slate-200 sticky top-0 z-50"
        aria-label="Profile navigation"
      >
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 text-slate-600 hover:text-blue-600 transition-colors duration-200 cursor-pointer"
              aria-label="Go back to dashboard"
            >
              <ArrowLeft className="w-5 h-5" aria-hidden="true" />
              <span className="font-medium">Back to Dashboard</span>
            </Link>
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            Profile Settings
          </h1>
          <p className="text-slate-600">
            Manage your account settings and preferences
          </p>
        </div>

        {/* Success/Error Messages */}
        {success && (
          <div
            className="mb-6 p-4 bg-green-50 border border-green-200 text-green-700 rounded-xl flex items-center gap-3"
            role="status"
          >
            <CheckCircle className="w-5 h-5 flex-shrink-0" aria-hidden="true" />
            <p className="text-sm">{success}</p>
          </div>
        )}
        {error && (
          <div
            className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-center gap-3"
            role="alert"
            aria-live="polite"
          >
            <AlertCircle className="w-5 h-5 flex-shrink-0" aria-hidden="true" />
            <p className="text-sm">{error}</p>
          </div>
        )}

        {/* Profile Info Section */}
        <section
          aria-labelledby="profile-heading"
          className="bg-white rounded-2xl border border-slate-200 p-6 mb-6"
        >
          <h2
            id="profile-heading"
            className="text-xl font-semibold text-slate-900 mb-6"
          >
            Profile Information
          </h2>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 mb-6">
            {/* Avatar */}
            <div className="relative">
              <Avatar
                src={user?.avatar}
                alt={user?.name || 'User'}
                name={user?.name}
                size="xl"
              />
              {uploadLoading && (
                <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                  <Loader2
                    className="w-6 h-6 text-white animate-spin"
                    aria-hidden="true"
                  />
                </div>
              )}
            </div>

            {/* Upload Button */}
            <div>
              <p className="text-sm text-slate-600 mb-2">Profile Picture</p>
              <label className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-medium cursor-pointer transition-colors duration-200">
                <Camera className="w-4 h-4" aria-hidden="true" />
                <span>Change Avatar</span>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarFileChange}
                  disabled={uploadLoading}
                />
              </label>
            </div>
          </div>

          {/* User Info */}
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl">
              <User className="w-5 h-5 text-slate-500" aria-hidden="true" />
              <div>
                <p className="text-xs text-slate-500 font-medium">Full Name</p>
                <p className="text-slate-900 font-medium">{user?.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl">
              <Mail className="w-5 h-5 text-slate-500" aria-hidden="true" />
              <div>
                <p className="text-xs text-slate-500 font-medium">
                  Email Address
                </p>
                <p className="text-slate-900 font-medium">{user?.email}</p>
              </div>
            </div>
          </div>
        </section>

        {/* Change Password Section */}
        <section
          aria-labelledby="password-heading"
          className="bg-white rounded-2xl border border-slate-200 p-6"
        >
          <h2
            id="password-heading"
            className="text-xl font-semibold text-slate-900 mb-6"
          >
            Change Password
          </h2>

          <form
            onSubmit={passwordForm.handleSubmit(handlePasswordChange)}
            className="space-y-5"
          >
            {/* Current Password */}
            <div>
              <label
                htmlFor="currentPassword"
                className="block text-sm font-semibold text-slate-700 mb-2"
              >
                Current Password
              </label>
              <div className="relative">
                <div
                  className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"
                  aria-hidden="true"
                >
                  <Lock className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  {...passwordForm.register('currentPassword')}
                  id="currentPassword"
                  type={showCurrentPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  aria-invalid={
                    passwordForm.formState.errors.currentPassword
                      ? 'true'
                      : 'false'
                  }
                  className="w-full pl-12 pr-12 py-3 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 outline-none text-slate-900 placeholder:text-slate-400"
                  placeholder="Enter current password"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center cursor-pointer"
                  aria-label={
                    showCurrentPassword ? 'Hide password' : 'Show password'
                  }
                >
                  {showCurrentPassword ? (
                    <EyeOff className="h-5 w-5 text-slate-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-slate-400" />
                  )}
                </button>
              </div>
              {passwordForm.formState.errors.currentPassword && (
                <p className="mt-2 text-sm text-red-600" role="alert">
                  {passwordForm.formState.errors.currentPassword.message}
                </p>
              )}
            </div>

            {/* New Password */}
            <div>
              <label
                htmlFor="newPassword"
                className="block text-sm font-semibold text-slate-700 mb-2"
              >
                New Password
              </label>
              <div className="relative">
                <div
                  className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"
                  aria-hidden="true"
                >
                  <Lock className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  {...passwordForm.register('newPassword')}
                  id="newPassword"
                  type={showNewPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  aria-invalid={
                    passwordForm.formState.errors.newPassword ? 'true' : 'false'
                  }
                  className="w-full pl-12 pr-12 py-3 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 outline-none text-slate-900 placeholder:text-slate-400"
                  placeholder="Enter new password"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center cursor-pointer"
                  aria-label={
                    showNewPassword ? 'Hide password' : 'Show password'
                  }
                >
                  {showNewPassword ? (
                    <EyeOff className="h-5 w-5 text-slate-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-slate-400" />
                  )}
                </button>
              </div>
              {passwordForm.formState.errors.newPassword && (
                <p className="mt-2 text-sm text-red-600" role="alert">
                  {passwordForm.formState.errors.newPassword.message}
                </p>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-semibold text-slate-700 mb-2"
              >
                Confirm New Password
              </label>
              <div className="relative">
                <div
                  className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"
                  aria-hidden="true"
                >
                  <Lock className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  {...passwordForm.register('confirmPassword')}
                  id="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  aria-invalid={
                    passwordForm.formState.errors.confirmPassword
                      ? 'true'
                      : 'false'
                  }
                  className="w-full pl-12 pr-4 py-3 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 outline-none text-slate-900 placeholder:text-slate-400"
                  placeholder="Confirm new password"
                />
              </div>
              {passwordForm.formState.errors.confirmPassword && (
                <p className="mt-2 text-sm text-red-600" role="alert">
                  {passwordForm.formState.errors.confirmPassword.message}
                </p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={passwordLoading}
              aria-busy={passwordLoading}
              className="w-full py-3.5 bg-blue-600 text-white rounded-xl font-semibold text-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 flex items-center justify-center gap-2 cursor-pointer focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              {passwordLoading ? (
                <>
                  <Loader2
                    className="w-5 h-5 animate-spin"
                    aria-hidden="true"
                  />
                  <span>Changing password...</span>
                </>
              ) : (
                <span>Change Password</span>
              )}
            </button>
          </form>
        </section>
      </main>
    </div>
  );
}
