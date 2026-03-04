import {
  Injectable,
  NotFoundException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { FirebaseService } from '../firebase/firebase.service';
import { UserRole } from '../common/constants/roles.constant';
import { UserData } from '../common/interfaces/user-data.interface';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

/**
 * Users Service
 * Menangani operasi CRUD untuk user di Firestore
 */
@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);
  private readonly collectionName = 'users';

  constructor(private readonly firebaseService: FirebaseService) {}

  /**
   * Create new user
   * @param createUserDto - Data user baru
   * @param createdBy - UID admin yang membuat
   */
  async create(createUserDto: CreateUserDto, createdBy: string) {
    // Check if email already exists
    const existingUser = await this.findByEmail(createUserDto.email);
    if (existingUser) {
      throw new ConflictException('Email sudah terdaftar');
    }

    // Check if NIS already exists (for siswa)
    if (createUserDto.nis) {
      const existingNis = await this.findByNis(createUserDto.nis);
      if (existingNis) {
        throw new ConflictException('NIS sudah terdaftar');
      }
    }

    // Create user in Firebase Auth first
    const userRecord = await this.firebaseService.auth.createUser({
      email: createUserDto.email,
      password: createUserDto.password,
      displayName: createUserDto.nama,
      disabled: false,
    });

    // Prepare user data for Firestore
    const userData = {
      email: createUserDto.email,
      nama: createUserDto.nama,
      role: createUserDto.role,
      isActive: true,
      coins: createUserDto.role === UserRole.SISWA ? 0 : null,
      streak: createUserDto.role === UserRole.SISWA ? 0 : null,
      nis: createUserDto.nis || null,
      kelas: createUserDto.kelas || null,
      nip: createUserDto.nip || null,
      phone: createUserDto.phone || null,
      createdAt: this.firebaseService.serverTimestamp,
      createdBy,
      updatedAt: this.firebaseService.serverTimestamp,
    };

    // Save to Firestore
    await this.firebaseService
      .collection(this.collectionName)
      .doc(userRecord.uid)
      .set(userData);

    this.logger.log(`User created: ${userRecord.uid} - ${createUserDto.email}`);

    return {
      uid: userRecord.uid,
      ...userData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  /**
   * Get all users with optional filters
   */
  async findAll(filters?: {
    role?: UserRole;
    isActive?: boolean;
    kelas?: string;
  }) {
    let query: FirebaseFirestore.Query = this.firebaseService.collection(
      this.collectionName,
    );

    if (filters?.role) {
      query = query.where('role', '==', filters.role);
    }

    if (filters?.isActive !== undefined) {
      query = query.where('isActive', '==', filters.isActive);
    }

    if (filters?.kelas) {
      query = query.where('kelas', '==', filters.kelas);
    }

    const snapshot = await query.orderBy('nama').get();

    return snapshot.docs.map((doc) => ({
      uid: doc.id,
      ...doc.data(),
    }));
  }

  /**
   * Get user by UID
   */
  async findOne(uid: string): Promise<UserData & { uid: string }> {
    const doc = await this.firebaseService
      .collection(this.collectionName)
      .doc(uid)
      .get();

    if (!doc.exists) {
      throw new NotFoundException('User tidak ditemukan');
    }

    return {
      uid: doc.id,
      ...(doc.data() as UserData),
    };
  }

  /**
   * Find user by email
   */
  async findByEmail(email: string) {
    const snapshot = await this.firebaseService
      .collection(this.collectionName)
      .where('email', '==', email)
      .limit(1)
      .get();

    if (snapshot.empty) {
      return null;
    }

    const doc = snapshot.docs[0];
    return {
      uid: doc.id,
      ...doc.data(),
    };
  }

  /**
   * Find user by NIS (for siswa)
   */
  async findByNis(nis: string) {
    const snapshot = await this.firebaseService
      .collection(this.collectionName)
      .where('nis', '==', nis)
      .limit(1)
      .get();

    if (snapshot.empty) {
      return null;
    }

    const doc = snapshot.docs[0];
    return {
      uid: doc.id,
      ...doc.data(),
    };
  }

  /**
   * Update user data
   */
  async update(uid: string, updateUserDto: UpdateUserDto, updatedBy: string) {
    const existingUser = await this.findOne(uid);

    if (!existingUser) {
      throw new NotFoundException('User tidak ditemukan');
    }

    const updateData = {
      ...updateUserDto,
      updatedAt: this.firebaseService.serverTimestamp,
      updatedBy,
    };

    // Update Firebase Auth if needed
    const updateAuthData: { email?: string; displayName?: string } = {};
    if (updateUserDto.email !== undefined) {
      updateAuthData.email = String(updateUserDto.email);
    }
    if (updateUserDto.nama !== undefined) {
      updateAuthData.displayName = String(updateUserDto.nama);
    }
    if (Object.keys(updateAuthData).length > 0) {
      await this.firebaseService.auth.updateUser(uid, updateAuthData);
    }

    // Update Firestore
    await this.firebaseService
      .collection(this.collectionName)
      .doc(uid)
      .update(updateData);

    this.logger.log(`User updated: ${uid}`);

    return this.findOne(uid);
  }

  /**
   * Soft delete (deactivate) user
   */
  async deactivate(uid: string, updatedBy: string) {
    await this.findOne(uid); // Check if exists

    await this.firebaseService.collection(this.collectionName).doc(uid).update({
      isActive: false,
      updatedAt: this.firebaseService.serverTimestamp,
      updatedBy,
    });

    // Disable in Firebase Auth
    await this.firebaseService.auth.updateUser(uid, { disabled: true });

    this.logger.log(`User deactivated: ${uid}`);

    return { message: 'User berhasil dinonaktifkan' };
  }

  /**
   * Reactivate user
   */
  async activate(uid: string, updatedBy: string) {
    await this.findOne(uid); // Check if exists

    await this.firebaseService.collection(this.collectionName).doc(uid).update({
      isActive: true,
      updatedAt: this.firebaseService.serverTimestamp,
      updatedBy,
    });

    // Enable in Firebase Auth
    await this.firebaseService.auth.updateUser(uid, { disabled: false });

    this.logger.log(`User activated: ${uid}`);

    return { message: 'User berhasil diaktifkan' };
  }

  /**
   * Update user coins (for transactions)
   */
  async updateCoins(uid: string, amount: number) {
    const user = await this.findOne(uid);

    if (user.role !== UserRole.SISWA) {
      throw new ConflictException('Hanya siswa yang memiliki coins');
    }

    const currentCoins = typeof user.coins === 'number' ? user.coins : 0;
    const newCoins = Math.max(0, currentCoins + amount);

    await this.firebaseService.collection(this.collectionName).doc(uid).update({
      coins: newCoins,
      updatedAt: this.firebaseService.serverTimestamp,
    });

    return { coins: newCoins };
  }

  /**
   * Update user streak
   */
  async updateStreak(uid: string, reset: boolean = false) {
    const user = await this.findOne(uid);

    if (user.role !== UserRole.SISWA) {
      throw new ConflictException('Hanya siswa yang memiliki streak');
    }

    const currentStreak = typeof user.streak === 'number' ? user.streak : 0;
    const newStreak = reset ? 0 : currentStreak + 1;

    await this.firebaseService.collection(this.collectionName).doc(uid).update({
      streak: newStreak,
      updatedAt: this.firebaseService.serverTimestamp,
    });

    return { streak: newStreak };
  }

  /**
   * Get users count by role
   */
  async countByRole(role: UserRole) {
    const snapshot = await this.firebaseService
      .collection(this.collectionName)
      .where('role', '==', role)
      .where('isActive', '==', true)
      .count()
      .get();

    return snapshot.data().count;
  }
}
