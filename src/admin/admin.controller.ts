import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { FirebaseAuthGuard } from '../auth/guards/firebase-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UserRole } from '../common/constants/roles.constant';
import { CreateUserDto, UpdateUserDto } from '../users/dto';
import { CreateKelasDto, UpdateKelasDto } from './dto/kelas.dto';
import {
  CreateVoucherDto,
  UpdateVoucherDto,
  DistributeVoucherDto,
} from './dto/voucher.dto';
import { ImportSiswaDto } from './dto/import-siswa.dto';
import { UpdateSettingsDto } from './dto/settings.dto';

@Controller('admin')
@UseGuards(FirebaseAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  // ==================== DASHBOARD & ANALYTICS ====================

  /**
   * GET /api/v1/admin/dashboard
   */
  @Get('dashboard')
  async getDashboard() {
    const dashboard = await this.adminService.getDashboard();
    return {
      message: 'Berhasil mengambil data dashboard',
      data: dashboard,
    };
  }

  /**
   * GET /api/v1/admin/analytics
   */
  @Get('analytics')
  async getAnalytics(@Query('periode') periode?: string) {
    const analytics = await this.adminService.getAnalytics(periode);
    return {
      message: 'Berhasil mengambil data analytics',
      data: analytics,
    };
  }

  // ==================== SISWA MANAGEMENT ====================

  /**
   * GET /api/v1/admin/siswa
   */
  @Get('siswa')
  async getSiswaList(
    @Query('kelas') kelas?: string,
    @Query('search') search?: string,
  ) {
    const siswa = await this.adminService.getSiswaList({ kelas, search });
    return {
      message: 'Berhasil mengambil data siswa',
      data: siswa,
    };
  }

  /**
   * GET /api/v1/admin/siswa/:id
   */
  @Get('siswa/:id')
  async getSiswaById(@Param('id') id: string) {
    const siswa = await this.adminService.getSiswaById(id);
    return {
      message: 'Berhasil mengambil data siswa',
      data: siswa,
    };
  }

  /**
   * POST /api/v1/admin/siswa
   */
  @Post('siswa')
  async createSiswa(
    @Body() dto: CreateUserDto,
    @CurrentUser('uid') adminId: string,
  ) {
    const siswa = await this.adminService.createSiswa(dto, adminId);
    return {
      message: 'Siswa berhasil dibuat',
      data: siswa,
    };
  }

  /**
   * POST /api/v1/admin/siswa/import
   */
  @Post('siswa/import')
  async importSiswa(
    @Body() dto: ImportSiswaDto,
    @CurrentUser('uid') adminId: string,
  ) {
    const result = await this.adminService.importSiswa(dto.data, adminId);
    return {
      message: `Import selesai. Berhasil: ${result.success}, Gagal: ${result.failed}`,
      data: result,
    };
  }

  /**
   * PUT /api/v1/admin/siswa/:id
   */
  @Put('siswa/:id')
  async updateSiswa(
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
    @CurrentUser('uid') adminId: string,
  ) {
    const siswa = await this.adminService.updateSiswa(id, dto, adminId);
    return {
      message: 'Siswa berhasil diupdate',
      data: siswa,
    };
  }

  /**
   * DELETE /api/v1/admin/siswa/:id
   */
  @Delete('siswa/:id')
  async deleteSiswa(
    @Param('id') id: string,
    @CurrentUser('uid') adminId: string,
  ) {
    await this.adminService.deleteSiswa(id, adminId);
    return {
      message: 'Siswa berhasil dihapus',
      data: null,
    };
  }

  // ==================== GURU MANAGEMENT ====================

  /**
   * GET /api/v1/admin/guru
   */
  @Get('guru')
  async getGuruList(@Query('search') search?: string) {
    const guru = await this.adminService.getGuruList({ search });
    return {
      message: 'Berhasil mengambil data guru',
      data: guru,
    };
  }

  /**
   * GET /api/v1/admin/guru/:id
   */
  @Get('guru/:id')
  async getGuruById(@Param('id') id: string) {
    const guru = await this.adminService.getGuruById(id);
    return {
      message: 'Berhasil mengambil data guru',
      data: guru,
    };
  }

  /**
   * POST /api/v1/admin/guru
   */
  @Post('guru')
  async createGuru(
    @Body() dto: CreateUserDto,
    @CurrentUser('uid') adminId: string,
  ) {
    const guru = await this.adminService.createGuru(dto, adminId);
    return {
      message: 'Guru berhasil dibuat',
      data: guru,
    };
  }

  /**
   * PUT /api/v1/admin/guru/:id
   */
  @Put('guru/:id')
  async updateGuru(
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
    @CurrentUser('uid') adminId: string,
  ) {
    const guru = await this.adminService.updateGuru(id, dto, adminId);
    return {
      message: 'Guru berhasil diupdate',
      data: guru,
    };
  }

  /**
   * DELETE /api/v1/admin/guru/:id
   */
  @Delete('guru/:id')
  async deleteGuru(
    @Param('id') id: string,
    @CurrentUser('uid') adminId: string,
  ) {
    await this.adminService.deleteGuru(id, adminId);
    return {
      message: 'Guru berhasil dihapus',
      data: null,
    };
  }

  // ==================== KANTIN MANAGEMENT ====================

  /**
   * GET /api/v1/admin/kantin
   */
  @Get('kantin')
  async getKantinList(@Query('search') search?: string) {
    const kantin = await this.adminService.getKantinList({ search });
    return {
      message: 'Berhasil mengambil data kantin',
      data: kantin,
    };
  }

  /**
   * GET /api/v1/admin/kantin/:id
   */
  @Get('kantin/:id')
  async getKantinById(@Param('id') id: string) {
    const kantin = await this.adminService.getKantinById(id);
    return {
      message: 'Berhasil mengambil data kantin',
      data: kantin,
    };
  }

  /**
   * POST /api/v1/admin/kantin
   */
  @Post('kantin')
  async createKantin(
    @Body() dto: CreateUserDto,
    @CurrentUser('uid') adminId: string,
  ) {
    const kantin = await this.adminService.createKantin(dto, adminId);
    return {
      message: 'Akun kantin berhasil dibuat',
      data: kantin,
    };
  }

  /**
   * PUT /api/v1/admin/kantin/:id
   */
  @Put('kantin/:id')
  async updateKantin(
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
    @CurrentUser('uid') adminId: string,
  ) {
    const kantin = await this.adminService.updateKantin(id, dto, adminId);
    return {
      message: 'Akun kantin berhasil diupdate',
      data: kantin,
    };
  }

  /**
   * DELETE /api/v1/admin/kantin/:id
   */
  @Delete('kantin/:id')
  async deleteKantin(
    @Param('id') id: string,
    @CurrentUser('uid') adminId: string,
  ) {
    await this.adminService.deleteKantin(id, adminId);
    return {
      message: 'Akun kantin berhasil dihapus',
      data: null,
    };
  }

  // ==================== KELAS MANAGEMENT ====================

  /**
   * GET /api/v1/admin/kelas
   */
  @Get('kelas')
  async getKelasList() {
    const kelas = await this.adminService.getKelasList();
    return {
      message: 'Berhasil mengambil data kelas',
      data: kelas,
    };
  }

  /**
   * GET /api/v1/admin/kelas/:id
   */
  @Get('kelas/:id')
  async getKelasById(@Param('id') id: string) {
    const kelas = await this.adminService.getKelasById(id);
    return {
      message: 'Berhasil mengambil data kelas',
      data: kelas,
    };
  }

  /**
   * POST /api/v1/admin/kelas
   */
  @Post('kelas')
  async createKelas(@Body() dto: CreateKelasDto) {
    const kelas = await this.adminService.createKelas(dto);
    return {
      message: 'Kelas berhasil dibuat',
      data: kelas,
    };
  }

  /**
   * PUT /api/v1/admin/kelas/:id
   */
  @Put('kelas/:id')
  async updateKelas(@Param('id') id: string, @Body() dto: UpdateKelasDto) {
    const kelas = await this.adminService.updateKelas(id, dto);
    return {
      message: 'Kelas berhasil diupdate',
      data: kelas,
    };
  }

  /**
   * DELETE /api/v1/admin/kelas/:id
   */
  @Delete('kelas/:id')
  async deleteKelas(@Param('id') id: string) {
    await this.adminService.deleteKelas(id);
    return {
      message: 'Kelas berhasil dihapus',
      data: null,
    };
  }

  // ==================== VOUCHER MANAGEMENT ====================

  /**
   * GET /api/v1/admin/voucher
   */
  @Get('voucher')
  async getVoucherList() {
    const vouchers = await this.adminService.getVoucherList();
    return {
      message: 'Berhasil mengambil data voucher',
      data: vouchers,
    };
  }

  /**
   * GET /api/v1/admin/voucher/:id
   */
  @Get('voucher/:id')
  async getVoucherById(@Param('id') id: string) {
    const voucher = await this.adminService.getVoucherById(id);
    return {
      message: 'Berhasil mengambil data voucher',
      data: voucher,
    };
  }

  /**
   * POST /api/v1/admin/voucher
   */
  @Post('voucher')
  async createVoucher(@Body() dto: CreateVoucherDto) {
    const voucher = await this.adminService.createVoucher(dto);
    return {
      message: 'Voucher berhasil dibuat',
      data: voucher,
    };
  }

  /**
   * POST /api/v1/admin/voucher/distribute
   */
  @Post('voucher/distribute')
  async distributeVoucher(
    @Body() dto: DistributeVoucherDto,
    @CurrentUser('uid') adminId: string,
  ) {
    const result = await this.adminService.distributeVoucher(
      dto.voucherId,
      dto.siswaIds,
      adminId,
    );
    return {
      message: `Voucher didistribusikan. Berhasil: ${result.success}, Gagal: ${result.failed}`,
      data: result,
    };
  }

  /**
   * PUT /api/v1/admin/voucher/:id
   */
  @Put('voucher/:id')
  async updateVoucher(
    @Param('id') id: string,
    @Body() dto: UpdateVoucherDto,
  ) {
    const voucher = await this.adminService.updateVoucher(id, dto);
    return {
      message: 'Voucher berhasil diupdate',
      data: voucher,
    };
  }

  /**
   * DELETE /api/v1/admin/voucher/:id
   */
  @Delete('voucher/:id')
  async deleteVoucher(@Param('id') id: string) {
    await this.adminService.deleteVoucher(id);
    return {
      message: 'Voucher berhasil dihapus',
      data: null,
    };
  }

  // ==================== LAPORAN ====================

  /**
   * GET /api/v1/admin/laporan/kepatuhan
   */
  @Get('laporan/kepatuhan')
  async getLaporanKepatuhan(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('kelas') kelas?: string,
  ) {
    const laporan = await this.adminService.getLaporanKepatuhan({
      startDate,
      endDate,
      kelas,
    });
    return {
      message: 'Berhasil mengambil laporan kepatuhan',
      data: laporan,
    };
  }

  /**
   * GET /api/v1/admin/laporan/pelanggaran
   */
  @Get('laporan/pelanggaran')
  async getLaporanPelanggaran(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('kelas') kelas?: string,
  ) {
    const laporan = await this.adminService.getLaporanPelanggaran({
      startDate,
      endDate,
      kelas,
    });
    return {
      message: 'Berhasil mengambil laporan pelanggaran',
      data: laporan,
    };
  }

  /**
   * GET /api/v1/admin/laporan/transaksi
   */
  @Get('laporan/transaksi')
  async getLaporanTransaksi(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const laporan = await this.adminService.getLaporanTransaksi({
      startDate,
      endDate,
    });
    return {
      message: 'Berhasil mengambil laporan transaksi',
      data: laporan,
    };
  }

  /**
   * GET /api/v1/admin/laporan/dampak-lingkungan
   */
  @Get('laporan/dampak-lingkungan')
  async getLaporanDampakLingkungan(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const laporan = await this.adminService.getLaporanDampakLingkungan({
      startDate,
      endDate,
    });
    return {
      message: 'Berhasil mengambil laporan dampak lingkungan',
      data: laporan,
    };
  }
}

/**
 * Settings Controller - separate from admin prefix
 */
@Controller('settings')
@UseGuards(FirebaseAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class SettingsController {
  constructor(private readonly adminService: AdminService) {}

  /**
   * GET /api/v1/settings
   */
  @Get()
  async getSettings() {
    const settings = await this.adminService.getSettings();
    return {
      message: 'Berhasil mengambil settings',
      data: settings,
    };
  }

  /**
   * PUT /api/v1/settings
   */
  @Put()
  async updateSettings(@Body() dto: UpdateSettingsDto) {
    const settings = await this.adminService.updateSettings(dto);
    return {
      message: 'Settings berhasil diupdate',
      data: settings,
    };
  }
}
