import { withViewTransition } from './modules/utils/viewTransition.js';
import { Storage } from './modules/utils/storage.js';

import { LoginView } from './modules/views/LoginView.js';
import { RegisterView } from './modules/views/RegisterView.js';
import { HomeView } from './modules/views/HomeView.js';
import { AddStoryView } from './modules/views/AddStoryView.js';
import { DetailView } from './modules/views/DetailView.js';
import { StoriesDBView } from './modules/views/StoriesDBView.js';
import { NotFoundView } from './modules/views/NotFoundView.js';

const routes = [
  { path: '#/', private: true, view: HomeView },
  { path: '#/login', view: LoginView },
  { path: '#/register', view: RegisterView },
  { path: '#/add', private: true, view: AddStoryView },
  { path: '#/detail/:id', private: true, view: DetailView },
  { path: '#/stories-db', private: true, view: StoriesDBView },
];

function parseLocation() {
  const hash = window.location.hash || '#/';
  return hash;
}

function matchRoute(hash) {
  for (const r of routes) {
    if (r.path.includes(':')) {
      const base = r.path.split('/:')[0];
      if (hash.startsWith(base + '/')) return { route: r, params: { id: hash.split('/').pop() } };
    } else if (r.path === hash) return { route: r, params: {} };
  }
  return { route: null, params: {} };
}

export function navigateTo(hash) {
  if (window.location.hash === hash) return; // Don't trigger navigation if already on that route
  window.location.hash = hash;
}

export function initRouter({ onRoute, mainRoot }) {
  let isRendering = false;
  let currentHash = null;

  async function render() {
    // Prevent multiple simultaneous renders
    if (isRendering) {
      return;
    }

    const hash = parseLocation();
    
    // Prevent re-rendering the same route
    if (hash === currentHash) {
      return;
    }

    isRendering = true;
    currentHash = hash;
    
    try {
      // Cleanup previous view before rendering new one
      if (mainRoot._addStoryCleanup) {
        try {
          mainRoot._addStoryCleanup();
        } catch (e) {
          console.error('Cleanup error:', e);
        }
        mainRoot._addStoryCleanup = null;
      }

      const { route, params } = matchRoute(hash);

      if (!route) {
        mainRoot.innerHTML = '';
        await NotFoundView({ mainRoot });
      } else {
        if (route.private && !Storage.getToken()) {
          if (hash !== '#/login') {
            isRendering = false;
            currentHash = null; // Reset to allow navigation
            navigateTo('#/login');
            return;
          }
        }

        // Render with timeout to prevent blocking
        const renderPromise = withViewTransition(mainRoot, () => route.view({ params, mainRoot }));
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('View render timeout')), 10000)
        );
        
        try {
          await Promise.race([renderPromise, timeoutPromise]);
        } catch (err) {
          console.error('View render error:', err);
          // Ensure UI is still usable even if render fails
          mainRoot.classList.remove("out");
          mainRoot.classList.add("in");
          mainRoot.style.pointerEvents = 'auto';
        }
      }
      
      // Call onRoute only once after render completes
      if (typeof onRoute === 'function') {
        onRoute();
      }
    } catch (err) {
      console.error('Router render error:', err);
      // Ensure mainRoot is still interactive even on error
      mainRoot.classList.remove("out");
      mainRoot.classList.add("in");
    } finally {
      isRendering = false;
    }
  }

  window.addEventListener('hashchange', render);
  if (document.readyState === 'loading') {
    window.addEventListener('DOMContentLoaded', render);
  } else {
    render();
  }
}


