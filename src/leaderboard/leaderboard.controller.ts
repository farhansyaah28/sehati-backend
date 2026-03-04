import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { LeaderboardService } from './leaderboard.service';
import { FirebaseAuthGuard } from '../auth/guards/firebase-auth.guard';

@Controller('leaderboard')
@UseGuards(FirebaseAuthGuard)
export class LeaderboardController {
  constructor(private readonly leaderboardService: LeaderboardService) {}

  /**
   * GET /api/v1/leaderboard/kelas/:kelasId
   * Leaderboard per kelas
   */
  @Get('kelas/:kelasId')
  async getLeaderboardByKelas(
    @Param('kelasId') kelasId: string,
    @Query('limit') limit?: string,
  ) {
    const leaderboard = await this.leaderboardService.getLeaderboardByKelas(
      kelasId,
      limit ? parseInt(limit, 10) : 10,
    );
    return {
      message: 'Berhasil mengambil leaderboard kelas',
      data: leaderboard,
    };
  }

  /**
   * GET /api/v1/leaderboard/sekolah
   * Leaderboard seluruh sekolah
   */
  @Get('sekolah')
  async getLeaderboardSekolah(@Query('limit') limit?: string) {
    const leaderboard = await this.leaderboardService.getLeaderboardSekolah(
      limit ? parseInt(limit, 10) : 20,
    );
    return {
      message: 'Berhasil mengambil leaderboard sekolah',
      data: leaderboard,
    };
  }

  /**
   * GET /api/v1/leaderboard/ranking-kelas
   * Ranking antar kelas
   */
  @Get('ranking-kelas')
  async getLeaderboardKelasRanking() {
    const ranking = await this.leaderboardService.getLeaderboardKelasRanking();
    return {
      message: 'Berhasil mengambil ranking kelas',
      data: ranking,
    };
  }
}
