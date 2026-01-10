// Script to unregister any existing service workers
// Run this in browser console if you have conflicting service workers

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    for (let registration of registrations) {
      registration.unregister().then((success) => {
        if (success) {
          console.log('Service Worker unregistered:', registration.scope);
        }
      });
    }
  });
  
  // Also clear all caches
  caches.keys().then((cacheNames) => {
    cacheNames.forEach((cacheName) => {
      caches.delete(cacheName);
      console.log('Cache deleted:', cacheName);
    });
  });
}

console.log('All service workers and caches cleared. Refresh the page.');
