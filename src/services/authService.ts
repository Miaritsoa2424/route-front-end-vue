import type { User } from 'firebase/auth';
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth';
import { auth } from '../firebase/firebase';

export class AuthService {
  /**
   * Connecter l'utilisateur avec email et password
   */
  static async login(email: string, password: string): Promise<User> {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      return userCredential.user;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  /**
   * Déconnecter l'utilisateur
   */
  static async logout(): Promise<void> {
    try {
      await signOut(auth);
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  /**
   * Obtenir l'utilisateur actuellement connecté
   */
  static getCurrentUser(): User | null {
    return auth.currentUser;
  }

  /**
   * Écouter les changements d'état d'authentification
   */
  static onAuthStateChanged(callback: (user: User | null) => void): () => void {
    return onAuthStateChanged(auth, callback);
  }

  /**
   * Gérer les erreurs Firebase
   */
  private static handleError(error: any): Error {
    const errorCode = error.code;
    const errorMessage = error.message;

    switch (errorCode) {
      case 'auth/user-not-found':
        return new Error('Utilisateur non trouvé. Veuillez vérifier votre email.');
      case 'auth/wrong-password':
        return new Error('Mot de passe incorrect.');
      case 'auth/invalid-email':
        return new Error('Format d\'email invalide.');
      case 'auth/user-disabled':
        return new Error('Ce compte a été désactivé.');
      case 'auth/too-many-login-attempts':
        return new Error('Trop de tentatives de connexion. Réessayez plus tard.');
      case 'auth/network-request-failed':
        return new Error('Erreur de connexion réseau.');
      default:
        return new Error(errorMessage || 'Une erreur s\'est produite.');
    }
  }
}
