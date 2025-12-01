'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/lib/store';
import { tripsApi, authApi } from '@/lib/api';
import { useFcmToken } from '@/lib/useFcmToken';
import { format } from 'date-fns';
import { 
  Plane, 
  LogOut, 
  Plus, 
  MapPin, 
  Calendar, 
  Users, 
  Wallet, 
  TrendingUp,
  Loader2,
  Sparkles
} from 'lucide-react';
import { NotificationBell } from '@/components/NotificationBell';
import { Avatar } from '@/components/OptimizedImage';

// Safely format date
const formatDate = (date: string | Date, formatStr: string = 'MMM d, yyyy') => {
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(dateObj.getTime())) {
      return 'Invalid date';
    }
    return format(dateObj, formatStr);
  } catch (error) {
    return 'Invalid date';
  }
};

export default function DashboardPage() {
  const router = useRouter();
  const { user, isAuthenticated, logout, _hasHydrated } = useAuthStore();
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

  const { data: trips, isLoading } = useQuery({
    queryKey: ['trips'],
    queryFn: async () => {
      const response = await tripsApi.getAll();
      return response.data;
    },
    enabled: mounted && _hasHydrated && isAuthenticated(),
  });

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  // Wait for hydration and mounting
  if (!mounted || !_hasHydrated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
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
    upcoming: trips?.filter((t: any) => t.status === 'UPCOMING').length || 0,
    ongoing: trips?.filter((t: any) => t.status === 'ONGOING').length || 0,
    completed: trips?.filter((t: any) => t.status === 'COMPLETED').length || 0,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Modern Navbar */}
      <nav className="bg-white/80 backdrop-blur-xl border-b border-gray-200/50 sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <Plane className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 text-transparent bg-clip-text">
                  Travel Planner
                </h1>
                <p className="text-xs text-gray-500">Plan your adventures</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <NotificationBell />
              <div className="hidden sm:flex items-center gap-3 px-4 py-2 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-full">
                <Avatar
                  src={user?.avatar}
                  alt={user?.name || 'User'}
                  name={user?.name}
                  size="sm"
                />
                <span className="text-gray-700 font-medium">{user?.name}</span>
              </div>
              <button
                onClick={handleLogout}
                className="mobile-icon-btn flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-xl transition-all duration-300 font-medium group"
              >
                <LogOut className="w-4 h-4 group-hover:rotate-12 transition-transform" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-4xl font-bold text-gray-900 mb-2">
            Welcome back, <span className="bg-gradient-to-r from-indigo-600 to-purple-600 text-transparent bg-clip-text">{user?.name?.split(' ')[0]}</span>! 👋
          </h2>
          <p className="text-gray-600 text-lg">Ready to plan your next adventure?</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-200/50 shadow-sm hover:shadow-md transition-all">
            <div className="flex items-center justify-between mb-2">
              <p className="text-gray-600 text-sm font-medium">Total Trips</p>
              <TrendingUp className="w-5 h-5 text-indigo-600" />
            </div>
            <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
          </div>
          
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all">
            <div className="flex items-center justify-between mb-2">
              <p className="text-blue-100 text-sm font-medium">Upcoming</p>
              <Calendar className="w-5 h-5 text-white" />
            </div>
            <p className="text-3xl font-bold text-white">{stats.upcoming}</p>
          </div>
          
          <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all">
            <div className="flex items-center justify-between mb-2">
              <p className="text-green-100 text-sm font-medium">Ongoing</p>
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <p className="text-3xl font-bold text-white">{stats.ongoing}</p>
          </div>
          
          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all">
            <div className="flex items-center justify-between mb-2">
              <p className="text-purple-100 text-sm font-medium">Completed</p>
              <Plane className="w-5 h-5 text-white" />
            </div>
            <p className="text-3xl font-bold text-white">{stats.completed}</p>
          </div>
        </div>

        {/* Trips Section Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <h3 className="text-2xl font-bold text-gray-900">Your Trips</h3>
          <Link
            href="/trips/new"
            className="mobile-icon-btn group flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-bold hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105"
          >
            <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" />
            <span>New Trip</span>
          </Link>
        </div>

        {/* Trips Grid */}
        {isLoading ? (
          <div className="text-center py-20">
            <Loader2 className="inline-block w-12 h-12 text-indigo-600 animate-spin" />
            <p className="mt-4 text-gray-600">Loading your trips...</p>
          </div>
        ) : trips && trips.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {trips.map((trip: any) => (
              <Link
                key={trip.id}
                href={`/trips/${trip.id}`}
                className="group bg-white/80 backdrop-blur-sm rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-200/50 hover:scale-[1.02] hover:-translate-y-1"
              >
                {/* Card Header with gradient */}
                <div className={`h-2 ${
                  trip.status === 'UPCOMING' 
                    ? 'bg-gradient-to-r from-blue-500 to-blue-600' 
                    : trip.status === 'ONGOING'
                    ? 'bg-gradient-to-r from-green-500 to-emerald-600'
                    : 'bg-gradient-to-r from-gray-400 to-gray-500'
                }`}></div>
                
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-xl font-bold text-gray-900 group-hover:text-indigo-600 transition-colors line-clamp-1">
                      {trip.name}
                    </h3>
                    <span
                      className={`px-3 py-1 text-xs font-bold rounded-full flex-shrink-0 ml-2 ${
                        trip.status === 'UPCOMING'
                          ? 'bg-blue-100 text-blue-700'
                          : trip.status === 'ONGOING'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {trip.status}
                    </span>
                  </div>

                  <div className="space-y-3 mb-4">
                    <div className="flex items-center gap-2 text-gray-600">
                      <MapPin className="w-4 h-4 text-indigo-500 flex-shrink-0" />
                      <span className="text-sm line-clamp-1">{trip.location}</span>
                    </div>
                    
                    <div className="flex items-center gap-2 text-gray-600">
                      <Calendar className="w-4 h-4 text-indigo-500 flex-shrink-0" />
                      <span className="text-sm">
                        {formatDate(trip.startDate, 'MMM d')} - {formatDate(trip.endDate, 'MMM d, yyyy')}
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-4 pt-4 border-t border-gray-100">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Users className="w-4 h-4 text-purple-500" />
                      <span className="text-sm font-medium">{trip._count?.members || 0}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <Wallet className="w-4 h-4 text-green-500" />
                      <span className="text-sm font-medium">{trip._count?.expenses || 0}</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-white/50 backdrop-blur-sm rounded-3xl border-2 border-dashed border-gray-300">
            <div className="w-20 h-20 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Plane className="w-10 h-10 text-indigo-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">No trips yet</h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              Start planning your first adventure and track all your travel expenses in one place!
            </p>
            <Link
              href="/trips/new"
              className="mobile-icon-btn inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-bold hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105"
            >
              <Plus className="w-5 h-5" />
              <span>Create Your First Trip</span>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
