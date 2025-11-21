import { Loader2, TrendingUp, Calendar, Users, Plane } from 'lucide-react';

export default function DashboardLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Navbar Skeleton */}
      <nav className="bg-white/80 backdrop-blur-xl border-b border-gray-200/50 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl animate-pulse"></div>
              <div className="h-6 w-32 bg-gray-200 rounded animate-pulse"></div>
            </div>
            <div className="flex items-center gap-4">
              <div className="h-10 w-32 bg-gray-200 rounded-full animate-pulse"></div>
              <div className="h-10 w-20 bg-gray-200 rounded-xl animate-pulse"></div>
            </div>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8">
        {/* Welcome Section Skeleton */}
        <div className="mb-8">
          <div className="h-10 w-64 bg-gray-200 rounded-lg animate-pulse mb-2"></div>
          <div className="h-6 w-48 bg-gray-200 rounded animate-pulse"></div>
        </div>

        {/* Stats Cards Skeleton */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[TrendingUp, Calendar, Users, Plane].map((Icon, index) => (
            <div key={index} className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-200/50 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <div className="h-4 w-20 bg-gray-200 rounded animate-pulse"></div>
                <Icon className="w-5 h-5 text-gray-300" />
              </div>
              <div className="h-8 w-16 bg-gray-200 rounded animate-pulse"></div>
            </div>
          ))}
        </div>

        {/* Header Skeleton */}
        <div className="flex justify-between items-center mb-6">
          <div className="h-8 w-32 bg-gray-200 rounded-lg animate-pulse"></div>
          <div className="h-12 w-32 bg-gray-200 rounded-xl animate-pulse"></div>
        </div>

        {/* Loading Content */}
        <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-lg p-12 text-center">
          <div className="mb-6 relative inline-block">
            <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl shadow-xl flex items-center justify-center">
              <Plane className="w-10 h-10 text-white" />
            </div>
            <Loader2 className="absolute -inset-2 w-24 h-24 text-indigo-600 animate-spin" />
          </div>
          
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Loading Your Trips</h2>
          <p className="text-gray-600">Fetching your travel plans...</p>

          {/* Loading Animation */}
          <div className="flex justify-center gap-2 mt-6">
            <div className="w-3 h-3 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
            <div className="w-3 h-3 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            <div className="w-3 h-3 bg-pink-600 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
          </div>
        </div>
      </div>
    </div>
  );
}
