import { withViewTransition } from "./modules/utils/viewTransition.js";
import { Storage } from "./modules/utils/storage.js";

import { LoginView } from "./modules/views/LoginView.js";
import { RegisterView } from "./modules/views/RegisterView.js";
import { HomeView } from "./modules/views/HomeView.js";
import { AddStoryView } from "./modules/views/AddStoryView.js";
import { DetailView } from "./modules/views/DetailView.js";
import { StoriesDBView } from "./modules/views/StoriesDBView.js";
import { NotFoundView } from "./modules/views/NotFoundView.js";

const routes = [
  { path: "#/", private: true, view: HomeView },
  { path: "#/login", view: LoginView },
  { path: "#/register", view: RegisterView },
  { path: "#/add", private: true, view: AddStoryView },
  { path: "#/detail/:id", private: true, view: DetailView },
  { path: "#/stories-db", private: true, view: StoriesDBView },
];

function parseLocation() {
  let hash = window.location.hash || "#/";
  if (hash === "#main") {
    hash = "#/";
    if (window.history.replaceState) {
      window.history.replaceState(null, "", "#/");
    }
  }
  return hash;
}

function matchRoute(hash) {
  for (const r of routes) {
    if (r.path.includes(":")) {
      const base = r.path.split("/:")[0];
      if (hash.startsWith(base + "/"))
        return { route: r, params: { id: hash.split("/").pop() } };
    } else if (r.path === hash) return { route: r, params: {} };
  }
  return { route: null, params: {} };
}

export function navigateTo(hash) {
  if (window.location.hash === hash) return;
  window.location.hash = hash;
}

export function initRouter({ onRoute, mainRoot }) {
  let isRendering = false;
  let currentHash = null;

  async function render() {
    if (isRendering) {
      return;
    }

    const hash = parseLocation();

    if (hash === currentHash) {
      return;
    }

    isRendering = true;
    currentHash = hash;

    try {
      if (mainRoot._addStoryCleanup) {
        try {
          mainRoot._addStoryCleanup();
        } catch (e) {
          console.warn("AddStory cleanup warning:", e.message);
        }
        mainRoot._addStoryCleanup = null;
      }

      if (mainRoot._homeViewCleanup) {
        try {
          mainRoot._homeViewCleanup();
        } catch (e) {
          console.warn("HomeView cleanup warning:", e.message);
        }
        mainRoot._homeViewCleanup = null;
      }

      if (mainRoot._detailViewCleanup) {
        try {
          mainRoot._detailViewCleanup();
        } catch (e) {
          console.warn("DetailView cleanup warning:", e.message);
        }
        mainRoot._detailViewCleanup = null;
      }

      const { route, params } = matchRoute(hash);

      if (!route) {
        mainRoot.innerHTML = "";
        await NotFoundView({ mainRoot });
      } else {
        if (route.private && !Storage.getToken()) {
          if (hash !== "#/login") {
            isRendering = false;
            currentHash = null;
            navigateTo("#/login");
            return;
          }
        }
        const renderPromise = withViewTransition(mainRoot, () =>
          route.view({ params, mainRoot })
        );
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error("View render timeout")), 10000)
        );
        try {
          await Promise.race([renderPromise, timeoutPromise]);
        } catch (err) {
          console.error("View render error:", err);
          mainRoot.classList.remove("out");
          mainRoot.classList.add("in");
          mainRoot.style.pointerEvents = "auto";
        }
      }

      if (typeof onRoute === "function") {
        onRoute();
      }
    } catch (err) {
      console.error("Router render error:", err);
      mainRoot.classList.remove("out");
      mainRoot.classList.add("in");
    } finally {
      isRendering = false;
    }
  }

  window.addEventListener("hashchange", render);
  if (document.readyState === "loading") {
    window.addEventListener("DOMContentLoaded", render);
  } else {
    render();
  }
}
