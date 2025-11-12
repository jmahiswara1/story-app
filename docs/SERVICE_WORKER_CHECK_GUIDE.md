# Panduan Memeriksa Service Worker di DevTools

## Cara 1: Melalui Tab Application (Paling Mudah)

### Langkah 1: Buka DevTools
1. Buka aplikasi: `https://jmahiswara1.github.io/story-app/`
2. Tekan `F12` untuk membuka DevTools
3. Atau klik kanan > "Inspect" / "Periksa Elemen"

### Langkah 2: Buka Tab Application
1. Di bagian atas DevTools, klik tab **"Application"**
2. Di panel kiri, scroll ke bawah dan klik **"Service Workers"**

### Langkah 3: Lihat Status Service Worker
Anda akan melihat informasi seperti ini:

```
┌─────────────────────────────────────────────────────────┐
│ Service Workers                                         │
├─────────────────────────────────────────────────────────┤
│ 📍 https://jmahiswara1.github.io/story-app/sw.js       │
│                                                          │
│ Status: ● activated and is running                      │
│ Source: /story-app/sw.js                                │
│ Scope: /story-app/                                      │
│                                                          │
│ [Update] [Unregister]                                   │
└─────────────────────────────────────────────────────────┘
```

### Status yang Baik:
- ✅ **Status**: "activated and is running" (hijau)
- ✅ **Source**: Menunjukkan path ke `sw.js`
- ✅ **Scope**: Menunjukkan scope service worker

### Status yang Bermasalah:
- ❌ **Status**: "redundant" (merah) - Service worker lama yang sudah tidak digunakan
- ❌ **Status**: "installing" (kuning) - Masih dalam proses instalasi
- ❌ Tidak ada service worker - Service worker tidak terdaftar

## Cara 2: Melalui Console (Untuk Debugging)

### Langkah 1: Buka Console
1. Tekan `F12` untuk membuka DevTools
2. Klik tab **"Console"**

### Langkah 2: Jalankan Command
Ketikan command berikut di console:

```javascript
// Cek apakah service worker didukung
console.log('Service Worker supported:', 'serviceWorker' in navigator);

// Cek registrations
navigator.serviceWorker.getRegistrations().then(registrations => {
  console.log('Service Worker Registrations:', registrations);
  if (registrations.length === 0) {
    console.error('❌ Tidak ada service worker yang terdaftar!');
  } else {
    registrations.forEach((reg, index) => {
      console.log(`✅ Service Worker ${index + 1}:`);
      console.log('  - Scope:', reg.scope);
      console.log('  - Active:', reg.active?.state);
      console.log('  - Installing:', reg.installing?.state);
      console.log('  - Waiting:', reg.waiting?.state);
    });
  }
});

// Cek service worker yang aktif
navigator.serviceWorker.ready.then(registration => {
  console.log('✅ Service Worker Ready:', registration);
  console.log('  - Scope:', registration.scope);
}).catch(error => {
  console.error('❌ Service Worker Not Ready:', error);
});
```

### Hasil yang Diharapkan:
```
Service Worker supported: true
Service Worker Registrations: [ServiceWorkerRegistration]
✅ Service Worker 1:
  - Scope: https://jmahiswara1.github.io/story-app/
  - Active: activated
  - Installing: null
  - Waiting: null
✅ Service Worker Ready: ServiceWorkerRegistration
  - Scope: https://jmahiswara1.github.io/story-app/
```

## Cara 3: Melalui Network Tab

### Langkah 1: Buka Network Tab
1. Tekan `F12` untuk membuka DevTools
2. Klik tab **"Network"**

### Langkah 2: Refresh Halaman
1. Tekan `F5` untuk refresh
2. Filter dengan `sw.js`

### Langkah 3: Periksa Request
Anda harus melihat request ke `sw.js` dengan status:
- ✅ **Status**: `200 OK` (berhasil dimuat)
- ❌ **Status**: `404 Not Found` (file tidak ditemukan)
- ❌ **Status**: `Failed` (gagal dimuat)

## Cara 4: Melalui Cache Storage

### Langkah 1: Buka Tab Application
1. Tekan `F12` untuk membuka DevTools
2. Klik tab **"Application"**

### Langkah 2: Periksa Cache Storage
1. Di panel kiri, expand **"Cache Storage"**
2. Anda akan melihat cache yang dibuat service worker:
   - `story-app-v1`
   - `story-app-runtime-v1`
   - `story-app-api-v1`

### Jika Cache Ada:
- ✅ Service worker berfungsi dengan baik
- ✅ Assets berhasil di-cache

### Jika Cache Tidak Ada:
- ❌ Service worker mungkin tidak berjalan
- ❌ Atau cache belum dibuat

## Troubleshooting

### Masalah 1: Service Worker Tidak Terdaftar

**Solusi:**
1. Buka Console dan lihat error
2. Periksa apakah file `sw.js` dapat diakses:
   - Buka: `https://jmahiswara1.github.io/story-app/sw.js`
   - Harus menampilkan kode JavaScript, bukan 404
3. Periksa Network tab untuk melihat request `sw.js`
4. Pastikan aplikasi diakses melalui HTTPS

### Masalah 2: Service Worker Status "Redundant"

**Solusi:**
1. Klik tombol **"Unregister"** pada service worker yang redundant
2. Refresh halaman
3. Service worker baru akan terdaftar

### Masalah 3: Service Worker Status "Installing"

**Solusi:**
1. Tunggu beberapa saat (biasanya hanya beberapa detik)
2. Jika masih "installing", periksa Console untuk error
3. Periksa apakah ada masalah dengan cache installation

### Masalah 4: Service Worker Scope Tidak Sesuai

**Solusi:**
1. Pastikan service worker di-register dengan scope yang benar
2. Untuk GitHub Pages subdirectory, scope harus sesuai dengan base path
3. Periksa kode di `src/main.js` untuk registration

## Testing Push Notifications

### Langkah 1: Periksa Service Worker Ready
```javascript
navigator.serviceWorker.ready.then(registration => {
  console.log('Service Worker Ready:', registration);
  return registration.pushManager.getSubscription();
}).then(subscription => {
  if (subscription) {
    console.log('✅ Push Subscription Active:', subscription);
  } else {
    console.log('❌ No Push Subscription');
  }
});
```

### Langkah 2: Test Push Subscription
1. Klik tombol **"Aktifkan Notifikasi"** di aplikasi
2. Periksa Console untuk log:
   - "Service worker ready"
   - "Subscribing with VAPID key..."
   - "Subscription created"
   - "Subscription sent to server successfully"

## Checklist

Gunakan checklist ini untuk memastikan service worker berfungsi:

- [ ] Service worker terdaftar di DevTools > Application > Service Workers
- [ ] Status: "activated and is running"
- [ ] File `sw.js` dapat diakses (status 200 di Network tab)
- [ ] Cache Storage berisi cache yang dibuat service worker
- [ ] Console tidak menampilkan error terkait service worker
- [ ] Push notifications dapat diaktifkan (jika menggunakan fitur push)

## Video Tutorial (Referensi)

Jika masih bingung, cari video tutorial dengan kata kunci:
- "How to check service worker in Chrome DevTools"
- "Service worker debugging Chrome"
- "PWA service worker inspection"

## Catatan Penting

1. **Service Worker hanya bekerja di HTTPS**
   - GitHub Pages sudah menggunakan HTTPS
   - Localhost juga dianggap aman untuk development

2. **Service Worker Scope**
   - Scope harus sesuai dengan base path aplikasi
   - Untuk GitHub Pages: `/story-app/`
   - Untuk root domain: `/`

3. **Browser Support**
   - Chrome/Edge: Full support
   - Firefox: Full support
   - Safari: Full support (iOS 11.3+)
   - Opera: Full support

4. **Service Worker Lifecycle**
   - Installing → Installed → Activating → Activated
   - Service worker lama akan menjadi "redundant" setelah yang baru diaktifkan

