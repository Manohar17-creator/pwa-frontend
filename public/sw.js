self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {};
  const title = data.title || 'Hello from Web Push!';

  event.waitUntil(
    self.registration.showNotification(title, {
      body: data.body || 'Push notification received successfully 🎉',
      icon: '/icon-192x192.png',
      badge: '/icon-192x192.png'
    })
  );
});
