<template>
  <ion-page>
    <ion-header :translucent="true">
      <ion-toolbar>
        <ion-title>Accueil</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true">
      <ion-header collapse="condense">
        <ion-toolbar>
          <ion-title size="large">Accueil</ion-title>
        </ion-toolbar>
      </ion-header>

      <div id="container">
        <strong>Bienvenue!</strong>
        <p>Utilisez les onglets ci-dessous pour naviguer entre les pages.</p>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar } from '@ionic/vue';
</script>

<style scoped>
#container {
  text-align: center;
  position: absolute;
  left: 0;
  right: 0;
  top: 50%;
  transform: translateY(-50%);
  padding: 2rem;
}

#container::before {
  content: '🚧';
  font-size: 64px;
  display: block;
  margin-bottom: 1.5rem;
  animation: bounce 2s infinite;
}

@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

#container strong {
  font-size: 28px;
  line-height: 1.4;
  font-weight: 700;
  color: var(--route-primary);
  display: block;
  margin-bottom: 0.5rem;
}

#container p {
  font-size: 16px;
  line-height: 1.6;
  color: var(--text-secondary);
  margin: 0;
  max-width: 300px;
  margin: 0 auto;
}

#container::after {
  content: '';
  display: block;
  width: 100px;
  height: 4px;
  background: repeating-linear-gradient(
    90deg,
    var(--route-warning) 0px,
    var(--route-warning) 15px,
    transparent 15px,
    transparent 25px
  );
  margin: 2rem auto 0;
  border-radius: 2px;
}
</style>
