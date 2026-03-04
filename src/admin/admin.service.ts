import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { FirebaseService } from '../firebase/firebase.service';
import { UsersService } from '../users/users.service';
import { UserRole } from '../common/constants/roles.constant';
import { CreateKelasDto, UpdateKelasDto } from './dto/kelas.dto';
import { CreateVoucherDto, UpdateVoucherDto } from './dto/voucher.dto';

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(
    private readonly firebaseService: FirebaseService,
    private readonly usersService: UsersService,
  ) {}

  // ==================== DASHBOARD & ANALYTICS ====================

  /**
   * Get dashboard data untuk admin
   */
  async getDashboard() {
    const [siswaCount, guruCount, kantinCount, kelasCount] = await Promise.all([
      this.usersService.countByRole(UserRole.SISWA),
      this.usersService.countByRole(UserRole.GURU),
      this.usersService.countByRole(UserRole.KANTIN),
      this.getKelasCount(),
    ]);

    // Get today stats
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [absensiToday, pelanggaranToday, transaksiToday] = await Promise.all([
      this.firebaseService
        .collection('absensi')
        .where('tanggal', '==', today.toISOString().split('T')[0])
        .count()
        .get(),
      this.firebaseService
        .collection('pelanggaran')
        .where('createdAt', '>=', today)
        .count()
        .get(),
      this.firebaseService
        .collection('transaksi')
        .where('createdAt', '>=', today)
        .count()
        .get(),
    ]);

    return {
      totalSiswa: siswaCount,
      totalGuru: guruCount,
      totalKantin: kantinCount,
      totalKelas: kelasCount,
      statistikHariIni: {
        absensi: absensiToday.data().count,
        pelanggaran: pelanggaranToday.data().count,
        transaksi: transaksiToday.data().count,
      },
      tanggal: today.toISOString().split('T')[0],
    };
  }

  /**
   * Get analytics data
   */
  async getAnalytics(periode?: string) {
    const now = new Date();
    let startDate: Date;

    switch (periode) {
      case 'minggu':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'bulan':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'tahun':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    // Get absensi trend
    const absensiSnapshot = await this.firebaseService
      .collection('absensi')
      .where('createdAt', '>=', startDate)
      .get();

    // Get pelanggaran count
    const pelanggaranSnapshot = await this.firebaseService
      .collection('pelanggaran')
      .where('createdAt', '>=', startDate)
      .count()
      .get();

    // Get transaksi stats
    const transaksiSnapshot = await this.firebaseService
      .collection('transaksi')
      .where('createdAt', '>=', startDate)
      .get();

    let totalTransaksi = 0;
    transaksiSnapshot.docs.forEach((doc) => {
      totalTransaksi += doc.data().totalBayar || 0;
    });

    // Get coins distributed
    const usersSnapshot = await this.firebaseService
      .collection('users')
      .where('role', '==', 'siswa')
      .get();

    let totalCoins = 0;
    usersSnapshot.docs.forEach((doc) => {
      totalCoins += doc.data().coins || 0;
    });

    return {
      periode: periode || 'bulan',
      startDate: startDate.toISOString(),
      analytics: {
        totalAbsensi: absensiSnapshot.size,
        totalPelanggaran: pelanggaranSnapshot.data().count,
        totalTransaksi: transaksiSnapshot.size,
        nilaiTransaksi: totalTransaksi,
        totalCoinsDistributed: totalCoins,
        avgAbsensiPerHari: Math.round(
          absensiSnapshot.size / Math.max(1, this.daysBetween(startDate, now)),
        ),
      },
    };
  }

  private daysBetween(date1: Date, date2: Date): number {
    const diffTime = Math.abs(date2.getTime() - date1.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  // ==================== SISWA MANAGEMENT ====================

  async getSiswaList(filters?: { kelas?: string; search?: string }) {
    return this.usersService.findAll({
      role: UserRole.SISWA,
      ...filters,
    });
  }

  async getSiswaById(id: string) {
    return this.usersService.findOne(id);
  }

  async createSiswa(dto: any, createdBy: string) {
    return this.usersService.create(
      {
        ...dto,
        role: UserRole.SISWA,
      },
      createdBy,
    );
  }

  async importSiswa(data: any[], createdBy: string) {
    const results = {
      success: 0,
      failed: 0,
      errors: [] as string[],
    };

    for (const siswa of data) {
      try {
        await this.usersService.create(
          {
            ...siswa,
            role: UserRole.SISWA,
          },
          createdBy,
        );
        results.success++;
      } catch (error) {
        results.failed++;
        results.errors.push(
          `NIS ${siswa.nis}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        );
      }
    }

    return results;
  }

  async updateSiswa(id: string, dto: any, updatedBy: string) {
    return this.usersService.update(id, dto, updatedBy);
  }

  async deleteSiswa(id: string, adminId: string = 'system') {
    return this.usersService.deactivate(id, adminId);
  }

  // ==================== GURU MANAGEMENT ====================

  async getGuruList(filters?: { search?: string }) {
    return this.usersService.findAll({
      role: UserRole.GURU,
      ...filters,
    });
  }

  async getGuruById(id: string) {
    return this.usersService.findOne(id);
  }

  async createGuru(dto: any, createdBy: string) {
    return this.usersService.create(
      {
        ...dto,
        role: UserRole.GURU,
      },
      createdBy,
    );
  }

  async updateGuru(id: string, dto: any, updatedBy: string) {
    return this.usersService.update(id, dto, updatedBy);
  }

  async deleteGuru(id: string, adminId: string = 'system') {
    return this.usersService.deactivate(id, adminId);
  }

  // ==================== KANTIN MANAGEMENT ====================

  async getKantinList(filters?: { search?: string }) {
    return this.usersService.findAll({
      role: UserRole.KANTIN,
      ...filters,
    });
  }

  async getKantinById(id: string) {
    return this.usersService.findOne(id);
  }

  async createKantin(dto: any, createdBy: string) {
    return this.usersService.create(
      {
        ...dto,
        role: UserRole.KANTIN,
      },
      createdBy,
    );
  }

  async updateKantin(id: string, dto: any, updatedBy: string) {
    return this.usersService.update(id, dto, updatedBy);
  }

  async deleteKantin(id: string, adminId: string = 'system') {
    return this.usersService.deactivate(id, adminId);
  }

  // ==================== KELAS MANAGEMENT ====================

  private async getKelasCount(): Promise<number> {
    const snapshot = await this.firebaseService
      .collection('kelas')
      .count()
      .get();
    return snapshot.data().count;
  }

  async getKelasList() {
    const snapshot = await this.firebaseService
      .collection('kelas')
      .orderBy('nama')
      .get();

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  }

  async getKelasById(id: string) {
    const doc = await this.firebaseService.collection('kelas').doc(id).get();

    if (!doc.exists) {
      throw new NotFoundException('Kelas tidak ditemukan');
    }

    // Get student count for this kelas
    const siswaCount = await this.firebaseService
      .collection('users')
      .where('role', '==', 'siswa')
      .where('kelas', '==', id)
      .count()
      .get();

    return {
      id: doc.id,
      ...doc.data(),
      jumlahSiswa: siswaCount.data().count,
    };
  }

  async createKelas(dto: CreateKelasDto) {
    const kelasData = {
      nama: dto.nama,
      tingkat: dto.tingkat,
      waliKelas: dto.waliKelas || null,
      tahunAjaran: dto.tahunAjaran || new Date().getFullYear().toString(),
      isActive: true,
      createdAt: this.firebaseService.serverTimestamp,
      updatedAt: this.firebaseService.serverTimestamp,
    };

    const docRef = await this.firebaseService
      .collection('kelas')
      .add(kelasData);

    return {
      id: docRef.id,
      ...kelasData,
    };
  }

  async updateKelas(id: string, dto: UpdateKelasDto) {
    await this.getKelasById(id);

    const updateData = {
      ...dto,
      updatedAt: this.firebaseService.serverTimestamp,
    };

    await this.firebaseService.collection('kelas').doc(id).update(updateData);

    return {
      id,
      ...updateData,
    };
  }

  async deleteKelas(id: string) {
    await this.getKelasById(id);

    await this.firebaseService.collection('kelas').doc(id).update({
      isActive: false,
      deletedAt: this.firebaseService.serverTimestamp,
    });

    return { message: 'Kelas berhasil dihapus' };
  }

  // ==================== VOUCHER MANAGEMENT ====================

  async getVoucherList() {
    const snapshot = await this.firebaseService
      .collection('vouchers')
      .orderBy('createdAt', 'desc')
      .get();

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  }

  async getVoucherById(id: string) {
    const doc = await this.firebaseService.collection('vouchers').doc(id).get();

    if (!doc.exists) {
      throw new NotFoundException('Voucher tidak ditemukan');
    }

    return {
      id: doc.id,
      ...doc.data(),
    };
  }

  async createVoucher(dto: CreateVoucherDto) {
    const voucherData = {
      nama: dto.nama,
      deskripsi: dto.deskripsi || '',
      discountAmount: dto.discountAmount,
      coinsRequired: dto.coinsRequired,
      stock: dto.stock || 0,
      isActive: dto.isActive !== false,
      expiredAt: dto.expiredAt ? new Date(dto.expiredAt) : null,
      createdAt: this.firebaseService.serverTimestamp,
      updatedAt: this.firebaseService.serverTimestamp,
    };

    const docRef = await this.firebaseService
      .collection('vouchers')
      .add(voucherData);

    return {
      id: docRef.id,
      ...voucherData,
    };
  }

  async updateVoucher(id: string, dto: UpdateVoucherDto) {
    await this.getVoucherById(id);

    const updateData: any = {
      ...dto,
      updatedAt: this.firebaseService.serverTimestamp,
    };

    if (dto.expiredAt) {
      updateData.expiredAt = new Date(dto.expiredAt);
    }

    await this.firebaseService
      .collection('vouchers')
      .doc(id)
      .update(updateData);

    return {
      id,
      ...updateData,
    };
  }

  async deleteVoucher(id: string) {
    await this.getVoucherById(id);

    await this.firebaseService.collection('vouchers').doc(id).update({
      isActive: false,
      deletedAt: this.firebaseService.serverTimestamp,
    });

    return { message: 'Voucher berhasil dihapus' };
  }

  /**
   * Distribute voucher ke siswa
   */
  async distributeVoucher(
    voucherId: string,
    siswaIds: string[],
    _adminId: string,
  ) {
    const voucher = await this.getVoucherById(voucherId);
    const voucherData = voucher as any;

    const results = {
      success: 0,
      failed: 0,
      redemptions: [] as string[],
    };

    for (const siswaId of siswaIds) {
      try {
        const redemptionData = {
          siswaId,
          voucherId,
          voucherName: voucherData.nama,
          discountAmount: voucherData.discountAmount,
          coinsSpent: 0, // Free distribution
          isUsed: false,
          distributedBy: 'admin',
          createdAt: this.firebaseService.serverTimestamp,
          expiredAt: voucherData.expiredAt || null,
        };

        const docRef = await this.firebaseService
          .collection('voucher_redemptions')
          .add(redemptionData);

        results.redemptions.push(docRef.id);
        results.success++;
      } catch (error) {
        results.failed++;
        this.logger.error(`Failed to distribute voucher to ${siswaId}`, error);
      }
    }

    return results;
  }

  // ==================== LAPORAN ====================

  /**
   * Laporan kepatuhan absensi tumbler
   */
  async getLaporanKepatuhan(filters?: {
    startDate?: string;
    endDate?: string;
    kelas?: string;
  }) {
    let query: FirebaseFirestore.Query =
      this.firebaseService.collection('absensi');

    if (filters?.startDate) {
      query = query.where('tanggal', '>=', filters.startDate);
    }
    if (filters?.endDate) {
      query = query.where('tanggal', '<=', filters.endDate);
    }

    const absensiSnapshot = await query.get();

    // Get all siswa
    let siswaQuery: FirebaseFirestore.Query = this.firebaseService
      .collection('users')
      .where('role', '==', 'siswa')
      .where('isActive', '==', true);

    if (filters?.kelas) {
      siswaQuery = siswaQuery.where('kelas', '==', filters.kelas);
    }

    const siswaSnapshot = await siswaQuery.get();
    const totalSiswa = siswaSnapshot.size;

    // Calculate kepatuhan per kelas
    const kelasMap = new Map<string, { absensi: number; siswa: number }>();

    siswaSnapshot.docs.forEach((doc) => {
      const kelas = doc.data().kelas || 'Unknown';
      const current = kelasMap.get(kelas) || { absensi: 0, siswa: 0 };
      current.siswa++;
      kelasMap.set(kelas, current);
    });

    absensiSnapshot.docs.forEach((doc) => {
      const data = doc.data();
      if (data.siswaKelas) {
        const current = kelasMap.get(data.siswaKelas) || {
          absensi: 0,
          siswa: 0,
        };
        current.absensi++;
        kelasMap.set(data.siswaKelas, current);
      }
    });

    const kepatuhanPerKelas = Array.from(kelasMap.entries()).map(
      ([kelas, stats]) => ({
        kelas,
        totalSiswa: stats.siswa,
        totalAbsensi: stats.absensi,
        rataRataKepatuhan:
          stats.siswa > 0
            ? Math.round((stats.absensi / stats.siswa) * 100) / 100
            : 0,
      }),
    );

    return {
      periode: {
        startDate: filters?.startDate || 'All time',
        endDate: filters?.endDate || 'Now',
      },
      summary: {
        totalSiswa,
        totalAbsensi: absensiSnapshot.size,
        rataRataKepatuhanSekolah:
          totalSiswa > 0
            ? Math.round((absensiSnapshot.size / totalSiswa) * 100) / 100
            : 0,
      },
      kepatuhanPerKelas,
    };
  }

  /**
   * Laporan pelanggaran
   */
  async getLaporanPelanggaran(filters?: {
    startDate?: string;
    endDate?: string;
    kelas?: string;
  }) {
    let query: FirebaseFirestore.Query =
      this.firebaseService.collection('pelanggaran');

    if (filters?.startDate) {
      query = query.where('createdAt', '>=', new Date(filters.startDate));
    }
    if (filters?.endDate) {
      query = query.where('createdAt', '<=', new Date(filters.endDate));
    }

    const snapshot = await query.get();

    // Group by jenis pelanggaran
    const jenisMap = new Map<string, number>();
    const kelasMap = new Map<string, number>();
    let totalCoinsDikurangi = 0;

    snapshot.docs.forEach((doc) => {
      const data = doc.data();

      // By jenis
      const jenis = data.jenisPelanggaran || 'Tidak diketahui';
      jenisMap.set(jenis, (jenisMap.get(jenis) || 0) + 1);

      // By kelas
      const kelas = data.siswaKelas || 'Unknown';
      kelasMap.set(kelas, (kelasMap.get(kelas) || 0) + 1);

      totalCoinsDikurangi += data.coinsDikurangi || 0;
    });

    return {
      periode: {
        startDate: filters?.startDate || 'All time',
        endDate: filters?.endDate || 'Now',
      },
      summary: {
        totalPelanggaran: snapshot.size,
        totalCoinsDikurangi,
      },
      pelanggaranPerJenis: Array.from(jenisMap.entries()).map(
        ([jenis, count]) => ({
          jenis,
          count,
        }),
      ),
      pelanggaranPerKelas: Array.from(kelasMap.entries())
        .map(([kelas, count]) => ({
          kelas,
          count,
        }))
        .sort((a, b) => b.count - a.count),
    };
  }

  /**
   * Laporan transaksi
   */
  async getLaporanTransaksi(filters?: {
    startDate?: string;
    endDate?: string;
  }) {
    let query: FirebaseFirestore.Query =
      this.firebaseService.collection('transaksi');

    if (filters?.startDate) {
      query = query.where('createdAt', '>=', new Date(filters.startDate));
    }
    if (filters?.endDate) {
      query = query.where('createdAt', '<=', new Date(filters.endDate));
    }

    const snapshot = await query.get();

    let totalNilai = 0;
    let totalVoucherUsed = 0;
    let totalCoinsUsed = 0;
    const transaksiPerHari = new Map<string, number>();

    snapshot.docs.forEach((doc) => {
      const data = doc.data();
      totalNilai += data.totalBayar || 0;

      if (data.voucherUsed) {
        totalVoucherUsed++;
      }
      totalCoinsUsed += data.coinsUsed || 0;

      // Group by date
      const dateStr = data.createdAt?.toDate
        ? data.createdAt.toDate().toISOString().split('T')[0]
        : 'Unknown';
      transaksiPerHari.set(dateStr, (transaksiPerHari.get(dateStr) || 0) + 1);
    });

    return {
      periode: {
        startDate: filters?.startDate || 'All time',
        endDate: filters?.endDate || 'Now',
      },
      summary: {
        totalTransaksi: snapshot.size,
        totalNilai,
        rataRataNilai:
          snapshot.size > 0 ? Math.round(totalNilai / snapshot.size) : 0,
        totalVoucherUsed,
        totalCoinsUsed,
      },
      transaksiPerHari: Array.from(transaksiPerHari.entries())
        .map(([tanggal, count]) => ({ tanggal, count }))
        .sort((a, b) => a.tanggal.localeCompare(b.tanggal)),
    };
  }

  /**
   * Laporan dampak lingkungan
   */
  async getLaporanDampakLingkungan(filters?: {
    startDate?: string;
    endDate?: string;
  }) {
    let query: FirebaseFirestore.Query =
      this.firebaseService.collection('absensi');

    if (filters?.startDate) {
      query = query.where('tanggal', '>=', filters.startDate);
    }
    if (filters?.endDate) {
      query = query.where('tanggal', '<=', filters.endDate);
    }

    const absensiSnapshot = await query.get();
    const totalTumblerUsage = absensiSnapshot.size;

    // Estimasi dampak lingkungan
    // Asumsi: 1 tumbler = 1 botol plastik yang tidak digunakan
    const botolPlastikDihemat = totalTumblerUsage;
    // Asumsi: 1 botol plastik = 12g plastik
    const plastikDihematGram = botolPlastikDihemat * 12;
    // Asumsi: 1g plastik = 2g CO2 emisi
    const co2DihematGram = plastikDihematGram * 2;

    return {
      periode: {
        startDate: filters?.startDate || 'All time',
        endDate: filters?.endDate || 'Now',
      },
      dampakLingkungan: {
        totalPenggunaanTumbler: totalTumblerUsage,
        botolPlastikDihemat,
        plastikDihematGram,
        plastikDihematKg: Math.round((plastikDihematGram / 1000) * 100) / 100,
        co2DihematGram,
        co2DihematKg: Math.round((co2DihematGram / 1000) * 100) / 100,
      },
      catatan:
        'Estimasi berdasarkan asumsi: 1 penggunaan tumbler = 1 botol plastik (12g), 1g plastik = 2g emisi CO2',
    };
  }

  // ==================== SETTINGS ====================

  async getSettings() {
    const doc = await this.firebaseService
      .collection('settings')
      .doc('app')
      .get();

    if (!doc.exists) {
      // Return default settings
      return {
        coinsPerAbsensi: 10,
        streakBonusPercentage: 50,
        streakDays: 7,
        coinToRupiahRate: 100,
      };
    }

    return doc.data();
  }

  async updateSettings(settings: any) {
    await this.firebaseService
      .collection('settings')
      .doc('app')
      .set(
        {
          ...settings,
          updatedAt: this.firebaseService.serverTimestamp,
        },
        { merge: true },
      );

    return this.getSettings();
  }
}
