'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { AlertCircle, Home, RefreshCw } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Error:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 flex items-center justify-center px-4">
      <div className="max-w-2xl w-full">
        {/* Error Card */}
        <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl p-8 md:p-12 border border-red-200/50 text-center">
          {/* Error Icon */}
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-red-500 to-orange-500 rounded-full mb-6 shadow-lg">
            <AlertCircle className="w-10 h-10 text-white" />
          </div>

          {/* Error Title */}
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Something Went Wrong
          </h1>

          {/* Error Message */}
          <p className="text-gray-600 text-lg mb-6">
            We encountered an unexpected error. Don't worry, it's not your fault!
          </p>

          {/* Error Details (in development) */}
          {process.env.NODE_ENV === 'development' && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-left">
              <p className="font-mono text-sm text-red-800 break-all">
                {error.message}
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={reset}
              className="group flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-red-600 to-orange-600 text-white rounded-xl font-bold text-lg hover:from-red-700 hover:to-orange-700 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105"
            >
              <RefreshCw className="w-5 h-5 group-hover:rotate-180 transition-transform duration-500" />
              <span>Try Again</span>
            </button>

            <Link
              href="/"
              className="flex items-center justify-center gap-2 px-8 py-4 bg-gray-100 text-gray-700 rounded-xl font-bold text-lg hover:bg-gray-200 transition-all duration-300"
            >
              <Home className="w-5 h-5" />
              <span>Go Home</span>
            </Link>
          </div>

          {/* Help Text */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-gray-500 text-sm">
              If this problem persists, please try refreshing the page or contact support.
            </p>
          </div>
        </div>

        {/* Helpful Tips */}
        <div className="mt-6 bg-orange-50 border border-orange-200 rounded-2xl p-6">
          <h3 className="font-bold text-orange-900 mb-2 flex items-center gap-2">
            <span className="text-xl">💡</span>
            What you can do:
          </h3>
          <ul className="text-orange-800 text-sm space-y-1">
            <li>• Click "Try Again" to retry the operation</li>
            <li>• Refresh the page using your browser</li>
            <li>• Check your internet connection</li>
            <li>• Go back to the home page and try again</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
