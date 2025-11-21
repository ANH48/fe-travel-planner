import { initializeApp, getApps } from 'firebase/app';
import { getMessaging, getToken, onMessage, isSupported } from 'firebase/messaging';
import { getDatabase, ref, onValue, off } from 'firebase/database';
import { getAuth, signInWithCustomToken } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyCNZGh4zO4Wvpi1Tx8wpy3IoNXicwNG5Nc",
  authDomain: "travel-planer-b5efb.firebaseapp.com",
  databaseURL: "https://travel-planer-b5efb-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "travel-planer-b5efb",
  storageBucket: "travel-planer-b5efb.firebasestorage.app",
  messagingSenderId: "207023267506",
  appId: "1:207023267506:web:9ab7e4fd914f2212af73ab",
  measurementId: "G-PJ9LZ1W3QF"
};

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

// Get Firebase Realtime Database instance
export const database = getDatabase(app);

// Get Firebase Auth instance
export const auth = getAuth(app);

/**
 * Sign in to Firebase using custom token from backend
 */
export const signInWithBackendToken = async (customToken: string) => {
  try {
    console.log('🔐 Signing in to Firebase with custom token...');
    const userCredential = await signInWithCustomToken(auth, customToken);
    console.log('✅ Signed in to Firebase successfully. User ID:', userCredential.user.uid);
    return userCredential.user;
  } catch (error: any) {
    console.error('❌ Error signing in to Firebase:', error);
    console.error('Error code:', error?.code);
    console.error('Error message:', error?.message);
    throw error;
  }
};

// Get Firebase Cloud Messaging instance
export const getFirebaseMessaging = async () => {
  const supported = await isSupported();
  if (!supported) {
    console.warn('Firebase Messaging is not supported in this browser');
    return null;
  }
  return getMessaging(app);
};

// Request notification permission and get FCM token
export const requestNotificationPermission = async () => {
  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      const messaging = await getFirebaseMessaging();
      if (!messaging) return null;

      // Get FCM token
      const token = await getToken(messaging, {
        vapidKey: 'BNfPiU9vOzMFlcap4buo4Bl-JsGIA959XcZYq538vbnHY-HkgciCuvmMm1azYFFN4oBdiZpZcyUA89S9afDYs7s'
      });
      
      console.log('FCM Token:', token);
      return token;
    } else {
      console.log('Notification permission denied');
      return null;
    }
  } catch (error) {
    console.error('Error getting notification permission:', error);
    return null;
  }
};

// Listen for foreground messages
export const onMessageListener = (callback: (payload: any) => void) => {
  getFirebaseMessaging().then((messaging) => {
    if (!messaging) {
      console.warn('Cannot set up message listener: Firebase Messaging not available');
      return;
    }

    console.log('✅ Firebase message listener registered');
    onMessage(messaging, (payload) => {
      console.log('🔔 Message received in foreground:', payload);
      callback(payload);
    });
  }).catch((error) => {
    console.error('Error setting up message listener:', error);
  });
};

/**
 * Listen to user's notifications in Realtime Database
 */
export const listenToNotifications = (
  userId: string,
  callback: (notifications: any[]) => void
) => {
  const notificationsRef = ref(database, `notifications/${userId}`);
  
  const listener = onValue(notificationsRef, (snapshot) => {
    const data = snapshot.val();
    
    if (!data) {
      callback([]);
      return;
    }

    // Convert object to array and sort by createdAt descending
    const notificationsArray = Object.keys(data).map(key => ({
      id: key,
      ...data[key],
    })).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

    console.log('🔥 Realtime Database notifications updated:', notificationsArray.length);
    callback(notificationsArray);
  }, (error) => {
    console.error('Error listening to notifications:', error);
  });

  // Return cleanup function
  return () => {
    off(notificationsRef, 'value', listener);
    console.log('🔥 Stopped listening to notifications');
  };
};

export default app;
