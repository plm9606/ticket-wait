/* eslint-disable no-undef */
importScripts(
  "https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js"
);
importScripts(
  "https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js"
);

firebase.initializeApp({
  apiKey: self.__FIREBASE_API_KEY,
  projectId: self.__FIREBASE_PROJECT_ID,
  messagingSenderId: self.__FIREBASE_MESSAGING_SENDER_ID,
  appId: self.__FIREBASE_APP_ID,
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const { title, body, image } = payload.notification || {};
  const options = {
    body: body || "",
    icon: "/icon-192.png",
    badge: "/icon-192.png",
    image: image,
    data: payload.data,
  };

  self.registration.showNotification(title || "공연 알리미", options);
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/";
  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((windowClients) => {
        for (const client of windowClients) {
          if (client.url.includes(url) && "focus" in client) {
            return client.focus();
          }
        }
        return clients.openWindow(url);
      })
  );
});
