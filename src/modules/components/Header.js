import { Storage } from "../utils/storage.js";

export function createHeader({ isAuthenticated, onNavigate, onLogout }) {
  const header = document.createElement("div");
  header.className = "container";

  const nav = document.createElement("nav");
  nav.className = "nav";

  const brand = document.createElement("div");
  brand.className = "brand";
  const brandLink = document.createElement("a");
  brandLink.href = "#/";
  brandLink.textContent = "Story App";
  brandLink.addEventListener("click", (e) => {
    e.preventDefault();
    onNavigate("#/");
  });
  brand.append(brandLink);

  const links = document.createElement("div");
  links.className = "nav-links";

  function link(text, hash, cls = "btn secondary") {
    const a = document.createElement("a");
    a.href = hash;
    a.className = cls;
    a.textContent = text;
    a.addEventListener("click", (e) => {
      e.preventDefault();
      onNavigate(hash);
    });
    return a;
  }

  if (isAuthenticated) {
    links.append(
      link("Beranda", "#/"),
      link("Tambah Cerita", "#/add"),
      link("Cerita Tersimpan", "#/stories-db")
    );
    const name = Storage.getName();
    const span = document.createElement("span");
    span.className = "help";
    span.textContent = name ? `Halo, ${name}` : "";
    links.append(span);

    const btnOut = document.createElement("button");
    btnOut.className = "btn danger";
    btnOut.textContent = "Keluar";
    btnOut.addEventListener("click", (e) => {
      e.preventDefault();
      onLogout?.();
    });
    links.append(btnOut);
  } else {
    links.append(link("Masuk", "#/login"), link("Daftar", "#/register", "btn"));
  }

  nav.append(brand, links);
  header.append(nav);
  return header;
}
