// Manual Service Worker Registration Script
// Run this in browser console to check service worker status

console.log('=== Service Worker Registration Check ===');

if ('serviceWorker' in navigator) {
  console.log('✅ Service Worker API is supported');
  
  // Check current registrations
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    console.log('Current registrations:', registrations.length);
    registrations.forEach((reg, index) => {
      console.log(`Registration ${index + 1}:`, {
        scope: reg.scope,
        active: reg.active?.state,
        installing: reg.installing?.state,
        waiting: reg.waiting?.state
      });
    });
  });
  
  // Try to register
  navigator.serviceWorker.register('/sw.js', { scope: '/' })
    .then((registration) => {
      console.log('✅ Service Worker registered successfully!');
      console.log('Scope:', registration.scope);
      console.log('State:', registration.active?.state || registration.installing?.state || registration.waiting?.state);
      
      // Check if service worker file is accessible
      fetch('/sw.js')
        .then(response => {
          if (response.ok) {
            console.log('✅ Service Worker file is accessible');
          } else {
            console.error('❌ Service Worker file returned status:', response.status);
          }
        })
        .catch(error => {
          console.error('❌ Cannot fetch Service Worker file:', error);
        });
    })
    .catch((error) => {
      console.error('❌ Service Worker registration failed!');
      console.error('Error:', error);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      
      // Try to fetch the service worker file to see if it exists
      fetch('/sw.js')
        .then(response => {
          console.log('Service Worker file fetch response:', response.status, response.statusText);
          return response.text();
        })
        .then(text => {
          console.log('Service Worker file content length:', text.length);
        })
        .catch(fetchError => {
          console.error('Cannot fetch Service Worker file:', fetchError);
        });
    });
} else {
  console.error('❌ Service Worker API is NOT supported in this browser');
}
