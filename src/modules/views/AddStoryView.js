import { StoryApi } from '../api/storyApi.js';
import { showToast } from '../components/Toast.js';
import { navigateTo } from '../../router.js';
import * as IDB from '../utils/indexedDB.js';
import { Storage } from '../utils/storage.js';

export async function AddStoryView({ mainRoot }) {
  mainRoot.innerHTML = '';
  const container = document.createElement('div');
  container.className = 'container';

  const card = document.createElement('section');
  card.className = 'card';
  card.innerHTML = `
    <h1>Tambah Cerita</h1>
    <div class="help">Klik peta untuk memilih lokasi. Maksimum foto 1MB.</div>
    <div id="map" class="map" role="region" aria-label="Peta pilih lokasi"></div>
    <form id="story-form" class="grid" style="grid-template-columns:1fr; gap:12px; margin-top:12px;" novalidate>
      <div class="field">
        <label for="description">Deskripsi</label>
        <textarea id="description" name="description" rows="3" required aria-required="true" placeholder="Tulis cerita singkat..."></textarea>
      </div>
      <div class="field">
        <label for="photo">Foto</label>
        <input id="photo" name="photo" type="file" accept="image/*" required aria-required="true" />
        <span class="help">Atau gunakan kamera langsung:</span>
        <div class="actions">
          <button id="open-camera" type="button" class="btn secondary">Gunakan Kamera</button>
          <button id="capture" type="button" class="btn" disabled>Ambil Foto</button>
          <button id="close-camera" type="button" class="btn secondary" disabled>Tutup Kamera</button>
        </div>
        <video id="video" class="card" style="width:100%;max-height:240px;display:none" playsinline></video>
        <canvas id="canvas" class="card" style="display:none"></canvas>
      </div>
      <div class="grid" style="grid-template-columns:1fr 1fr; gap:12px;">
        <div class="field">
          <label for="lat">Latitude</label>
          <input id="lat" name="lat" type="number" step="any" readonly />
        </div>
        <div class="field">
          <label for="lon">Longitude</label>
          <input id="lon" name="lon" type="number" step="any" readonly />
        </div>
      </div>
      <div class="actions">
        <button type="submit" class="btn">Kirim</button>
        <button id="cancel" type="button" class="btn secondary">Batal</button>
      </div>
    </form>
  `;

  container.append(card);
  mainRoot.append(container);

  // Map select
  const map = L.map('map').setView([0, 0], 2);
  const osm = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(map);
  let pin;
  function setPin(latlng) {
    if (!pin) pin = L.marker(latlng, { draggable: true }).addTo(map);
    else pin.setLatLng(latlng);
    updateLatLonInputs(pin.getLatLng());
    pin.off('move').on('move', (e) => updateLatLonInputs(e.latlng));
  }
  function updateLatLonInputs(latlng) {
    form.lat.value = Number(latlng.lat.toFixed(6));
    form.lon.value = Number(latlng.lng.toFixed(6));
  }
  map.on('click', (e) => setPin(e.latlng));

  // Initialize IndexedDB
  await IDB.initDB().catch(() => {});

  // Helper to create photo URL from file
  function createPhotoUrl(file) {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(file);
    });
  }

  // Helper to convert File to Blob for IndexedDB storage
  function fileToBlob(file) {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const blob = new Blob([e.target.result], { type: file.type });
        resolve(blob);
      };
      reader.onerror = () => resolve(null);
      reader.readAsArrayBuffer(file);
    });
  }

  // Form
  const form = card.querySelector('#story-form');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const description = form.description.value.trim();
    const file = form.photo.files[0];
    const lat = form.lat.value ? parseFloat(form.lat.value) : undefined;
    const lon = form.lon.value ? parseFloat(form.lon.value) : undefined;
    if (!description) return showToast('Deskripsi wajib diisi', 'error');
    if (!file) return showToast('Pilih atau ambil foto dahulu', 'error');
    if (file.size > 1024 * 1024) return showToast('Ukuran foto melebihi 1MB', 'error');

    const isOnline = navigator.onLine;
    const userName = Storage.getName() || 'User';

    try {
      if (isOnline) {
        // Try to send to API first
        try {
          const result = await StoryApi.addStory({ description, file, lat, lon });
          showToast('Cerita berhasil dikirim', 'success');
          // Also save to IndexedDB for offline access
          const photoUrl = await createPhotoUrl(file);
          const photoBlob = await fileToBlob(file);
          await IDB.createStory({
            id: result?.story?.id || `temp-${Date.now()}`,
            name: userName,
            description,
            photoUrl,
            photoBlob, // Store as Blob for sync later
            lat,
            lon,
            createdAt: new Date().toISOString(),
            synced: true,
          });
          cleanupAndGoHome();
        } catch (apiErr) {
          // API failed, save to IndexedDB as unsynced
          const photoUrl = await createPhotoUrl(file);
          const photoBlob = await fileToBlob(file);
          const tempId = `temp-${Date.now()}`;
          await IDB.createStory({
            id: tempId,
            name: userName,
            description,
            photoUrl,
            photoBlob, // Store as Blob for sync later
            lat,
            lon,
            createdAt: new Date().toISOString(),
            synced: false,
          });
          showToast('Cerita disimpan offline, akan disinkronkan saat online', 'info');
          cleanupAndGoHome();
        }
      } else {
        // Offline - save to IndexedDB
        const photoUrl = await createPhotoUrl(file);
        const photoBlob = await fileToBlob(file);
        const tempId = `temp-${Date.now()}`;
        await IDB.createStory({
          id: tempId,
          name: userName,
          description,
          photoUrl,
          photoBlob, // Store as Blob for sync later
          lat,
          lon,
          createdAt: new Date().toISOString(),
          synced: false,
        });
        showToast('Cerita disimpan offline, akan disinkronkan saat online', 'info');
        cleanupAndGoHome();
      }
    } catch (err) {
      showToast(err.message || 'Gagal menyimpan cerita', 'error');
    }
  });

  // Camera capture using MediaStream
  const btnOpen = card.querySelector('#open-camera');
  const btnCapture = card.querySelector('#capture');
  const btnClose = card.querySelector('#close-camera');
  const video = card.querySelector('#video');
  const canvas = card.querySelector('#canvas');
  let stream;

  async function openCamera() {
    try {
      stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false });
      video.srcObject = stream;
      video.style.display = 'block';
      await video.play();
      btnCapture.disabled = false;
      btnClose.disabled = false;
      showToast('Kamera aktif');
    } catch (err) {
      showToast('Tidak dapat mengakses kamera', 'error');
    }
  }
  function closeCamera() {
    if (stream) {
      stream.getTracks().forEach((t) => t.stop());
      stream = null;
    }
    video.pause();
    video.srcObject = null;
    video.style.display = 'none';
    btnCapture.disabled = true;
    btnClose.disabled = true;
    showToast('Kamera ditutup');
  }
  function dataURLtoFile(dataUrl, filename) {
    const arr = dataUrl.split(',');
    const mime = arr[0].match(/:(.*?);/)[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) u8arr[n] = bstr.charCodeAt(n);
    return new File([u8arr], filename, { type: mime });
  }
  function capturePhoto() {
    if (!video.videoWidth) return;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
    const file = dataURLtoFile(dataUrl, `capture-${Date.now()}.jpg`);
    const dt = new DataTransfer();
    dt.items.add(file);
    form.photo.files = dt.files;
    showToast('Foto diambil dari kamera', 'success');
  }

  btnOpen.addEventListener('click', openCamera);
  btnClose.addEventListener('click', closeCamera);
  btnCapture.addEventListener('click', capturePhoto);
  const btnCancel = card.querySelector('#cancel');

  // Use a more efficient cleanup approach - only observe parent container
  const parentContainer = mainRoot.querySelector('.container');
  let observer = null;
  
  // Store cleanup function on mainRoot for router to call
  const cleanup = () => {
    try {
      closeCamera();
      if (observer) {
        observer.disconnect();
        observer = null;
      }
      if (map) {
        map.remove();
        map = null;
      }
    } catch (e) {
      console.error('Cleanup error:', e);
    }
  };
  
  function cleanupAndGoHome() {
    cleanup();
    navigateTo('#/');
  }
  btnCancel.addEventListener('click', (e) => {
    e.preventDefault();
    cleanupAndGoHome();
  });

  // Only observe the container, not the entire body (much more efficient)
  if (parentContainer) {
    observer = new MutationObserver((mutations) => {
      // Only check if card was removed from container
      for (const mutation of mutations) {
        for (const node of mutation.removedNodes) {
          if (node === card || (node.nodeType === 1 && node.contains && node.contains(card))) {
            cleanup();
            return;
          }
        }
      }
    });
    observer.observe(parentContainer, { childList: true });
  }
  
  // Store cleanup function for router to call when navigating away
  mainRoot._addStoryCleanup = cleanup;
}


