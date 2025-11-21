import { Loader2, Plane } from 'lucide-react';

export default function Loading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
      <div className="text-center">
        {/* Animated Icon */}
        <div className="mb-6 relative">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl shadow-xl animate-pulse">
            <Plane className="w-12 h-12 text-white" />
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 className="w-32 h-32 text-indigo-600 animate-spin" />
          </div>
        </div>

        {/* Loading Text */}
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Loading...</h2>
        <p className="text-gray-600">Please wait while we prepare your content</p>

        {/* Loading Dots */}
        <div className="flex justify-center gap-2 mt-6">
          <div className="w-3 h-3 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
          <div className="w-3 h-3 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
          <div className="w-3 h-3 bg-pink-600 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
        </div>
      </div>
    </div>
  );
}
