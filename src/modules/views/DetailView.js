import { StoryApi } from "../api/storyApi.js";
import { showToast } from "../components/Toast.js";

export async function DetailView({ params, mainRoot }) {
  mainRoot.innerHTML = "";
  const container = document.createElement("div");
  container.className = "container";

  const card = document.createElement("section");
  card.className = "card";
  card.innerHTML = `<div class="help">Memuat...</div>`;
  container.append(card);
  mainRoot.append(container);

  try {
    const { story } = await StoryApi.getStory(params.id);
    card.innerHTML = `
      <article class="grid" style="grid-template-columns:1fr;gap:12px;">
        <header>
          <a class="btn secondary" href="#/">Kembali</a>
          <h1 style="margin:12px 0 0">${story.name}</h1>
          <p class="help">${new Date(story.createdAt).toLocaleString()}</p>
        </header>
        <img src="${story.photoUrl}" alt="Foto oleh ${
      story.name
    }" style="width:100%;max-height:420px;object-fit:cover;border-radius:12px;border:1px solid var(--border)"/>
        <p>${story.description || ""}</p>
        <div id="map" class="map" role="region" aria-label="Lokasi cerita"></div>
      </article>
    `;
    const hasLoc =
      typeof story.lat === "number" && typeof story.lon === "number";
    let map = null;

    try {
      const mapContainer = card.querySelector("#map");
      if (mapContainer) {
        map = L.map("map");
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          maxZoom: 19,
        }).addTo(map);
        if (hasLoc) {
          map.setView([story.lat, story.lon], 10);
          L.marker([story.lat, story.lon])
            .addTo(map)
            .bindPopup(`${story.name}`)
            .openPopup();
        } else {
          map.setView([0, 0], 2);
        }
      }
    } catch (mapError) {
      console.error("Error initializing map:", mapError);
    }

    const cleanup = () => {
      try {
        if (map) {
          map.remove();
          map = null;
        }
      } catch (error) {
        console.warn("DetailView map cleanup warning:", error.message);
      }
    };
    mainRoot._detailViewCleanup = cleanup;
  } catch (err) {
    showToast(err.message || "Gagal memuat detail", "error");
    card.innerHTML = `<p class="error">${err.message || "Gagal memuat"}</p>`;
  }
}
