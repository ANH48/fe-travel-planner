'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQueryClient } from '@tanstack/react-query';
import { membersApi } from '@/lib/api';
import { 
  ArrowLeft, 
  Mail, 
  Loader2,
  UserPlus,
  Send
} from 'lucide-react';

const inviteSchema = z.object({
  email: z.string().email('Invalid email address'),
});

type InviteFormData = z.infer<typeof inviteSchema>;

export default function InviteMemberPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const tripId = params.id as string;
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<InviteFormData>({
    resolver: zodResolver(inviteSchema),
  });

  const onSubmit = async (data: InviteFormData) => {
    try {
      setLoading(true);
      setError('');
      
      await membersApi.invite(tripId, data.email);
      
      // Invalidate queries to refresh data
      await queryClient.invalidateQueries({ queryKey: ['members', tripId] });
      await queryClient.invalidateQueries({ queryKey: ['invitations', tripId] });
      await queryClient.invalidateQueries({ queryKey: ['trip', tripId] });
      
      // Navigate back to trip page with members tab active
      router.push(`/trips/${tripId}?tab=members`);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to send invitation');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-xl border-b border-gray-200/50 sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <Link 
            href={`/trips/${tripId}`}
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors group"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            <span className="font-medium">Back to Trip</span>
          </Link>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto">
          {/* Page Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl mb-4 shadow-lg">
              <UserPlus className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Invite Member</h1>
            <p className="text-gray-600 text-lg">Send an invitation to join your trip</p>
          </div>

          {/* Form Card */}
          <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-xl p-8 md:p-10 border border-gray-200/50">
            {/* Error Message */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-start gap-3">
                <div className="flex-shrink-0 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white text-xs font-bold mt-0.5">
                  !
                </div>
                <p className="text-sm">{error}</p>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Email */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    {...register('email')}
                    type="email"
                    className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none text-gray-900 placeholder:text-gray-400"
                    placeholder="john@example.com"
                    autoFocus
                  />
                </div>
                {errors.email && (
                  <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                    <span className="w-1 h-1 bg-red-600 rounded-full"></span>
                    {errors.email.message}
                  </p>
                )}
              </div>

              {/* Info Box */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <h3 className="font-bold text-blue-900 mb-2 flex items-center gap-2">
                  <span className="text-xl">💌</span>
                  How it works
                </h3>
                <ul className="text-blue-800 text-sm space-y-1">
                  <li>• An invitation will be sent to this email address</li>
                  <li>• If they have an account, they'll receive a notification</li>
                  <li>• They can accept or decline the invitation</li>
                  <li>• Once accepted, they'll be added as a trip member</li>
                </ul>
              </div>

              {/* Submit Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-bold text-lg hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Sending Invitation...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      <span>Send Invitation</span>
                    </>
                  )}
                </button>
                
                <Link
                  href={`/trips/${tripId}`}
                  className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-gray-100 text-gray-700 rounded-xl font-bold text-lg hover:bg-gray-200 transition-all duration-300"
                >
                  Cancel
                </Link>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
