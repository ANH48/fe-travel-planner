'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { expensesApi, membersApi, tripsApi } from '@/lib/api';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import {
  ArrowLeft,
  DollarSign,
  Calendar,
  FileText,
  User,
  Loader2,
  Wallet,
  Save,
  UserPlus
} from 'lucide-react';
import { ExpenseSplitSelector } from '@/components/ExpenseSplitSelector';

const expenseSchema = z.object({
  description: z.string().min(3, 'Description must be at least 3 characters'),
  amount: z.string().refine((val) => {
    const numVal = parseFloat(val.replace(/\./g, ''));
    return !isNaN(numVal) && numVal > 0;
  }, {
    message: 'Amount must be a positive number',
  }),
  date: z.string().min(1, 'Date is required'),
  paidById: z.string().min(1, 'Please select who paid'),
  category: z.string().optional(),
});

type ExpenseFormData = z.infer<typeof expenseSchema>;

// Format number to Vietnamese style (1.000.000)
const formatVND = (value: string) => {
  const num = value.replace(/\D/g, '');
  if (!num) return '';
  return num.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
};

// Format number (not string) to VND
const formatVNDNumber = (value: number) => {
  return new Intl.NumberFormat('vi-VN').format(value);
};

// Parse Vietnamese format to number
const parseVND = (value: string) => {
  return parseFloat(value.replace(/\./g, '')) || 0;
};

export default function NewExpensePage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const tripId = params.id as string;
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [splitType, setSplitType] = useState<'equal' | 'custom'>('equal');
  const [customSplits, setCustomSplits] = useState<{ [key: string]: string }>({});

  // Fetch members for the dropdown
  const { data: members, isLoading: membersLoading } = useQuery({
    queryKey: ['members', tripId],
    queryFn: async () => {
      const response = await membersApi.getAll(tripId);
      return response.data;
    },
  });

  // Fetch trip data for date constraints
  const { data: trip } = useQuery({
    queryKey: ['trip', tripId],
    queryFn: async () => {
      const response = await tripsApi.getOne(tripId);
      return response.data;
    },
  });

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors },
  } = useForm<ExpenseFormData>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      date: new Date().toISOString().split('T')[0],
      amount: '',
    },
  });

  const amount = watch('amount');
  const totalAmount = parseVND(amount || '0');

  const onSubmit = async (data: ExpenseFormData) => {
    try {
      setLoading(true);
      setError('');
      
      const totalAmount = parseVND(data.amount);
      
      // Build splits array
      let splits;
      if (splitType === 'equal') {
        // Equal split: divide amount equally among all members
        const perPerson = Math.floor(totalAmount / (members?.length || 1));
        const remainder = totalAmount - (perPerson * (members?.length || 1));
        
        splits = members?.map((member: any, index: number) => ({
          memberId: member.id,
          // Add remainder to last person to ensure total matches
          amount: index === members.length - 1 ? perPerson + remainder : perPerson,
        }));
      } else {
        // Custom split
        splits = Object.entries(customSplits).map(([memberId, amount]) => ({
          memberId,
          amount: parseVND(amount),
        }));
        
        const totalSplit = splits.reduce((sum, s) => sum + s.amount, 0);
        if (totalSplit !== totalAmount) {
          setError(`Total split (${formatVNDNumber(totalSplit)} ₫) must equal expense amount (${formatVNDNumber(totalAmount)} ₫)`);
          setLoading(false);
          return;
        }
      }
      
      const payload: any = {
        description: data.description,
        amount: totalAmount,
        date: data.date,
        paidById: data.paidById,
        splits,
      };
      
      // Add category if provided (convert to UPPERCASE)
      if (data.category) {
        payload.category = data.category;
      }
      
      await expensesApi.create(tripId, payload);
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['expenses', tripId] });
      queryClient.invalidateQueries({ queryKey: ['trip', tripId] });
      
      router.push(`/trips/${tripId}`);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to add expense');
    } finally {
      setLoading(false);
    }
  };

  const categories = [
    { value: 'FOOD', label: 'Food & Dining' },
    { value: 'TRANSPORT', label: 'Transportation' },
    { value: 'ACCOMMODATION', label: 'Accommodation' },
    { value: 'ENTERTAINMENT', label: 'Entertainment' },
    { value: 'OTHER', label: 'Other' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-xl border-b border-gray-200/50 sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <Link 
            href={`/trips/${tripId}`}
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors group"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            <span className="font-medium">Back to Trip</span>
          </Link>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto">
          {/* Page Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl mb-4 shadow-lg">
              <Wallet className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Add Expense</h1>
            <p className="text-gray-600 text-lg">Record a new expense for this trip</p>
          </div>

          {/* Form Card */}
          <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-xl p-8 md:p-10 border border-gray-200/50">
            {/* Error Message */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-start gap-3">
                <div className="flex-shrink-0 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white text-xs font-bold mt-0.5">
                  !
                </div>
                <p className="text-sm">{error}</p>
              </div>
            )}

            {membersLoading ? (
              <div className="text-center py-8">
                <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mx-auto mb-4" />
                <p className="text-gray-600">Loading members...</p>
              </div>
            ) : !members || members.length === 0 ? (
              <div className="text-center py-8">
                <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-4">You need to add members first before adding expenses</p>
                <Link
                  href={`/trips/${tripId}/members/new`}
                  className="mobile-icon-btn inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-bold hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg"
                >
                  <UserPlus className="w-5 h-5" />
                  <span>Add Members</span>
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {/* Description */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Description <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <FileText className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      {...register('description')}
                      type="text"
                      className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all outline-none text-gray-900 placeholder:text-gray-400"
                      placeholder="e.g., Hotel booking, Dinner, Taxi"
                    />
                  </div>
                  {errors.description && (
                    <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                      <span className="w-1 h-1 bg-red-600 rounded-full"></span>
                      {errors.description.message}
                    </p>
                  )}
                </div>

                {/* Amount and Date */}
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Amount */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Amount (VNĐ) <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <DollarSign className="h-5 w-5 text-gray-400" />
                      </div>
                      <Controller
                        name="amount"
                        control={control}
                        render={({ field }) => (
                          <input
                            type="text"
                            inputMode="numeric"
                            className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all outline-none text-gray-900 placeholder:text-gray-400"
                            placeholder="0"
                            value={field.value}
                            onChange={(e) => {
                              const formatted = formatVND(e.target.value);
                              field.onChange(formatted);
                            }}
                          />
                        )}
                      />
                    </div>
                    {errors.amount && (
                      <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                        <span className="w-1 h-1 bg-red-600 rounded-full"></span>
                        {errors.amount.message}
                      </p>
                    )}
                  </div>

                  {/* Date */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Date <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Controller
                        name="date"
                        control={control}
                        render={({ field }) => (
                          <DatePicker
                            selected={field.value ? new Date(field.value) : null}
                            onChange={(date) => field.onChange(date ? date.toISOString().split('T')[0] : '')}
                            minDate={trip?.startDate ? new Date(trip.startDate) : undefined}
                            maxDate={trip?.endDate ? new Date(trip.endDate) : undefined}
                            dateFormat="yyyy-MM-dd"
                            className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all outline-none text-gray-900 cursor-pointer"
                            placeholderText="Select a date"
                          />
                        )}
                      />
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Calendar className="h-5 w-5 text-gray-400" />
                      </div>
                    </div>
                    {errors.date && (
                      <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                        <span className="w-1 h-1 bg-red-600 rounded-full"></span>
                        {errors.date.message}
                      </p>
                    )}
                  </div>
                </div>

                {/* Paid By */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Paid By *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <User className="h-5 w-5 text-gray-400" />
                    </div>
                    <select
                      {...register('paidById')}
                      className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all outline-none text-gray-900 appearance-none bg-white"
                    >
                      <option value="">Select a member</option>
                      {members?.map((member: any) => (
                        <option key={member.id} value={member.id}>
                          {member.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  {errors.paidById && (
                    <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                      <span className="w-1 h-1 bg-red-600 rounded-full"></span>
                      {errors.paidById.message}
                    </p>
                  )}
                </div>

                {/* Category */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Category (Optional)
                  </label>
                  <select
                    {...register('category')}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all outline-none text-gray-900 appearance-none bg-white"
                  >
                    <option value="">Select a category</option>
                    {categories.map((cat) => (
                      <option key={cat.value} value={cat.value}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Expense Split Selector */}
                <ExpenseSplitSelector
                  members={members || []}
                  totalAmount={totalAmount}
                  splitType={splitType}
                  customSplits={customSplits}
                  onSplitTypeChange={setSplitType}
                  onCustomSplitsChange={setCustomSplits}
                  formatVND={formatVND}
                  formatVNDNumber={formatVNDNumber}
                  parseVND={parseVND}
                />

                {/* Submit Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 pt-4">
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-bold text-lg hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Adding Expense...</span>
                      </>
                    ) : (
                      <>
                        <Save className="w-5 h-5" />
                        <span>Add Expense</span>
                      </>
                    )}
                  </button>
                  
                  <Link
                    href={`/trips/${tripId}`}
                    className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-gray-100 text-gray-700 rounded-xl font-bold text-lg hover:bg-gray-200 transition-all duration-300"
                  >
                    Cancel
                  </Link>
                </div>
              </form>
            )}
          </div>

          {/* Info Box */}
          <div className="mt-6 bg-green-50 border border-green-200 rounded-2xl p-6">
            <h3 className="font-bold text-green-900 mb-2 flex items-center gap-2">
              <span className="text-xl">💡</span>
              Expense Tips
            </h3>
            <ul className="text-green-800 text-sm space-y-1">
              <li>• Choose <strong>Equal Split</strong> to divide equally among all members</li>
              <li>• Choose <strong>Custom Split</strong> to set specific amounts per member</li>
              <li>• Custom split total must equal the expense amount</li>
              <li>• Use custom split when some members didn't use the service (e.g., taxi, food)</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
