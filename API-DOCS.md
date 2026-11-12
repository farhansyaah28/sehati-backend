# SEHATI Backend - API Documentation

## Informasi Umum

| Item | Detail |
|------|--------|
| Base URL (development) | `http://localhost:3000/api/v1` |
| Format Response | JSON |
| Authentication | Firebase ID Token (Bearer Token) |
| Firebase Project ID | `sehati-backend` |
| Firebase API Key | `AIzaSyDVk42NrphJxSXUlotehZXknt7UPQsRPjs` |

---

## Setup Firebase di Frontend

### 1. Install Firebase SDK
```bash
npm install firebase
```

### 2. Firebase Config
```javascript
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDVk42NrphJxSXUlotehZXknt7UPQsRPjs",
  authDomain: "sehati-backend.firebaseapp.com",
  projectId: "sehati-backend",
  storageBucket: "sehati-backend.firebasestorage.app",
  messagingSenderId: "64284287585",
  appId: "1:64284287585:web:2a8ae6a59c093b11830020"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
```

### 3. Login Flow
```javascript
import { signInWithEmailAndPassword } from "firebase/auth";

// Login
const userCredential = await signInWithEmailAndPassword(auth, email, password);
const idToken = await userCredential.user.getIdToken();

// Kirim ke backend
const response = await fetch("http://localhost:3000/api/v1/auth/login", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ idToken })
});
```

### 4. Request ke API (dengan Authorization)
```javascript
// Dapatkan token terbaru (auto-refresh jika expired)
const idToken = await auth.currentUser.getIdToken(true);

// Contoh request
const response = await fetch("http://localhost:3000/api/v1/siswa/dashboard", {
  headers: {
    "Authorization": `Bearer ${idToken}`,
    "Content-Type": "application/json"
  }
});
const data = await response.json();
```

### 5. Logout
```javascript
import { signOut } from "firebase/auth";

// Logout di backend dulu
await fetch("http://localhost:3000/api/v1/auth/logout", {
  method: "POST",
  headers: { "Authorization": `Bearer ${idToken}` }
});

// Logout di Firebase
await signOut(auth);
```

---

## Response Format

Semua endpoint mengembalikan format yang sama:

### Success
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Pesan sukses",
  "data": { ... },
  "timestamp": "2026-03-03T05:00:00.000Z"
}
```

### Error
```json
{
  "success": false,
  "statusCode": 400,
  "error": "Bad Request",
  "message": ["field tidak boleh kosong"],
  "timestamp": "2026-03-03T05:00:00.000Z",
  "path": "/api/v1/..."
}
```

---

## Roles (Hak Akses)

| Role | Deskripsi |
|------|-----------|
| `admin` | Kelola semua data (siswa, guru, kantin, kelas, voucher, laporan) |
| `guru` | Absensi, input pelanggaran, lihat data siswa |
| `siswa` | Lihat dashboard, coins, riwayat, voucher |
| `kantin` | Kelola produk, transaksi, scan siswa, validasi voucher |

---

## Endpoints

### Auth (`/auth`)

| Method | Endpoint | Auth | Body | Deskripsi |
|--------|----------|------|------|-----------|
| POST | `/auth/login` | ❌ | `{ idToken }` | Login dengan Firebase Token |
| GET | `/auth/me` | ✅ | - | Profil user saat ini |
| GET | `/auth/verify` | ✅ | - | Verifikasi token |
| POST | `/auth/logout` | ✅ | - | Logout |

---

### Siswa (`/siswa`) — Role: SISWA

| Method | Endpoint | Body / Params | Deskripsi |
|--------|----------|---------------|-----------|
| GET | `/siswa/dashboard` | - | Dashboard (coins, streak, ranking) |
| GET | `/siswa/pelanggaran` | - | Riwayat pelanggaran |
| GET | `/siswa/transaksi` | - | Riwayat transaksi |
| GET | `/siswa/voucher` | - | Voucher tersedia |

---

### Guru (`/guru`) — Role: GURU

| Method | Endpoint | Body / Params | Deskripsi |
|--------|----------|---------------|-----------|
| GET | `/guru/dashboard` | - | Dashboard guru |
| GET | `/guru/siswa` | Query: `kelas?`, `search?` | Daftar siswa |
| POST | `/guru/absensi/scan` | `{ nis }` | Scan NIS untuk absensi |
| POST | `/guru/absensi/manual` | `{ siswaId, keterangan? }` | Input absensi manual |
| GET | `/guru/absensi/check/:siswaId` | - | Cek status absensi hari ini |
| POST | `/guru/pelanggaran` | `{ siswaId, jenisPelanggaranId, keterangan?, buktiUrl? }` | Input pelanggaran |
| GET | `/guru/pelanggaran` | Query: `kelas?`, `startDate?`, `endDate?` | Daftar pelanggaran |
| GET | `/guru/pelanggaran/:id` | - | Detail pelanggaran |
| GET | `/guru/jenis-pelanggaran` | - | Daftar jenis pelanggaran |
| GET | `/guru/statistik-kelas` | - | Statistik per kelas |

---

### Kantin (`/kantin`) — Role: KANTIN

| Method | Endpoint | Body / Params | Deskripsi |
|--------|----------|---------------|-----------|
| GET | `/kantin/dashboard` | - | Dashboard kantin |
| GET | `/kantin/produk` | Query: `kategori?`, `search?` | Daftar produk |
| GET | `/kantin/produk/:id` | - | Detail produk |
| POST | `/kantin/produk` | `{ nama, harga, kategori?, deskripsi?, stock?, gambarUrl? }` | Tambah produk |
| PUT | `/kantin/produk/:id` | `{ nama?, harga?, ... }` | Update produk |
| DELETE | `/kantin/produk/:id` | - | Hapus produk |
| POST | `/kantin/scan` | `{ nis }` | Scan siswa (lihat data + voucher) |
| POST | `/kantin/transaksi` | `{ siswaId, items: [{produkId, qty}], voucherRedemptionId?, useCoins?, metodePembayaran? }` | Buat transaksi |
| GET | `/kantin/transaksi` | Query: `startDate?`, `endDate?` | Riwayat transaksi |
| GET | `/kantin/transaksi/:id` | - | Detail transaksi |
| POST | `/kantin/voucher/redeem` | `{ siswaId, voucherId }` | Tukar coins → voucher |
| POST | `/kantin/voucher/validasi` | `{ voucherRedemptionId, siswaId }` | Validasi voucher |

---

### Leaderboard (`/leaderboard`) — Semua role

| Method | Endpoint | Body / Params | Deskripsi |
|--------|----------|---------------|-----------|
| GET | `/leaderboard/sekolah` | Query: `limit?` | Leaderboard sekolah |
| GET | `/leaderboard/kelas/:kelasId` | Query: `limit?` | Leaderboard per kelas |
| GET | `/leaderboard/ranking-kelas` | - | Ranking antar kelas |

---

### Admin (`/admin`) — Role: ADMIN

#### Dashboard & Analytics
| Method | Endpoint | Params | Deskripsi |
|--------|----------|--------|-----------|
| GET | `/admin/dashboard` | - | Dashboard admin |
| GET | `/admin/analytics` | Query: `periode?` (minggu/bulan/tahun) | Analytics |

#### CRUD Siswa
| Method | Endpoint | Body | Deskripsi |
|--------|----------|------|-----------|
| GET | `/admin/siswa` | Query: `kelas?`, `search?` | Daftar siswa |
| GET | `/admin/siswa/:id` | - | Detail siswa |
| POST | `/admin/siswa` | `{ email, password, nama, role, nis?, kelas?, phone? }` | Tambah siswa |
| POST | `/admin/siswa/import` | `{ data: [{ nama, nis, email, kelas, ... }] }` | Import batch |
| PUT | `/admin/siswa/:id` | `{ nama?, email?, nis?, kelas?, phone? }` | Update siswa |
| DELETE | `/admin/siswa/:id` | - | Hapus siswa |

#### CRUD Guru
| Method | Endpoint | Body | Deskripsi |
|--------|----------|------|-----------|
| GET | `/admin/guru` | Query: `search?` | Daftar guru |
| GET | `/admin/guru/:id` | - | Detail guru |
| POST | `/admin/guru` | `{ email, password, nama, role, nip?, phone? }` | Tambah guru |
| PUT | `/admin/guru/:id` | `{ nama?, email?, nip?, phone? }` | Update guru |
| DELETE | `/admin/guru/:id` | - | Hapus guru |

#### CRUD Kantin
| Method | Endpoint | Body | Deskripsi |
|--------|----------|------|-----------|
| GET | `/admin/kantin` | Query: `search?` | Daftar akun kantin |
| GET | `/admin/kantin/:id` | - | Detail kantin |
| POST | `/admin/kantin` | `{ email, password, nama, role, phone? }` | Tambah kantin |
| PUT | `/admin/kantin/:id` | `{ nama?, email?, phone? }` | Update kantin |
| DELETE | `/admin/kantin/:id` | - | Hapus kantin |

#### CRUD Kelas
| Method | Endpoint | Body | Deskripsi |
|--------|----------|------|-----------|
| GET | `/admin/kelas` | - | Daftar kelas |
| GET | `/admin/kelas/:id` | - | Detail kelas |
| POST | `/admin/kelas` | `{ nama, tingkat, waliKelas?, tahunAjaran? }` | Tambah kelas |
| PUT | `/admin/kelas/:id` | `{ nama?, tingkat?, ... }` | Update kelas |
| DELETE | `/admin/kelas/:id` | - | Hapus kelas |

#### CRUD Voucher
| Method | Endpoint | Body | Deskripsi |
|--------|----------|------|-----------|
| GET | `/admin/voucher` | - | Daftar voucher |
| GET | `/admin/voucher/:id` | - | Detail voucher |
| POST | `/admin/voucher` | `{ nama, deskripsi?, discountAmount, coinsRequired, stock?, expiredAt? }` | Tambah voucher |
| POST | `/admin/voucher/distribute` | `{ voucherId, siswaIds: [] }` | Distribusi voucher |
| PUT | `/admin/voucher/:id` | `{ nama?, ... }` | Update voucher |
| DELETE | `/admin/voucher/:id` | - | Hapus voucher |

#### Laporan
| Method | Endpoint | Params | Deskripsi |
|--------|----------|--------|-----------|
| GET | `/admin/laporan/kepatuhan` | Query: `startDate?`, `endDate?`, `kelas?` | Laporan kepatuhan |
| GET | `/admin/laporan/pelanggaran` | Query: `startDate?`, `endDate?`, `kelas?` | Laporan pelanggaran |
| GET | `/admin/laporan/transaksi` | Query: `startDate?`, `endDate?` | Laporan transaksi |
| GET | `/admin/laporan/dampak-lingkungan` | Query: `startDate?`, `endDate?` | Dampak lingkungan |

---

### Settings (`/settings`) — Role: ADMIN

| Method | Endpoint | Body | Deskripsi |
|--------|----------|------|-----------|
| GET | `/settings` | - | Get settings |
| PUT | `/settings` | `{ coinsPerAbsensi?, streakBonusPercentage?, streakDays?, coinToRupiahRate? }` | Update settings |

---

## Tips untuk Frontend Developer

1. **Token Management**: Gunakan `onAuthStateChanged` dan `getIdToken(true)` untuk auto-refresh token
2. **Error Handling**: Cek `success` field di response, tampilkan `message` ke user
3. **Role-based Routing**: Redirect user ke dashboard sesuai role setelah login
4. **Real-time**: Bisa tambahkan Firestore listener di frontend untuk data real-time (optional)

## Menjalankan Backend

```bash
cd sehati-backend
npm install --legacy-peer-deps
npm run start:dev
```

Server berjalan di `http://localhost:3000`
