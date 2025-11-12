import { initRouter, navigateTo } from "./router.js";
import "./app.css";
import { createHeader } from "./modules/components/Header.js";
import { Storage } from "./modules/utils/storage.js";
if ("serviceWorker" in navigator) {
  const getBasePath = () => {
    try {
      const pathname = window.location.pathname || "/";
      if (/\/[A-Za-z0-9_\-]+\.[A-Za-z0-9]+$/.test(pathname)) {
        return pathname.substring(0, pathname.lastIndexOf("/") + 1) || "/";
      }
      return pathname.endsWith("/") ? pathname : pathname + "/";
    } catch {
      return "/";
    }
  };

  const basePath = getBasePath();
  const swPath = basePath === "/" ? "/sw.js" : basePath + "sw.js";

  navigator.serviceWorker
    .register(swPath)
    .then((registration) => {
      console.log("Service Worker registered:", registration);
    })
    .catch((error) => {
      console.error("Service Worker registration failed:", error);
    });

  navigator.serviceWorker.addEventListener("message", (event) => {
    if (event.data && event.data.type === "NAVIGATE" && event.data.url) {
      const hash = event.data.url.split("#")[1] || "/";
      navigateTo(`#${hash}`);
    }
  });
}

const headerRoot = document.getElementById("header");
const mainRoot = document.getElementById("main");

let lastAuthState = null;

function mountHeader() {
  const currentAuthState = !!Storage.getToken();

  if (lastAuthState === currentAuthState && headerRoot.children.length > 0) {
    return;
  }

  lastAuthState = currentAuthState;

  headerRoot.innerHTML = "";
  headerRoot.append(
    createHeader({
      isAuthenticated: currentAuthState,
      onNavigate: (hash) => navigateTo(hash),
      onLogout: () => {
        Storage.clear();
        lastAuthState = false;
        navigateTo("#/login");
      },
    })
  );
}

mountHeader();
initRouter({ onRoute: mountHeader, mainRoot });
