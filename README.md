# SEHATI Backend

**SEHATI (Sekolah Hijau dan Anti Plastik)** merupakan aplikasi manajemen insentif ramah lingkungan yang dirancang untuk mendukung penerapan kebiasaan mengurangi penggunaan plastik di lingkungan sekolah.

Repository ini berisi implementasi **Back-End SEHATI** yang dikembangkan menggunakan NestJS, TypeScript, dan Firebase Cloud Firestore. Back-end menyediakan REST API untuk mendukung pengelolaan data pengguna, pencatatan kehadiran membawa tumbler, pengelolaan pelanggaran, transaksi kantin, serta sistem penghargaan bagi siswa.

## Gambaran Umum

SEHATI dikembangkan sebagai sistem pendukung program sekolah ramah lingkungan dan anti plastik. Aplikasi ini membantu proses pencatatan serta pengelolaan aktivitas yang berkaitan dengan penerapan kebiasaan ramah lingkungan di sekolah.

Repository ini berfokus pada pengembangan sisi back-end, yang bertanggung jawab dalam menyediakan layanan API, mengelola data, menangani autentikasi, dan mengatur hak akses pengguna berdasarkan perannya.

## Teknologi yang Digunakan

- **Framework:** NestJS 11
- **Bahasa Pemrograman:** TypeScript
- **Database:** Firebase Cloud Firestore
- **Autentikasi:** Firebase Authentication
- **Arsitektur API:** REST API
- **Package Manager:** npm
- **Runtime:** Node.js

## Fitur Utama

- **Autentikasi dan Otorisasi** — Menggunakan Firebase Authentication serta pengaturan hak akses berdasarkan peran pengguna.
- **Manajemen Pengguna** — Menyediakan layanan untuk pengelolaan data pengguna aplikasi.
- **Absensi Tumbler** — Mendukung pencatatan dan pengelolaan kehadiran siswa yang membawa tumbler.
- **Manajemen Pelanggaran** — Mengelola data pelanggaran serta jenis pelanggaran terkait program lingkungan.
- **Manajemen Produk** — Menyediakan layanan pengelolaan produk kantin.
- **Manajemen Transaksi** — Mendukung pencatatan transaksi kantin.
- **Manajemen Voucher** — Mengelola informasi voucher dan penukaran voucher.
- **Leaderboard** — Menyediakan layanan yang berkaitan dengan papan peringkat.
- **Pengaturan Aplikasi** — Mengelola data pengaturan aplikasi.

## Hak Akses Pengguna

Back-end SEHATI mendukung empat peran pengguna:

| Peran | Deskripsi |
|---|---|
| `admin` | Memiliki akses terhadap fungsi administratif dan pengelolaan data aplikasi. |
| `guru` | Memiliki akses terhadap fungsi yang berkaitan dengan aktivitas guru, termasuk pemantauan siswa. |
| `siswa` | Memiliki akses terhadap fungsi yang berkaitan dengan aktivitas siswa. |
| `kantin` | Memiliki akses terhadap fungsi pengelolaan kantin. |

Pembatasan akses terhadap endpoint dilakukan menggunakan mekanisme autentikasi dan otorisasi berdasarkan peran pengguna.

## Struktur Proyek

Aplikasi dikembangkan menggunakan arsitektur modular NestJS untuk memisahkan fungsi berdasarkan modul dan tanggung jawabnya.

```text
sehati-backend/
├── src/
│   ├── admin/
│   ├── auth/
│   ├── guru/
│   ├── kantin/
│   ├── leaderboard/
│   ├── siswa/
│   ├── users/
│   ├── settings/
│   ├── common/
│   ├── app.module.ts
│   └── main.ts
├── scripts/
│   ├── seed.ts
│   └── get-token.ts
├── test/
├── API-DOCS.md
├── .env.example
├── package.json
└── README.md
```

## Autentikasi dan Otorisasi

SEHATI menggunakan **Firebase Authentication** untuk proses autentikasi pengguna.

Setelah berhasil melakukan autentikasi, aplikasi klien memperoleh Firebase ID Token. Token tersebut kemudian dikirimkan melalui HTTP Authorization Header ketika mengakses endpoint yang memerlukan autentikasi.

Contoh penggunaan header:

```http
Authorization: Bearer <firebase-id-token>
```

Pada sisi back-end, token divalidasi menggunakan `FirebaseAuthGuard`. Selanjutnya, pembatasan hak akses berdasarkan peran pengguna diterapkan melalui `RolesGuard` dan decorator `@Roles`.

## Konfigurasi API

Back-end SEHATI menggunakan konfigurasi API sebagai berikut:

- **Prefix API:** `/api/v1`
- **Health Check:** `GET /api/v1/health`

Contoh permintaan:

```http
GET /api/v1/health
```

Informasi mengenai endpoint API dapat dilihat pada file [`API-DOCS.md`](./API-DOCS.md).

> Catatan: Dokumentasi endpoint dikelola secara terpisah dan perlu disesuaikan dengan implementasi controller terbaru.

## Struktur Database

SEHATI menggunakan Firebase Cloud Firestore sebagai basis data untuk menyimpan informasi aplikasi.

Berikut merupakan koleksi Firestore yang digunakan dalam implementasi back-end:

| Koleksi | Keterangan |
|---|---|
| `users` | Menyimpan informasi pengguna dan perannya. |
| `absensi` | Menyimpan data pencatatan absensi siswa. |
| `pelanggaran` | Menyimpan data pelanggaran terkait program lingkungan. |
| `jenis_pelanggaran` | Menyimpan kategori atau jenis pelanggaran. |
| `kelas` | Menyimpan informasi kelas. |
| `produk` | Menyimpan data produk kantin. |
| `transaksi` | Menyimpan data transaksi. |
| `vouchers` | Menyimpan informasi voucher. |
| `voucher_redemptions` | Menyimpan data penukaran voucher. |
| `settings` | Menyimpan pengaturan aplikasi. |

## Instalasi dan Menjalankan Proyek

### Persyaratan

Pastikan perangkat telah memiliki:

- Node.js
- npm
- Firebase Project yang telah mengaktifkan Firebase Authentication dan Cloud Firestore.

### 1. Clone Repository

```bash
git clone https://github.com/farhansyaah28/sehati-backend.git
cd sehati-backend
```

### 2. Instal Dependensi

```bash
npm install
```

### 3. Konfigurasi Environment Variable

Buat file `.env` berdasarkan file contoh yang tersedia:

```bash
cp .env.example .env
```

Sesuaikan konfigurasi kredensial Firebase dan variabel lingkungan lainnya dengan konfigurasi Firebase Project yang digunakan.

**Penting:** Jangan mengunggah private key, kredensial service account, access token, atau informasi sensitif lainnya ke repository publik.

### 4. Menjalankan Aplikasi

Mode pengembangan:

```bash
npm run start:dev
```

Mode produksi:

```bash
npm run build
npm run start:prod
```

Aplikasi akan berjalan menggunakan port yang telah ditentukan dalam konfigurasi.

## Daftar Perintah yang Tersedia

| Perintah | Keterangan |
|---|---|
| `npm run start` | Menjalankan aplikasi. |
| `npm run start:dev` | Menjalankan aplikasi dalam mode pengembangan dengan watch mode. |
| `npm run start:debug` | Menjalankan aplikasi dalam mode debug. |
| `npm run start:prod` | Menjalankan aplikasi hasil build untuk produksi. |
| `npm run build` | Melakukan proses build aplikasi. |
| `npm run lint` | Menjalankan ESLint. |
| `npm run format` | Melakukan pemformatan kode. |
| `npm run test` | Menjalankan unit test. |
| `npm run test:e2e` | Menjalankan end-to-end test. |
| `npm run test:cov` | Menjalankan pengujian dengan laporan coverage. |
| `npm run seed` | Menjalankan script untuk mengisi data awal. |
| `npm run get-token` | Menjalankan utilitas untuk memperoleh token Firebase. |

## Validasi dan Penanganan Error

Implementasi back-end memanfaatkan beberapa fitur NestJS untuk menangani permintaan dan respons API, antara lain:

- **Global ValidationPipe** — Melakukan validasi terhadap data permintaan yang diterima API.
- **Global Exception Filter** — Menangani exception atau kesalahan selama proses permintaan.
- **Response Transformation Interceptor** — Mengatur transformasi format respons API.

Komponen tersebut digunakan untuk mendukung proses penanganan permintaan dan respons pada aplikasi.

## Pengujian

Repository ini menyediakan konfigurasi untuk pengujian unit dan end-to-end.

Menjalankan unit test:

```bash
npm run test
```

Menjalankan end-to-end test:

```bash
npm run test:e2e
```

Menjalankan pengujian dengan laporan coverage:

```bash
npm run test:cov
```

Hasil pengujian perlu diverifikasi pada lingkungan pengembangan sebelum dinyatakan berhasil.

## Dokumentasi API

Dokumentasi endpoint API tersedia pada file:

[`API-DOCS.md`](./API-DOCS.md)

Dokumentasi tersebut berisi informasi mengenai endpoint serta detail permintaan API. Dokumentasi perlu diperbarui secara berkala agar tetap sesuai dengan implementasi controller terbaru.

## Keamanan

Beberapa hal yang perlu diperhatikan dalam pengelolaan aplikasi:

- Menggunakan Firebase ID Token untuk autentikasi permintaan API yang dilindungi.
- Menerapkan pembatasan hak akses berdasarkan peran pengguna.
- Menjaga kerahasiaan kredensial Firebase Service Account.
- Tidak mengunggah informasi sensitif melalui file konfigurasi ke repository publik.
- Tidak mencantumkan kredensial akun pengujian atau konfigurasi rahasia dalam dokumentasi publik.

## Lisensi

Repository ini belum mencantumkan lisensi secara khusus.
