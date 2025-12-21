'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tripsApi, membersApi, expensesApi, settlementsApi, itineraryApi, invitationsApi } from '@/lib/api';
import { format } from 'date-fns';
import { LocationAutocomplete } from '@/components/LocationAutocomplete';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { 
  ArrowLeft, 
  MapPin, 
  Calendar, 
  Users, 
  Wallet, 
  Plus,
  Loader2,
  Trash2,
  Edit,
  DollarSign,
  TrendingUp,
  UserPlus,
  Receipt,
  BarChart3,
  CalendarDays,
  Clock,
  FileText,
  Save,
  X,
  User
} from 'lucide-react';
import { NotificationBell } from '@/components/NotificationBell';
import { ConfirmationDialog } from '@/components/ConfirmationDialog';
import { Avatar } from '@/components/OptimizedImage';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ExpenseSplitSelector } from '@/components/ExpenseSplitSelector';

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

// Format VND input (for form inputs)
const formatVNDInput = (value: string) => {
  const num = value.replace(/\D/g, '');
  if (!num) return '';
  return num.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
};

// Parse Vietnamese format to number
const parseVND = (value: string) => {
  return parseFloat(value.replace(/\./g, '')) || 0;
};

// Itinerary form schema
const itinerarySchema = z.object({
  date: z.string().min(1, 'Date is required'),
  startTime: z.string().min(1, 'Start time is required'),
  endTime: z.string().min(1, 'End time is required'),
  activity: z.string().min(3, 'Activity name must be at least 3 characters'),
  location: z.string().optional(),
  description: z.string().optional(),
  category: z.string().min(1, 'Category is required'),
});

type ItineraryFormData = z.infer<typeof itinerarySchema>;

// Expense form schema
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
  category: z.string().min(1, 'Category is required'),
});

type ExpenseFormData = z.infer<typeof expenseSchema>;

export default function TripDetailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const tripId = params.id as string;
  const [activeTab, setActiveTab] = useState<'overview' | 'members' | 'expenses' | 'itinerary' | 'settlements'>('overview');
  const [isItineraryModalOpen, setIsItineraryModalOpen] = useState(false);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [itineraryError, setItineraryError] = useState('');
  const [expenseError, setExpenseError] = useState('');
  const [expenseSplitType, setExpenseSplitType] = useState<'equal' | 'custom'>('equal');
  const [expenseCustomSplits, setExpenseCustomSplits] = useState<{ [key: string]: string }>({});

  // Set active tab from URL query params
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam && ['overview', 'members', 'expenses', 'itinerary', 'settlements'].includes(tabParam)) {
      setActiveTab(tabParam as 'overview' | 'members' | 'expenses' | 'itinerary' | 'settlements');
    }
  }, [searchParams]);

  // Handle notification received - refresh data if on members tab
  const handleNotificationReceived = () => {
    if (activeTab === 'members') {
      console.log('📬 Notification received on members tab - refreshing data');
      queryClient.invalidateQueries({ queryKey: ['members', tripId] });
      queryClient.invalidateQueries({ queryKey: ['invitations', tripId] });
      queryClient.invalidateQueries({ queryKey: ['trip', tripId] });
    }
  };

  // Handle tab change and refetch data
  const handleTabChange = (tab: 'overview' | 'members' | 'expenses' | 'itinerary' | 'settlements') => {
    setActiveTab(tab);

    // Refetch data based on the tab
    switch (tab) {
      case 'members':
        queryClient.invalidateQueries({ queryKey: ['members', tripId] });
        queryClient.invalidateQueries({ queryKey: ['invitations', tripId] });
        break;
      case 'expenses':
        queryClient.invalidateQueries({ queryKey: ['expenses', tripId] });
        break;
      case 'itinerary':
        queryClient.invalidateQueries({ queryKey: ['itinerary', tripId] });
        break;
      case 'settlements':
        queryClient.invalidateQueries({ queryKey: ['settlements', tripId] });
        break;
      case 'overview':
        // Refetch all data for overview
        queryClient.invalidateQueries({ queryKey: ['members', tripId] });
        queryClient.invalidateQueries({ queryKey: ['expenses', tripId] });
        break;
      default:
        break;
    }

    // Always refetch trip data to get updated stats
    queryClient.invalidateQueries({ queryKey: ['trip', tripId] });
  };

  // Fetch trip details
  const { data: trip, isLoading: tripLoading } = useQuery({
    queryKey: ['trip', tripId],
    queryFn: async () => {
      const response = await tripsApi.getOne(tripId);
      return response.data;
    },
  });

  // Fetch members
  const { data: members, isLoading: membersLoading } = useQuery({
    queryKey: ['members', tripId],
    queryFn: async () => {
      const response = await membersApi.getAll(tripId);
      return response.data;
    },
  });

  // Check if user is creator
  const isCreator = trip?.role === 'creator';

  // Fetch pending invitations (only for trip creator)
  const { data: pendingInvitations, isLoading: invitationsLoading } = useQuery({
    queryKey: ['invitations', tripId],
    queryFn: async () => {
      const response = await membersApi.getPendingInvitations(tripId);
      return response.data;
    },
    enabled: activeTab === 'members' && isCreator,
  });

  // Fetch expenses
  const { data: expenses, isLoading: expensesLoading } = useQuery({
    queryKey: ['expenses', tripId],
    queryFn: async () => {
      const response = await expensesApi.getAll(tripId);
      return response.data;
    },
  });

  // Fetch itinerary
  const { data: itinerary, isLoading: itineraryLoading } = useQuery({
    queryKey: ['itinerary', tripId],
    queryFn: async () => {
      const response = await itineraryApi.getAll(tripId);
      return response.data;
    },
  });

  // Fetch settlements
  const { data: settlementsData, isLoading: settlementsLoading } = useQuery({
    queryKey: ['settlements', tripId],
    queryFn: async () => {
      const response = await settlementsApi.getAll(tripId);
      return response.data;
    },
    enabled: activeTab === 'settlements',
  });

  // Delete trip mutation
  const deleteTripMutation = useMutation({
    mutationFn: () => tripsApi.delete(tripId),
    onSuccess: () => {
      router.push('/dashboard');
    },
  });

  // Delete itinerary item mutation
  const deleteItineraryMutation = useMutation({
    mutationFn: (id: string) => itineraryApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['itinerary', tripId] });
    },
  });

  // Cancel invitation mutation
  const cancelInvitationMutation = useMutation({
    mutationFn: (invitationId: string) => invitationsApi.cancel(invitationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invitations', tripId] });
      queryClient.invalidateQueries({ queryKey: ['members', tripId] });
    },
  });

  // Create itinerary mutation
  const createItineraryMutation = useMutation({
    mutationFn: (data: ItineraryFormData) => itineraryApi.create(tripId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['itinerary', tripId] });
      setIsItineraryModalOpen(false);
      resetItineraryForm();
    },
    onError: (err: any) => {
      setItineraryError(err.response?.data?.message || 'Failed to add itinerary');
    },
  });

  // Create expense mutation
  const createExpenseMutation = useMutation({
    mutationFn: (data: any) => expensesApi.create(tripId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses', tripId] });
      queryClient.invalidateQueries({ queryKey: ['trip', tripId] });
      setIsExpenseModalOpen(false);
      resetExpenseForm();
    },
    onError: (err: any) => {
      setExpenseError(err.response?.data?.message || 'Failed to add expense');
    },
  });

  // Itinerary form setup
  const {
    register: registerItinerary,
    handleSubmit: handleItinerarySubmit,
    control: itineraryControl,
    watch: watchItinerary,
    reset: resetItineraryForm,
    formState: { errors: itineraryErrors },
  } = useForm<ItineraryFormData>({
    resolver: zodResolver(itinerarySchema),
  });

  // Expense form setup
  const {
    register: registerExpense,
    handleSubmit: handleExpenseSubmit,
    control: expenseControl,
    watch: watchExpense,
    reset: resetExpenseForm,
    formState: { errors: expenseErrors },
  } = useForm<ExpenseFormData>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      date: new Date().toISOString().split('T')[0],
      amount: '',
    },
  });

  const expenseAmount = watchExpense('amount');
  const totalExpenseAmount = parseVND(expenseAmount || '0');

  const handleDeleteTrip = async () => {
    const confirmed = await ConfirmationDialog({
      title: 'Are you sure?',
      text: 'You want to delete this trip? This action cannot be undone.',
      icon: 'warning',
      confirmButtonText: 'Yes, delete it',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280'
    });

    if (confirmed) {
      deleteTripMutation.mutate();
    }
  };

  const handleCancelInvitation = async (invitationId: string, email: string) => {
    const confirmed = await ConfirmationDialog({
      title: 'Cancel invitation?',
      text: `Are you sure you want to cancel the invitation for ${email}?`,
      icon: 'question',
      confirmButtonText: 'Yes, cancel',
      cancelButtonText: 'Keep invitation',
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280'
    });

    if (confirmed) {
      cancelInvitationMutation.mutate(invitationId);
    }
  };

  const handleDeleteItineraryItem = async (itemId: string, activityName: string) => {
    const confirmed = await ConfirmationDialog({
      title: 'Delete activity?',
      text: `Are you sure you want to delete "${activityName}"?`,
      icon: 'warning',
      confirmButtonText: 'Yes, delete',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280'
    });

    if (confirmed) {
      deleteItineraryMutation.mutate(itemId);
    }
  };

  // Itinerary form handlers
  const onItinerarySubmit = async (data: ItineraryFormData) => {
    setItineraryError('');
    createItineraryMutation.mutate(data);
  };

  const openItineraryModal = () => {
    setIsItineraryModalOpen(true);
    setItineraryError('');
    resetItineraryForm();
  };

  const closeItineraryModal = () => {
    setIsItineraryModalOpen(false);
    setItineraryError('');
    resetItineraryForm();
  };

  // Expense form handlers
  const onExpenseSubmit = async (data: ExpenseFormData) => {
    try {
      setExpenseError('');

      const totalAmount = parseVND(data.amount);

      // Build splits array based on split type
      let splits;
      if (expenseSplitType === 'equal') {
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
        splits = Object.entries(expenseCustomSplits).map(([memberId, amount]) => ({
          memberId,
          amount: parseVND(amount),
        }));

        const totalSplit = splits.reduce((sum, s) => sum + s.amount, 0);
        if (totalSplit !== totalAmount) {
          setExpenseError(`Total split (${formatVND(totalSplit)} ₫) must equal expense amount (${formatVND(totalAmount)} ₫)`);
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

      // Add category if provided
      if (data.category) {
        payload.category = data.category;
      }

      createExpenseMutation.mutate(payload);
    } catch (err: any) {
      setExpenseError(err.response?.data?.message || 'Failed to add expense');
    }
  };

  const openExpenseModal = () => {
    setIsExpenseModalOpen(true);
    setExpenseError('');
    setExpenseSplitType('equal');
    setExpenseCustomSplits({});
    resetExpenseForm();
  };

  const closeExpenseModal = () => {
    setIsExpenseModalOpen(false);
    setExpenseError('');
    setExpenseSplitType('equal');
    setExpenseCustomSplits({});
    resetExpenseForm();
  };

  // Itinerary categories
  const itineraryCategories = [
    'Sightseeing',
    'Food & Dining',
    'Transportation',
    'Activity',
    'Shopping',
    'Relaxation',
    'Meeting',
    'Other'
  ];

  // Expense categories
  const expenseCategories = [
    { value: 'FOOD', label: 'Food & Dining' },
    { value: 'TRANSPORT', label: 'Transportation' },
    { value: 'ACCOMMODATION', label: 'Accommodation' },
    { value: 'ENTERTAINMENT', label: 'Entertainment' },
    { value: 'OTHER', label: 'Other' },
  ];

  if (tripLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading trip details...</p>
        </div>
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Trip not found</h2>
          <Link href="/dashboard" className="text-indigo-600 hover:underline">
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const totalExpenses = expenses?.reduce((sum: number, exp: any) => sum + parseFloat(exp.amount), 0) || 0;
  const memberCount = members?.length || 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-xl border-b border-gray-200/50 sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link 
              href="/dashboard"
              className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors group"
            >
              <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
              <span className="font-medium">Back to Dashboard</span>
            </Link>
            
            <div className="flex items-center gap-2">
              <NotificationBell onNotificationReceived={handleNotificationReceived} />
              {isCreator && (
                <div className="flex items-center gap-1">
                  <Link
                    href={`/trips/${tripId}/edit`}
                    className="mobile-icon-btn flex items-center gap-2 px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-xl transition-all font-medium min-h-[44px]"
                  >
                    <Edit className="w-4 h-4" />
                    <span>Edit</span>
                  </Link>
                  <button
                    onClick={handleDeleteTrip}
                    disabled={deleteTripMutation.isPending}
                    className="mobile-icon-btn flex items-center gap-2 px-3 py-2 text-red-600 hover:bg-red-50 rounded-xl transition-all font-medium min-h-[44px] disabled:opacity-50"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Delete</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Trip Header */}
        <div className="bg-gradient-to-br from-indigo-600 to-purple-600 rounded-3xl p-8 mb-8 text-white shadow-xl">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-4xl font-bold">{trip.name}</h1>
                <span className={`px-3 py-1 text-xs font-bold rounded-full ${
                  trip.status === 'UPCOMING'
                    ? 'bg-blue-400/30 text-blue-100'
                    : trip.status === 'ONGOING'
                    ? 'bg-green-400/30 text-green-100'
                    : 'bg-gray-400/30 text-gray-100'
                }`}>
                  {trip.status}
                </span>
              </div>
              
              <div className="flex flex-wrap gap-4 text-white/90">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  <span>{trip.location}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>
                    {formatDate(trip.startDate, 'MMM d')} - {formatDate(trip.endDate, 'MMM d, yyyy')}
                  </span>
                </div>
              </div>
              
              {trip.description && (
                <p className="mt-3 text-white/80">{trip.description}</p>
              )}
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-6 border border-gray-200/50 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <p className="text-gray-600 text-sm font-medium">Total Spent</p>
              <DollarSign className="w-5 h-5 text-green-600" />
            </div>
            <p className="text-3xl font-bold text-gray-900">{formatVND(totalExpenses)} ₫</p>
          </div>
          
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-6 border border-gray-200/50 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <p className="text-gray-600 text-sm font-medium">Members</p>
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <p className="text-3xl font-bold text-gray-900">{memberCount}</p>
          </div>
          
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-6 border border-gray-200/50 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <p className="text-gray-600 text-sm font-medium">Expenses</p>
              <Receipt className="w-5 h-5 text-purple-600" />
            </div>
            <p className="text-3xl font-bold text-gray-900">{expenses?.length || 0}</p>
          </div>
          
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-6 border border-gray-200/50 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <p className="text-gray-600 text-sm font-medium">Per Person</p>
              <TrendingUp className="w-5 h-5 text-orange-600" />
            </div>
            <p className="text-3xl font-bold text-gray-900">
              {memberCount > 0 ? formatVND(Math.round(totalExpenses / memberCount)) : '0'} ₫
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl border border-gray-200/50 shadow-sm mb-6 overflow-hidden">
          <div className="flex border-b border-gray-200 overflow-x-auto scrollbar-hide">
            <button
              onClick={() => handleTabChange('overview')}
              className={`flex-1 px-4 py-4 font-semibold transition-all whitespace-nowrap min-w-[80px] min-h-[48px] flex flex-col md:flex-row items-center justify-center gap-1 md:gap-2 ${
                activeTab === 'overview'
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <BarChart3 className="w-5 h-5 md:w-4 md:h-4" />
              <span className="hidden md:inline">Overview</span>
            </button>
            <button
              onClick={() => handleTabChange('itinerary')}
              className={`flex-1 px-4 py-4 font-semibold transition-all whitespace-nowrap min-w-[80px] min-h-[48px] flex flex-col md:flex-row items-center justify-center gap-1 md:gap-2 ${
                activeTab === 'itinerary'
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <CalendarDays className="w-5 h-5 md:w-4 md:h-4" />
              <span className="hidden md:inline">Itinerary</span>
            </button>
            <button
              onClick={() => handleTabChange('members')}
              className={`flex-1 px-4 py-4 font-semibold transition-all whitespace-nowrap min-w-[100px] min-h-[48px] flex flex-col md:flex-row items-center justify-center gap-1 md:gap-2 ${
                activeTab === 'members'
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Users className="w-5 h-5 md:w-4 md:h-4" />
              <span className="hidden md:inline">Members ({memberCount})</span>
            </button>
            <button
              onClick={() => handleTabChange('expenses')}
              className={`flex-1 px-4 py-4 font-semibold transition-all whitespace-nowrap min-w-[90px] min-h-[48px] flex flex-col md:flex-row items-center justify-center gap-1 md:gap-2 ${
                activeTab === 'expenses'
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Receipt className="w-5 h-5 md:w-4 md:h-4" />
              <span className="hidden md:inline">Expenses ({expenses?.length || 0})</span>
            </button>
            <button
              onClick={() => handleTabChange('settlements')}
              className={`flex-1 px-4 py-4 font-semibold transition-all whitespace-nowrap min-w-[100px] min-h-[48px] flex flex-col md:flex-row items-center justify-center gap-1 md:gap-2 ${
                activeTab === 'settlements'
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <DollarSign className="w-5 h-5 md:w-4 md:h-4" />
              <span className="hidden md:inline">Settlements</span>
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl border border-gray-200/50 shadow-sm p-8">
          {activeTab === 'overview' && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Trip Overview</h2>
              <div className="space-y-4">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-semibold text-gray-700 mb-2">Recent Members</h3>
                    {members && members.length > 0 ? (
                      <div className="space-y-2">
                        {members.slice(0, 3).map((member: any) => (
                          <div key={member.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                            <Avatar
                              src={member.avatar}
                              alt={member.name}
                              name={member.name}
                              size="md"
                            />
                            <div>
                              <p className="font-medium text-gray-900">{member.name}</p>
                              <p className="text-sm text-gray-500">{member.email}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500">No members yet</p>
                    )}
                  </div>
                  
                  <div>
                    <h3 className="font-semibold text-gray-700 mb-2">Recent Expenses</h3>
                    {expenses && expenses.length > 0 ? (
                      <div className="space-y-2">
                        {expenses.slice(0, 3).map((expense: any) => (
                          <div key={expense.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                            <div>
                              <p className="font-medium text-gray-900">{expense.description}</p>
                              <p className="text-sm text-gray-500">{formatDate(expense.date)}</p>
                            </div>
                            <p className="font-bold text-green-600">{formatVND(parseFloat(expense.amount))} ₫</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500">No expenses yet</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'members' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Members</h2>
                {isCreator && (
                  <Link
                    href={`/trips/${tripId}/members/new`}
                    className="mobile-icon-btn flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>Invite Member</span>
                  </Link>
                )}
              </div>
              
              {membersLoading || invitationsLoading ? (
                <div className="text-center py-8">
                  <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mx-auto" />
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Pending Invitations - Only visible to creator */}
                  {isCreator && pendingInvitations && pendingInvitations.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-700 mb-3 flex items-center gap-2">
                        <Clock className="w-5 h-5 text-amber-500" />
                        Pending Invitations ({pendingInvitations.length})
                      </h3>
                      <div className="grid md:grid-cols-2 gap-4">
                        {pendingInvitations.map((invitation: any) => {
                          const userName = invitation.invitedUser?.name || invitation.invitedEmail.split('@')[0];
                          const userEmail = invitation.invitedUser?.email || invitation.invitedEmail;
                          
                          return (
                            <div key={invitation.id} className="flex items-center gap-4 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                              <Avatar
                                src={invitation.invitedUser?.avatar}
                                alt={userName}
                                name={userName}
                                size="lg"
                                fallbackColor="from-amber-400 to-orange-500"
                              />
                              <div className="flex-1 min-w-0">
                                <p className="font-semibold text-gray-900">{userName}</p>
                                <p className="text-sm text-gray-600 truncate">{userEmail}</p>
                                {!invitation.invitedUser && (
                                  <p className="text-xs text-amber-600 mt-1">Not registered yet</p>
                                )}
                              </div>
                              <div className="flex items-center gap-2 flex-shrink-0">
                                <div className="flex items-center gap-1 px-2 py-1 bg-amber-100 rounded-full text-xs font-medium text-amber-700">
                                  <Clock className="w-3 h-3" />
                                  Pending
                                </div>
                                {isCreator && (
                                  <button
                                    onClick={() => handleCancelInvitation(invitation.id, userEmail)}
                                    disabled={cancelInvitationMutation.isPending}
                                    className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors disabled:opacity-50"
                                    title="Cancel invitation"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Active Members */}
                  {members && members.length > 0 ? (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-700 mb-3 flex items-center gap-2">
                        <Users className="w-5 h-5 text-indigo-600" />
                        Active Members ({members.length})
                      </h3>
                      <div className="grid md:grid-cols-2 gap-4">
                        {members.map((member: any) => (
                          <div key={member.id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                            <Avatar
                              src={member.avatar}
                              alt={member.name}
                              name={member.name}
                              size="md"
                            />
                            <div className="flex-1">
                              <p className="font-semibold text-gray-900">{member.name}</p>
                              <p className="text-sm text-gray-500">{member.email}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    (!isCreator || !pendingInvitations?.length) && (
                      <div className="text-center py-12">
                        <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500 mb-4">No members yet</p>
                        {isCreator && (
                          <Link
                            href={`/trips/${tripId}/members/new`}
                            className="mobile-icon-btn inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg"
                          >
                            <UserPlus className="w-4 h-4" />
                            <span>Invite First Member</span>
                          </Link>
                        )}
                      </div>
                    )
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === 'itinerary' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Trip Itinerary</h2>
                <button
                  onClick={openItineraryModal}
                  className="mobile-icon-btn flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold hover:from-purple-700 hover:to-pink-700 transition-all shadow-lg"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Activity</span>
                </button>
              </div>
              
              {itineraryLoading ? (
                <div className="text-center py-8">
                  <Loader2 className="w-8 h-8 text-purple-600 animate-spin mx-auto" />
                </div>
              ) : itinerary && itinerary.length > 0 ? (
                <div className="space-y-6">
                  {/* Group by date */}
                  {Object.entries(
                    itinerary.reduce((acc: any, item: any) => {
                      const date = formatDate(item.date, 'yyyy-MM-dd');
                      if (!acc[date]) acc[date] = [];
                      acc[date].push(item);
                      return acc;
                    }, {})
                  ).map(([date, items]: [string, any], dayIndex) => (
                    <div key={date}>
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center text-white font-bold">
                          D{dayIndex + 1}
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-gray-900">Day {dayIndex + 1}</h3>
                          <p className="text-sm text-gray-500">{formatDate(date, 'EEEE, MMM d, yyyy')}</p>
                        </div>
                      </div>
                      
                      <div className="ml-6 pl-6 border-l-2 border-purple-200 space-y-4">
                        {items
                          .sort((a: any, b: any) => a.startTime.localeCompare(b.startTime))
                          .map((item: any, index: number) => {
                            const categoryStyles: any = {
                              'Sightseeing': {
                                bg: 'bg-gradient-to-r from-purple-50 to-purple-100',
                                badge: 'bg-purple-200 text-purple-800',
                              },
                              'Food & Dining': {
                                bg: 'bg-gradient-to-r from-orange-50 to-orange-100',
                                badge: 'bg-orange-200 text-orange-800',
                              },
                              'Transportation': {
                                bg: 'bg-gradient-to-r from-blue-50 to-blue-100',
                                badge: 'bg-blue-200 text-blue-800',
                              },
                              'Activity': {
                                bg: 'bg-gradient-to-r from-green-50 to-green-100',
                                badge: 'bg-green-200 text-green-800',
                              },
                              'Shopping': {
                                bg: 'bg-gradient-to-r from-pink-50 to-pink-100',
                                badge: 'bg-pink-200 text-pink-800',
                              },
                              'Relaxation': {
                                bg: 'bg-gradient-to-r from-teal-50 to-teal-100',
                                badge: 'bg-teal-200 text-teal-800',
                              },
                              'Meeting': {
                                bg: 'bg-gradient-to-r from-indigo-50 to-indigo-100',
                                badge: 'bg-indigo-200 text-indigo-800',
                              },
                              'Other': {
                                bg: 'bg-gradient-to-r from-gray-50 to-gray-100',
                                badge: 'bg-gray-200 text-gray-800',
                              },
                            };
                            const style = categoryStyles[item.category] || categoryStyles['Other'];
                            
                            return (
                              <div key={item.id} className="relative group">
                                <div className="absolute -left-[29px] w-4 h-4 bg-purple-500 rounded-full border-4 border-white"></div>
                                <div className={`${style.bg} rounded-xl p-4 hover:shadow-md transition-all`}>
                                  <div className="flex items-start justify-between mb-2">
                                    <div className="flex items-center gap-3">
                                      <Clock className="w-5 h-5 text-purple-600" />
                                      <span className="font-semibold text-purple-900">
                                        {item.startTime} - {item.endTime}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <span className={`text-xs px-3 py-1 ${style.badge} rounded-full font-semibold`}>
                                        {item.category}
                                      </span>
                                      <button
                                        onClick={() => handleDeleteItineraryItem(item.id, item.activity)}
                                        className="opacity-100 lg:opacity-0 group-hover:opacity-100 p-1 hover:bg-red-100 rounded-lg transition-all min-h-[32px] min-w-[32px] flex items-center justify-center"
                                      >
                                        <Trash2 className="w-4 h-4 text-red-600" />
                                      </button>
                                    </div>
                                  </div>
                                  <h4 className="text-lg font-bold text-gray-900 mb-1">{item.activity}</h4>
                                  {item.location && (
                                    <div className="flex items-center gap-2 text-gray-600 text-sm mb-2">
                                      <MapPin className="w-4 h-4" />
                                      <span>{item.location}</span>
                                    </div>
                                  )}
                                  {item.description && (
                                    <p className="text-gray-600 text-sm">{item.description}</p>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl border-2 border-dashed border-purple-300">
                  <CalendarDays className="w-12 h-12 text-purple-400 mx-auto mb-4" />
                  <p className="text-gray-500 mb-4">Start planning your daily activities</p>
                  {/* <button
                    onClick={openItineraryModal}
                    className="mobile-icon-btn inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold hover:from-purple-700 hover:to-pink-700 transition-all shadow-lg"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add First Activity</span>
                  </button> */}
                </div>
              )}
            </div>
          )}

          {activeTab === 'expenses' && (
            <div>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Expenses</h2>
                <div className="flex gap-2">
                  <Link
                    href={`/trips/${tripId}/expense-tracker`}
                    className="mobile-icon-btn flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-cyan-700 transition-all shadow-lg"
                  >
                    <BarChart3 className="w-4 h-4" />
                    <span>View Tracker</span>
                  </Link>
                  <button
                    onClick={openExpenseModal}
                    className="mobile-icon-btn flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Expense</span>
                  </button>
                </div>
              </div>
              
              {expensesLoading ? (
                <div className="text-center py-8">
                  <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mx-auto" />
                </div>
              ) : expenses && expenses.length > 0 ? (
                <div className="space-y-3">
                  {expenses.map((expense: any) => (
                    <div key={expense.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                          <Wallet className="w-6 h-6 text-green-600" />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{expense.description}</p>
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            <span>{formatDate(expense.date)}</span>
                            <span>•</span>
                            <span>Paid by {expense.paidBy?.name || 'Unknown'}</span>
                            {expense.createdBy && (
                              <>
                                <span>•</span>
                                <span>Added by {expense.createdBy.name}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      <p className="text-xl font-bold text-green-600">{formatVND(parseFloat(expense.amount))} ₫</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Wallet className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 mb-4">No expenses recorded yet</p>
                  <button
                    onClick={openExpenseModal}
                    className="mobile-icon-btn inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add First Expense</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {activeTab === 'settlements' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Settlements</h2>
                <Link
                  href={`/trips/${tripId}/settlements`}
                  className="mobile-icon-btn flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg"
                >
                  <BarChart3 className="w-4 h-4" />
                  <span>View Details</span>
                </Link>
              </div>

              {settlementsLoading ? (
                <div className="text-center py-8">
                  <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mx-auto" />
                </div>
              ) : settlementsData?.settlements && settlementsData.settlements.length > 0 ? (
                <>
                  {/* Total Card */}
                  <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl p-6 mb-6 text-white shadow-xl">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-green-100 font-medium mb-1">Total Trip Expense</p>
                        <p className="text-4xl font-bold">{formatVND(settlementsData.total)} ₫</p>
                        <p className="text-green-100 text-sm mt-1">
                          Split among {settlementsData.settlements.length} members
                        </p>
                      </div>
                      <DollarSign className="w-16 h-16 text-green-100 opacity-50" />
                    </div>
                  </div>

                  {/* Settlements List */}
                  <div className="space-y-3">
                    {settlementsData.settlements
                      .sort((a: any, b: any) => b.amount - a.amount)
                      .map((settlement: any, index: number) => (
                        <Link
                          key={settlement.id}
                          href={`/trips/${tripId}/settlements/${settlement.memberId}`}
                          className="block"
                        >
                          <div className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl hover:from-indigo-50 hover:to-purple-50 transition-all hover:shadow-md group">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                                {settlement.memberName.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <p className="font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">
                                  {settlement.memberName}
                                </p>
                                <p className="text-sm text-gray-500">
                                  {((settlement.amount / settlementsData.total) * 100).toFixed(1)}% of total
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <p className="text-2xl font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">
                                {formatVND(settlement.amount)} ₫
                              </p>
                              <div className="w-8 h-8 rounded-full bg-indigo-100 group-hover:bg-indigo-200 flex items-center justify-center transition-colors">
                                <span className="text-sm font-bold text-indigo-600">#{index + 1}</span>
                              </div>
                            </div>
                          </div>
                        </Link>
                      ))}
                  </div>

                  {/* Info Note */}
                  <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-4">
                    <div className="flex gap-3">
                      <Wallet className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                      <div className="text-sm text-blue-800">
                        <p className="font-semibold mb-1">What is Settlement?</p>
                        <p>
                          Settlement shows how much each member needs to pay based on their share of all expenses.
                          Click on any member to see a detailed breakdown.
                        </p>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-12">
                  <Wallet className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 mb-4">No settlements yet</p>
                  <p className="text-sm text-gray-400">Add expenses to see how much each member needs to pay</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Add Itinerary Modal */}
      {isItineraryModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center">
                  <CalendarDays className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Add Itinerary</h3>
                  <p className="text-sm text-gray-600">Plan your daily activities</p>
                </div>
              </div>
              <button
                onClick={closeItineraryModal}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6">
              {/* Error Message */}
              {itineraryError && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-start gap-3">
                  <div className="flex-shrink-0 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white text-xs font-bold mt-0.5">
                    !
                  </div>
                  <p className="text-sm">{itineraryError}</p>
                </div>
              )}

              <form onSubmit={handleItinerarySubmit(onItinerarySubmit)} className="space-y-6">
                {/* Date */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Date <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Calendar className="h-5 w-5 text-gray-400" />
                    </div>
                    <Controller
                      name="date"
                      control={itineraryControl}
                      render={({ field }) => (
                        <DatePicker
                          selected={field.value ? new Date(field.value) : null}
                          onChange={(date) => field.onChange(date ? date.toISOString().split('T')[0] : '')}
                          minDate={trip?.startDate ? new Date(trip.startDate) : undefined}
                          maxDate={trip?.endDate ? new Date(trip.endDate) : undefined}
                          dateFormat="yyyy-MM-dd"
                          className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all outline-none text-gray-900"
                          placeholderText="Select a date"
                        />
                      )}
                    />
                  </div>
                  {itineraryErrors.date && (
                    <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                      <span className="w-1 h-1 bg-red-600 rounded-full"></span>
                      {itineraryErrors.date.message}
                    </p>
                  )}
                </div>

                {/* Time Range */}
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Start Time */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Start Time <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Clock className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        {...registerItinerary('startTime')}
                        type="time"
                        className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all outline-none text-gray-900"
                      />
                    </div>
                    {itineraryErrors.startTime && (
                      <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                        <span className="w-1 h-1 bg-red-600 rounded-full"></span>
                        {itineraryErrors.startTime.message}
                      </p>
                    )}
                  </div>

                  {/* End Time */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      End Time <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Clock className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        {...registerItinerary('endTime')}
                        type="time"
                        className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all outline-none text-gray-900"
                      />
                    </div>
                    {itineraryErrors.endTime && (
                      <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                        <span className="w-1 h-1 bg-red-600 rounded-full"></span>
                        {itineraryErrors.endTime.message}
                      </p>
                    )}
                  </div>
                </div>

                {/* Activity Name */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Activity Name <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <CalendarDays className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      {...registerItinerary('activity')}
                      type="text"
                      className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all outline-none text-gray-900 placeholder:text-gray-400"
                      placeholder="e.g., Visit Eiffel Tower, Beach Day, Dinner at Restaurant"
                    />
                  </div>
                  {itineraryErrors.activity && (
                    <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                      <span className="w-1 h-1 bg-red-600 rounded-full"></span>
                      {itineraryErrors.activity.message}
                    </p>
                  )}
                </div>

                {/* Location */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Location (Optional)
                  </label>
                  <Controller
                    name="location"
                    control={itineraryControl}
                    render={({ field }) => (
                      <LocationAutocomplete
                        value={field.value || ''}
                        onChange={field.onChange}
                        placeholder="e.g., Champ de Mars, 5 Avenue Anatole France"
                      />
                    )}
                  />
                </div>

                {/* Category */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Category <span className="text-red-500">*</span>
                  </label>
                  <select
                    {...registerItinerary('category')}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all outline-none text-gray-900 appearance-none bg-white"
                  >
                    <option value="">Select a category</option>
                    {itineraryCategories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                  {itineraryErrors.category && (
                    <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                      <span className="w-1 h-1 bg-red-600 rounded-full"></span>
                      {itineraryErrors.category.message}
                    </p>
                  )}
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Description (Optional)
                  </label>
                  <div className="relative">
                    <div className="absolute top-3 left-0 pl-4 flex pointer-events-none">
                      <FileText className="h-5 w-5 text-gray-400" />
                    </div>
                    <textarea
                      {...registerItinerary('description')}
                      rows={3}
                      className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all outline-none text-gray-900 placeholder:text-gray-400 resize-none"
                      placeholder="Add notes, booking details, or any other information..."
                    />
                  </div>
                </div>

                {/* Submit Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 pt-4">
                  <button
                    type="submit"
                    disabled={createItineraryMutation.isPending}
                    className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-bold text-lg hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]"
                  >
                    {createItineraryMutation.isPending ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Adding Activity...</span>
                      </>
                    ) : (
                      <>
                        <Save className="w-5 h-5" />
                        <span>Add to Itinerary</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={closeItineraryModal}
                    className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-gray-100 text-gray-700 rounded-xl font-bold text-lg hover:bg-gray-200 transition-all duration-300"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Add Expense Modal */}
      {isExpenseModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
                  <Wallet className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Add Expense</h3>
                  <p className="text-sm text-gray-600">Record a new expense for this trip</p>
                </div>
              </div>
              <button
                onClick={closeExpenseModal}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6">
              {/* Error Message */}
              {expenseError && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-start gap-3">
                  <div className="flex-shrink-0 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white text-xs font-bold mt-0.5">
                    !
                  </div>
                  <p className="text-sm">{expenseError}</p>
                </div>
              )}

              <form onSubmit={handleExpenseSubmit(onExpenseSubmit)} className="space-y-6">
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
                      {...registerExpense('description')}
                      type="text"
                      className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all outline-none text-gray-900 placeholder:text-gray-400"
                      placeholder="e.g., Hotel booking, Dinner, Taxi"
                    />
                  </div>
                  {expenseErrors.description && (
                    <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                      <span className="w-1 h-1 bg-red-600 rounded-full"></span>
                      {expenseErrors.description.message}
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
                        control={expenseControl}
                        render={({ field }) => (
                          <input
                            type="text"
                            inputMode="numeric"
                            className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all outline-none text-gray-900 placeholder:text-gray-400"
                            placeholder="0"
                            value={field.value}
                            onChange={(e) => {
                              const formatted = formatVNDInput(e.target.value);
                              field.onChange(formatted);
                            }}
                          />
                        )}
                      />
                    </div>
                    {expenseErrors.amount && (
                      <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                        <span className="w-1 h-1 bg-red-600 rounded-full"></span>
                        {expenseErrors.amount.message}
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
                        control={expenseControl}
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
                    {expenseErrors.date && (
                      <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                        <span className="w-1 h-1 bg-red-600 rounded-full"></span>
                        {expenseErrors.date.message}
                      </p>
                    )}
                  </div>
                </div>

                {/* Paid By */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Paid By <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <User className="h-5 w-5 text-gray-400" />
                    </div>
                    <select
                      {...registerExpense('paidById')}
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
                  {expenseErrors.paidById && (
                    <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                      <span className="w-1 h-1 bg-red-600 rounded-full"></span>
                      {expenseErrors.paidById.message}
                    </p>
                  )}
                </div>

                {/* Category */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Category <span className="text-red-500">*</span>
                  </label>
                  <select
                    {...registerExpense('category')}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all outline-none text-gray-900 appearance-none bg-white"
                  >
                    <option value="">Select a category</option>
                    {expenseCategories.map((cat) => (
                      <option key={cat.value} value={cat.value}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                  {expenseErrors.category && (
                    <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                      <span className="w-1 h-1 bg-red-600 rounded-full"></span>
                      {expenseErrors.category.message}
                    </p>
                  )}
                </div>

                {/* Expense Split Selector */}
                <ExpenseSplitSelector
                  members={members || []}
                  totalAmount={totalExpenseAmount}
                  splitType={expenseSplitType}
                  customSplits={expenseCustomSplits}
                  onSplitTypeChange={setExpenseSplitType}
                  onCustomSplitsChange={setExpenseCustomSplits}
                  formatVND={formatVNDInput}
                  formatVNDNumber={formatVND}
                  parseVND={parseVND}
                />

                {/* Submit Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 pt-4">
                  <button
                    type="submit"
                    disabled={createExpenseMutation.isPending}
                    className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-bold text-lg hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]"
                  >
                    {createExpenseMutation.isPending ? (
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

                  <button
                    type="button"
                    onClick={closeExpenseModal}
                    className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-gray-100 text-gray-700 rounded-xl font-bold text-lg hover:bg-gray-200 transition-all duration-300"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
