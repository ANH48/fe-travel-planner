'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tripsApi, itineraryApi } from '@/lib/api';
import { LocationAutocomplete } from '@/components/LocationAutocomplete';
import { 
  ArrowLeft, 
  Clock, 
  Calendar,
  MapPin,
  FileText,
  Loader2,
  CalendarDays,
  Save
} from 'lucide-react';

const itinerarySchema = z.object({
  date: z.string().min(1, 'Date is required'),
  startTime: z.string().min(1, 'Start time is required'),
  endTime: z.string().min(1, 'End time is required'),
  activity: z.string().min(3, 'Activity name must be at least 3 characters'),
  location: z.string().optional(),
  description: z.string().optional(),
  category: z.string().optional(),
});

type ItineraryFormData = z.infer<typeof itinerarySchema>;

export default function NewItineraryPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const tripId = params.id as string;
  const [error, setError] = useState('');

  // Fetch trip to get date range
  const { data: trip } = useQuery({
    queryKey: ['trip', tripId],
    queryFn: async () => {
      const response = await tripsApi.getOne(tripId);
      return response.data;
    },
  });

  // Create itinerary mutation
  const createMutation = useMutation({
    mutationFn: (data: ItineraryFormData) => itineraryApi.create(tripId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['itinerary', tripId] });
      router.push(`/trips/${tripId}?tab=itinerary`);
    },
    onError: (err: any) => {
      setError(err.response?.data?.message || 'Failed to add itinerary');
    },
  });

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors },
  } = useForm<ItineraryFormData>({
    resolver: zodResolver(itinerarySchema),
  });

  const startTime = watch('startTime');

  const onSubmit = async (data: ItineraryFormData) => {
    setError('');
    createMutation.mutate(data);
  };

  const categories = [
    'Sightseeing',
    'Food & Dining',
    'Transportation',
    'Activity',
    'Shopping',
    'Relaxation',
    'Meeting',
    'Other'
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-xl border-b border-gray-200/50 sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <Link 
            href={`/trips/${tripId}?tab=itinerary`}
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
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl mb-4 shadow-lg">
              <CalendarDays className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Add Itinerary</h1>
            <p className="text-gray-600 text-lg">Plan your daily activities and schedule</p>
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

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Date */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Date <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Calendar className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    {...register('date')}
                    type="date"
                    min={trip?.startDate?.split('T')[0]}
                    max={trip?.endDate?.split('T')[0]}
                    className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all outline-none text-gray-900"
                  />
                </div>
                {errors.date && (
                  <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                    <span className="w-1 h-1 bg-red-600 rounded-full"></span>
                    {errors.date.message}
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
                      {...register('startTime')}
                      type="time"
                      className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all outline-none text-gray-900"
                    />
                  </div>
                  {errors.startTime && (
                    <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                      <span className="w-1 h-1 bg-red-600 rounded-full"></span>
                      {errors.startTime.message}
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
                      {...register('endTime')}
                      type="time"
                      className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all outline-none text-gray-900"
                    />
                  </div>
                  {errors.endTime && (
                    <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                      <span className="w-1 h-1 bg-red-600 rounded-full"></span>
                      {errors.endTime.message}
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
                    {...register('activity')}
                    type="text"
                    className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all outline-none text-gray-900 placeholder:text-gray-400"
                    placeholder="e.g., Visit Eiffel Tower, Beach Day, Dinner at Restaurant"
                  />
                </div>
                {errors.activity && (
                  <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                    <span className="w-1 h-1 bg-red-600 rounded-full"></span>
                    {errors.activity.message}
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
                  control={control}
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
                  Category (Optional)
                </label>
                <select
                  {...register('category')}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all outline-none text-gray-900 appearance-none bg-white"
                >
                  <option value="">Select a category</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
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
                    {...register('description')}
                    rows={4}
                    className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all outline-none text-gray-900 placeholder:text-gray-400 resize-none"
                    placeholder="Add notes, booking details, or any other information..."
                  />
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-bold text-lg hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]"
                >
                  {createMutation.isPending ? (
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
                
                <Link
                  href={`/trips/${tripId}?tab=itinerary`}
                  className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-gray-100 text-gray-700 rounded-xl font-bold text-lg hover:bg-gray-200 transition-all duration-300"
                >
                  Cancel
                </Link>
              </div>
            </form>
          </div>

          {/* Info Box */}
          <div className="mt-6 bg-purple-50 border border-purple-200 rounded-2xl p-6">
            <h3 className="font-bold text-purple-900 mb-2 flex items-center gap-2">
              <span className="text-xl">💡</span>
              Planning Tips
            </h3>
            <ul className="text-purple-800 text-sm space-y-1">
              <li>• Plan activities within your trip dates</li>
              <li>• Add specific times to create a detailed schedule</li>
              <li>• Include location details for easy navigation</li>
              <li>• Use categories to organize different types of activities</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
