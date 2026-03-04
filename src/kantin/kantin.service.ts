import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { FirebaseService } from '../firebase/firebase.service';
import { UsersService } from '../users/users.service';
import { CreateTransaksiDto } from './dto/create-transaksi.dto';
import { RedeemVoucherDto } from './dto/redeem-voucher.dto';
import { CreateProdukDto } from './dto/create-produk.dto';
import { UpdateProdukDto } from './dto/update-produk.dto';

@Injectable()
export class KantinService {
  private readonly logger = new Logger(KantinService.name);

  constructor(
    private readonly firebaseService: FirebaseService,
    private readonly usersService: UsersService,
  ) {}

  /**
   * Get dashboard kantin
   */
  async getDashboard() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get transaksi hari ini
    const transaksiTodaySnapshot = await this.firebaseService
      .collection('transaksi')
      .where('createdAt', '>=', today)
      .count()
      .get();

    // Get total voucher redeemed today
    const voucherTodaySnapshot = await this.firebaseService
      .collection('voucher_redemptions')
      .where('createdAt', '>=', today)
      .count()
      .get();

    // Get total produk aktif
    const produkSnapshot = await this.firebaseService
      .collection('produk')
      .where('isActive', '==', true)
      .count()
      .get();

    return {
      transaksiHariIni: transaksiTodaySnapshot.data().count,
      voucherRedeemedHariIni: voucherTodaySnapshot.data().count,
      totalProdukAktif: produkSnapshot.data().count,
      tanggal: today.toISOString().split('T')[0],
    };
  }

  /**
   * Get daftar produk kantin
   */
  async getProdukList(filters?: { kategori?: string; search?: string }) {
    let query: FirebaseFirestore.Query = this.firebaseService
      .collection('produk')
      .where('isActive', '==', true);

    if (filters?.kategori) {
      query = query.where('kategori', '==', filters.kategori);
    }

    const snapshot = await query.orderBy('nama').get();

    let results = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    if (filters?.search) {
      const searchLower = filters.search.toLowerCase();
      results = results.filter((produk: any) =>
        produk.nama.toLowerCase().includes(searchLower),
      );
    }

    return results;
  }

  /**
   * Scan NIS untuk transaksi
   */
  async scanSiswa(nis: string) {
    const siswa = (await this.usersService.findByNis(nis)) as {
      uid: string;
      nama: string;
      nis: string;
      kelas: string;
      coins?: number;
    } | null;

    if (!siswa) {
      throw new NotFoundException('Siswa dengan NIS tersebut tidak ditemukan');
    }

    // Get active vouchers owned by siswa
    const vouchersSnapshot = await this.firebaseService
      .collection('voucher_redemptions')
      .where('siswaId', '==', siswa.uid)
      .where('isUsed', '==', false)
      .get();

    const vouchers = vouchersSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return {
      siswa: {
        uid: siswa.uid,
        nama: siswa.nama,
        nis: siswa.nis,
        kelas: siswa.kelas,
        coins: siswa.coins || 0,
      },
      availableVouchers: vouchers,
    };
  }

  /**
   * Create transaksi kantin
   */
  async createTransaksi(dto: CreateTransaksiDto, kantinId: string) {
    // Verify siswa
    const siswa = await this.usersService.findOne(dto.siswaId);
    const siswaCoins = typeof siswa.coins === 'number' ? siswa.coins : 0;

    // Calculate total
    let totalHarga = 0;
    const items: any[] = [];

    for (const item of dto.items) {
      const produkDoc = await this.firebaseService
        .collection('produk')
        .doc(item.produkId)
        .get();

      if (!produkDoc.exists) {
        throw new NotFoundException(`Produk ${item.produkId} tidak ditemukan`);
      }

      const produkData = produkDoc.data();
      const subtotal = (produkData?.harga || 0) * item.qty;
      totalHarga += subtotal;

      items.push({
        produkId: item.produkId,
        nama: produkData?.nama,
        harga: produkData?.harga,
        qty: item.qty,
        subtotal,
      });
    }

    // Apply voucher discount if provided
    let voucherDiscount = 0;
    let voucherInfo: { id: string; nama: string; discount: number } | null =
      null;

    if (dto.voucherRedemptionId) {
      const voucherRedemption = await this.firebaseService
        .collection('voucher_redemptions')
        .doc(dto.voucherRedemptionId)
        .get();

      if (!voucherRedemption.exists) {
        throw new NotFoundException('Voucher tidak ditemukan');
      }

      const voucherData = voucherRedemption.data();

      if (voucherData?.isUsed) {
        throw new BadRequestException('Voucher sudah digunakan');
      }

      if (voucherData?.siswaId !== dto.siswaId) {
        throw new BadRequestException('Voucher bukan milik siswa ini');
      }

      voucherDiscount = voucherData?.discountAmount || 0;
      voucherInfo = {
        id: dto.voucherRedemptionId,
        nama: voucherData?.voucherName,
        discount: voucherDiscount,
      };

      // Mark voucher as used
      await this.firebaseService
        .collection('voucher_redemptions')
        .doc(dto.voucherRedemptionId)
        .update({
          isUsed: true,
          usedAt: this.firebaseService.serverTimestamp,
        });
    }

    // Calculate coins to use
    const totalSetelahDiskon = Math.max(0, totalHarga - voucherDiscount);
    let coinsUsed = 0;

    if (dto.useCoins && siswaCoins > 0) {
      // 1 coin = Rp 100 (configurable)
      const maxCoinsToUse = Math.floor(totalSetelahDiskon / 100);
      coinsUsed = Math.min(siswaCoins, maxCoinsToUse);
    }

    const coinsValue = coinsUsed * 100;
    const totalBayar = totalSetelahDiskon - coinsValue;

    // Create transaksi record
    const transaksiData = {
      siswaId: dto.siswaId,
      kantinId,
      items,
      totalHarga,
      voucherDiscount,
      voucherRedemptionId: dto.voucherRedemptionId || null,
      coinsUsed,
      coinsValue,
      totalBayar,
      metodePembayaran: dto.metodePembayaran || 'tunai',
      createdAt: this.firebaseService.serverTimestamp,
    };

    const transaksiRef = await this.firebaseService
      .collection('transaksi')
      .add(transaksiData);

    // Deduct coins from siswa
    if (coinsUsed > 0) {
      const newCoins = siswaCoins - coinsUsed;
      await this.firebaseService.collection('users').doc(dto.siswaId).update({
        coins: newCoins,
        updatedAt: this.firebaseService.serverTimestamp,
      });
    }

    this.logger.log(
      `Transaksi created: ${transaksiRef.id} - ${dto.siswaId} - Rp ${totalBayar}`,
    );

    return {
      transaksiId: transaksiRef.id,
      siswa: {
        uid: dto.siswaId,
        nama: siswa.nama,
        nis: siswa.nis,
      },
      items,
      totalHarga,
      voucherDiscount,
      voucher: voucherInfo,
      coinsUsed,
      coinsValue,
      totalBayar,
      sisaCoins: siswaCoins - coinsUsed,
    };
  }

  /**
   * Redeem voucher (siswa menukar coins dengan voucher)
   */
  async redeemVoucher(dto: RedeemVoucherDto, siswaId: string) {
    // Get voucher info
    const voucherDoc = await this.firebaseService
      .collection('vouchers')
      .doc(dto.voucherId)
      .get();

    if (!voucherDoc.exists) {
      throw new NotFoundException('Voucher tidak ditemukan');
    }

    const voucherData = voucherDoc.data();

    if (!voucherData?.isActive) {
      throw new BadRequestException('Voucher tidak aktif');
    }

    if ((voucherData?.stock || 0) <= 0) {
      throw new BadRequestException('Stok voucher habis');
    }

    // Check siswa coins
    const siswa = await this.usersService.findOne(siswaId);
    const siswaCoins = typeof siswa.coins === 'number' ? siswa.coins : 0;
    const coinsRequired = voucherData?.coinsRequired || 0;

    if (siswaCoins < coinsRequired) {
      throw new BadRequestException(
        `Coins tidak cukup. Dibutuhkan ${coinsRequired} coins, Anda memiliki ${siswaCoins} coins`,
      );
    }

    // Create voucher redemption
    const redemptionData = {
      siswaId,
      voucherId: dto.voucherId,
      voucherName: voucherData?.nama,
      discountAmount: voucherData?.discountAmount,
      coinsSpent: coinsRequired,
      isUsed: false,
      createdAt: this.firebaseService.serverTimestamp,
      expiredAt: voucherData?.expiredAt || null,
    };

    const redemptionRef = await this.firebaseService
      .collection('voucher_redemptions')
      .add(redemptionData);

    // Deduct coins from siswa
    const newCoins = siswaCoins - coinsRequired;
    await this.firebaseService.collection('users').doc(siswaId).update({
      coins: newCoins,
      updatedAt: this.firebaseService.serverTimestamp,
    });

    // Decrease voucher stock
    await this.firebaseService
      .collection('vouchers')
      .doc(dto.voucherId)
      .update({
        stock: this.firebaseService.increment(-1),
      });

    this.logger.log(
      `Voucher redeemed: ${redemptionRef.id} - ${siswaId} - ${coinsRequired} coins`,
    );

    return {
      redemptionId: redemptionRef.id,
      voucher: {
        id: dto.voucherId,
        nama: voucherData?.nama,
        discountAmount: voucherData?.discountAmount,
      },
      coinsSpent: coinsRequired,
      sisaCoins: newCoins,
    };
  }

  /**
   * Get riwayat transaksi kantin
   */
  async getTransaksiList(filters?: { startDate?: string; endDate?: string }) {
    let query: FirebaseFirestore.Query =
      this.firebaseService.collection('transaksi');

    if (filters?.startDate) {
      query = query.where('createdAt', '>=', new Date(filters.startDate));
    }

    if (filters?.endDate) {
      query = query.where('createdAt', '<=', new Date(filters.endDate));
    }

    const snapshot = await query.orderBy('createdAt', 'desc').limit(100).get();

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  }

  /**
   * Get produk by ID
   */
  async getProdukById(id: string) {
    const doc = await this.firebaseService.collection('produk').doc(id).get();

    if (!doc.exists) {
      throw new NotFoundException('Produk tidak ditemukan');
    }

    return {
      id: doc.id,
      ...doc.data(),
    };
  }

  /**
   * Create produk baru
   */
  async createProduk(dto: CreateProdukDto) {
    const produkData = {
      nama: dto.nama,
      deskripsi: dto.deskripsi || '',
      harga: dto.harga,
      kategori: dto.kategori || 'umum',
      stock: dto.stock || 0,
      isActive: dto.isActive !== false,
      gambarUrl: dto.gambarUrl || '',
      createdAt: this.firebaseService.serverTimestamp,
      updatedAt: this.firebaseService.serverTimestamp,
    };

    const docRef = await this.firebaseService
      .collection('produk')
      .add(produkData);

    return {
      id: docRef.id,
      ...produkData,
    };
  }

  /**
   * Update produk
   */
  async updateProduk(id: string, dto: UpdateProdukDto) {
    const existingProduk = await this.getProdukById(id);

    const updateData: any = {
      ...dto,
      updatedAt: this.firebaseService.serverTimestamp,
    };

    await this.firebaseService
      .collection('produk')
      .doc(id)
      .update(updateData);

    return {
      ...existingProduk,
      ...updateData,
      id,
    };
  }

  /**
   * Delete produk (soft delete)
   */
  async deleteProduk(id: string) {
    await this.getProdukById(id);

    await this.firebaseService.collection('produk').doc(id).update({
      isActive: false,
      deletedAt: this.firebaseService.serverTimestamp,
    });

    return { message: 'Produk berhasil dihapus' };
  }

  /**
   * Get transaksi by ID
   */
  async getTransaksiById(id: string) {
    const doc = await this.firebaseService
      .collection('transaksi')
      .doc(id)
      .get();

    if (!doc.exists) {
      throw new NotFoundException('Transaksi tidak ditemukan');
    }

    return {
      id: doc.id,
      ...doc.data(),
    };
  }

  /**
   * Validasi voucher (untuk kantin saat transaksi)
   */
  async validasiVoucher(voucherRedemptionId: string, siswaId: string) {
    const voucherDoc = await this.firebaseService
      .collection('voucher_redemptions')
      .doc(voucherRedemptionId)
      .get();

    if (!voucherDoc.exists) {
      throw new NotFoundException('Voucher tidak ditemukan');
    }

    const voucherData = voucherDoc.data();

    if (voucherData?.siswaId !== siswaId) {
      throw new BadRequestException('Voucher bukan milik siswa ini');
    }

    if (voucherData?.isUsed) {
      throw new BadRequestException('Voucher sudah digunakan');
    }

    // Check expiry
    if (voucherData?.expiredAt) {
      const expiredAt = voucherData.expiredAt.toDate
        ? voucherData.expiredAt.toDate()
        : new Date(voucherData.expiredAt);
      if (expiredAt < new Date()) {
        throw new BadRequestException('Voucher sudah expired');
      }
    }

    return {
      valid: true,
      voucher: {
        id: voucherDoc.id,
        nama: voucherData?.voucherName,
        discountAmount: voucherData?.discountAmount,
        siswaId: voucherData?.siswaId,
      },
    };
  }
}
