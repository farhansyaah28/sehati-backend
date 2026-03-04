import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { FirebaseService } from '../firebase/firebase.service';
import { UsersService } from '../users/users.service';
import { CreateAbsensiDto } from './dto/create-absensi.dto';
import { CreatePelanggaranDto } from './dto/create-pelanggaran.dto';

@Injectable()
export class GuruService {
  private readonly logger = new Logger(GuruService.name);

  // Konfigurasi coins
  private readonly COINS_PER_ABSENSI = 10;
  private readonly BONUS_STREAK_MULTIPLIER = 0.5; // 50% bonus per 7 hari streak

  constructor(
    private readonly firebaseService: FirebaseService,
    private readonly usersService: UsersService,
  ) {}

  /**
   * Get dashboard data untuk guru
   */
  async getDashboard(_guruId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().split('T')[0];

    // Get total siswa aktif
    const totalSiswa = await this.usersService.countByRole('siswa' as any);

    // Get absensi hari ini
    const absensiTodaySnapshot = await this.firebaseService
      .collection('absensi')
      .where('tanggal', '==', todayStr)
      .count()
      .get();

    // Get pelanggaran bulan ini
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const pelanggaranSnapshot = await this.firebaseService
      .collection('pelanggaran')
      .where('createdAt', '>=', startOfMonth)
      .count()
      .get();

    return {
      totalSiswa,
      absensiHariIni: absensiTodaySnapshot.data().count,
      pelanggaranBulanIni: pelanggaranSnapshot.data().count,
      tanggal: todayStr,
    };
  }

  /**
   * Get daftar siswa (untuk keperluan absensi/pelanggaran)
   */
  async getSiswaList(filters?: { kelas?: string; search?: string }) {
    let query: FirebaseFirestore.Query = this.firebaseService
      .collection('users')
      .where('role', '==', 'siswa')
      .where('isActive', '==', true);

    if (filters?.kelas) {
      query = query.where('kelas', '==', filters.kelas);
    }

    const snapshot = await query.orderBy('nama').get();

    let results = snapshot.docs.map((doc) => ({
      uid: doc.id,
      nama: doc.data().nama,
      nis: doc.data().nis,
      kelas: doc.data().kelas,
      coins: doc.data().coins || 0,
      streak: doc.data().streak || 0,
    }));

    // Filter by search if provided
    if (filters?.search) {
      const searchLower = filters.search.toLowerCase();
      results = results.filter(
        (siswa) =>
          siswa.nama.toLowerCase().includes(searchLower) ||
          siswa.nis?.toLowerCase().includes(searchLower),
      );
    }

    return results;
  }

  /**
   * Scan barcode NIS untuk absensi tumbler
   */
  async scanAbsensi(nis: string, guruId: string) {
    // Find siswa by NIS
    const siswa = await this.usersService.findByNis(nis);
    if (!siswa) {
      throw new NotFoundException('Siswa dengan NIS tersebut tidak ditemukan');
    }

    return this.processAbsensi(siswa.uid, guruId, 'scan');
  }

  /**
   * Input absensi manual
   */
  async manualAbsensi(dto: CreateAbsensiDto, guruId: string) {
    // Verify siswa exists
    const siswa = await this.usersService.findOne(dto.siswaId);
    if (!siswa) {
      throw new NotFoundException('Siswa tidak ditemukan');
    }

    return this.processAbsensi(dto.siswaId, guruId, 'manual', dto.keterangan);
  }

  /**
   * Process absensi (shared logic)
   */
  private async processAbsensi(
    siswaId: string,
    guruId: string,
    method: 'scan' | 'manual',
    keterangan?: string,
  ) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().split('T')[0];

    // Check if already absen today
    const existingAbsensi = await this.firebaseService
      .collection('absensi')
      .where('siswaId', '==', siswaId)
      .where('tanggal', '==', todayStr)
      .limit(1)
      .get();

    if (!existingAbsensi.empty) {
      throw new BadRequestException('Siswa sudah melakukan absensi hari ini');
    }

    // Get siswa data for streak calculation
    const siswaDoc = await this.firebaseService
      .collection('users')
      .doc(siswaId)
      .get();
    const siswaData = siswaDoc.data();

    // Check if streak continues (absen kemarin)
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    const yesterdayAbsensi = await this.firebaseService
      .collection('absensi')
      .where('siswaId', '==', siswaId)
      .where('tanggal', '==', yesterdayStr)
      .limit(1)
      .get();

    const currentStreak = siswaData?.streak || 0;
    const newStreak = yesterdayAbsensi.empty ? 1 : currentStreak + 1;

    // Calculate coins with streak bonus
    let coinsEarned = this.COINS_PER_ABSENSI;
    const streakBonus =
      Math.floor(newStreak / 7) * this.BONUS_STREAK_MULTIPLIER;
    coinsEarned = Math.floor(coinsEarned * (1 + streakBonus));

    // Create absensi record
    const absensiData = {
      siswaId,
      guruId,
      tanggal: todayStr,
      waktu: new Date().toISOString(),
      method,
      keterangan: keterangan || null,
      coinsEarned,
      streakDay: newStreak,
      createdAt: this.firebaseService.serverTimestamp,
    };

    const absensiRef = await this.firebaseService
      .collection('absensi')
      .add(absensiData);

    // Update siswa coins and streak
    const newCoins = (siswaData?.coins || 0) + coinsEarned;
    await this.firebaseService.collection('users').doc(siswaId).update({
      coins: newCoins,
      streak: newStreak,
      lastAbsensi: todayStr,
      updatedAt: this.firebaseService.serverTimestamp,
    });

    this.logger.log(
      `Absensi recorded: ${siswaId} - ${coinsEarned} coins - streak ${newStreak}`,
    );

    return {
      absensiId: absensiRef.id,
      siswa: {
        uid: siswaId,
        nama: siswaData?.nama,
        nis: siswaData?.nis,
        kelas: siswaData?.kelas,
      },
      coinsEarned,
      totalCoins: newCoins,
      streak: newStreak,
      streakBonus:
        streakBonus > 0 ? `+${Math.floor(streakBonus * 100)}%` : null,
    };
  }

  /**
   * Check status absensi siswa hari ini
   */
  async checkAbsensiStatus(siswaId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().split('T')[0];

    const siswa = await this.usersService.findOne(siswaId);

    const absensiSnapshot = await this.firebaseService
      .collection('absensi')
      .where('siswaId', '==', siswaId)
      .where('tanggal', '==', todayStr)
      .limit(1)
      .get();

    return {
      siswa: {
        uid: siswaId,
        nama: siswa.nama,
        nis: siswa.nis,
        kelas: siswa.kelas,
        coins: siswa.coins,
        streak: siswa.streak,
      },
      sudahAbsensi: !absensiSnapshot.empty,
      absensi: absensiSnapshot.empty
        ? null
        : {
            id: absensiSnapshot.docs[0].id,
            ...absensiSnapshot.docs[0].data(),
          },
    };
  }

  /**
   * Input pelanggaran siswa
   */
  async createPelanggaran(dto: CreatePelanggaranDto, guruId: string) {
    // Verify siswa exists
    const siswa = await this.usersService.findOne(dto.siswaId);

    // Get jenis pelanggaran untuk mendapatkan denda coins
    const jenisDoc = await this.firebaseService
      .collection('jenis_pelanggaran')
      .doc(dto.jenisPelanggaranId)
      .get();

    if (!jenisDoc.exists) {
      throw new NotFoundException('Jenis pelanggaran tidak ditemukan');
    }

    const jenisData = jenisDoc.data();
    const coinsPenalty = jenisData?.coinsPenalty || 0;

    // Create pelanggaran record
    const pelanggaranData = {
      siswaId: dto.siswaId,
      guruId,
      jenisPelanggaranId: dto.jenisPelanggaranId,
      jenisPelanggaran: jenisData?.nama,
      keterangan: dto.keterangan || null,
      buktiUrl: dto.buktiUrl || null,
      coinsPenalty,
      createdAt: this.firebaseService.serverTimestamp,
    };

    const pelanggaranRef = await this.firebaseService
      .collection('pelanggaran')
      .add(pelanggaranData);

    // Deduct coins from siswa
    if (coinsPenalty > 0) {
      const currentCoins = typeof siswa.coins === 'number' ? siswa.coins : 0;
      const newCoins = Math.max(0, currentCoins - coinsPenalty);

      await this.firebaseService.collection('users').doc(dto.siswaId).update({
        coins: newCoins,
        updatedAt: this.firebaseService.serverTimestamp,
      });
    }

    this.logger.log(
      `Pelanggaran recorded: ${dto.siswaId} - ${jenisData?.nama} - ${coinsPenalty} coins deducted`,
    );

    return {
      pelanggaranId: pelanggaranRef.id,
      siswa: {
        uid: dto.siswaId,
        nama: siswa.nama,
        kelas: siswa.kelas,
      },
      jenisPelanggaran: jenisData?.nama,
      coinsPenalty,
    };
  }

  /**
   * Get daftar pelanggaran (untuk monitoring)
   */
  async getPelanggaranList(filters?: {
    kelas?: string;
    startDate?: string;
    endDate?: string;
  }) {
    let query: FirebaseFirestore.Query =
      this.firebaseService.collection('pelanggaran');

    if (filters?.startDate) {
      query = query.where('createdAt', '>=', new Date(filters.startDate));
    }

    if (filters?.endDate) {
      query = query.where('createdAt', '<=', new Date(filters.endDate));
    }

    const snapshot = await query.orderBy('createdAt', 'desc').get();

    const results = await Promise.all(
      snapshot.docs.map(async (doc) => {
        const data = doc.data();
        // Get siswa info
        const siswaDoc = await this.firebaseService
          .collection('users')
          .doc(data.siswaId)
          .get();
        const siswaData = siswaDoc.data();

        return {
          id: doc.id,
          ...data,
          siswa: {
            uid: data.siswaId,
            nama: siswaData?.nama,
            kelas: siswaData?.kelas,
            nis: siswaData?.nis,
          },
        };
      }),
    );

    // Filter by kelas if provided
    if (filters?.kelas) {
      return results.filter((r) => r.siswa.kelas === filters.kelas);
    }

    return results;
  }

  /**
   * Get detail pelanggaran by ID
   */
  async getPelanggaranDetail(pelanggaranId: string) {
    const doc = await this.firebaseService
      .collection('pelanggaran')
      .doc(pelanggaranId)
      .get();

    if (!doc.exists) {
      throw new NotFoundException('Pelanggaran tidak ditemukan');
    }

    const data = doc.data();

    // Get siswa info
    const siswaDoc = await this.firebaseService
      .collection('users')
      .doc(data?.siswaId)
      .get();

    // Get guru info
    const guruDoc = await this.firebaseService
      .collection('users')
      .doc(data?.guruId)
      .get();

    return {
      id: doc.id,
      ...data,
      siswa: {
        uid: data?.siswaId,
        nama: siswaDoc.data()?.nama,
        kelas: siswaDoc.data()?.kelas,
        nis: siswaDoc.data()?.nis,
      },
      guru: {
        uid: data?.guruId,
        nama: guruDoc.data()?.nama,
      },
    };
  }

  /**
   * Get daftar jenis pelanggaran
   */
  async getJenisPelanggaran() {
    const snapshot = await this.firebaseService
      .collection('jenis_pelanggaran')
      .where('isActive', '==', true)
      .orderBy('coinsPenalty', 'asc')
      .get();

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  }

  /**
   * Get statistik per kelas
   */
  async getStatistikKelas() {
    // Get all active classes
    const siswaSnapshot = await this.firebaseService
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
        avgCoins: number;
        totalStreak: number;
      }
    >();

    siswaSnapshot.docs.forEach((doc) => {
      const data = doc.data();
      const kelas = data.kelas || 'Unknown';
      const current = kelasMap.get(kelas) || {
        totalSiswa: 0,
        totalCoins: 0,
        avgCoins: 0,
        totalStreak: 0,
      };

      current.totalSiswa += 1;
      current.totalCoins += data.coins || 0;
      current.totalStreak += data.streak || 0;
      kelasMap.set(kelas, current);
    });

    // Calculate averages and sort
    const result = Array.from(kelasMap.entries())
      .map(([kelas, stats]) => ({
        kelas,
        totalSiswa: stats.totalSiswa,
        totalCoins: stats.totalCoins,
        avgCoins: Math.round(stats.totalCoins / stats.totalSiswa),
        avgStreak: Math.round(stats.totalStreak / stats.totalSiswa),
      }))
      .sort((a, b) => b.avgCoins - a.avgCoins);

    return result;
  }
}
