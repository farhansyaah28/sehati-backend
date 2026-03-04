/**
 * SEHATI - Get Firebase ID Token
 * Mendapatkan Firebase ID Token untuk testing di Postman
 *
 * Cara pakai:
 *   npx ts-node scripts/get-token.ts <email> <password>
 *   atau: npm run get-token -- <email> <password>
 *
 * Contoh:
 *   npm run get-token -- admin@sehati.test Admin123!
 *   npm run get-token -- guru1@sehati.test Guru123!
 *   npm run get-token -- siswa1@sehati.test Siswa123!
 *   npm run get-token -- kantin1@sehati.test Kantin123!
 */

import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

const FIREBASE_API_KEY = process.env.FIREBASE_API_KEY;
const projectId = process.env.FIREBASE_PROJECT_ID;

/**
 * Sign in using Firebase Auth REST API
 * https://firebase.google.com/docs/reference/rest/auth#section-sign-in-email-password
 */
async function signInWithEmailPassword(
  email: string,
  password: string,
): Promise<{ idToken: string; refreshToken: string; expiresIn: string }> {
  if (!FIREBASE_API_KEY) {
    throw new Error(
      'FIREBASE_API_KEY tidak ditemukan di .env\n' +
        'Tambahkan: FIREBASE_API_KEY=your-web-api-key\n' +
        'Dapatkan di: Firebase Console → Project Settings → General → Web API Key',
    );
  }

  const url = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${FIREBASE_API_KEY}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email,
      password,
      returnSecureToken: true,
    }),
  });

  if (!response.ok) {
    const errorData = (await response.json()) as { error?: { message?: string } };
    throw new Error(
      `Login gagal: ${errorData?.error?.message || response.statusText}`,
    );
  }

  return response.json() as Promise<{
    idToken: string;
    refreshToken: string;
    expiresIn: string;
  }>;
}

// ─── Alternative: Get token using Firebase Admin (custom token → exchange) ───

import * as admin from 'firebase-admin';

async function getTokenViaCustomToken(email: string): Promise<string> {
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;

  if (!projectId || !privateKey || !clientEmail) {
    throw new Error('Firebase credentials tidak lengkap');
  }

  if (admin.apps.length === 0) {
    admin.initializeApp({
      credential: admin.credential.cert({ projectId, privateKey, clientEmail }),
    });
  }

  // Cari user by email
  const userRecord = await admin.auth().getUserByEmail(email);

  // Buat custom token
  const customToken = await admin.auth().createCustomToken(userRecord.uid, {
    role: (await admin.firestore().collection('users').doc(userRecord.uid).get()).data()?.role,
  });

  if (!FIREBASE_API_KEY) {
    console.log('\n⚠️  FIREBASE_API_KEY tidak ada di .env');
    console.log('   Tidak bisa menukar custom token → ID token secara otomatis.\n');
    console.log('   Custom Token (exchange manually):');
    console.log(`   ${customToken}\n`);
    console.log('   Cara menukar custom token → ID token:');
    console.log('   POST https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=YOUR_API_KEY');
    console.log('   Body: { "token": "<customToken>", "returnSecureToken": true }');
    return customToken;
  }

  // Exchange custom token for ID token via REST API
  const url = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=${FIREBASE_API_KEY}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token: customToken, returnSecureToken: true }),
  });

  if (!response.ok) {
    const errorData = (await response.json()) as { error?: { message?: string } };
    throw new Error(
      `Exchange gagal: ${errorData?.error?.message || response.statusText}`,
    );
  }

  const data = (await response.json()) as { idToken: string };
  return data.idToken;
}

// ─── Main ──────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2);

  if (args.length < 1) {
    console.log('📝 Cara pakai:');
    console.log('   npm run get-token -- <email> <password>');
    console.log('   npm run get-token -- <email>              (tanpa password, pakai custom token)\n');
    console.log('📧 Akun tersedia:');
    console.log('   admin@sehati.test   Admin123!');
    console.log('   guru1@sehati.test   Guru123!');
    console.log('   guru2@sehati.test   Guru123!');
    console.log('   siswa1@sehati.test  Siswa123!');
    console.log('   siswa2@sehati.test  Siswa123!');
    console.log('   siswa3@sehati.test  Siswa123!');
    console.log('   kantin1@sehati.test Kantin123!');
    process.exit(0);
  }

  const email = args[0];
  const password = args[1];

  console.log(`\n🔐 Mendapatkan token untuk: ${email}`);
  console.log(`📡 Project: ${projectId}\n`);

  let idToken: string;

  if (password && FIREBASE_API_KEY) {
    // Metode 1: Sign in langsung dengan email/password (perlu API Key)
    console.log('📌 Metode: Sign in dengan email/password\n');
    const result = await signInWithEmailPassword(email, password);
    idToken = result.idToken;
  } else {
    // Metode 2: Custom token via Admin SDK
    console.log('📌 Metode: Custom token via Admin SDK\n');
    idToken = await getTokenViaCustomToken(email);
  }

  console.log('═══════════════════════════════════════════════════════');
  console.log('🎫 ID TOKEN (copy ini ke Postman Authorization header):');
  console.log('═══════════════════════════════════════════════════════\n');
  console.log(idToken);
  console.log('\n═══════════════════════════════════════════════════════');
  console.log('\n💡 Di Postman:');
  console.log('   1. Tab "Authorization"');
  console.log('   2. Type: "Bearer Token"');
  console.log('   3. Paste token di atas\n');
  console.log('Token berlaku selama 1 jam.');

  process.exit(0);
}

main().catch((err) => {
  console.error('❌ Error:', err.message || err);
  process.exit(1);
});
