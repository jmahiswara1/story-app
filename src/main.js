import { initRouter, navigateTo } from './router.js';
import './app.css';
import { createHeader } from './modules/components/Header.js';
import { Storage } from './modules/utils/storage.js';

// Register service worker for push notifications (non-blocking)
if ('serviceWorker' in navigator) {
  // Use absolute path for GitHub Pages compatibility
  const swPath = '/sw.js';
  navigator.serviceWorker.register(swPath)
    .then((registration) => {
      console.log('Service Worker registered:', registration);
    })
    .catch((error) => {
      console.error('Service Worker registration failed:', error);
    });
  
  // Listen for messages from service worker (for notification navigation)
  navigator.serviceWorker.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'NAVIGATE' && event.data.url) {
      const hash = event.data.url.split('#')[1] || '/';
      navigateTo(`#${hash}`);
    }
  });
}

const headerRoot = document.getElementById('header');
const mainRoot = document.getElementById('main');

let lastAuthState = null;

function mountHeader() {
  const currentAuthState = !!Storage.getToken();
  
  // Only remount header if auth state actually changed
  if (lastAuthState === currentAuthState && headerRoot.children.length > 0) {
    return;
  }
  
  lastAuthState = currentAuthState;
  
  headerRoot.innerHTML = '';
  headerRoot.append(
    createHeader({
      isAuthenticated: currentAuthState,
      onNavigate: (hash) => navigateTo(hash),
      onLogout: () => {
        Storage.clear();
        lastAuthState = false;
        navigateTo('#/login');
      },
    }),
  );
}

// Initialize App
mountHeader();
initRouter({ onRoute: mountHeader, mainRoot });


