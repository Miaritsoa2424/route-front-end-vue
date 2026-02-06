import './assets/main.css'

import { createApp } from 'vue'
import { IonicVue } from '@ionic/vue'
import App from './App.vue'
import router from './router'
import { initSignalementsStore } from './stores/signalementsStore'
import { AuthService } from './services/authService'
import { NotificationService } from './services/notificationService'

/* Core CSS required for Ionic components to work properly */
import '@ionic/vue/css/core.css'

/* Basic CSS for apps built with Ionic */
import '@ionic/vue/css/normalize.css'
import '@ionic/vue/css/structure.css'
import '@ionic/vue/css/typography.css'

/* Optional CSS utils that can be commented out */
import '@ionic/vue/css/padding.css'
import '@ionic/vue/css/float-elements.css'
import '@ionic/vue/css/text-alignment.css'
import '@ionic/vue/css/text-transformation.css'
import '@ionic/vue/css/flex-utils.css'
import '@ionic/vue/css/display.css'

const app = createApp(App)
  .use(IonicVue)
  .use(router)

router.isReady().then(async () => {
  // Initialiser le store avant de monter l'app
  await initSignalementsStore()

  // Initialiser les notifications push au démarrage de l'app
  try {
    await NotificationService.initializeNotifications()
  } catch (error) {
    console.error('Erreur lors de l\'initialisation des notifications:', error)
  }

  // Écouter les changements d'état d'authentification
  AuthService.onAuthStateChanged(async (user) => {
    if (user) {
      // Sauvegarder le token FCM si en attente après connexion
      try {
        await NotificationService.onUserLogin()
      } catch (error) {
        console.error('Erreur lors de la sauvegarde du token FCM:', error)
      }
    }
  })

  app.mount('#app')
})
