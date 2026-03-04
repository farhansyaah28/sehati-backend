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
import { KantinService } from './kantin.service';
import { FirebaseAuthGuard } from '../auth/guards/firebase-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UserRole } from '../common/constants/roles.constant';
import { CreateTransaksiDto } from './dto/create-transaksi.dto';
import { ScanSiswaDto } from './dto/scan-siswa.dto';
import { RedeemVoucherDto } from './dto/redeem-voucher.dto';
import { CreateProdukDto } from './dto/create-produk.dto';
import { UpdateProdukDto } from './dto/update-produk.dto';
import { ValidasiVoucherDto } from './dto/validasi-voucher.dto';

@Controller('kantin')
@UseGuards(FirebaseAuthGuard, RolesGuard)
@Roles(UserRole.KANTIN)
export class KantinController {
  constructor(private readonly kantinService: KantinService) {}

  /**
   * GET /api/v1/kantin/dashboard
   * Dashboard kantin
   */
  @Get('dashboard')
  async getDashboard() {
    const dashboard = await this.kantinService.getDashboard();
    return {
      message: 'Berhasil mengambil data dashboard',
      data: dashboard,
    };
  }

  /**
   * GET /api/v1/kantin/produk
   * Daftar produk kantin
   */
  @Get('produk')
  async getProdukList(
    @Query('kategori') kategori?: string,
    @Query('search') search?: string,
  ) {
    const produk = await this.kantinService.getProdukList({ kategori, search });
    return {
      message: 'Berhasil mengambil data produk',
      data: produk,
    };
  }

  /**
   * POST /api/v1/kantin/scan
   * Scan NIS untuk melihat data siswa dan voucher
   */
  @Post('scan')
  async scanSiswa(@Body() dto: ScanSiswaDto) {
    const result = await this.kantinService.scanSiswa(dto.nis);
    return {
      message: 'Berhasil mengambil data siswa',
      data: result,
    };
  }

  /**
   * POST /api/v1/kantin/transaksi
   * Buat transaksi baru
   */
  @Post('transaksi')
  async createTransaksi(
    @Body() dto: CreateTransaksiDto,
    @CurrentUser('uid') kantinId: string,
  ) {
    const result = await this.kantinService.createTransaksi(dto, kantinId);
    return {
      message: 'Transaksi berhasil dibuat',
      data: result,
    };
  }

  /**
   * GET /api/v1/kantin/transaksi
   * Riwayat transaksi
   */
  @Get('transaksi')
  async getTransaksiList(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const transaksi = await this.kantinService.getTransaksiList({
      startDate,
      endDate,
    });
    return {
      message: 'Berhasil mengambil data transaksi',
      data: transaksi,
    };
  }

  /**
   * POST /api/v1/kantin/voucher/redeem
   * Redeem voucher dengan coins (untuk siswa, tapi diakses via kantin)
   */
  @Post('voucher/redeem')
  async redeemVoucher(@Body() dto: RedeemVoucherDto) {
    const result = await this.kantinService.redeemVoucher(dto, dto.siswaId);
    return {
      message: 'Voucher berhasil ditukar',
      data: result,
    };
  }

  /**
   * GET /api/v1/kantin/produk/:id
   * Get produk by ID
   */
  @Get('produk/:id')
  async getProdukById(@Param('id') id: string) {
    const produk = await this.kantinService.getProdukById(id);
    return {
      message: 'Berhasil mengambil data produk',
      data: produk,
    };
  }

  /**
   * POST /api/v1/kantin/produk
   * Create produk baru
   */
  @Post('produk')
  async createProduk(@Body() dto: CreateProdukDto) {
    const produk = await this.kantinService.createProduk(dto);
    return {
      message: 'Produk berhasil dibuat',
      data: produk,
    };
  }

  /**
   * PUT /api/v1/kantin/produk/:id
   * Update produk
   */
  @Put('produk/:id')
  async updateProduk(@Param('id') id: string, @Body() dto: UpdateProdukDto) {
    const produk = await this.kantinService.updateProduk(id, dto);
    return {
      message: 'Produk berhasil diupdate',
      data: produk,
    };
  }

  /**
   * DELETE /api/v1/kantin/produk/:id
   * Delete produk
   */
  @Delete('produk/:id')
  async deleteProduk(@Param('id') id: string) {
    const result = await this.kantinService.deleteProduk(id);
    return {
      message: result.message,
      data: null,
    };
  }

  /**
   * POST /api/v1/kantin/transaksi/scan
   * Scan untuk transaksi (alias endpoint)
   */
  @Post('transaksi/scan')
  async scanTransaksi(@Body() dto: ScanSiswaDto) {
    const result = await this.kantinService.scanSiswa(dto.nis);
    return {
      message: 'Berhasil mengambil data siswa',
      data: result,
    };
  }

  /**
   * GET /api/v1/kantin/transaksi/:id
   * Get transaksi by ID
   */
  @Get('transaksi/:id')
  async getTransaksiById(@Param('id') id: string) {
    const transaksi = await this.kantinService.getTransaksiById(id);
    return {
      message: 'Berhasil mengambil data transaksi',
      data: transaksi,
    };
  }

  /**
   * POST /api/v1/kantin/voucher/validasi
   * Validasi voucher sebelum digunakan
   */
  @Post('voucher/validasi')
  async validasiVoucher(@Body() dto: ValidasiVoucherDto) {
    const result = await this.kantinService.validasiVoucher(
      dto.voucherRedemptionId,
      dto.siswaId,
    );
    return {
      message: 'Voucher valid',
      data: result,
    };
  }
}
