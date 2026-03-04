import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';
import { App } from 'firebase-admin/app';
import { Auth } from 'firebase-admin/auth';
import { Firestore } from 'firebase-admin/firestore';

/**
 * Firebase Service
 * Menyediakan akses ke Firebase Admin SDK (Auth & Firestore)
 */
@Injectable()
export class FirebaseService implements OnModuleInit {
  private readonly logger = new Logger(FirebaseService.name);
  private firebaseApp: App;
  private firestoreDb: Firestore;
  private firebaseAuth: Auth;

  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
    this.initializeFirebase();
  }

  private initializeFirebase() {
    try {
      const projectId = this.configService.get<string>('firebase.projectId');
      const privateKey = this.configService.get<string>('firebase.privateKey');
      const clientEmail = this.configService.get<string>(
        'firebase.clientEmail',
      );

      if (!projectId || !privateKey || !clientEmail) {
        this.logger.warn(
          'Firebase credentials not fully configured. Some features may not work.',
        );
        return;
      }

      // Check if Firebase app already initialized
      if (admin.apps.length === 0) {
        this.firebaseApp = admin.initializeApp({
          credential: admin.credential.cert({
            projectId,
            privateKey,
            clientEmail,
          }),
        });
        this.logger.log('Firebase Admin SDK initialized successfully');
      } else {
        this.firebaseApp = admin.apps[0] as App;
        this.logger.log('Using existing Firebase Admin SDK instance');
      }

      this.firestoreDb = admin.firestore();
      this.firebaseAuth = admin.auth();

      // Configure Firestore settings
      this.firestoreDb.settings({
        ignoreUndefinedProperties: true,
      });
    } catch (error) {
      this.logger.error('Failed to initialize Firebase Admin SDK', error);
      throw error;
    }
  }

  /**
   * Get Firestore instance
   */
  get firestore(): Firestore {
    return this.firestoreDb;
  }

  /**
   * Get Firebase Auth instance
   */
  get auth(): Auth {
    return this.firebaseAuth;
  }

  /**
   * Verify Firebase ID Token
   * @param idToken - Token dari client
   * @returns Decoded token
   */
  async verifyIdToken(idToken: string): Promise<admin.auth.DecodedIdToken> {
    return this.firebaseAuth.verifyIdToken(idToken);
  }

  /**
   * Get user by UID from Firebase Auth
   * @param uid - User UID
   */
  async getUserByUid(uid: string): Promise<admin.auth.UserRecord> {
    return this.firebaseAuth.getUser(uid);
  }

  /**
   * Get collection reference
   * @param collectionPath - Path to collection
   */
  collection(collectionPath: string): FirebaseFirestore.CollectionReference {
    return this.firestoreDb.collection(collectionPath);
  }

  /**
   * Get document reference
   * @param documentPath - Path to document
   */
  doc(documentPath: string): FirebaseFirestore.DocumentReference {
    return this.firestoreDb.doc(documentPath);
  }

  /**
   * Run Firestore transaction
   */
  async runTransaction<T>(
    updateFunction: (transaction: FirebaseFirestore.Transaction) => Promise<T>,
  ): Promise<T> {
    return this.firestoreDb.runTransaction(updateFunction);
  }

  /**
   * Create batch write
   */
  batch(): FirebaseFirestore.WriteBatch {
    return this.firestoreDb.batch();
  }

  /**
   * Get server timestamp
   */
  get serverTimestamp(): FirebaseFirestore.FieldValue {
    return admin.firestore.FieldValue.serverTimestamp();
  }

  /**
   * Increment field value
   */
  increment(value: number): FirebaseFirestore.FieldValue {
    return admin.firestore.FieldValue.increment(value);
  }

  /**
   * Array union
   */
  arrayUnion(...elements: unknown[]): FirebaseFirestore.FieldValue {
    return admin.firestore.FieldValue.arrayUnion(...elements);
  }

  /**
   * Array remove
   */
  arrayRemove(...elements: unknown[]): FirebaseFirestore.FieldValue {
    return admin.firestore.FieldValue.arrayRemove(...elements);
  }
}
