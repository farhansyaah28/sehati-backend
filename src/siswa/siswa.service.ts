import { Injectable, Logger } from '@nestjs/common';
import { FirebaseService } from '../firebase/firebase.service';
import { AuthenticatedUser } from '../common/interfaces/firebase-user.interface';

@Injectable()
export class SiswaService {
  private readonly logger = new Logger(SiswaService.name);

  constructor(private readonly firebaseService: FirebaseService) {}

  /**
   * Get dashboard data untuk siswa
   * Menampilkan coins, streak, ranking, dan statistik
   */
  async getDashboard(user: AuthenticatedUser) {
    // Get user data with coins and streak
    const userDoc = await this.firebaseService
      .collection('users')
      .doc(user.uid)
      .get();

    const userData = userDoc.data();

    // Get today's absensi status
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().split('T')[0];

    const absensiToday = await this.firebaseService
      .collection('absensi')
      .where('siswaId', '==', user.uid)
      .where('tanggal', '==', todayStr)
      .limit(1)
      .get();

    // Get total pelanggaran count
    const pelanggaranSnapshot = await this.firebaseService
      .collection('pelanggaran')
      .where('siswaId', '==', user.uid)
      .count()
      .get();

    // Get ranking in class
    const classRanking = await this.getClassRanking(user.uid, userData?.kelas);

    // Get ranking in school
    const schoolRanking = await this.getSchoolRanking(user.uid);

    return {
      profile: {
        nama: userData?.nama,
        kelas: userData?.kelas,
        nis: userData?.nis,
      },
      stats: {
        coins: userData?.coins || 0,
        streak: userData?.streak || 0,
        sudahAbsensiHariIni: !absensiToday.empty,
        totalPelanggaran: pelanggaranSnapshot.data().count,
      },
      ranking: {
        kelas: classRanking,
        sekolah: schoolRanking,
      },
    };
  }

  /**
   * Get daftar pelanggaran siswa
   */
  async getPelanggaran(siswaId: string) {
    const snapshot = await this.firebaseService
      .collection('pelanggaran')
      .where('siswaId', '==', siswaId)
      .orderBy('createdAt', 'desc')
      .get();

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  }

  /**
   * Get riwayat transaksi siswa
   */
  async getTransaksi(siswaId: string) {
    const snapshot = await this.firebaseService
      .collection('transaksi')
      .where('siswaId', '==', siswaId)
      .orderBy('createdAt', 'desc')
      .get();

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  }

  /**
   * Get voucher yang tersedia untuk ditukar
   */
  async getAvailableVouchers(siswaId: string) {
    // Get user's current coins
    const userDoc = await this.firebaseService
      .collection('users')
      .doc(siswaId)
      .get();
    const userCoins = userDoc.data()?.coins || 0;

    // Get all active vouchers
    const snapshot = await this.firebaseService
      .collection('vouchers')
      .where('isActive', '==', true)
      .where('stock', '>', 0)
      .orderBy('stock')
      .orderBy('coinsRequired', 'asc')
      .get();

    return {
      currentCoins: userCoins,
      vouchers: snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          canRedeem: userCoins >= (data.coinsRequired || 0),
        };
      }),
    };
  }

  /**
   * Get ranking siswa dalam kelas
   */
  private async getClassRanking(
    siswaId: string,
    kelas: string | undefined,
  ): Promise<number | null> {
    if (!kelas) return null;

    const snapshot = await this.firebaseService
      .collection('users')
      .where('role', '==', 'siswa')
      .where('kelas', '==', kelas)
      .where('isActive', '==', true)
      .orderBy('coins', 'desc')
      .get();

    const index = snapshot.docs.findIndex((doc) => doc.id === siswaId);
    return index !== -1 ? index + 1 : null;
  }

  /**
   * Get ranking siswa dalam sekolah
   */
  private async getSchoolRanking(siswaId: string): Promise<number | null> {
    const snapshot = await this.firebaseService
      .collection('users')
      .where('role', '==', 'siswa')
      .where('isActive', '==', true)
      .orderBy('coins', 'desc')
      .get();

    const index = snapshot.docs.findIndex((doc) => doc.id === siswaId);
    return index !== -1 ? index + 1 : null;
  }
}
