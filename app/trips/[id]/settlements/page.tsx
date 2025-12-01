'use client';

import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { settlementsApi, tripsApi } from '@/lib/api';
import { 
  ArrowLeft, 
  Loader2,
  DollarSign,
  Users,
  AlertCircle,
  Wallet,
  RefreshCw
} from 'lucide-react';
import { ConfirmationDialog, ErrorDialog } from '@/components/ConfirmationDialog';
import { Avatar } from '@/components/OptimizedImage';

// Format VND
const formatVND = (amount: number) => {
  return new Intl.NumberFormat('vi-VN').format(amount);
};

interface Settlement {
  id: string;
  tripId: string;
  memberId: string;
  memberName: string;
  amount: number;
  createdAt: string;
  updatedAt: string;
}

interface SettlementsData {
  settlements: Settlement[];
  total: number;
}

export default function SettlementsPage() {
  const params = useParams();
  const router = useRouter();
  const tripId = params.id as string;

  // Fetch trip details
  const { data: trip, isLoading: tripLoading } = useQuery({
    queryKey: ['trip', tripId],
    queryFn: async () => {
      const response = await tripsApi.getOne(tripId);
      return response.data;
    },
  });

  // Fetch settlements
  const { data: settlementsData, isLoading: settlementsLoading, refetch } = useQuery({
    queryKey: ['settlements', tripId],
    queryFn: async () => {
      const response = await settlementsApi.getAll(tripId);
      return response.data as SettlementsData;
    },
  });

  const isLoading = tripLoading || settlementsLoading;

  const handleRecalculate = async () => {
    try {
      await settlementsApi.recalculate(tripId);
      refetch();
    } catch (err: any) {
      console.error('Error recalculating settlements:', err);
      await ErrorDialog({
        title: 'Error',
        text: err.response?.data?.message || 'Failed to recalculate settlements',
        confirmButtonColor: '#3b82f6'
      });
    }
  };

  const handleViewDetail = (memberId: string) => {
    router.push(`/trips/${tripId}/settlements/${memberId}`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading settlements...</p>
        </div>
      </div>
    );
  }

  const settlements = settlementsData?.settlements || [];
  const total = settlementsData?.total || 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
      <div className="max-w-6xl mx-auto p-4 md:p-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href={`/trips/${tripId}`}
            className="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-700 mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Trip</span>
          </Link>

          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  Settlements
                </h1>
                <p className="text-gray-600">
                  {trip?.name} • {trip?.location}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  Amount each member needs to pay
                </p>
              </div>
              <div className="flex gap-3 items-start">
                <button
                  onClick={handleRecalculate}
                  className="mobile-icon-btn flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Recalculate</span>
                </button>
                <div className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white p-3 rounded-xl">
                  <Wallet className="w-8 h-8" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Total Expense Card */}
        <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl shadow-lg p-8 mb-8 text-white">
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-3">
              <DollarSign className="w-6 h-6" />
              <p className="text-lg opacity-90">Total Trip Expense</p>
            </div>
            <p className="text-5xl font-bold">
              {formatVND(total)} ₫
            </p>
            <p className="text-sm opacity-75 mt-2">
              Split among {settlements.length} members
            </p>
          </div>
        </div>

        {/* Settlements List */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
            <div className="flex items-center gap-3">
              <Users className="w-6 h-6 text-indigo-600" />
              <h2 className="text-2xl font-bold text-gray-900">Member Settlements</h2>
            </div>
          </div>

          {settlements.length === 0 ? (
            <div className="text-center py-16">
              <AlertCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-xl font-semibold text-gray-700 mb-2">No settlements yet</p>
              <p className="text-gray-500">Add some expenses to see how much each member needs to pay</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {settlements.map((settlement, index) => (
                <div
                  key={settlement.id}
                  className="p-6 hover:bg-gradient-to-r hover:from-indigo-50 hover:to-purple-50 transition-all cursor-pointer group"
                  onClick={() => handleViewDetail(settlement.memberId)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1">
                      <Avatar
                        alt={settlement.memberName}
                        name={settlement.memberName}
                        size="md"
                      />
                      <div>
                        <h3 className="text-lg font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">
                          {settlement.memberName}
                        </h3>
                        <p className="text-sm text-gray-500">
                          Click to view detailed breakdown
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="flex items-center gap-3">
                        <div>
                          <p className="text-3xl font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">
                            {formatVND(settlement.amount)} ₫
                          </p>
                          <p className="text-sm text-gray-500 mt-1">
                            {((settlement.amount / total) * 100).toFixed(1)}% of total
                          </p>
                        </div>
                        <div className="w-12 h-12 rounded-full bg-indigo-100 group-hover:bg-indigo-200 flex items-center justify-center transition-colors">
                          <span className="text-2xl">#{index + 1}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Info Note */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-4">
          <div className="flex gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-semibold mb-1">What is Settlement?</p>
              <p>
                Settlement shows how much each member needs to pay based on their share of all expenses.
                This amount represents their portion of the trip costs, regardless of who actually paid for each expense.
                Click on any member to see a detailed breakdown of how their total was calculated.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
