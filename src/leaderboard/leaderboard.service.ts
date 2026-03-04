import { Injectable, Logger } from '@nestjs/common';
import { FirebaseService } from '../firebase/firebase.service';

@Injectable()
export class LeaderboardService {
  private readonly logger = new Logger(LeaderboardService.name);

  constructor(private readonly firebaseService: FirebaseService) {}

  /**
   * Get leaderboard per kelas
   */
  async getLeaderboardByKelas(kelasId: string, limit: number = 10) {
    const snapshot = await this.firebaseService
      .collection('users')
      .where('role', '==', 'siswa')
      .where('kelas', '==', kelasId)
      .where('isActive', '==', true)
      .orderBy('coins', 'desc')
      .limit(limit)
      .get();

    const leaderboard = snapshot.docs.map((doc, index) => ({
      rank: index + 1,
      uid: doc.id,
      nama: doc.data().nama,
      nis: doc.data().nis,
      coins: doc.data().coins || 0,
      streak: doc.data().streak || 0,
    }));

    // Get total students in class
    const totalSnapshot = await this.firebaseService
      .collection('users')
      .where('role', '==', 'siswa')
      .where('kelas', '==', kelasId)
      .where('isActive', '==', true)
      .count()
      .get();

    // Get class stats
    const allStudentsSnapshot = await this.firebaseService
      .collection('users')
      .where('role', '==', 'siswa')
      .where('kelas', '==', kelasId)
      .where('isActive', '==', true)
      .get();

    let totalCoins = 0;
    let totalStreak = 0;
    allStudentsSnapshot.docs.forEach((doc) => {
      totalCoins += doc.data().coins || 0;
      totalStreak += doc.data().streak || 0;
    });

    const totalStudents = totalSnapshot.data().count;

    return {
      kelas: kelasId,
      totalSiswa: totalStudents,
      avgCoins: totalStudents > 0 ? Math.round(totalCoins / totalStudents) : 0,
      avgStreak:
        totalStudents > 0 ? Math.round(totalStreak / totalStudents) : 0,
      totalCoins,
      leaderboard,
    };
  }

  /**
   * Get leaderboard sekolah (all students)
   */
  async getLeaderboardSekolah(limit: number = 20) {
    const snapshot = await this.firebaseService
      .collection('users')
      .where('role', '==', 'siswa')
      .where('isActive', '==', true)
      .orderBy('coins', 'desc')
      .limit(limit)
      .get();

    const leaderboard = snapshot.docs.map((doc, index) => ({
      rank: index + 1,
      uid: doc.id,
      nama: doc.data().nama,
      nis: doc.data().nis,
      kelas: doc.data().kelas,
      coins: doc.data().coins || 0,
      streak: doc.data().streak || 0,
    }));

    // Get school-wide stats
    const allStudentsSnapshot = await this.firebaseService
      .collection('users')
      .where('role', '==', 'siswa')
      .where('isActive', '==', true)
      .get();

    let totalCoins = 0;
    let totalStreak = 0;
    allStudentsSnapshot.docs.forEach((doc) => {
      totalCoins += doc.data().coins || 0;
      totalStreak += doc.data().streak || 0;
    });

    const totalStudents = allStudentsSnapshot.size;

    return {
      totalSiswa: totalStudents,
      avgCoins: totalStudents > 0 ? Math.round(totalCoins / totalStudents) : 0,
      avgStreak:
        totalStudents > 0 ? Math.round(totalStreak / totalStudents) : 0,
      totalCoins,
      leaderboard,
    };
  }

  /**
   * Get leaderboard per kelas (ranking antar kelas)
   */
  async getLeaderboardKelasRanking() {
    const snapshot = await this.firebaseService
      .collection('users')
      .where('role', '==', 'siswa')
      .where('isActive', '==', true)
      .get();

    // Group by kelas
    const kelasMap = new Map<
      string,
      {
        totalSiswa: number;
        totalCoins: number;
        totalStreak: number;
      }
    >();

    snapshot.docs.forEach((doc) => {
      const data = doc.data();
      const kelas = data.kelas || 'Unknown';
      const current = kelasMap.get(kelas) || {
        totalSiswa: 0,
        totalCoins: 0,
        totalStreak: 0,
      };

      current.totalSiswa += 1;
      current.totalCoins += data.coins || 0;
      current.totalStreak += data.streak || 0;
      kelasMap.set(kelas, current);
    });

    // Calculate averages and sort by avgCoins
    const ranking = Array.from(kelasMap.entries())
      .map(([kelas, stats]) => ({
        kelas,
        totalSiswa: stats.totalSiswa,
        totalCoins: stats.totalCoins,
        avgCoins: Math.round(stats.totalCoins / stats.totalSiswa),
        avgStreak: Math.round(stats.totalStreak / stats.totalSiswa),
      }))
      .sort((a, b) => b.avgCoins - a.avgCoins)
      .map((item, index) => ({
        rank: index + 1,
        ...item,
      }));

    return ranking;
  }
}
