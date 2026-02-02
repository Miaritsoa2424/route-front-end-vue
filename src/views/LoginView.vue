<template>
  <IonPage>
    <IonContent class="ion-padding">
      <div class="login-container">
        <!-- Header -->
        <div class="login-header">
          <h1>Route Signalement</h1>
          <p v-if="!isBlocked">Connectez-vous à votre compte</p>
          <p v-else class="blocked-message">Votre compte est bloqué après 3 tentatives. Contactez un administrateur pour le débloquer.</p>
        </div>

        <!-- Form -->
        <form @submit.prevent="handleLogin" class="login-form">
          <!-- Email Input -->
          <IonItem>
            <IonLabel position="floating">Email</IonLabel>
            <IonInput
              v-model="email"
              type="email"
              placeholder="votre@email.com"
              :disabled="isBlocked"
              required
            />
          </IonItem>

          <!-- Password Input -->
          <IonItem>
            <IonLabel position="floating">Mot de passe</IonLabel>
            <IonInput
              v-model="password"
              type="password"
              placeholder="••••••••"
              :disabled="isBlocked"
              required
            />
          </IonItem>

          <!-- Error Alert -->
          <div v-if="errorMessage" class="error-alert">
            <IonIcon icon="alertCircle" />
            <span>{{ errorMessage }}</span>
          </div>

          <!-- Success Alert -->
          <div v-if="successMessage" class="success-alert">
            <IonIcon icon="checkmarkCircle" />
            <span>{{ successMessage }}</span>
          </div>

          <IonButton
            type="submit"
            expand="block"
            class="login-button"
            :disabled="isLoading || !email || !password"
          >
            <IonSpinner v-if="isLoading" name="crescent" />
            <span v-else>Se connecter</span>
          </IonButton>
        </form>
      </div>
    </IonContent>
  </IonPage>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import {
  IonPage,
  IonContent,
  IonItem,
  IonLabel,
  IonInput,
  IonButton,
  IonIcon,
  IonSpinner
} from '@ionic/vue';
import { alertCircle, checkmarkCircle } from 'ionicons/icons';
import { AuthService } from '../services/authService';

const router = useRouter();

const email = ref('');
const password = ref('');
const isLoading = ref(false);
const errorMessage = ref('');
const successMessage = ref('');
const isBlocked = ref(false);  // Flag pour bloquer l'UI

const handleLogin = async () => {
  errorMessage.value = '';
  successMessage.value = '';

  // Validation
  if (!email.value || !password.value) {
    errorMessage.value = 'Veuillez remplir tous les champs.';
    return;
  }

  isLoading.value = true;

  try {
    await AuthService.login(email.value, password.value);
    successMessage.value = 'Connexion réussie! Redirection...';
    isBlocked.value = false;  // Réinitialiser si connexion réussie
    
    // Rediriger vers la Carte après 1 seconde
    setTimeout(() => {
      router.push('/map');
    }, 1000);
  } catch (error: any) {
    // Gérer les erreurs
    let userMessage = 'Erreur de connexion.';
    
    if (error.message.includes('bloqué')) {
      userMessage = error.message;
      isBlocked.value = true;  // Bloquer l'UI
    } else {
      // Autres erreurs Firebase
      if (error.code === 'auth/user-not-found') {
        userMessage = 'Cet email n\'existe pas.';
      } else if (error.code === 'auth/wrong-password') {
        userMessage = 'Mot de passe incorrect.';
      } else if (error.code === 'auth/invalid-email') {
        userMessage = 'Adresse email invalide.';
      } else if (error.code === 'auth/too-many-requests') {
        userMessage = 'Trop de tentatives. Réessayez plus tard.';
      } else if (error.code === 'auth/network-request-failed') {
        userMessage = 'Erreur réseau.';
      }
    }
    
    errorMessage.value = userMessage;
  } finally {
    isLoading.value = false;
  }
};
</script>

<style scoped>
.login-container {
  display: flex;
  flex-direction: column;
  justify-content: center;
  min-height: 100vh;
  padding: 20px;
  background: linear-gradient(135deg, var(--route-primary) 0%, var(--route-primary-light) 50%, var(--route-accent) 100%);
  position: relative;
  overflow: hidden;
}

.login-container::before {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 100px;
  background: repeating-linear-gradient(
    90deg,
    rgba(255, 255, 255, 0.1) 0px,
    rgba(255, 255, 255, 0.1) 30px,
    transparent 30px,
    transparent 60px
  );
  opacity: 0.3;
}

.login-container::after {
  content: '';
  position: absolute;
  top: -50%;
  right: -50%;
  width: 100%;
  height: 100%;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.1) 0%, transparent 70%);
  pointer-events: none;
}

.login-header {
  text-align: center;
  color: white;
  margin-bottom: 40px;
  position: relative;
  z-index: 1;
}

.login-header::before {
  content: '🚧';
  font-size: 48px;
  display: block;
  margin-bottom: 1rem;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.1); }
}

.login-header h1 {
  font-size: 32px;
  font-weight: 800;
  margin: 0 0 10px 0;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  letter-spacing: 1px;
}

.login-header p {
  font-size: 16px;
  opacity: 0.9;
  margin: 0;
  font-weight: 500;
}

.login-form {
  background: white;
  border-radius: var(--card-radius);
  padding: 28px;
  margin-bottom: 20px;
  box-shadow: var(--shadow-xl);
  position: relative;
  z-index: 1;
  animation: slideUp 0.5s ease-out;
}

@keyframes slideUp {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

.login-form ion-item {
  margin-bottom: 20px;
  --background: var(--bg-primary);
  border-radius: 12px;
  --padding-top: 20px;
  --padding-bottom: 8px;
  --padding-start: 16px;
  --padding-end: 16px;
  border: 2px solid var(--border-light);
  transition: all 0.3s ease;
}

.login-form ion-item:focus-within {
  border-color: var(--route-primary);
  box-shadow: 0 0 0 3px rgba(26, 95, 122, 0.1);
}

.login-form ion-label {
  margin-bottom: 12px;
  font-weight: 600;
  color: var(--text-primary);
}

.login-form ion-input {
  --padding-top: 8px;
  --padding-bottom: 8px;
  font-weight: 500;
}

.login-form ion-item:last-of-type {
  margin-bottom: 20px;
}

.error-alert {
  display: flex;
  align-items: center;
  gap: 12px;
  background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
  color: var(--route-danger-dark);
  padding: 14px 16px;
  border-radius: 12px;
  margin-bottom: 20px;
  font-size: 14px;
  border-left: 4px solid var(--route-danger);
  font-weight: 500;
  animation: shake 0.5s ease-out;
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-5px); }
  75% { transform: translateX(5px); }
}

.error-alert ion-icon {
  flex-shrink: 0;
  font-size: 22px;
  color: var(--route-danger);
}

.success-alert {
  display: flex;
  align-items: center;
  gap: 12px;
  background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%);
  color: var(--route-accent-dark);
  padding: 14px 16px;
  border-radius: 12px;
  margin-bottom: 20px;
  font-size: 14px;
  border-left: 4px solid var(--route-accent);
  font-weight: 500;
}

.success-alert ion-icon {
  flex-shrink: 0;
  font-size: 22px;
  color: var(--route-accent);
}

.login-button {
  --background: var(--gradient-primary);
  --background-hover: var(--route-primary-dark);
  height: 52px;
  font-weight: 700;
  font-size: 16px;
  margin-bottom: 10px;
  --border-radius: var(--button-radius);
  --box-shadow: var(--shadow-md);
  letter-spacing: 0.5px;
}

.login-button:hover {
  transform: translateY(-2px);
  --box-shadow: var(--shadow-lg);
}

.login-button:disabled {
  --background: var(--bg-tertiary);
  --box-shadow: none;
}

ion-spinner {
  margin-right: 8px;
  --color: white;
}
</style>
