// Import Firebase scripts
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

// Initialize Firebase in the service worker
firebase.initializeApp({
  apiKey: "AIzaSyCNZGh4zO4Wvpi1Tx8wpy3IoNXicwNG5Nc",
  authDomain: "travel-planer-b5efb.firebaseapp.com",
  projectId: "travel-planer-b5efb",
  storageBucket: "travel-planer-b5efb.firebasestorage.app",
  messagingSenderId: "207023267506",
  appId: "1:207023267506:web:9ab7e4fd914f2212af73ab",
  measurementId: "G-PJ9LZ1W3QF"
});

const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('Received background message:', payload);

  const notificationTitle = payload.notification?.title || 'New Notification';
  const notificationOptions = {
    body: payload.notification?.body || '',
    icon: '/icon-192x192.png',
    badge: '/badge-72x72.png',
    data: payload.data
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event);
  event.notification.close();

  // Open the app or focus existing window
  event.waitUntil(
    clients.openWindow('/')
  );
});
