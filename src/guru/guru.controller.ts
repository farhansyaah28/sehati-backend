import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { GuruService } from './guru.service';
import { FirebaseAuthGuard } from '../auth/guards/firebase-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UserRole } from '../common/constants/roles.constant';
import { CreateAbsensiDto } from './dto/create-absensi.dto';
import { CreatePelanggaranDto } from './dto/create-pelanggaran.dto';
import { ScanAbsensiDto } from './dto/scan-absensi.dto';

@Controller('guru')
@UseGuards(FirebaseAuthGuard, RolesGuard)
@Roles(UserRole.GURU)
export class GuruController {
  constructor(private readonly guruService: GuruService) {}

  /**
   * GET /api/v1/guru/dashboard
   * Dashboard guru dengan statistik
   */
  @Get('dashboard')
  async getDashboard(@CurrentUser('uid') guruId: string) {
    const dashboard = await this.guruService.getDashboard(guruId);
    return {
      message: 'Berhasil mengambil data dashboard',
      data: dashboard,
    };
  }

  /**
   * GET /api/v1/guru/siswa
   * Daftar siswa untuk absensi/pelanggaran
   */
  @Get('siswa')
  async getSiswaList(
    @Query('kelas') kelas?: string,
    @Query('search') search?: string,
  ) {
    const siswa = await this.guruService.getSiswaList({ kelas, search });
    return {
      message: 'Berhasil mengambil data siswa',
      data: siswa,
    };
  }

  /**
   * POST /api/v1/guru/absensi/scan
   * Scan barcode NIS untuk absensi
   */
  @Post('absensi/scan')
  async scanAbsensi(
    @Body() dto: ScanAbsensiDto,
    @CurrentUser('uid') guruId: string,
  ) {
    const result = await this.guruService.scanAbsensi(dto.nis, guruId);
    return {
      message: 'Absensi berhasil dicatat',
      data: result,
    };
  }

  /**
   * POST /api/v1/guru/absensi/manual
   * Input absensi manual
   */
  @Post('absensi/manual')
  async manualAbsensi(
    @Body() dto: CreateAbsensiDto,
    @CurrentUser('uid') guruId: string,
  ) {
    const result = await this.guruService.manualAbsensi(dto, guruId);
    return {
      message: 'Absensi berhasil dicatat',
      data: result,
    };
  }

  /**
   * GET /api/v1/guru/absensi/check/:siswaId
   * Check status absensi siswa hari ini
   */
  @Get('absensi/check/:siswaId')
  async checkAbsensiStatus(@Param('siswaId') siswaId: string) {
    const status = await this.guruService.checkAbsensiStatus(siswaId);
    return {
      message: 'Berhasil mengambil status absensi',
      data: status,
    };
  }

  /**
   * POST /api/v1/guru/pelanggaran
   * Input pelanggaran siswa
   */
  @Post('pelanggaran')
  async createPelanggaran(
    @Body() dto: CreatePelanggaranDto,
    @CurrentUser('uid') guruId: string,
  ) {
    const result = await this.guruService.createPelanggaran(dto, guruId);
    return {
      message: 'Pelanggaran berhasil dicatat',
      data: result,
    };
  }

  /**
   * GET /api/v1/guru/pelanggaran
   * Daftar pelanggaran
   */
  @Get('pelanggaran')
  async getPelanggaranList(
    @Query('kelas') kelas?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const pelanggaran = await this.guruService.getPelanggaranList({
      kelas,
      startDate,
      endDate,
    });
    return {
      message: 'Berhasil mengambil data pelanggaran',
      data: pelanggaran,
    };
  }

  /**
   * GET /api/v1/guru/pelanggaran/:id
   * Detail pelanggaran
   */
  @Get('pelanggaran/:id')
  async getPelanggaranDetail(@Param('id') id: string) {
    const pelanggaran = await this.guruService.getPelanggaranDetail(id);
    return {
      message: 'Berhasil mengambil detail pelanggaran',
      data: pelanggaran,
    };
  }

  /**
   * GET /api/v1/guru/jenis-pelanggaran
   * Daftar jenis pelanggaran
   */
  @Get('jenis-pelanggaran')
  async getJenisPelanggaran() {
    const jenis = await this.guruService.getJenisPelanggaran();
    return {
      message: 'Berhasil mengambil daftar jenis pelanggaran',
      data: jenis,
    };
  }

  /**
   * GET /api/v1/guru/statistik-kelas
   * Statistik per kelas
   */
  @Get('statistik-kelas')
  async getStatistikKelas() {
    const statistik = await this.guruService.getStatistikKelas();
    return {
      message: 'Berhasil mengambil statistik kelas',
      data: statistik,
    };
  }
}
