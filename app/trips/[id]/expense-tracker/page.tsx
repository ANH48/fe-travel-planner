'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { expensesApi, tripsApi } from '@/lib/api';
import { format } from 'date-fns';
import { 
  ArrowLeft, 
  DollarSign,
  TrendingUp,
  TrendingDown,
  PieChart,
  Loader2,
  Plus,
  Calendar,
  Tag,
  Wallet
} from 'lucide-react';

// Format number to Vietnamese VNĐ
const formatVND = (amount: number) => {
  return new Intl.NumberFormat('vi-VN').format(amount);
};

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

export default function ExpenseTrackerPage() {
  const params = useParams();
  const tripId = params.id as string;

  // Fetch trip
  const { data: trip } = useQuery({
    queryKey: ['trip', tripId],
    queryFn: async () => {
      const response = await tripsApi.getOne(tripId);
      return response.data;
    },
  });

  // Fetch expenses
  const { data: expenses, isLoading } = useQuery({
    queryKey: ['expenses', tripId],
    queryFn: async () => {
      const response = await expensesApi.getAll(tripId);
      return response.data;
    },
  });

  // Calculate stats
  const totalAmount = expenses?.reduce((sum: number, exp: any) => sum + parseFloat(exp.amount), 0) || 0;
  
  // Group by payer
  const expensesByPayer = expenses?.reduce((acc: any, exp: any) => {
    const payerName = exp.paidBy?.name || 'Unknown';
    const payerId = exp.paidBy?.id || 'unknown';
    if (!acc[payerId]) {
      acc[payerId] = {
        name: payerName,
        total: 0,
        count: 0,
        items: []
      };
    }
    acc[payerId].total += parseFloat(exp.amount);
    acc[payerId].count += 1;
    acc[payerId].items.push(exp);
    return acc;
  }, {}) || {};

  const payers = Object.keys(expensesByPayer);
  
  // Group by category
  const expensesByCategory = expenses?.reduce((acc: any, exp: any) => {
    const category = exp.category || 'Other';
    if (!acc[category]) {
      acc[category] = {
        total: 0,
        count: 0,
        items: []
      };
    }
    acc[category].total += parseFloat(exp.amount);
    acc[category].count += 1;
    acc[category].items.push(exp);
    return acc;
  }, {}) || {};

  // Group by date
  const expensesByDate = expenses?.reduce((acc: any, exp: any) => {
    const date = formatDate(exp.date, 'yyyy-MM-dd');
    if (!acc[date]) {
      acc[date] = {
        total: 0,
        items: []
      };
    }
    acc[date].total += parseFloat(exp.amount);
    acc[date].items.push(exp);
    return acc;
  }, {}) || {};

  const categories = Object.keys(expensesByCategory).sort();
  const dates = Object.keys(expensesByDate).sort();

  // Category colors
  const categoryColors: any = {
    'Accommodation': 'bg-blue-100 text-blue-800 border-blue-200',
    'Transportation': 'bg-green-100 text-green-800 border-green-200',
    'Food & Dining': 'bg-orange-100 text-orange-800 border-orange-200',
    'Activities': 'bg-purple-100 text-purple-800 border-purple-200',
    'Shopping': 'bg-pink-100 text-pink-800 border-pink-200',
    'Other': 'bg-gray-100 text-gray-800 border-gray-200'
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-xl border-b border-gray-200/50 sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link 
              href={`/trips/${tripId}`}
              className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors group"
            >
              <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
              <span className="font-medium">Back to Trip</span>
            </Link>
            
            <Link
              href={`/trips/${tripId}/expenses/new`}
              className="mobile-icon-btn flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-semibold hover:from-green-700 hover:to-emerald-700 transition-all shadow-lg"
            >
              <Plus className="w-4 h-4" />
              <span>Add Expense</span>
            </Link>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Expense Tracker</h1>
          <p className="text-gray-600 text-lg">Track and analyze your trip expenses</p>
        </div>

        {isLoading ? (
          <div className="text-center py-20">
            <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Loading expenses...</p>
          </div>
        ) : (
          <>
            {/* Summary Cards */}
            <div className="grid md:grid-cols-3 gap-6 mb-8">
              <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-3xl p-6 text-white shadow-xl">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-green-100 font-medium">Total Expenses</p>
                  <DollarSign className="w-8 h-8 text-green-100" />
                </div>
                <p className="text-5xl font-bold mb-2">{formatVND(totalAmount)} ₫</p>
                <p className="text-green-100 text-sm">{expenses?.length || 0} transactions</p>
              </div>

              <div className="bg-white/95 backdrop-blur-sm rounded-3xl p-6 border border-gray-200/50 shadow-lg">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-gray-600 font-medium">Average/Day</p>
                  <TrendingUp className="w-8 h-8 text-blue-600" />
                </div>
                <p className="text-4xl font-bold text-gray-900 mb-2">
                  {formatVND(dates.length > 0 ? Math.round(totalAmount / dates.length) : 0)} ₫
                </p>
                <p className="text-gray-500 text-sm">{dates.length} days with expenses</p>
              </div>

              <div className="bg-white/95 backdrop-blur-sm rounded-3xl p-6 border border-gray-200/50 shadow-lg">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-gray-600 font-medium">Categories</p>
                  <PieChart className="w-8 h-8 text-purple-600" />
                </div>
                <p className="text-4xl font-bold text-gray-900 mb-2">{categories.length}</p>
                <p className="text-gray-500 text-sm">expense categories</p>
              </div>
            </div>

            {/* Paid by Members */}
            <div className="bg-white/95 backdrop-blur-sm rounded-3xl p-8 border border-gray-200/50 shadow-lg mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                <Wallet className="w-7 h-7 text-green-600" />
                Total Paid by Members
              </h2>
              
              <div className="space-y-4">
                {payers.map((payerId) => {
                  const data = expensesByPayer[payerId];
                  const percentage = (data.total / totalAmount * 100).toFixed(1);
                  
                  return (
                    <div key={payerId} className="group">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center text-white font-bold">
                            {data.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">{data.name}</p>
                            <p className="text-sm text-gray-500">{data.count} payment{data.count > 1 ? 's' : ''}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xl font-bold text-green-600">{formatVND(data.total)} ₫</p>
                          <p className="text-sm text-gray-500">{percentage}% of total</p>
                        </div>
                      </div>
                      
                      {/* Progress Bar */}
                      <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                        <div 
                          className="bg-gradient-to-r from-green-500 to-emerald-600 h-full rounded-full transition-all duration-500"
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                      
                      {/* Payer's Expenses (expandable on hover) */}
                      <div className="mt-3 ml-4 space-y-2 max-h-0 group-hover:max-h-96 overflow-hidden transition-all duration-300">
                        {data.items.map((item: any) => (
                          <div key={item.id} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                            <div>
                              <p className="font-medium text-gray-900">{item.description}</p>
                              <div className="flex items-center gap-3 text-sm text-gray-500 mt-1">
                                <span>{formatDate(item.date)}</span>
                                {item.category && (
                                  <>
                                    <span>•</span>
                                    <span className={`px-2 py-0.5 rounded text-xs font-semibold ${categoryColors[item.category] || categoryColors['Other']}`}>
                                      {item.category}
                                    </span>
                                  </>
                                )}
                              </div>
                            </div>
                            <p className="font-semibold text-green-600">{formatVND(parseFloat(item.amount))} ₫</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Category Breakdown */}
            <div className="bg-white/95 backdrop-blur-sm rounded-3xl p-8 border border-gray-200/50 shadow-lg mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                <Tag className="w-7 h-7 text-indigo-600" />
                Expenses by Category
              </h2>
              
              <div className="space-y-4">
                {categories.map((category) => {
                  const data = expensesByCategory[category];
                  const percentage = (data.total / totalAmount * 100).toFixed(1);
                  
                  return (
                    <div key={category} className="group">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <span className={`px-3 py-1 rounded-lg text-sm font-semibold border ${categoryColors[category] || categoryColors['Other']}`}>
                            {category}
                          </span>
                          <span className="text-gray-500 text-sm">{data.count} item{data.count > 1 ? 's' : ''}</span>
                        </div>
                        <div className="text-right">
                          <p className="text-xl font-bold text-gray-900">{formatVND(data.total)} ₫</p>
                          <p className="text-sm text-gray-500">{percentage}%</p>
                        </div>
                      </div>
                      
                      {/* Progress Bar */}
                      <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                        <div 
                          className="bg-gradient-to-r from-indigo-600 to-purple-600 h-full rounded-full transition-all duration-500"
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                      
                      {/* Category Items (expandable) */}
                      <div className="mt-3 ml-4 space-y-2 max-h-0 group-hover:max-h-96 overflow-hidden transition-all duration-300">
                        {data.items.map((item: any) => (
                          <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div>
                              <p className="font-medium text-gray-900">{item.description}</p>
                              <div className="flex items-center gap-3 text-sm text-gray-500 mt-1">
                                <span>{formatDate(item.date)}</span>
                                <span>•</span>
                                <span>Paid by {item.paidBy?.name || 'Unknown'}</span>
                                {item.createdBy && (
                                  <>
                                    <span>•</span>
                                    <span>Added by {item.createdBy.name}</span>
                                  </>
                                )}
                              </div>
                            </div>
                            <p className="font-semibold text-gray-900">{formatVND(parseFloat(item.amount))} ₫</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Daily Breakdown */}
            <div className="bg-white/95 backdrop-blur-sm rounded-3xl p-8 border border-gray-200/50 shadow-lg">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                <Calendar className="w-7 h-7 text-indigo-600" />
                Daily Expenses
              </h2>
              
              <div className="space-y-6">
                {dates.map((date) => {
                  const data = expensesByDate[date];
                  
                  return (
                    <div key={date} className="border-b border-gray-200 last:border-0 pb-6 last:pb-0">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="text-lg font-bold text-gray-900">
                            {formatDate(date, 'EEEE, MMM d, yyyy')}
                          </h3>
                          <p className="text-sm text-gray-500">{data.items.length} transaction{data.items.length > 1 ? 's' : ''}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-green-600">{formatVND(data.total)} ₫</p>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        {data.items.map((item: any) => (
                          <div key={item.id} className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl hover:shadow-md transition-all">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <p className="font-semibold text-gray-900">{item.description}</p>
                                {item.category && (
                                  <span className={`px-2 py-0.5 rounded text-xs font-semibold ${categoryColors[item.category] || categoryColors['Other']}`}>
                                    {item.category}
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-3 text-sm text-gray-500">
                                <span>Paid by {item.paidBy?.name || 'Unknown'}</span>
                                {item.createdBy && (
                                  <>
                                    <span>•</span>
                                    <span>Added by {item.createdBy.name}</span>
                                  </>
                                )}
                              </div>
                            </div>
                            <p className="text-xl font-bold text-gray-900">{formatVND(parseFloat(item.amount))} ₫</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
