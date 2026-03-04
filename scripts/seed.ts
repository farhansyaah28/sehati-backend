/**
 * SEHATI - Seed Script
 * Membuat data awal di Firebase Auth + Firestore untuk testing
 *
 * Cara pakai:
 *   npx ts-node -r tsconfig-paths/register scripts/seed.ts
 *   atau: npm run seed
 */

import * as admin from 'firebase-admin';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load .env
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

// ─── Firebase Init ─────────────────────────────────────────────
const projectId = process.env.FIREBASE_PROJECT_ID;
const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;

if (!projectId || !privateKey || !clientEmail) {
  console.error('❌ Firebase credentials tidak lengkap di .env');
  process.exit(1);
}

admin.initializeApp({
  credential: admin.credential.cert({ projectId, privateKey, clientEmail }),
});

const db = admin.firestore();
const auth = admin.auth();

db.settings({ ignoreUndefinedProperties: true });

// ─── Data Seed ─────────────────────────────────────────────────
interface SeedUser {
  email: string;
  password: string;
  nama: string;
  role: 'admin' | 'guru' | 'siswa' | 'kantin';
  nis?: string;
  nip?: string;
  kelas?: string;
  coins?: number;
  streak?: number;
  phone?: string;
}

const seedUsers: SeedUser[] = [
  {
    email: 'admin@sehati.test',
    password: 'Admin123!',
    nama: 'Administrator SEHATI',
    role: 'admin',
    phone: '081234567890',
  },
  {
    email: 'guru1@sehati.test',
    password: 'Guru123!',
    nama: 'Budi Santoso',
    role: 'guru',
    nip: '198501012010011001',
    phone: '081234567891',
  },
  {
    email: 'guru2@sehati.test',
    password: 'Guru123!',
    nama: 'Siti Rahayu',
    role: 'guru',
    nip: '198801012012012001',
    phone: '081234567892',
  },
  {
    email: 'siswa1@sehati.test',
    password: 'Siswa123!',
    nama: 'Ahmad Fauzi',
    role: 'siswa',
    nis: '2024001',
    kelas: 'X-IPA-1',
    coins: 150,
    streak: 5,
  },
  {
    email: 'siswa2@sehati.test',
    password: 'Siswa123!',
    nama: 'Dewi Lestari',
    role: 'siswa',
    nis: '2024002',
    kelas: 'X-IPA-1',
    coins: 230,
    streak: 12,
  },
  {
    email: 'siswa3@sehati.test',
    password: 'Siswa123!',
    nama: 'Rizky Pratama',
    role: 'siswa',
    nis: '2024003',
    kelas: 'X-IPA-2',
    coins: 80,
    streak: 3,
  },
  {
    email: 'kantin1@sehati.test',
    password: 'Kantin123!',
    nama: 'Kantin Sehat',
    role: 'kantin',
    phone: '081234567893',
  },
];

// Kelas seed data
const seedKelas = [
  { id: 'X-IPA-1', nama: 'X IPA 1', tingkat: 'X', jurusan: 'IPA', waliKelas: '' },
  { id: 'X-IPA-2', nama: 'X IPA 2', tingkat: 'X', jurusan: 'IPA', waliKelas: '' },
  { id: 'XI-IPA-1', nama: 'XI IPA 1', tingkat: 'XI', jurusan: 'IPA', waliKelas: '' },
  { id: 'XI-IPS-1', nama: 'XI IPS 1', tingkat: 'XI', jurusan: 'IPS', waliKelas: '' },
];

// Jenis pelanggaran seed data
const seedJenisPelanggaran = [
  {
    id: 'JP001',
    nama: 'Membuang sampah sembarangan',
    kategori: 'ringan',
    coinsPenalty: 10,
    deskripsi: 'Siswa membuang sampah tidak pada tempatnya',
  },
  {
    id: 'JP002',
    nama: 'Tidak membawa tumbler',
    kategori: 'ringan',
    coinsPenalty: 5,
    deskripsi: 'Siswa tidak membawa tumbler ke sekolah',
  },
  {
    id: 'JP003',
    nama: 'Menggunakan plastik sekali pakai',
    kategori: 'sedang',
    coinsPenalty: 20,
    deskripsi: 'Siswa menggunakan plastik sekali pakai di lingkungan sekolah',
  },
  {
    id: 'JP004',
    nama: 'Merusak tanaman sekolah',
    kategori: 'berat',
    coinsPenalty: 50,
    deskripsi: 'Siswa merusak tanaman atau fasilitas hijau sekolah',
  },
];

// Produk kantin seed data
const seedProduk = [
  {
    nama: 'Nasi Goreng Spesial',
    harga: 15000,
    kategori: 'makanan',
    deskripsi: 'Nasi goreng dengan telur dan sayuran segar',
    stok: 50,
    gambar: null,
  },
  {
    nama: 'Es Teh Manis',
    harga: 5000,
    kategori: 'minuman',
    deskripsi: 'Teh manis segar dengan es batu',
    stok: 100,
    gambar: null,
  },
  {
    nama: 'Roti Bakar Cokelat',
    harga: 8000,
    kategori: 'makanan',
    deskripsi: 'Roti bakar dengan isian cokelat leleh',
    stok: 30,
    gambar: null,
  },
  {
    nama: 'Jus Jeruk Segar',
    harga: 10000,
    kategori: 'minuman',
    deskripsi: 'Jus jeruk segar tanpa gula tambahan',
    stok: 40,
    gambar: null,
  },
];

// Voucher seed data
const seedVouchers = [
  {
    nama: 'Voucher Nasi Goreng',
    deskripsi: 'Gratis 1 porsi nasi goreng spesial',
    coinsRequired: 100,
    tipe: 'diskon',
    nilai: 15000,
    kuota: 20,
    kuotaTerpakai: 0,
    isActive: true,
  },
  {
    nama: 'Diskon 50% Minuman',
    deskripsi: 'Diskon 50% untuk semua minuman',
    coinsRequired: 50,
    tipe: 'diskon',
    nilai: 50, // persentase
    kuota: 50,
    kuotaTerpakai: 0,
    isActive: true,
  },
  {
    nama: 'Voucher Roti Bakar',
    deskripsi: 'Gratis 1 roti bakar cokelat',
    coinsRequired: 75,
    tipe: 'gratis',
    nilai: 8000,
    kuota: 15,
    kuotaTerpakai: 0,
    isActive: true,
  },
];

// Settings seed data
const seedSettings = {
  coinsPerAbsensi: 10,
  streakBonusPercentage: 50,
  streakDays: 7,
  coinToRupiahRate: 100,
  maxCoinsPerDay: 50,
  schoolName: 'SMA Negeri 1 SEHATI',
  schoolYear: '2024/2025',
  semester: 'Genap',
};

// ─── Seed Functions ────────────────────────────────────────────

async function createUser(user: SeedUser): Promise<string> {
  let uid: string;

  try {
    // Cek apakah user sudah ada berdasarkan email
    const existingUser = await auth.getUserByEmail(user.email);
    uid = existingUser.uid;
    console.log(`  ⚡ User sudah ada: ${user.email} (${uid})`);
  } catch {
    // User belum ada, buat baru
    const userRecord = await auth.createUser({
      email: user.email,
      password: user.password,
      displayName: user.nama,
      emailVerified: true,
    });
    uid = userRecord.uid;
    console.log(`  ✅ User dibuat: ${user.email} (${uid})`);
  }

  // Set/update custom claims
  await auth.setCustomUserClaims(uid, { role: user.role });

  // Simpan/update data di Firestore
  const now = admin.firestore.FieldValue.serverTimestamp();
  await db
    .collection('users')
    .doc(uid)
    .set(
      {
        uid,
        email: user.email,
        nama: user.nama,
        role: user.role,
        isActive: true,
        nis: user.nis || null,
        nip: user.nip || null,
        kelas: user.kelas || null,
        phone: user.phone || null,
        coins: user.coins ?? 0,
        streak: user.streak ?? 0,
        lastAbsensi: null,
        totalAbsensi: 0,
        totalPelanggaran: 0,
        createdAt: now,
        updatedAt: now,
      },
      { merge: true },
    );

  return uid;
}

async function seedKelasData(): Promise<void> {
  console.log('\n📚 Membuat data kelas...');
  const batch = db.batch();

  for (const kelas of seedKelas) {
    const ref = db.collection('kelas').doc(kelas.id);
    batch.set(
      ref,
      {
        ...kelas,
        jumlahSiswa: 0,
        isActive: true,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true },
    );
    console.log(`  ✅ Kelas: ${kelas.nama}`);
  }

  await batch.commit();
}

async function seedJenisPelanggaranData(): Promise<void> {
  console.log('\n⚠️ Membuat data jenis pelanggaran...');
  const batch = db.batch();

  for (const jp of seedJenisPelanggaran) {
    const ref = db.collection('jenis_pelanggaran').doc(jp.id);
    batch.set(
      ref,
      {
        ...jp,
        isActive: true,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true },
    );
    console.log(`  ✅ Jenis Pelanggaran: ${jp.nama} (-${jp.coinsPenalty} coins)`);
  }

  await batch.commit();
}

async function seedProdukData(kantinUid: string): Promise<void> {
  console.log('\n🍽️ Membuat data produk kantin...');
  const batch = db.batch();

  for (const produk of seedProduk) {
    const ref = db.collection('produk').doc();
    batch.set(ref, {
      ...produk,
      kantinId: kantinUid,
      isActive: true,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    console.log(`  ✅ Produk: ${produk.nama} - Rp${produk.harga.toLocaleString()}`);
  }

  await batch.commit();
}

async function seedVoucherData(): Promise<void> {
  console.log('\n🎫 Membuat data voucher...');
  const batch = db.batch();

  for (const voucher of seedVouchers) {
    const ref = db.collection('vouchers').doc();
    batch.set(ref, {
      ...voucher,
      expiredAt: admin.firestore.Timestamp.fromDate(
        new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 hari dari sekarang
      ),
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    console.log(`  ✅ Voucher: ${voucher.nama} (${voucher.coinsRequired} coins)`);
  }

  await batch.commit();
}

async function seedSettingsData(): Promise<void> {
  console.log('\n⚙️ Membuat data settings...');
  await db
    .collection('settings')
    .doc('app')
    .set(
      {
        ...seedSettings,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true },
    );
  console.log('  ✅ Settings berhasil disimpan');
}

async function updateKelasCount(): Promise<void> {
  console.log('\n📊 Menghitung jumlah siswa per kelas...');
  for (const kelas of seedKelas) {
    const siswaSnap = await db
      .collection('users')
      .where('kelas', '==', kelas.id)
      .where('role', '==', 'siswa')
      .where('isActive', '==', true)
      .get();

    await db.collection('kelas').doc(kelas.id).update({
      jumlahSiswa: siswaSnap.size,
    });
    console.log(`  📋 ${kelas.nama}: ${siswaSnap.size} siswa`);
  }
}

// ─── Main ──────────────────────────────────────────────────────

async function main() {
  console.log('🌱 SEHATI - Seed Script');
  console.log('========================\n');
  console.log(`📡 Project: ${projectId}`);

  let kantinUid = '';

  // 1. Buat users
  console.log('\n👤 Membuat users...');
  for (const user of seedUsers) {
    const uid = await createUser(user);
    if (user.role === 'kantin') {
      kantinUid = uid;
    }
  }

  // 2. Assign wali kelas ke guru
  const guruSnap = await db
    .collection('users')
    .where('role', '==', 'guru')
    .where('isActive', '==', true)
    .limit(2)
    .get();

  const guruUids = guruSnap.docs.map((d) => d.id);
  if (guruUids.length >= 2) {
    seedKelas[0].waliKelas = guruUids[0]; // X-IPA-1 → guru1
    seedKelas[1].waliKelas = guruUids[1]; // X-IPA-2 → guru2
  }

  // 3. Seed data lainnya
  await seedKelasData();
  await seedJenisPelanggaranData();
  await seedProdukData(kantinUid);
  await seedVoucherData();
  await seedSettingsData();
  await updateKelasCount();

  console.log('\n════════════════════════════════════════');
  console.log('🎉 Seed selesai!');
  console.log('════════════════════════════════════════');
  console.log('\n📝 Akun yang tersedia:');
  console.log('────────────────────────────────────────');
  seedUsers.forEach((u) => {
    console.log(`  ${u.role.padEnd(8)} | ${u.email.padEnd(25)} | ${u.password}`);
  });
  console.log('────────────────────────────────────────');
  console.log('\n💡 Gunakan scripts/get-token.ts untuk mendapatkan ID Token');
  console.log('   npm run get-token -- admin@sehati.test Admin123!\n');

  process.exit(0);
}

main().catch((err) => {
  console.error('❌ Seed gagal:', err);
  process.exit(1);
});
