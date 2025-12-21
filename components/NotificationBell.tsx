'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Bell, Check, X, Clock } from 'lucide-react';
import { invitationsApi, notificationsApi } from '@/lib/api';
import { listenToNotifications } from '@/lib/firebase';
import { useAuthStore } from '@/lib/store';
import { ConfirmationDialog } from '@/components/ConfirmationDialog';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  data: {
    tripId?: string;
    tripName?: string;
    invitationId?: string;
    invitationStatus?: string;
    inviterName?: string;
    expenseId?: string;
    amount?: number;
    description?: string;
    itineraryId?: string;
    activity?: string;
    location?: string;
    date?: string;
    startTime?: string;
    createdBy?: string;
  };
  isRead: boolean;
  createdAt: number;
}

interface NotificationBellProps {
  onNotificationReceived?: () => void;
}

export function NotificationBell({ onNotificationReceived }: NotificationBellProps = {}) {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [processedInvitations, setProcessedInvitations] = useState<Set<string>>(new Set());
  const dropdownRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const router = useRouter();

  const unreadCount = notifications.filter(n => !n.isRead).length;

  // Listen to Firebase Realtime Database for notifications (without authentication)
  useEffect(() => {
    if (!user?.id) return;

    console.log('🔥 Setting up Realtime Database listener for user:', user.id);

    const unsubscribe = listenToNotifications(user.id, (notifs) => {
      console.log('📬 Notifications updated from Realtime Database:', notifs.length);
      setNotifications(notifs);

      // Call the callback when new notifications are received
      if (onNotificationReceived) {
        onNotificationReceived();
      }

      // Note: Browser notifications are handled by FCM service worker
      // No need to show duplicate notifications here
    });

    return () => {
      unsubscribe();
    };
  }, [user?.id, onNotificationReceived]);

  // Accept invitation mutation
  const acceptInvitationMutation = useMutation({
    mutationFn: invitationsApi.accept,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invitations'] });
      queryClient.invalidateQueries({ queryKey: ['members'] });
    },
  });

  // Reject invitation mutation
  const rejectInvitationMutation = useMutation({
    mutationFn: invitationsApi.reject,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invitations'] });
    },
  });

  // Mark notification as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: notificationsApi.markAsRead,
  });

  // Clear all notifications mutation
  const clearAllMutation = useMutation({
    mutationFn: notificationsApi.deleteAll,
    onSuccess: () => {
      setNotifications([]);
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleAcceptInvitation = async (notificationId: string, invitationId: string) => {
    try {
      // Mark invitation as processed immediately
      setProcessedInvitations((prev) => new Set(prev).add(invitationId));

      await acceptInvitationMutation.mutateAsync(invitationId);
      // Remove notification from list
      setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
    } catch (error) {
      console.error('Error accepting invitation:', error);
      // Remove from processed set if error occurs
      setProcessedInvitations((prev) => {
        const newSet = new Set(prev);
        newSet.delete(invitationId);
        return newSet;
      });
    }
  };

  const handleRejectInvitation = async (notificationId: string, invitationId: string) => {
    try {
      // Mark invitation as processed immediately
      setProcessedInvitations((prev) => new Set(prev).add(invitationId));

      await rejectInvitationMutation.mutateAsync(invitationId);
      // Remove notification from list
      setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
    } catch (error) {
      console.error('Error rejecting invitation:', error);
      // Remove from processed set if error occurs
      setProcessedInvitations((prev) => {
        const newSet = new Set(prev);
        newSet.delete(invitationId);
        return newSet;
      });
    }
  };

  const handleClearAll = async () => {
    if (notifications.length === 0) return;

    const confirmed = await ConfirmationDialog({
      title: 'Clear all notifications?',
      text: `You are about to delete ${notifications.length} notification${notifications.length > 1 ? 's' : ''}`,
      icon: 'warning',
      confirmButtonText: 'Yes, clear all',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#3b82f6',
      cancelButtonColor: '#6b7280'
    });

    if (confirmed) {
      clearAllMutation.mutate();
    }
  };

  const handleNotificationClick = async (notificationId: string, notification?: Notification) => {
    // Handle navigation for specific notification types
    if (notification?.type === 'ITINERARY_ADDED' && notification.data.tripId) {
      router.push(`/trips/${notification.data.tripId}?tab=itinerary`);
      setIsOpen(false); // Close dropdown
    }

    // Optimistically update UI
    setNotifications(prev => 
      prev.map(n => 
        n.id === notificationId ? { ...n, isRead: true } : n
      )
    );

    try {
      await markAsReadMutation.mutateAsync(notificationId);
      console.log(`✅ Notification ${notificationId} marked as read`);
    } catch (error) {
      console.error('Error marking notification as read:', error);
      // Revert on error
      setNotifications(prev => 
        prev.map(n => 
          n.id === notificationId ? { ...n, isRead: false } : n
        )
      );
    }
  };

  const formatTimeAgo = (timestamp: number) => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    
    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    return new Date(timestamp).toLocaleDateString();
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Icon Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-700 hover:bg-gray-100 rounded-xl transition-all duration-300 group"
      >
        <Bell className="w-6 h-6 group-hover:scale-110 transition-transform" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full min-w-[20px] h-5 px-1 flex items-center justify-center animate-pulse">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden z-50">
          {/* Header */}
          <div className="px-4 py-3 border-b border-gray-200 bg-gradient-to-r from-indigo-50 to-purple-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-gray-900">Notifications</h3>
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 bg-red-500 text-white text-xs font-bold rounded-full">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </div>
              {notifications.length > 0 && (
                <button
                  onClick={handleClearAll}
                  disabled={clearAllMutation.isPending}
                  className="text-xs text-indigo-600 hover:text-indigo-700 font-medium disabled:opacity-50"
                >
                  {clearAllMutation.isPending ? 'Clearing...' : 'Clear all'}
                </button>
              )}
            </div>
          </div>

          {/* Notifications List */}
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="px-4 py-8 text-center text-gray-500">
                <Bell className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p className="text-sm">No notifications yet</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification.id, notification)}
                    className={`px-4 py-3 hover:bg-gray-50 transition-colors cursor-pointer ${
                      !notification.isRead ? 'bg-indigo-50/50' : 'bg-white'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {/* Icon */}
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                        notification.type === 'TRIP_INVITATION'
                          ? 'bg-indigo-100 text-indigo-600'
                          : notification.type === 'MEMBER_JOINED'
                          ? 'bg-green-100 text-green-600'
                          : notification.type === 'INVITATION_CANCELLED'
                          ? 'bg-red-100 text-red-600'
                          : notification.type === 'EXPENSE_ADDED'
                          ? 'bg-amber-100 text-amber-600'
                          : notification.type === 'ITINERARY_ADDED'
                          ? 'bg-purple-100 text-purple-600'
                          : 'bg-blue-100 text-blue-600'
                      }`}>
                        {notification.type === 'TRIP_INVITATION' && <Bell className="w-5 h-5" />}
                        {notification.type === 'MEMBER_JOINED' && <Check className="w-5 h-5" />}
                        {notification.type === 'INVITATION_CANCELLED' && <X className="w-5 h-5" />}
                        {notification.type === 'EXPENSE_ADDED' && <Bell className="w-5 h-5" />}
                        {notification.type === 'ITINERARY_ADDED' && <Clock className="w-5 h-5" />}
                        {!['TRIP_INVITATION', 'MEMBER_JOINED', 'INVITATION_CANCELLED', 'EXPENSE_ADDED', 'ITINERARY_ADDED'].includes(notification.type) && <Bell className="w-5 h-5" />}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <div className="flex-1">
                            <p className="text-sm font-semibold text-gray-900">
                              {notification.title}
                            </p>
                            <p className="text-sm text-gray-700 mt-1">
                              {notification.message}
                            </p>
                          </div>
                          {!notification.isRead && (
                            <span className="flex-shrink-0 px-2 py-0.5 bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-full">
                              New
                            </span>
                          )}
                        </div>
                        {notification.data.tripName && (
                          <p className="text-xs text-gray-600 mb-2">
                            Trip: <span className="font-medium">{notification.data.tripName}</span>
                          </p>
                        )}
                        {notification.type === 'EXPENSE_ADDED' && notification.data.amount && (
                          <p className="text-xs text-gray-600 mb-2">
                            Amount: <span className="font-medium text-green-600">{notification.data.amount.toLocaleString()} ₫</span>
                          </p>
                        )}
                        {notification.type === 'ITINERARY_ADDED' && (
                          <div className="space-y-1">
                            <p className="text-xs text-gray-600">
                              Activity: <span className="font-medium">{notification.data.activity}</span>
                              {notification.data.location && <span> at {notification.data.location}</span>}
                            </p>
                            {notification.data.date && (
                              <p className="text-xs text-gray-600">
                                Date: <span className="font-medium">{new Date(notification.data.date).toLocaleDateString()}</span>
                                {notification.data.startTime && <span> at {notification.data.startTime}</span>}
                              </p>
                            )}
                          </div>
                        )}
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <Clock className="w-3 h-3" />
                          <span>{formatTimeAgo(notification.createdAt)}</span>
                        </div>

                        {/* Action Buttons for Invitations */}
                        {notification.type === 'TRIP_INVITATION' &&
                          notification.data.invitationId &&
                          !processedInvitations.has(notification.data.invitationId) &&
                          (!notification.data.invitationStatus || notification.data.invitationStatus === 'PENDING') && (
                          <div className="flex gap-2 mt-3">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleAcceptInvitation(notification.id, notification.data.invitationId!);
                              }}
                              disabled={acceptInvitationMutation.isPending || rejectInvitationMutation.isPending}
                              className="flex items-center gap-1 px-3 py-1.5 bg-indigo-600 text-white text-xs font-medium rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <Check className="w-3 h-3" />
                              {acceptInvitationMutation.isPending ? 'Accepting...' : 'Accept'}
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRejectInvitation(notification.id, notification.data.invitationId!);
                              }}
                              disabled={acceptInvitationMutation.isPending || rejectInvitationMutation.isPending}
                              className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 text-gray-700 text-xs font-medium rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <X className="w-3 h-3" />
                              {rejectInvitationMutation.isPending ? 'Declining...' : 'Decline'}
                            </button>
                          </div>
                        )}

                        {/* Show status message if invitation is already processed */}
                        {notification.type === 'TRIP_INVITATION' &&
                          notification.data.invitationStatus &&
                          notification.data.invitationStatus !== 'PENDING' && (
                          <div className="mt-3">
                            <span className={`inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg ${
                              notification.data.invitationStatus === 'ACCEPTED'
                                ? 'bg-green-100 text-green-700'
                                : 'bg-gray-100 text-gray-700'
                            }`}>
                              {notification.data.invitationStatus === 'ACCEPTED' ? (
                                <>
                                  <Check className="w-3 h-3" />
                                  Already Accepted
                                </>
                              ) : (
                                <>
                                  <X className="w-3 h-3" />
                                  Already Declined
                                </>
                              )}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Unread indicator */}
                      {!notification.isRead && (
                        <div className="w-2 h-2 bg-indigo-600 rounded-full flex-shrink-0 mt-2"></div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
