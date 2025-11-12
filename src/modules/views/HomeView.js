import { StoryApi } from '../api/storyApi.js';
import { showToast } from '../components/Toast.js';

export async function HomeView({ mainRoot }) {
  mainRoot.innerHTML = '';
  const container = document.createElement('div');
  container.className = 'container';

  const toolbar = document.createElement('div');
  toolbar.className = 'toolbar';
  toolbar.innerHTML = `
    <h1 style="margin:0">Cerita</h1>
    <span class="spacer"></span>
    <button id="push-toggle" class="btn secondary" type="button">Aktifkan Notifikasi</button>
    <a class="btn" href="#/add">Tambah Cerita</a>
  `;

  const grid = document.createElement('div');
  grid.className = 'grid home-grid';

  const listCard = document.createElement('section');
  listCard.className = 'card';
  listCard.innerHTML = `
    <h2 style="margin-top:0">Daftar Cerita</h2>
    <div class="field" style="margin-bottom:8px;">
      <label for="filter-text">Cari</label>
      <input id="filter-text" type="text" placeholder="Cari deskripsi atau nama..." />
    </div>
    <div class="list" id="story-list" aria-live="polite" aria-busy="true"></div>
  `;

  const mapCard = document.createElement('section');
  mapCard.className = 'card';
  mapCard.innerHTML = `
    <h2 style="margin-top:0">Peta Cerita</h2>
    <div id="map" class="map" role="region" aria-label="Peta cerita" aria-describedby="map-help"></div>
    <div id="map-help" class="help" style="margin-top:8px">Klik marker untuk melihat deskripsi. Klik item daftar akan menyorot marker di peta.</div>
  `;

  grid.append(listCard, mapCard);
  container.append(toolbar, grid);
  mainRoot.append(container);

  // Push subscription toggle
  const VAPID_PUBLIC = 'BCCs2eonMI-6H2ctvFaWg-UYdDv387Vno_bzUzALpB442r2lCnsHmtrx8biyPi_E-1fSGABK_Qs_GlvPoJJqxbk';
  function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) outputArray[i] = rawData.charCodeAt(i);
    return outputArray;
  }
  
  async function getSubscription() {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      return null;
    }
    try {
      const reg = await navigator.serviceWorker.ready;
      return await reg.pushManager.getSubscription();
    } catch (error) {
      console.error('Error getting subscription:', error);
      return null;
    }
  }
  
  async function updatePushButton() {
    const btn = toolbar.querySelector('#push-toggle');
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      btn.disabled = true;
      btn.textContent = 'Notifikasi tidak didukung';
      return;
    }
    try {
      const sub = await getSubscription();
      btn.disabled = false;
      btn.textContent = sub ? 'Matikan Notifikasi' : 'Aktifkan Notifikasi';
    } catch (error) {
      console.error('Error updating push button:', error);
      btn.disabled = false;
      btn.textContent = 'Aktifkan Notifikasi';
    }
  }
  
  async function requestNotificationPermission() {
    if (!('Notification' in window)) {
      throw new Error('Browser tidak mendukung notifikasi');
    }
    
    if (Notification.permission === 'granted') {
      return true;
    }
    
    if (Notification.permission === 'denied') {
      throw new Error('Izin notifikasi ditolak. Silakan aktifkan di pengaturan browser.');
    }
    
    // Request permission
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      throw new Error('Izin notifikasi diperlukan untuk mengaktifkan fitur ini.');
    }
    
    return true;
  }
  
  async function subscribePush() {
    // Check if service worker and push are supported
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      throw new Error('Browser tidak mendukung push notification');
    }
    
    // Request notification permission first
    await requestNotificationPermission();
    
    // Wait for service worker to be ready (with timeout)
    let reg;
    try {
      reg = await Promise.race([
        navigator.serviceWorker.ready,
        new Promise((_, reject) => setTimeout(() => reject(new Error('Service worker timeout')), 10000))
      ]);
    } catch (error) {
      console.error('Service worker not ready:', error);
      throw new Error('Service worker belum siap. Silakan refresh halaman dan coba lagi.');
    }
    
    if (!reg) {
      throw new Error('Service worker tidak ditemukan. Pastikan aplikasi diakses melalui HTTPS.');
    }
    
    console.log('Service worker ready:', reg);
    console.log('Service worker scope:', reg.scope);
    
    // Check if already subscribed
    let sub = await reg.pushManager.getSubscription();
    if (sub) {
      console.log('Already subscribed:', sub);
      showToast('Notifikasi sudah aktif', 'success');
      return;
    }
    
    // Subscribe to push
    try {
      const applicationServerKey = urlBase64ToUint8Array(VAPID_PUBLIC);
      console.log('Subscribing with VAPID key...');
      sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: applicationServerKey
      });
      
      console.log('Subscription created:', sub);
      const json = sub.toJSON();
      console.log('Subscription JSON:', json);
      
      if (!json.endpoint || !json.keys) {
        throw new Error('Subscription data tidak valid');
      }
      
      // Send subscription to server
      console.log('Sending subscription to server...');
      await StoryApi.subscribePush({ endpoint: json.endpoint, keys: json.keys });
      console.log('Subscription sent to server successfully');
      showToast('Notifikasi diaktifkan', 'success');
    } catch (error) {
      console.error('Subscribe error:', error);
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      
      if (error.name === 'NotAllowedError') {
        throw new Error('Izin notifikasi ditolak. Silakan aktifkan di pengaturan browser.');
      } else if (error.name === 'NotSupportedError') {
        throw new Error('Push notification tidak didukung di browser ini.');
      } else if (error.message && error.message.includes('VAPID')) {
        throw new Error('Kunci VAPID tidak valid. Silakan hubungi administrator.');
      } else if (error.message && error.message.includes('network') || error.message && error.message.includes('fetch')) {
        throw new Error('Gagal terhubung ke server. Periksa koneksi internet Anda.');
      } else {
        throw new Error(error.message || 'Gagal mengaktifkan notifikasi. Periksa console untuk detail.');
      }
    }
  }
  
  async function unsubscribePush() {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      return;
    }
    
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (!sub) {
        showToast('Tidak ada subscription aktif');
        return;
      }
      
      const endpoint = sub.endpoint;
      const unsubscribed = await sub.unsubscribe();
      
      if (unsubscribed) {
        try {
          await StoryApi.unsubscribePush({ endpoint });
        } catch (apiError) {
          console.error('Error unsubscribing from server:', apiError);
          // Continue even if server unsubscribe fails
        }
        showToast('Notifikasi dimatikan', 'success');
      } else {
        throw new Error('Gagal unsubscribe');
      }
    } catch (error) {
      console.error('Unsubscribe error:', error);
      throw new Error('Gagal mematikan notifikasi');
    }
  }
  
  toolbar.querySelector('#push-toggle').addEventListener('click', async () => {
    const btn = toolbar.querySelector('#push-toggle');
    btn.disabled = true;
    try {
      const sub = await getSubscription();
      if (sub) {
        await unsubscribePush();
      } else {
        await subscribePush();
      }
      await updatePushButton();
    } catch (error) {
      console.error('Push toggle error:', error);
      showToast(error.message || 'Gagal mengubah status notifikasi', 'error');
      await updatePushButton();
    } finally {
      btn.disabled = false;
    }
  });
  
  // Initialize button state
  updatePushButton();

  // Fetch and render stories with locations
  let stories = [];
  try {
    const data = await StoryApi.getStories({ page: 1, size: 50, withLocation: 1 });
    stories = data?.listStory || [];
  } catch (err) {
    showToast(err.message || 'Gagal memuat cerita', 'error');
  }

  const listRoot = listCard.querySelector('#story-list');
  listRoot.setAttribute('aria-busy', 'false');

  // Build list
  function renderList(items) {
    listRoot.innerHTML = '';
    for (const s of items) {
      const el = document.createElement('article');
      el.className = 'story-item card';
      el.innerHTML = `
        <img src="${s.photoUrl}" alt="Foto oleh ${s.name}" loading="lazy"/>
        <div>
          <h3><a href="#/detail/${s.id}">${s.name}</a></h3>
          <p>${s.description || ''}</p>
          <p class="help" aria-label="Tanggal dibuat">${new Date(s.createdAt).toLocaleString?.() || ''}</p>
        </div>
      `;
      el.addEventListener('click', () => focusMarker(s.id));
      listRoot.append(el);
    }
  }
  renderList(stories);

  // Filter
  const filterInput = listCard.querySelector('#filter-text');
  filterInput.addEventListener('input', () => {
    const q = filterInput.value.toLowerCase();
    const filtered = stories.filter((s) => `${s.name} ${s.description}`.toLowerCase().includes(q));
    renderList(filtered);
  });

  // Map with tile layers and markers
  let map = null;
  let markers = null;
  
  try {
    // Check if map container exists
    const mapContainer = mapCard.querySelector('#map');
    if (mapContainer) {
      map = L.map('map', { zoomControl: true });

      const osm = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap',
      }).addTo(map);
      const stamenTerrain = L.tileLayer('https://stamen-tiles.a.ssl.fastly.net/terrain/{z}/{x}/{y}.jpg', {
        attribution: 'Map tiles by Stamen Design',
      });
      const stamenWatercolor = L.tileLayer('https://stamen-tiles.a.ssl.fastly.net/watercolor/{z}/{x}/{y}.jpg', {
        attribution: 'Map tiles by Stamen Design',
      });
      L.control.layers(
        { OSM: osm, Terrain: stamenTerrain, Watercolor: stamenWatercolor },
        {}, { position: 'topright' },
      ).addTo(map);

      markers = new Map();
      const bounds = L.latLngBounds([]);
      for (const s of stories) {
        if (typeof s.lat !== 'number' || typeof s.lon !== 'number') continue;
        const m = L.marker([s.lat, s.lon]).addTo(map);
        m.bindPopup(`<strong>${s.name}</strong><br/>${s.description || ''}<br/><small>${new Date(s.createdAt).toLocaleString?.() || ''}</small>`);
        m.on('click', () => highlightListItem(s.id));
        markers.set(s.id, m);
        bounds.extend([s.lat, s.lon]);
      }

      // Fit map to all markers, or fallback
      if (bounds.isValid()) {
        map.fitBounds(bounds.pad(0.15), { animate: false });
      } else {
        map.setView([0, 0], 2);
      }
    }
  } catch (error) {
    console.error('Error initializing map:', error);
  }

  function focusMarker(id) {
    if (!map || !markers) return;
    const m = markers.get(id);
    if (!m) return;
    const latLng = m.getLatLng();
    map.setView(latLng, Math.max(map.getZoom(), 8), { animate: true });
    m.openPopup();
    highlightListItem(id);
  }

  function highlightListItem(id) {
    listRoot.querySelectorAll('.story-item').forEach((el) => el.classList.remove('active'));
    const index = stories.findIndex((s) => s.id === id);
    if (index >= 0) {
      const el = listRoot.children[index];
      if (el) {
        el.classList.add('active');
        el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }
  }
  
  // Cleanup function for map
  const cleanup = () => {
    try {
      if (map) {
        map.remove();
        map = null;
      }
      if (markers) {
        markers.clear();
        markers = null;
      }
    } catch (error) {
      // Ignore cleanup errors (map might already be removed)
      console.warn('Map cleanup warning:', error.message);
    }
  };
  
  // Store cleanup function for router
  mainRoot._homeViewCleanup = cleanup;
}


