'use client';

import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { settlementsApi } from '@/lib/api';
import { 
  ArrowLeft, 
  Loader2,
  Receipt,
  Calendar,
  DollarSign,
  AlertCircle
} from 'lucide-react';
import { format } from 'date-fns';

// Format VND
const formatVND = (amount: number) => {
  return new Intl.NumberFormat('vi-VN').format(amount);
};

interface ExpenseBreakdown {
  expenseId: string;
  description: string;
  amount: number;
  splitType: string;
  expenseDate: string;
}

interface SettlementDetail {
  id: string;
  tripId: string;
  memberId: string;
  memberName: string;
  totalAmount: number;
  breakdown: ExpenseBreakdown[];
  createdAt: string;
  updatedAt: string;
}

const getSplitTypeLabel = (splitType: string) => {
  switch (splitType) {
    case 'EQUAL':
      return { label: 'Equal Split', color: 'bg-blue-100 text-blue-700' };
    case 'EXACT':
      return { label: 'Exact Amount', color: 'bg-green-100 text-green-700' };
    case 'PERCENTAGE':
      return { label: 'Percentage', color: 'bg-purple-100 text-purple-700' };
    default:
      return { label: splitType, color: 'bg-gray-100 text-gray-700' };
  }
};

export default function SettlementDetailPage() {
  const params = useParams();
  const router = useRouter();
  const tripId = params.id as string;
  const memberId = params.memberId as string;

  // Fetch settlement detail
  const { data: settlementDetail, isLoading } = useQuery({
    queryKey: ['settlement-detail', tripId, memberId],
    queryFn: async () => {
      const response = await settlementsApi.getDetail(tripId, memberId);
      return response.data as SettlementDetail;
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading settlement details...</p>
        </div>
      </div>
    );
  }

  if (!settlementDetail) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <p className="text-xl font-semibold text-gray-700">Settlement not found</p>
        </div>
      </div>
    );
  }

  const breakdown = settlementDetail.breakdown || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
      <div className="max-w-4xl mx-auto p-4 md:p-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href={`/trips/${tripId}/settlements`}
            className="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-700 mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Settlements</span>
          </Link>

          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  Settlement Detail
                </h1>
                <p className="text-xl text-gray-600">
                  {settlementDetail.memberName}
                </p>
              </div>
              <div className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white w-16 h-16 rounded-full flex items-center justify-center font-bold text-2xl">
                {settlementDetail.memberName.charAt(0).toUpperCase()}
              </div>
            </div>
          </div>
        </div>

        {/* Total Amount Card */}
        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl shadow-lg p-8 mb-8 text-white">
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-3">
              <DollarSign className="w-6 h-6" />
              <p className="text-lg opacity-90">Total Amount to Pay</p>
            </div>
            <p className="text-5xl font-bold">
              {formatVND(settlementDetail.totalAmount)} ₫
            </p>
            <p className="text-sm opacity-75 mt-2">
              From {breakdown.length} expense{breakdown.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        {/* Expense Breakdown */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
            <div className="flex items-center gap-3">
              <Receipt className="w-6 h-6 text-indigo-600" />
              <h2 className="text-2xl font-bold text-gray-900">Expense Breakdown</h2>
            </div>
            <p className="text-sm text-gray-600 mt-1">
              Detailed breakdown of how the total was calculated
            </p>
          </div>

          {breakdown.length === 0 ? (
            <div className="text-center py-16">
              <AlertCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-xl font-semibold text-gray-700 mb-2">No expenses yet</p>
              <p className="text-gray-500">This member has no expense allocations</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {breakdown.map((expense) => {
                const splitTypeInfo = getSplitTypeLabel(expense.splitType);
                return (
                  <div
                    key={expense.expenseId}
                    className="p-6 hover:bg-gradient-to-r hover:from-indigo-50 hover:to-purple-50 transition-all"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="font-bold text-lg text-gray-900 mb-2">
                          {expense.description}
                        </h3>
                        <div className="flex items-center gap-4 text-sm">
                          <div className="flex items-center gap-1 text-gray-600">
                            <Calendar className="w-4 h-4" />
                            {format(new Date(expense.expenseDate), 'MMM dd, yyyy')}
                          </div>
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${splitTypeInfo.color}`}>
                            {splitTypeInfo.label}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-indigo-600">
                          {formatVND(expense.amount)} ₫
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          Your share
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Info Note */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-4">
          <div className="flex gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-semibold mb-1">About this settlement</p>
              <p>
                This shows the breakdown of all expenses that {settlementDetail.memberName} needs to contribute to.
                The amounts shown reflect their share based on how each expense was split among trip members.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
