import { Loader2, MapPin, Calendar, DollarSign, Users, Receipt, TrendingUp, Plane } from 'lucide-react';

export default function TripLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header Skeleton */}
      <div className="bg-white/80 backdrop-blur-xl border-b border-gray-200/50 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="h-6 w-40 bg-gray-200 rounded animate-pulse"></div>
            <div className="flex items-center gap-2">
              <div className="h-10 w-20 bg-gray-200 rounded-xl animate-pulse"></div>
              <div className="h-10 w-24 bg-gray-200 rounded-xl animate-pulse"></div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Trip Header Skeleton */}
        <div className="bg-gradient-to-br from-indigo-600 to-purple-600 rounded-3xl p-8 mb-8 shadow-xl">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <div className="h-10 w-64 bg-white/20 rounded-lg animate-pulse"></div>
                <div className="h-6 w-24 bg-white/20 rounded-full animate-pulse"></div>
              </div>
              <div className="flex flex-wrap gap-4">
                <div className="h-5 w-40 bg-white/20 rounded animate-pulse"></div>
                <div className="h-5 w-48 bg-white/20 rounded animate-pulse"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards Skeleton */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[DollarSign, Users, Receipt, TrendingUp].map((Icon, index) => (
            <div key={index} className="bg-white/95 backdrop-blur-sm rounded-2xl p-6 border border-gray-200/50 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <div className="h-4 w-20 bg-gray-200 rounded animate-pulse"></div>
                <Icon className="w-5 h-5 text-gray-300" />
              </div>
              <div className="h-8 w-24 bg-gray-200 rounded animate-pulse"></div>
            </div>
          ))}
        </div>

        {/* Tabs Skeleton */}
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl border border-gray-200/50 shadow-sm mb-6">
          <div className="flex border-b border-gray-200">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex-1 px-6 py-4">
                <div className="h-6 bg-gray-200 rounded animate-pulse"></div>
              </div>
            ))}
          </div>
        </div>

        {/* Content Loading */}
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl border border-gray-200/50 shadow-sm p-12 text-center">
          <div className="mb-6 relative inline-block">
            <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl shadow-xl flex items-center justify-center">
              <Plane className="w-10 h-10 text-white" />
            </div>
            <Loader2 className="absolute -inset-2 w-24 h-24 text-indigo-600 animate-spin" />
          </div>
          
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Loading Trip Details</h2>
          <p className="text-gray-600">Please wait while we fetch your trip information...</p>

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
