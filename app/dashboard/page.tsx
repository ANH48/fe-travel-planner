'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/lib/store';
import { tripsApi } from '@/lib/api';
import { useFcmToken } from '@/lib/useFcmToken';
import { format } from 'date-fns';
import {
  Plane,
  Plus,
  MapPin,
  Calendar,
  Users,
  Wallet,
  TrendingUp,
  Loader2,
  Sparkles,
  CheckCircle,
} from 'lucide-react';
import { NotificationBell } from '@/components/NotificationBell';
import { UserDropdown } from '@/components/user-dropdown';

interface Trip {
  id: string;
  name: string;
  location: string;
  startDate: string;
  endDate: string;
  status: 'UPCOMING' | 'ONGOING' | 'COMPLETED';
  _count?: {
    members: number;
    expenses: number;
  };
}

// Safely format date
const formatDate = (date: string | Date, formatStr: string = 'MMM d, yyyy') => {
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(dateObj.getTime())) {
      return 'Invalid date';
    }
    return format(dateObj, formatStr);
  } catch {
    return 'Invalid date';
  }
};

const getStatusStyles = (status: Trip['status']) => {
  switch (status) {
    case 'UPCOMING':
      return {
        bar: 'bg-blue-600',
        badge: 'bg-blue-100 text-blue-700',
      };
    case 'ONGOING':
      return {
        bar: 'bg-emerald-600',
        badge: 'bg-emerald-100 text-emerald-700',
      };
    case 'COMPLETED':
      return {
        bar: 'bg-slate-400',
        badge: 'bg-slate-100 text-slate-700',
      };
  }
};

export default function DashboardPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, isAuthenticated, _hasHydrated } = useAuthStore();
  const [mounted, setMounted] = useState(false);

  // Initialize Firebase Cloud Messaging
  useFcmToken();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && _hasHydrated && !isAuthenticated()) {
      router.push('/login');
    }
  }, [mounted, _hasHydrated, isAuthenticated, router]);

  // Handle notification changes - refresh trips when invitation is accepted
  const handleNotificationReceived = () => {
    queryClient.invalidateQueries({ queryKey: ['trips'] });
  };

  const { data: trips, isLoading } = useQuery<Trip[]>({
    queryKey: ['trips'],
    queryFn: async () => {
      const response = await tripsApi.getAll();
      return response.data;
    },
    enabled: mounted && _hasHydrated && isAuthenticated(),
  });

  // Wait for hydration and mounting
  if (!mounted || !_hasHydrated) {
    return (
      <div
        className="min-h-screen bg-slate-50 flex items-center justify-center"
        role="status"
        aria-label="Loading dashboard"
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

  // Calculate stats
  const stats = {
    total: trips?.length || 0,
    upcoming: trips?.filter((t) => t.status === 'UPCOMING').length || 0,
    ongoing: trips?.filter((t) => t.status === 'ONGOING').length || 0,
    completed: trips?.filter((t) => t.status === 'COMPLETED').length || 0,
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Navbar */}
      <nav
        className="bg-white border-b border-slate-200 sticky top-0 z-50"
        aria-label="Main navigation"
      >
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
                <Plane className="w-6 h-6 text-white" aria-hidden="true" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900">
                  Travel Planner
                </h1>
                <p className="text-xs text-slate-500">Plan your adventures</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <NotificationBell
                onNotificationReceived={handleNotificationReceived}
              />
              <UserDropdown />
            </div>
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-slate-900 mb-2">
            Welcome back,{' '}
            <span className="text-blue-600">{user?.name?.split(' ')[0]}</span>
          </h2>
          <p className="text-slate-600 text-lg">
            Ready to plan your next adventure?
          </p>
        </div>

        {/* Stats Cards */}
        <section aria-labelledby="stats-heading" className="mb-8">
          <h3 id="stats-heading" className="sr-only">
            Trip statistics
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl p-6 border border-slate-200 hover:border-slate-300 transition-colors duration-200">
              <div className="flex items-center justify-between mb-2">
                <p className="text-slate-600 text-sm font-medium">Total Trips</p>
                <TrendingUp
                  className="w-5 h-5 text-blue-600"
                  aria-hidden="true"
                />
              </div>
              <p className="text-3xl font-bold text-slate-900">{stats.total}</p>
            </div>

            <div className="bg-blue-600 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-blue-100 text-sm font-medium">Upcoming</p>
                <Calendar className="w-5 h-5 text-white" aria-hidden="true" />
              </div>
              <p className="text-3xl font-bold text-white">{stats.upcoming}</p>
            </div>

            <div className="bg-emerald-600 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-emerald-100 text-sm font-medium">Ongoing</p>
                <Sparkles className="w-5 h-5 text-white" aria-hidden="true" />
              </div>
              <p className="text-3xl font-bold text-white">{stats.ongoing}</p>
            </div>

            <div className="bg-slate-600 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-slate-200 text-sm font-medium">Completed</p>
                <CheckCircle className="w-5 h-5 text-white" aria-hidden="true" />
              </div>
              <p className="text-3xl font-bold text-white">{stats.completed}</p>
            </div>
          </div>
        </section>

        {/* Trips Section */}
        <section aria-labelledby="trips-heading">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <h3 id="trips-heading" className="text-2xl font-bold text-slate-900">
              Your Trips
            </h3>
            <Link
              href="/trips/new"
              className="mobile-icon-btn flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors duration-200 cursor-pointer focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              <Plus className="w-5 h-5" aria-hidden="true" />
              <span>New Trip</span>
            </Link>
          </div>

          {/* Trips Grid */}
          {isLoading ? (
            <div className="text-center py-20" role="status" aria-label="Loading trips">
              <Loader2
                className="inline-block w-12 h-12 text-blue-600 animate-spin"
                aria-hidden="true"
              />
              <p className="mt-4 text-slate-600">Loading your trips...</p>
            </div>
          ) : trips && trips.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {trips.map((trip) => {
                const statusStyles = getStatusStyles(trip.status);
                return (
                  <Link
                    key={trip.id}
                    href={`/trips/${trip.id}`}
                    className="group bg-white rounded-2xl overflow-hidden border border-slate-200 hover:border-blue-200 hover:shadow-lg transition-all duration-200 cursor-pointer"
                  >
                    {/* Status bar */}
                    <div className={`h-1.5 ${statusStyles.bar}`} aria-hidden="true" />

                    <div className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <h4 className="text-xl font-bold text-slate-900 group-hover:text-blue-600 transition-colors duration-200 line-clamp-1">
                          {trip.name}
                        </h4>
                        <span
                          className={`px-3 py-1 text-xs font-semibold rounded-full flex-shrink-0 ml-2 ${statusStyles.badge}`}
                        >
                          {trip.status}
                        </span>
                      </div>

                      <div className="space-y-3 mb-4">
                        <div className="flex items-center gap-2 text-slate-600">
                          <MapPin
                            className="w-4 h-4 text-blue-600 flex-shrink-0"
                            aria-hidden="true"
                          />
                          <span className="text-sm line-clamp-1">
                            {trip.location}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 text-slate-600">
                          <Calendar
                            className="w-4 h-4 text-blue-600 flex-shrink-0"
                            aria-hidden="true"
                          />
                          <span className="text-sm">
                            {formatDate(trip.startDate, 'MMM d')} -{' '}
                            {formatDate(trip.endDate, 'MMM d, yyyy')}
                          </span>
                        </div>
                      </div>

                      <div className="flex gap-4 pt-4 border-t border-slate-100">
                        <div className="flex items-center gap-2 text-slate-600">
                          <Users
                            className="w-4 h-4 text-slate-500"
                            aria-hidden="true"
                          />
                          <span className="text-sm font-medium">
                            {trip._count?.members || 0}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-slate-600">
                          <Wallet
                            className="w-4 h-4 text-slate-500"
                            aria-hidden="true"
                          />
                          <span className="text-sm font-medium">
                            {trip._count?.expenses || 0}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-20 bg-white rounded-2xl border-2 border-dashed border-slate-300">
              <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Plane
                  className="w-10 h-10 text-blue-600"
                  aria-hidden="true"
                />
              </div>
              <h4 className="text-2xl font-bold text-slate-900 mb-2">
                No trips yet
              </h4>
              <p className="text-slate-600 mb-6 max-w-md mx-auto">
                Start planning your first adventure and track all your travel
                expenses in one place!
              </p>
              <Link
                href="/trips/new"
                className="mobile-icon-btn inline-flex items-center gap-2 px-8 py-4 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors duration-200 cursor-pointer focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                <Plus className="w-5 h-5" aria-hidden="true" />
                <span>Create Your First Trip</span>
              </Link>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
