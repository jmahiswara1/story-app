const DB_NAME = 'StoryAppDB';
const DB_VERSION = 1;
const STORE_NAME = 'stories';

let db = null;

// Initialize IndexedDB
export async function initDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      db = request.result;
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const database = event.target.result;
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        const store = database.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: false });
        store.createIndex('name', 'name', { unique: false });
        store.createIndex('createdAt', 'createdAt', { unique: false });
        store.createIndex('description', 'description', { unique: false });
      }
    };
  });
}

// Get database instance
async function getDB() {
  if (db) return db;
  return await initDB();
}

// Create - Add story to IndexedDB
export async function createStory(story) {
  const database = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.add({
      ...story,
      synced: false, // Mark as not synced if created offline
      createdAt: story.createdAt || new Date().toISOString(),
    });

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// Read - Get all stories
export async function getAllStories() {
  const database = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
}

// Read - Get single story by ID
export async function getStoryById(id) {
  const database = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(id);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// Read - Get unsynced stories
export async function getUnsyncedStories() {
  const database = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();

    request.onsuccess = () => {
      const stories = request.result || [];
      resolve(stories.filter((s) => s.synced === false));
    };
    request.onerror = () => reject(request.error);
  });
}

// Update - Update story
export async function updateStory(story) {
  const database = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.put(story);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// Delete - Remove story from IndexedDB
export async function deleteStory(id) {
  const database = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(id);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

// Search - Filter stories by query
export async function searchStories(query) {
  const stories = await getAllStories();
  const lowerQuery = query.toLowerCase();
  return stories.filter(
    (story) =>
      story.name?.toLowerCase().includes(lowerQuery) ||
      story.description?.toLowerCase().includes(lowerQuery)
  );
}

// Sort - Sort stories
export async function sortStories(sortBy = 'createdAt', order = 'desc') {
  const stories = await getAllStories();
  return stories.sort((a, b) => {
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
}

// Sync - Sync unsynced stories to API
export async function syncStories(apiFunction) {
  const unsynced = await getUnsyncedStories();
  const results = [];

  for (const story of unsynced) {
    try {
      // Try to sync to API
      const result = await apiFunction(story);
      // Mark as synced
      await updateStory({ ...story, synced: true, id: result?.story?.id || story.id });
      results.push({ success: true, story });
    } catch (error) {
      results.push({ success: false, story, error: error.message });
    }
  }

  return results;
}

// Bulk insert stories from API
export async function bulkInsertStories(stories) {
  const database = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const promises = stories.map((story) => {
      return new Promise((res, rej) => {
        const req = store.put({ ...story, synced: true });
        req.onsuccess = () => res();
        req.onerror = () => rej(req.error);
      });
    });

    Promise.all(promises)
      .then(() => resolve())
      .catch((err) => reject(err));
  });
}

// Clear all stories
export async function clearAllStories() {
  const database = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.clear();

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}







