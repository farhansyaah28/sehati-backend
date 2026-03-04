import { Controller, Get, UseGuards } from '@nestjs/common';
import { SiswaService } from './siswa.service';
import { FirebaseAuthGuard } from '../auth/guards/firebase-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UserRole } from '../common/constants/roles.constant';
import type { AuthenticatedUser } from '../common/interfaces/firebase-user.interface';

@Controller('siswa')
@UseGuards(FirebaseAuthGuard, RolesGuard)
@Roles(UserRole.SISWA)
export class SiswaController {
  constructor(private readonly siswaService: SiswaService) {}

  /**
   * GET /api/v1/siswa/dashboard
   * Dashboard siswa dengan coins, streak, ranking
   */
  @Get('dashboard')
  async getDashboard(@CurrentUser() user: AuthenticatedUser) {
    const dashboard = await this.siswaService.getDashboard(user);
    return {
      message: 'Berhasil mengambil data dashboard',
      data: dashboard,
    };
  }

  /**
   * GET /api/v1/siswa/pelanggaran
   * Riwayat pelanggaran siswa
   */
  @Get('pelanggaran')
  async getPelanggaran(@CurrentUser('uid') siswaId: string) {
    const pelanggaran = await this.siswaService.getPelanggaran(siswaId);
    return {
      message: 'Berhasil mengambil data pelanggaran',
      data: pelanggaran,
    };
  }

  /**
   * GET /api/v1/siswa/transaksi
   * Riwayat transaksi siswa
   */
  @Get('transaksi')
  async getTransaksi(@CurrentUser('uid') siswaId: string) {
    const transaksi = await this.siswaService.getTransaksi(siswaId);
    return {
      message: 'Berhasil mengambil data transaksi',
      data: transaksi,
    };
  }

  /**
   * GET /api/v1/siswa/voucher
   * Voucher yang tersedia untuk ditukar
   */
  @Get('voucher')
  async getVouchers(@CurrentUser('uid') siswaId: string) {
    const vouchers = await this.siswaService.getAvailableVouchers(siswaId);
    return {
      message: 'Berhasil mengambil data voucher',
      data: vouchers,
    };
  }
}
