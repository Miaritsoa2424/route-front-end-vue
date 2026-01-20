<template>
  <IonPage>
    <IonContent class="ion-padding">
      <div class="login-container">
        <!-- Header -->
        <div class="login-header">
          <h1>Route Signalement</h1>
          <p>Connectez-vous à votre compte</p>
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

          <!-- Login Button -->
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
    
    // Rediriger vers la Carte après 1 seconde
    setTimeout(() => {
      router.push('/map');
    }, 1000);
  } catch (error: any) {
    errorMessage.value = error.message;
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
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.login-header {
  text-align: center;
  color: white;
  margin-bottom: 40px;
}

.login-header h1 {
  font-size: 32px;
  font-weight: bold;
  margin: 0 0 10px 0;
}

.login-header p {
  font-size: 16px;
  opacity: 0.9;
  margin: 0;
}

.login-form {
  background: white;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
}

.login-form ion-item {
  margin-bottom: 20px;
  --background: #f8f9fa;
  border-radius: 8px;
}

.login-form ion-item:last-of-type {
  margin-bottom: 20px;
}

.error-alert {
  display: flex;
  align-items: center;
  gap: 10px;
  background-color: #fee2e2;
  color: #991b1b;
  padding: 12px;
  border-radius: 8px;
  margin-bottom: 20px;
  font-size: 14px;
  border-left: 4px solid #dc2626;
}

.error-alert ion-icon {
  flex-shrink: 0;
  font-size: 20px;
}

.success-alert {
  display: flex;
  align-items: center;
  gap: 10px;
  background-color: #dcfce7;
  color: #166534;
  padding: 12px;
  border-radius: 8px;
  margin-bottom: 20px;
  font-size: 14px;
  border-left: 4px solid #22c55e;
}

.success-alert ion-icon {
  flex-shrink: 0;
  font-size: 20px;
}

.login-button {
  --background: #667eea;
  --background-hover: #5568d3;
  height: 48px;
  font-weight: 600;
  font-size: 16px;
  margin-bottom: 10px;
}

.login-button:disabled {
  --background: #cbd5e0;
}


ion-spinner {
  margin-right: 8px;
}
</style>
