import { PushNotifications } from '@capacitor/push-notifications';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../firebase/firebase';
import { Capacitor } from '@capacitor/core';

// Variable pour stocker le token en attente
let pendingToken: string | null = null;

export class NotificationService {
  static async initializeNotifications() {
    if (!Capacitor.isNativePlatform()) {
      console.log('Notifications push non supportées sur le web');
      return;
    }

    console.log('=== Initialisation des notifications push ===');

    let permStatus = await PushNotifications.checkPermissions();
    console.log('Status des permissions:', permStatus);

    if (permStatus.receive === 'prompt') {
      console.log('Demande des permissions...');
      permStatus = await PushNotifications.requestPermissions();
      console.log('Permissions après demande:', permStatus);
    }

    if (permStatus.receive !== 'granted') {
      console.error('Permission pour les notifications refusée');
      return;
    }

    console.log('Permissions accordées, configuration des écouteurs...');

    // Configurer les écouteurs AVANT d'appeler register()
    PushNotifications.addListener('registration', async (token) => {
      console.log('=== FCM Token reçu ===:', token.value);
      pendingToken = token.value;
      
      // Si l'utilisateur est déjà connecté, sauvegarder immédiatement
      const currentUser = auth.currentUser;
      console.log('Utilisateur actuel:', currentUser?.email || 'non connecté');
      
      if (currentUser?.email) {
        console.log('Utilisateur connecté, sauvegarde immédiate du token...');
        await NotificationService.saveTokenToFirestore(token.value);
      } else {
        console.log('Token stocké en attente, pendingToken =', pendingToken);
      }
    });

    PushNotifications.addListener('registrationError', (error) => {
      console.error('=== Erreur de registration FCM ===:', error);
    });

    PushNotifications.addListener('pushNotificationReceived', (notification) => {
      console.log('Notification reçue:', notification);
    });

    PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
      console.log('Action sur notification:', notification);
    });

    console.log('Écouteurs configurés, enregistrement auprès de FCM...');
    await PushNotifications.register();
    console.log('=== Initialisation des notifications terminée ===');
  }

  // Appeler cette méthode après la connexion de l'utilisateur
  static async onUserLogin() {
    console.log('=== onUserLogin appelé ===');
    console.log('pendingToken:', pendingToken);
    console.log('auth.currentUser?.email:', auth.currentUser?.email);
    
    if (pendingToken && auth.currentUser?.email) {
      console.log('Sauvegarde du token en attente...');
      await NotificationService.saveTokenToFirestore(pendingToken);
      pendingToken = null;
    } else if (!pendingToken) {
      console.log('Pas de token en attente, tentative de re-register...');
      // Si pas de token, essayer de se ré-enregistrer
      if (Capacitor.isNativePlatform()) {
        try {
          await PushNotifications.register();
        } catch (e) {
          console.error('Erreur re-register:', e);
        }
      }
    }
  }

  static async saveTokenToFirestore(token: string) {
    const user = auth.currentUser;
    console.log('=== saveTokenToFirestore ===');
    console.log('Token:', token);
    console.log('User:', user?.email);
    
    if (!user || !user.email) {
      console.error('Utilisateur non connecté ou email manquant');
      return;
    }

    try {
      console.log('Création du document dans fcmTokens/' + user.email);
      const tokenDocRef = doc(db, 'fcmTokens', user.email);
      await setDoc(tokenDocRef, { 
        fcmToken: token, 
        updatedAt: serverTimestamp() 
      }, { merge: true });
      console.log('=== Token FCM sauvegardé avec succès pour:', user.email, '===');
    } catch (error) {
      console.error('=== Erreur lors de la sauvegarde du token ===:', error);
    }
  }
}