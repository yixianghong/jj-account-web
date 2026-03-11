importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyBFCWlrvzajyL6r0g78nPRsGdj2TJxkEgk",
  authDomain: "jj-account.firebaseapp.com",
  projectId: "jj-account",
  storageBucket: "jj-account.firebasestorage.app",
  messagingSenderId: "735773086860",
  appId: "1:735773086860:web:b0a3bd9cdb01cc486d97a9"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const { title, body } = payload.notification;
  self.registration.showNotification(title, {
    body,
    icon: '/icons/icon-192x192.png',
  });
});
