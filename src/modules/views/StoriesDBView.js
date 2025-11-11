import * as IDB from '../utils/indexedDB.js';
import { StoryApi } from '../api/storyApi.js';
import { showToast } from '../components/Toast.js';
import { navigateTo } from '../../router.js';

export async function StoriesDBView({ mainRoot }) {
  mainRoot.innerHTML = '';
  const container = document.createElement('div');
  container.className = 'container';

  const card = document.createElement('section');
  card.className = 'card';
  card.innerHTML = `
    <div class="toolbar" style="margin-bottom: 16px;">
      <h1 style="margin: 0;">Cerita Tersimpan (IndexedDB)</h1>
      <span class="spacer"></span>
      <button id="sync-btn" class="btn">Sinkronkan</button>
      <button id="load-api-btn" class="btn secondary">Muat dari API</button>
      <button id="clear-btn" class="btn danger">Hapus Semua</button>
    </div>

    <div class="grid" style="grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 16px;">
      <div class="field">
        <label for="search-input">Cari</label>
        <input id="search-input" type="text" placeholder="Cari nama atau deskripsi..." />
      </div>
      <div class="field">
        <label for="sort-select">Urutkan</label>
        <select id="sort-select">
          <option value="createdAt-desc">Terbaru</option>
          <option value="createdAt-asc">Terlama</option>
          <option value="name-asc">Nama A-Z</option>
          <option value="name-desc">Nama Z-A</option>
        </select>
      </div>
    </div>

    <div id="stories-list" class="list" aria-live="polite" aria-busy="true"></div>
    <div id="stats" class="help" style="margin-top: 12px;"></div>
  `;

  container.append(card);
  mainRoot.append(container);

  // Initialize IndexedDB
  try {
    await IDB.initDB();
  } catch (err) {
    showToast('Gagal menginisialisasi IndexedDB', 'error');
    return;
  }

  let allStories = [];
  let filteredStories = [];

  // Render stories list
  function renderStories(stories) {
    const listRoot = card.querySelector('#stories-list');
    const statsRoot = card.querySelector('#stats');
    listRoot.setAttribute('aria-busy', 'false');
    listRoot.innerHTML = '';

    if (stories.length === 0) {
      listRoot.innerHTML = '<p class="help">Tidak ada cerita tersimpan.</p>';
      statsRoot.textContent = 'Total: 0 cerita';
      return;
    }

    stories.forEach((story) => {
      const el = document.createElement('article');
      el.className = 'story-item card';
      const syncedBadge = story.synced
        ? '<span class="badge" style="background: green; color: white; padding: 2px 8px; border-radius: 4px; font-size: 12px;">Tersinkron</span>'
        : '<span class="badge" style="background: orange; color: white; padding: 2px 8px; border-radius: 4px; font-size: 12px;">Belum Tersinkron</span>';

      el.innerHTML = `
        <div style="display: flex; gap: 12px;">
          ${story.photoUrl ? `<img src="${story.photoUrl}" alt="Foto" style="width: 80px; height: 80px; object-fit: cover; border-radius: 8px;" />` : ''}
          <div style="flex: 1;">
            <h3 style="margin: 0 0 8px 0;">
              ${story.name || 'Tanpa Nama'}
              ${syncedBadge}
            </h3>
            <p style="margin: 0 0 8px 0; color: #666;">${story.description || ''}</p>
            <p class="help" style="margin: 0; font-size: 12px;">
              ${new Date(story.createdAt).toLocaleString('id-ID')}
            </p>
            <div class="actions" style="margin-top: 8px;">
              ${story.id ? `<a href="#/detail/${story.id}" class="btn secondary" style="font-size: 12px; padding: 4px 8px;">Lihat</a>` : ''}
              <button class="btn danger delete-btn" data-id="${story.id}" style="font-size: 12px; padding: 4px 8px;">Hapus</button>
            </div>
          </div>
        </div>
      `;

      // Delete button handler
      const deleteBtn = el.querySelector('.delete-btn');
      deleteBtn.addEventListener('click', async () => {
        if (!confirm('Hapus cerita ini?')) return;
        try {
          await IDB.deleteStory(story.id);
          showToast('Cerita dihapus', 'success');
          await loadStories();
        } catch (err) {
          showToast('Gagal menghapus cerita', 'error');
        }
      });

      listRoot.append(el);
    });

    const unsyncedCount = stories.filter((s) => !s.synced).length;
    statsRoot.textContent = `Total: ${stories.length} cerita | Belum tersinkron: ${unsyncedCount}`;
  }

  // Load stories from IndexedDB
  async function loadStories() {
    try {
      allStories = await IDB.getAllStories();
      applyFilters();
    } catch (err) {
      showToast('Gagal memuat cerita', 'error');
    }
  }

  // Apply search and sort filters
  function applyFilters() {
    let result = [...allStories];

    // Search filter
    const searchInput = card.querySelector('#search-input');
    const searchQuery = searchInput.value.trim();
    if (searchQuery) {
      result = result.filter(
        (s) =>
          s.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          s.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Sort
    const sortSelect = card.querySelector('#sort-select');
    const [sortBy, order] = sortSelect.value.split('-');
    result.sort((a, b) => {
      let aVal = a[sortBy] || '';
      let bVal = b[sortBy] || '';

      if (sortBy === 'createdAt') {
        aVal = new Date(aVal).getTime();
        bVal = new Date(bVal).getTime();
      } else {
        aVal = String(aVal).toLowerCase();
        bVal = String(bVal).toLowerCase();
      }

      if (order === 'asc') {
        return aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
      } else {
        return aVal < bVal ? 1 : aVal > bVal ? -1 : 0;
      }
    });

    filteredStories = result;
    renderStories(result);
  }

  // Load from API
  const loadApiBtn = card.querySelector('#load-api-btn');
  loadApiBtn.addEventListener('click', async () => {
    try {
      loadApiBtn.disabled = true;
      loadApiBtn.textContent = 'Memuat...';
      const data = await StoryApi.getStories({ page: 1, size: 50, withLocation: 1 });
      const stories = data?.listStory || [];
      await IDB.bulkInsertStories(stories);
      showToast(`${stories.length} cerita dimuat dari API`, 'success');
      await loadStories();
    } catch (err) {
      showToast('Gagal memuat dari API: ' + err.message, 'error');
    } finally {
      loadApiBtn.disabled = false;
      loadApiBtn.textContent = 'Muat dari API';
    }
  });

  // Sync unsynced stories
  const syncBtn = card.querySelector('#sync-btn');
  syncBtn.addEventListener('click', async () => {
    try {
      syncBtn.disabled = true;
      syncBtn.textContent = 'Menyinkronkan...';
      const unsynced = await IDB.getUnsyncedStories();
      if (unsynced.length === 0) {
        showToast('Tidak ada cerita yang perlu disinkronkan', 'info');
        syncBtn.disabled = false;
        syncBtn.textContent = 'Sinkronkan';
        return;
      }

      let successCount = 0;
      for (const story of unsynced) {
        try {
          // Convert Blob to File for API
          let photoFile = null;
          if (story.photoBlob) {
            photoFile = new File([story.photoBlob], `story-${story.id}.jpg`, { type: story.photoBlob.type || 'image/jpeg' });
          }

          const result = await StoryApi.addStory({
            description: story.description,
            file: photoFile,
            lat: story.lat,
            lon: story.lon,
          });

          // Mark as synced
          await IDB.updateStory({ ...story, synced: true, id: result?.story?.id || story.id });
          successCount++;
        } catch (err) {
          console.error('Sync error for story:', story.id, err);
        }
      }

      showToast(`${successCount} dari ${unsynced.length} cerita berhasil disinkronkan`, 'success');
      await loadStories();
    } catch (err) {
      showToast('Gagal menyinkronkan: ' + err.message, 'error');
    } finally {
      syncBtn.disabled = false;
      syncBtn.textContent = 'Sinkronkan';
    }
  });

  // Clear all
  const clearBtn = card.querySelector('#clear-btn');
  clearBtn.addEventListener('click', async () => {
    if (!confirm('Hapus semua cerita dari IndexedDB?')) return;
    try {
      await IDB.clearAllStories();
      showToast('Semua cerita dihapus', 'success');
      await loadStories();
    } catch (err) {
      showToast('Gagal menghapus', 'error');
    }
  });

  // Search input
  const searchInput = card.querySelector('#search-input');
  searchInput.addEventListener('input', applyFilters);

  // Sort select
  const sortSelect = card.querySelector('#sort-select');
  sortSelect.addEventListener('change', applyFilters);

  // Initial load
  await loadStories();
}

