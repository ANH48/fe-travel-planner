'use client';

import Link from 'next/link';
import { Home, ArrowLeft, Plane, Search } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 relative overflow-hidden flex items-center justify-center">
      {/* Animated background shapes */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-1/2 -left-40 w-96 h-96 bg-white/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute bottom-0 right-1/4 w-72 h-72 bg-white/10 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      <div className="relative z-10 text-center px-4">
        {/* 404 Icon */}
        <div className="mb-8">
          <div className="inline-flex items-center justify-center w-32 h-32 bg-white/10 backdrop-blur-lg rounded-full border-4 border-white/20 mb-6">
            <Search className="w-16 h-16 text-white" />
          </div>
        </div>

        {/* 404 Number */}
        <div className="mb-6">
          <h1 className="text-9xl font-extrabold text-white mb-2">404</h1>
          <div className="h-2 w-32 bg-white/30 rounded-full mx-auto"></div>
        </div>

        {/* Message */}
        <div className="mb-8 max-w-md mx-auto">
          <h2 className="text-3xl font-bold text-white mb-4">Page Not Found</h2>
          <p className="text-white/90 text-lg mb-2">
            Oops! The page you're looking for doesn't exist.
          </p>
          <p className="text-white/70">
            It might have been moved, deleted, or you may have typed the wrong URL.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <button
            onClick={() => window.history.back()}
            className="mobile-icon-btn group flex items-center gap-2 px-8 py-4 bg-white/20 backdrop-blur-sm text-white border-2 border-white/30 rounded-full font-bold text-lg hover:bg-white/30 transition-all duration-300 shadow-lg hover:scale-105"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            <span>Go Back</span>
          </button>

          <Link
            href="/"
            className="mobile-icon-btn group flex items-center gap-2 px-8 py-4 bg-white text-purple-600 rounded-full font-bold text-lg hover:bg-gray-100 transition-all duration-300 shadow-xl hover:shadow-white/50 hover:scale-105"
          >
            <Home className="w-5 h-5" />
            <span>Go Home</span>
          </Link>
        </div>

        {/* Helpful Links */}
        <div className="mt-12 pt-8 border-t border-white/20">
          <p className="text-white/70 mb-4">You might be looking for:</p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Link
              href="/dashboard"
              className="px-4 py-2 bg-white/10 backdrop-blur-sm text-white rounded-lg hover:bg-white/20 transition-all text-sm font-medium"
            >
              Dashboard
            </Link>
            <Link
              href="/login"
              className="px-4 py-2 bg-white/10 backdrop-blur-sm text-white rounded-lg hover:bg-white/20 transition-all text-sm font-medium"
            >
              Login
            </Link>
            <Link
              href="/register"
              className="px-4 py-2 bg-white/10 backdrop-blur-sm text-white rounded-lg hover:bg-white/20 transition-all text-sm font-medium"
            >
              Sign Up
            </Link>
          </div>
        </div>

        {/* Decorative Element */}
        <div className="mt-12 flex justify-center gap-2">
          <Plane className="w-8 h-8 text-white/40 animate-bounce" style={{ animationDelay: '0s' }} />
          <Plane className="w-8 h-8 text-white/40 animate-bounce" style={{ animationDelay: '0.2s' }} />
          <Plane className="w-8 h-8 text-white/40 animate-bounce" style={{ animationDelay: '0.4s' }} />
        </div>
      </div>
    </div>
  );
}
