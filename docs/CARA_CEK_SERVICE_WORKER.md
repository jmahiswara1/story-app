# 🚀 Cara Cek Service Worker di DevTools

## Metode 1: Melalui Tab Application (Paling Mudah) ⭐

### Langkah-langkah:

1. **Buka Aplikasi**
   ```
   https://jmahiswara1.github.io/story-app/
   ```

2. **Buka DevTools**
   - Tekan `F12` atau `Ctrl + Shift + I` (Windows/Linux)
   - Tekan `Cmd + Option + I` (Mac)
   - Atau klik kanan > "Inspect"

3. **Buka Tab Application**
   - Klik tab **"Application"** di bagian atas DevTools
   - Di panel kiri, klik **"Service Workers"**

4. **Lihat Status**
   - ✅ **Baik**: Status menunjukkan "activated and is running" (hijau)
   - ❌ **Buruk**: Tidak ada service worker atau status error

### Screenshot yang Diinginkan:

```
Application
├── Service Workers
│   └── https://jmahiswara1.github.io/story-app/sw.js
│       Status: ● activated and is running
│       Source: /story-app/sw.js
│       Scope: /story-app/
│       [Update] [Unregister]
```

---

## Metode 2: Menggunakan Script JavaScript (Untuk Debugging) 🔧

### Langkah-langkah:

1. **Buka Console**
   - Tekan `F12` untuk membuka DevTools
   - Klik tab **"Console"**

2. **Copy-Paste Script**
   - Buka file `docs/check-sw.js`
   - Copy semua isinya
   - Paste ke Console
   - Tekan Enter

3. **Lihat Hasil**
   - Script akan menampilkan informasi lengkap tentang service worker
   - ✅ = Berfungsi dengan baik
   - ❌ = Ada masalah

### Script Quick Check (Copy-paste ini):

```javascript
// Quick check service worker
navigator.serviceWorker.getRegistrations().then(regs => {
  if (regs.length === 0) {
    console.error('❌ Tidak ada service worker');
  } else {
    regs.forEach(reg => {
      console.log('✅ Service Worker:', reg.scope);
      console.log('   Status:', reg.active?.state || 'Tidak aktif');
    });
  }
});
```

---

## Metode 3: Melalui Network Tab 📡

### Langkah-langkah:

1. **Buka Network Tab**
   - Tekan `F12` untuk membuka DevTools
   - Klik tab **"Network"**

2. **Refresh Halaman**
   - Tekan `F5` untuk refresh
   - Filter dengan kata kunci: `sw.js`

3. **Periksa Request**
   - ✅ **Baik**: Status `200 OK` (file berhasil dimuat)
   - ❌ **Buruk**: Status `404 Not Found` (file tidak ditemukan)

---

## Troubleshooting 🔍

### Problem 1: Service Worker Tidak Terdaftar

**Solusi:**
1. Refresh halaman (`F5`)
2. Periksa Console untuk error
3. Pastikan file `sw.js` dapat diakses:
   - Buka: `https://jmahiswara1.github.io/story-app/sw.js`
   - Harus menampilkan kode JavaScript

### Problem 2: Status "Redundant"

**Solusi:**
1. Klik tombol **"Unregister"** pada service worker
2. Refresh halaman
3. Service worker baru akan terdaftar

### Problem 3: Status "Installing"

**Solusi:**
1. Tunggu beberapa detik
2. Jika masih "installing", periksa Console untuk error
3. Periksa Network tab untuk melihat apakah `sw.js` berhasil dimuat

---

## Checklist ✅

Gunakan checklist ini untuk memastikan service worker berfungsi:

- [ ] Service worker terdaftar di DevTools > Application > Service Workers
- [ ] Status: "activated and is running"
- [ ] File `sw.js` dapat diakses (status 200 di Network tab)
- [ ] Console tidak menampilkan error
- [ ] Cache Storage berisi cache yang dibuat service worker

---

## Quick Reference 🎯

### Status Service Worker:

| Status | Arti | Tindakan |
|--------|------|----------|
| ✅ activated and is running | Berjalan dengan baik | Tidak perlu tindakan |
| ⏳ installing | Masih dalam proses instalasi | Tunggu beberapa detik |
| ⏸️ waiting | Menunggu aktivasi | Refresh halaman |
| ❌ redundant | Service worker lama | Unregister dan refresh |
| ❌ Tidak ada | Service worker tidak terdaftar | Periksa error di Console |

### Lokasi File Service Worker:

- **Development**: `http://localhost:9000/sw.js`
- **Production**: `https://jmahiswara1.github.io/story-app/sw.js`

---

## Video Tutorial (Referensi) 🎥

Cari di YouTube dengan kata kunci:
- "How to check service worker Chrome DevTools"
- "Service worker debugging tutorial"
- "PWA service worker inspection"

---

## Butuh Bantuan? 💬

Jika masih bermasalah:

1. **Periksa Console** untuk error message
2. **Periksa Network** tab untuk melihat request ke `sw.js`
3. **Periksa Application** > **Service Workers** untuk status detail
4. **Gunakan script** di `docs/check-sw.js` untuk debugging lengkap

---

## Catatan Penting 📝

1. **Service Worker hanya bekerja di HTTPS**
   - GitHub Pages sudah menggunakan HTTPS ✅
   - Localhost juga dianggap aman untuk development ✅

2. **Browser Support**
   - Chrome/Edge: Full support ✅
   - Firefox: Full support ✅
   - Safari: Full support (iOS 11.3+) ✅

3. **Service Worker Lifecycle**
   - Installing → Installed → Activating → Activated
   - Service worker lama akan menjadi "redundant" setelah yang baru diaktifkan

---

**Selamat debugging! 🚀**

