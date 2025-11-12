# Cara Memeriksa Service Worker di DevTools

## Langkah-langkah:

### 1. Buka Aplikasi di Browser
- Buka aplikasi di GitHub Pages: `https://jmahiswara1.github.io/story-app/`
- Pastikan menggunakan browser modern (Chrome, Edge, Firefox)

### 2. Buka Developer Tools (DevTools)
- **Windows/Linux**: Tekan `F12` atau `Ctrl + Shift + I`
- **Mac**: Tekan `Cmd + Option + I`
- Atau klik kanan pada halaman > "Inspect" / "Periksa Elemen"

### 3. Buka Tab "Application"
- Di bagian atas DevTools, klik tab **"Application"**
- Jika tidak terlihat, klik ikon `>>` untuk melihat tab tersembunyi

### 4. Periksa Service Workers
- Di panel kiri, expand menu **"Service Workers"** (di bawah "Application")
- Anda akan melihat informasi service worker yang terdaftar

### 5. Verifikasi Status Service Worker
Lihat informasi berikut:

#### Status yang Diinginkan:
- **Status**: "activated and is running" (hijau)
- **Source**: `/story-app/sw.js` atau `/sw.js`
- **Scope**: `/story-app/` atau `/`

#### Jika Service Worker Tidak Terdaftar:
- Tidak ada service worker yang terlihat
- Atau status menunjukkan error

### 6. Periksa Console untuk Error
- Klik tab **"Console"** di DevTools
- Lihat apakah ada error terkait service worker
- Error biasanya dimulai dengan: "Service Worker registration failed"

## Troubleshooting:

### Jika Service Worker Tidak Terdaftar:

1. **Refresh Halaman**
   - Tekan `F5` atau `Ctrl + R`
   - Atau hard refresh: `Ctrl + Shift + R`

2. **Unregister Service Worker Lama**
   - Di tab "Application" > "Service Workers"
   - Klik "Unregister" pada service worker yang ada
   - Refresh halaman

3. **Clear Cache**
   - Di tab "Application" > "Storage"
   - Klik "Clear site data"
   - Refresh halaman

4. **Periksa File sw.js**
   - Pastikan file `sw.js` ada di folder `dist/`
   - Pastikan file dapat diakses: `https://jmahiswara1.github.io/story-app/sw.js`

5. **Periksa Console untuk Error**
   - Buka tab "Console"
   - Lihat error message
   - Error umum:
     - "Failed to register a ServiceWorker"
     - "ServiceWorker script fetch failed"
     - "The script has an unsupported MIME type"

## Screenshot yang Diinginkan:

Di tab "Application" > "Service Workers", Anda harus melihat:

```
Service Workers
├── https://jmahiswara1.github.io/story-app/sw.js
│   Status: activated and is running
│   Source: /story-app/sw.js
│   Scope: /story-app/
│   [Update] [Unregister]
```

## Catatan Penting:

- Service Worker hanya bekerja di **HTTPS** (GitHub Pages sudah HTTPS)
- Service Worker hanya bekerja di browser modern
- Service Worker harus di-reload setelah perubahan kode
- Service Worker scope harus sesuai dengan base path aplikasi

## Testing Service Worker:

1. **Test Registration**
   - Buka Console
   - Ketik: `navigator.serviceWorker.getRegistrations()`
   - Enter
   - Anda akan melihat array registrations

2. **Test Cache**
   - Di tab "Application" > "Cache Storage"
   - Anda akan melihat cache yang dibuat service worker
   - Cache names: `story-app-v1`, `story-app-runtime-v1`, `story-app-api-v1`

3. **Test Push Notifications**
   - Di tab "Application" > "Service Workers"
   - Klik "Push" untuk mengirim test notification
   - Atau gunakan tombol "Aktifkan Notifikasi" di aplikasi

## Jika Masih Bermasalah:

1. Periksa Network tab untuk melihat apakah `sw.js` berhasil dimuat
2. Periksa apakah ada error CORS
3. Pastikan file `sw.js` tidak memiliki syntax error
4. Cek apakah service worker scope sesuai dengan base path

