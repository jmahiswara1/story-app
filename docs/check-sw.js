/**
 * Script untuk mengecek Service Worker
 * Copy-paste script ini ke Console browser (F12 > Console)
 */

console.log("🔍 Memeriksa Service Worker...\n");

// 1. Cek apakah Service Worker didukung
console.log("1️⃣  Dukungan Service Worker:");
if ("serviceWorker" in navigator) {
  console.log("   ✅ Service Worker didukung oleh browser ini");
} else {
  console.error("   ❌ Service Worker TIDAK didukung oleh browser ini");
  console.error("   Gunakan browser modern (Chrome, Edge, Firefox, Safari)");
}

// 2. Cek registrations
console.log("\n2️⃣  Service Worker Registrations:");
navigator.serviceWorker
  .getRegistrations()
  .then((registrations) => {
    if (registrations.length === 0) {
      console.error("   ❌ TIDAK ADA service worker yang terdaftar!");
      console.error("   Solusi:");
      console.error("   1. Refresh halaman (F5)");
      console.error("   2. Periksa apakah file sw.js dapat diakses");
      console.error("   3. Periksa Console untuk error");
    } else {
      console.log(
        `   ✅ Ditemukan ${registrations.length} service worker(s):\n`
      );
      registrations.forEach((reg, index) => {
        console.log(`   Service Worker ${index + 1}:`);
        console.log(`   - Scope: ${reg.scope}`);
        console.log(`   - Active State: ${reg.active?.state || "null"}`);
        console.log(
          `   - Installing State: ${reg.installing?.state || "null"}`
        );
        console.log(`   - Waiting State: ${reg.waiting?.state || "null"}`);

        if (reg.active?.state === "activated") {
          console.log("   ✅ Status: ACTIVATED (Berjalan dengan baik)");
        } else if (reg.installing?.state === "installing") {
          console.log("   ⏳ Status: INSTALLING (Masih dalam proses)");
        } else if (reg.waiting?.state === "installed") {
          console.log("   ⏸️  Status: WAITING (Menunggu aktivasi)");
        } else {
          console.log("   ⚠️  Status: Tidak diketahui");
        }
        console.log("");
      });
    }
  })
  .catch((error) => {
    console.error("   ❌ Error mendapatkan registrations:", error);
  });

// 3. Cek service worker ready
console.log("3️⃣  Service Worker Ready:");
navigator.serviceWorker.ready
  .then((registration) => {
    console.log("   ✅ Service Worker siap digunakan");
    console.log(`   - Scope: ${registration.scope}`);
    console.log(
      `   - Update Found: ${registration.updatefound ? "Ya" : "Tidak"}`
    );

    // Cek push manager
    if ("PushManager" in window) {
      console.log("   ✅ Push Manager didukung");

      // Cek subscription
      return registration.pushManager.getSubscription();
    } else {
      console.error("   ❌ Push Manager TIDAK didukung");
      return null;
    }
  })
  .then((subscription) => {
    if (subscription) {
      console.log("   ✅ Push Subscription aktif");
      console.log(
        `   - Endpoint: ${subscription.endpoint.substring(0, 50)}...`
      );
    } else {
      console.log("   ℹ️  Belum ada Push Subscription");
      console.log('   (Gunakan tombol "Aktifkan Notifikasi" untuk subscribe)');
    }
  })
  .catch((error) => {
    console.error("   ❌ Service Worker belum siap:", error);
    console.error("   Solusi:");
    console.error("   1. Refresh halaman (F5)");
    console.error("   2. Periksa apakah aplikasi diakses melalui HTTPS");
    console.error("   3. Periksa Console untuk error lainnya");
  });

// 4. Cek cache storage
console.log("\n4️⃣  Cache Storage:");
if ("caches" in window) {
  caches
    .keys()
    .then((cacheNames) => {
      if (cacheNames.length === 0) {
        console.log("   ℹ️  Tidak ada cache yang ditemukan");
      } else {
        console.log(`   ✅ Ditemukan ${cacheNames.length} cache(s):`);
        cacheNames.forEach((cacheName) => {
          console.log(`   - ${cacheName}`);
        });
      }
    })
    .catch((error) => {
      console.error("   ❌ Error mendapatkan cache:", error);
    });
} else {
  console.error("   ❌ Cache API tidak didukung");
}

// 5. Cek notification permission
console.log("\n5️⃣  Notification Permission:");
if ("Notification" in window) {
  const permission = Notification.permission;
  console.log(`   Permission: ${permission}`);

  if (permission === "granted") {
    console.log("   ✅ Izin notifikasi telah diberikan");
  } else if (permission === "denied") {
    console.error("   ❌ Izin notifikasi ditolak");
    console.error("   Solusi: Aktifkan di pengaturan browser");
  } else {
    console.log("   ℹ️  Izin notifikasi belum diminta");
    console.log('   (Akan diminta saat mengklik "Aktifkan Notifikasi")');
  }
} else {
  console.error("   ❌ Notification API tidak didukung");
}

// 6. Test service worker file accessibility
console.log("\n6️⃣  Test Akses File sw.js:");
const swPath = window.location.pathname.replace(/\/[^/]*$/, "") + "/sw.js";
const swUrl = new URL(swPath, window.location.origin).href;
console.log(`   URL: ${swUrl}`);

fetch(swUrl, { method: "HEAD" })
  .then((response) => {
    if (response.ok) {
      console.log("   ✅ File sw.js dapat diakses");
      console.log(`   - Status: ${response.status} ${response.statusText}`);
      console.log(`   - Content-Type: ${response.headers.get("Content-Type")}`);
    } else {
      console.error(
        `   ❌ File sw.js tidak dapat diakses: ${response.status} ${response.statusText}`
      );
    }
  })
  .catch((error) => {
    console.error("   ❌ Error mengakses file sw.js:", error.message);
  });

console.log("\n✨ Pemeriksaan selesai!");
console.log("💡 Tips:");
console.log(
  "   - Buka DevTools > Application > Service Workers untuk melihat detail"
);
console.log("   - Buka DevTools > Console untuk melihat error (jika ada)");
console.log("   - Buka DevTools > Network untuk melihat request ke sw.js");
