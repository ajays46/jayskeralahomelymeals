import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import './index.css'
import App from './App'

const queryClient = new QueryClient()

// Register Service Worker for offline support
if ('serviceWorker' in navigator) {
  // Register immediately, don't wait for load event
  navigator.serviceWorker.register('/sw.js', { scope: '/' })
    .then((registration) => {
      console.log('✅ Service Worker registered successfully:', registration.scope);
      console.log('Service Worker state:', registration.active?.state || registration.installing?.state || registration.waiting?.state);
      
      // Check for updates
      registration.addEventListener('updatefound', () => {
        console.log('Service Worker update found');
      });
    })
    .catch((error) => {
      console.error('❌ Service Worker registration failed:', error);
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
    });
  
  // Also listen for service worker controller changes
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    console.log('Service Worker controller changed');
    window.location.reload();
  });
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
    </QueryClientProvider>
  </StrictMode>,
)
