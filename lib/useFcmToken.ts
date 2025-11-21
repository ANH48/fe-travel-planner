'use client';

import { useEffect } from 'react';
import { requestNotificationPermission } from './firebase';
import { authApi } from './api';

export function useFcmToken() {
  useEffect(() => {
    const initializeFirebase = async () => {
      console.log('🚀 Initializing Firebase...');
      
      // Check if user is logged in
      const token = localStorage.getItem('token');
      if (!token) {
        console.log('⚠️ User not logged in, skipping FCM token registration');
        return;
      }
      
      console.log('✅ User logged in, proceeding with Firebase setup');

      // Register service worker for background notifications
      if ('serviceWorker' in navigator) {
        try {
          const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
          console.log('✅ Service Worker registered:', registration);
          
          // Wait for service worker to be ready
          await navigator.serviceWorker.ready;
          console.log('✅ Service Worker is ready');
        } catch (error) {
          console.error('❌ Service Worker registration failed:', error);
        }
      } else {
        console.warn('⚠️ Service Workers not supported in this browser');
      }

      // Request notification permission and get FCM token
      console.log('🔔 Requesting notification permission...');
      const fcmToken = await requestNotificationPermission();
      
      if (fcmToken) {
        console.log('✅ Got FCM token:', fcmToken.substring(0, 20) + '...');
        // Save FCM token to backend
        try {
          await authApi.saveFcmToken(fcmToken);
          console.log('✅ FCM token saved to backend successfully');
        } catch (error) {
          console.error('❌ Failed to save FCM token to backend:', error);
        }
      } else {
        console.log('⚠️ Failed to get FCM token - permission may be denied');
      }
    };

    initializeFirebase();
  }, []);
}
