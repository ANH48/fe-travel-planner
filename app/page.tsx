import Link from 'next/link';
import {
  Plane,
  Wallet,
  BarChart3,
  Users,
  MapPin,
  Calculator,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

const features = [
  {
    icon: MapPin,
    title: 'Plan Trips',
    description:
      'Create and organize your travel itineraries with dates, locations, and members',
    color: 'bg-blue-600',
  },
  {
    icon: Wallet,
    title: 'Track Expenses',
    description:
      'Record all trip expenses and split costs fairly among group members',
    color: 'bg-orange-500',
  },
  {
    icon: BarChart3,
    title: 'Generate Reports',
    description:
      'Get detailed reports and settlement suggestions to simplify payment',
    color: 'bg-emerald-600',
  },
];

const stats = [
  { label: 'Free to Use', value: '100%', icon: null },
  { label: 'Auto Calculate', value: null, icon: Calculator },
  { label: 'Group Friendly', value: null, icon: Users },
  { label: 'Travel Ready', value: null, icon: Plane },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-50 relative overflow-hidden">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-100 rounded-full blur-3xl opacity-60 motion-safe:animate-pulse" />
        <div className="absolute top-1/2 -left-40 w-96 h-96 bg-blue-50 rounded-full blur-3xl opacity-50 motion-safe:animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-72 h-72 bg-slate-100 rounded-full blur-3xl opacity-60 motion-safe:animate-pulse" />
      </div>

      <div className="container mx-auto px-4 py-16 relative z-10">
        {/* Hero Section */}
        <header className="text-center mb-20">
          <div className="inline-flex items-center gap-2 mb-6 px-4 py-2 bg-blue-100 rounded-full text-blue-700 text-sm font-medium">
            <Sparkles className="w-4 h-4" aria-hidden="true" />
            <span>Smart Travel Planning Made Easy</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-bold text-slate-900 mb-6 tracking-tight leading-tight">
            Travel Expense
            <br />
            <span className="text-blue-600">Planner</span>
          </h1>

          <p className="text-xl md:text-2xl text-slate-600 mb-12 max-w-3xl mx-auto font-light leading-relaxed">
            Plan your trips, track expenses, and split costs with your travel
            companions effortlessly
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              href="/login"
              className="group px-8 py-4 bg-blue-600 text-white rounded-xl font-semibold text-lg hover:bg-blue-700 transition-colors duration-200 shadow-lg flex items-center gap-2 cursor-pointer focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              <span>Login</span>
              <ArrowRight
                className="w-5 h-5 group-hover:translate-x-1 motion-safe:transition-transform duration-200"
                aria-hidden="true"
              />
            </Link>
            <Link
              href="/register"
              className="group px-8 py-4 bg-white text-slate-700 border-2 border-slate-200 rounded-xl font-semibold text-lg hover:border-blue-600 hover:text-blue-600 transition-colors duration-200 shadow-sm flex items-center gap-2 cursor-pointer focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              <span>Sign Up</span>
              <Users className="w-5 h-5" aria-hidden="true" />
            </Link>
          </div>
        </header>

        {/* Features Grid */}
        <section aria-labelledby="features-heading" className="mb-24">
          <h2 id="features-heading" className="sr-only">
            Features
          </h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-7xl mx-auto">
            {features.map((feature) => (
              <article
                key={feature.title}
                className="group bg-white p-8 rounded-2xl border border-slate-200 hover:border-blue-200 hover:shadow-lg transition-all duration-200 cursor-default"
              >
                <div
                  className={`w-14 h-14 ${feature.color} rounded-xl flex items-center justify-center mb-6`}
                >
                  <feature.icon
                    className="w-7 h-7 text-white"
                    aria-hidden="true"
                  />
                </div>
                <h3 className="text-xl font-bold mb-3 text-slate-900">
                  {feature.title}
                </h3>
                <p className="text-slate-600 leading-relaxed">
                  {feature.description}
                </p>
              </article>
            ))}
          </div>
        </section>

        {/* Stats Section */}
        <section aria-labelledby="stats-heading">
          <h2 id="stats-heading" className="sr-only">
            Platform benefits
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-5xl mx-auto">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="text-center bg-white rounded-2xl p-6 border border-slate-200"
              >
                <div className="mb-3">
                  {stat.value ? (
                    <span className="text-4xl font-bold text-blue-600">
                      {stat.value}
                    </span>
                  ) : stat.icon ? (
                    <stat.icon
                      className="w-10 h-10 mx-auto text-blue-600"
                      aria-hidden="true"
                    />
                  ) : null}
                </div>
                <p className="text-slate-600 font-medium">{stat.label}</p>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Footer */}
      <footer className="relative z-10 py-8 text-center text-slate-500 text-sm">
        <p>
          &copy; {new Date().getFullYear()} Travel Expense Planner. All rights
          reserved.
        </p>
      </footer>
    </div>
  );
}
