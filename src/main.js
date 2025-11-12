import { initRouter, navigateTo } from './router.js';
import './app.css';
import { createHeader } from './modules/components/Header.js';
import { Storage } from './modules/utils/storage.js';

// Register service worker for push notifications (non-blocking)
if ('serviceWorker' in navigator) {
  // Get base path for GitHub Pages subdirectory support
  // Simple and reliable method: extract directory from pathname
  const getBasePath = () => {
    const pathname = window.location.pathname;
    
    // Remove any filename (like index.html, app.bundle.js, etc.)
    // Keep only the directory path
    let basePath = pathname;
    
    // If pathname ends with a file (has extension), get directory
    if (pathname.match(/\/[^/]+\.[^/]+$/)) {
      // Remove filename, keep directory
      basePath = pathname.substring(0, pathname.lastIndexOf('/') + 1);
    }
    
    // Ensure it ends with / and starts with /
    if (!basePath.endsWith('/')) {
      basePath += '/';
    }
    if (!basePath.startsWith('/')) {
      basePath = '/' + basePath;
    }
    
    // Special case: if pathname is just "/", basePath should be "/"
    if (pathname === '/' || pathname === '') {
      basePath = '/';
    }
    
    return basePath;
  };
  
  const basePath = getBasePath();
  // Construct service worker path
  const swPath = basePath === '/' ? '/sw.js' : basePath + 'sw.js';
  
  console.log('🔧 Service Worker Registration:');
  console.log('   Current URL:', window.location.href);
  console.log('   Pathname:', window.location.pathname);
  console.log('   Base path:', basePath);
  console.log('   Service worker path:', swPath);
  console.log('   Full SW URL:', new URL(swPath, window.location.origin).href);
  
  // Register service worker
  navigator.serviceWorker.register(swPath)
    .then((registration) => {
      console.log('✅ Service Worker registered successfully');
      console.log('Service Worker scope:', registration.scope);
      console.log('Service Worker active:', registration.active?.state);
      console.log('Service Worker installing:', registration.installing?.state);
      console.log('Service Worker waiting:', registration.waiting?.state);
    })
    .catch((error) => {
      console.error('❌ Service Worker registration failed:', error);
      console.error('Attempted path:', swPath);
      console.error('Full attempted URL:', new URL(swPath, window.location.origin).href);
      console.error('Current URL:', window.location.href);
      console.error('Current pathname:', window.location.pathname);
      console.error('Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
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


