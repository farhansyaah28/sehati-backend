import { UserRole } from '../constants/roles.constant';

/**
 * Interface untuk data user di Firestore
 */
export interface UserData {
  uid?: string;
  email: string;
  nama: string;
  role: UserRole;
  isActive: boolean;
  coins?: number | null;
  streak?: number | null;
  nis?: string | null;
  nip?: string | null;
  kelas?: string | null;
  phone?: string | null;
  createdAt?: FirebaseFirestore.Timestamp | string;
  createdBy?: string;
  updatedAt?: FirebaseFirestore.Timestamp | string;
  updatedBy?: string;
}
