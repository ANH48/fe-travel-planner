import Link from 'next/link';
import { Plane, Wallet, BarChart3, Users, MapPin, Calculator } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 relative overflow-hidden">
      {/* Animated background shapes */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-1/2 -left-40 w-96 h-96 bg-white/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute bottom-0 right-1/4 w-72 h-72 bg-white/10 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      <div className="container mx-auto px-4 py-16 relative z-10">
        {/* Hero Section */}
        <div className="text-center mb-20">
          <div className="inline-block mb-6 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full text-white text-sm font-medium">
            ✨ Smart Travel Planning Made Easy
          </div>
          
          <h1 className="text-7xl md:text-8xl font-extrabold text-white mb-6 tracking-tight leading-tight">
            Travel Expense
            <br />
            <span className="bg-gradient-to-r from-yellow-300 to-orange-300 text-transparent bg-clip-text">
              Planner
            </span>
          </h1>
          
          <p className="text-xl md:text-2xl text-white/90 mb-12 max-w-3xl mx-auto font-light leading-relaxed">
            Plan your trips, track expenses, and split costs with your travel companions effortlessly
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              href="/login"
              className="group px-10 py-4 bg-white text-purple-600 rounded-full font-bold text-lg hover:bg-gray-100 transition-all duration-300 shadow-2xl hover:shadow-white/50 hover:scale-105 flex items-center gap-2"
            >
              Login
              <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
            <Link
              href="/register"
              className="group px-10 py-4 bg-transparent text-white border-3 border-white rounded-full font-bold text-lg hover:bg-white hover:text-purple-600 transition-all duration-300 shadow-lg hover:shadow-white/50 hover:scale-105 flex items-center gap-2"
            >
              Sign Up
              <Users className="w-5 h-5 group-hover:rotate-12 transition-transform" />
            </Link>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {/* Feature 1 */}
          <div className="group bg-white/10 backdrop-blur-lg p-8 rounded-3xl border border-white/20 hover:bg-white/20 transition-all duration-300 hover:scale-105 hover:shadow-2xl">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-blue-600 rounded-2xl flex items-center justify-center mb-6 group-hover:rotate-6 transition-transform shadow-lg">
              <MapPin className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-2xl font-bold mb-3 text-white">Plan Trips</h3>
            <p className="text-white/80 leading-relaxed">
              Create and organize your travel itineraries with dates, locations, and members
            </p>
          </div>

          {/* Feature 2 */}
          <div className="group bg-white/10 backdrop-blur-lg p-8 rounded-3xl border border-white/20 hover:bg-white/20 transition-all duration-300 hover:scale-105 hover:shadow-2xl">
            <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl flex items-center justify-center mb-6 group-hover:rotate-6 transition-transform shadow-lg">
              <Wallet className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-2xl font-bold mb-3 text-white">Track Expenses</h3>
            <p className="text-white/80 leading-relaxed">
              Record all trip expenses and split costs fairly among group members
            </p>
          </div>

          {/* Feature 3 */}
          <div className="group bg-white/10 backdrop-blur-lg p-8 rounded-3xl border border-white/20 hover:bg-white/20 transition-all duration-300 hover:scale-105 hover:shadow-2xl">
            <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-emerald-600 rounded-2xl flex items-center justify-center mb-6 group-hover:rotate-6 transition-transform shadow-lg">
              <BarChart3 className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-2xl font-bold mb-3 text-white">Generate Reports</h3>
            <p className="text-white/80 leading-relaxed">
              Get detailed reports and settlement suggestions to simplify payment
            </p>
          </div>
        </div>

        {/* Stats Section */}
        <div className="mt-24 grid grid-cols-2 md:grid-cols-4 gap-8 max-w-5xl mx-auto">
          <div className="text-center">
            <div className="text-5xl font-bold text-white mb-2">100%</div>
            <div className="text-white/70">Free to Use</div>
          </div>
          <div className="text-center">
            <div className="text-5xl font-bold text-white mb-2">
              <Calculator className="w-12 h-12 mx-auto" />
            </div>
            <div className="text-white/70">Auto Calculate</div>
          </div>
          <div className="text-center">
            <div className="text-5xl font-bold text-white mb-2">
              <Users className="w-12 h-12 mx-auto" />
            </div>
            <div className="text-white/70">Group Friendly</div>
          </div>
          <div className="text-center">
            <div className="text-5xl font-bold text-white mb-2">
              <Plane className="w-12 h-12 mx-auto" />
            </div>
            <div className="text-white/70">Travel Ready</div>
          </div>
        </div>
      </div>
    </div>
  );
}
