<script setup lang="ts">
import { IonApp, IonRouterOutlet, IonTabs, IonTabBar, IonTabButton, IonIcon, IonLabel } from '@ionic/vue';
import { home, map, document } from 'ionicons/icons';
import { useRoute } from 'vue-router';

const route = useRoute();

const isTabRoute = () => {
  return ['Home', 'Map', 'Signalements'].includes(route.name as string);
};
</script>

<template>
  <IonApp>
    <IonRouterOutlet v-if="!isTabRoute()" />
    <IonTabs v-else>
      <IonRouterOutlet />
      <IonTabBar slot="bottom" class="custom-tab-bar">
        <IonTabButton tab="home" href="/home" class="custom-tab-button">
          <IonIcon :icon="home" />
          <IonLabel>Accueil</IonLabel>
        </IonTabButton>
        <IonTabButton tab="map" href="/map" class="custom-tab-button">
          <IonIcon :icon="map" />
          <IonLabel>Carte</IonLabel>
        </IonTabButton>
        <IonTabButton tab="signalements" href="/signalements" class="custom-tab-button">
          <IonIcon :icon="document" />
          <IonLabel>Signalements</IonLabel>
        </IonTabButton>
      </IonTabBar>
    </IonTabs>
  </IonApp>
</template>

<style>
/* Styles non-scoped pour la tab bar Ionic */
ion-tab-bar.custom-tab-bar {
  --background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
  border-top: 1px solid #e2e8f0;
  box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.08);
  padding: 8px 0 calc(12px + env(safe-area-inset-bottom, 0px));
  height: auto;
  min-height: 60px;
}

ion-tab-button.custom-tab-button {
  --color: #64748b;
  --color-selected: #1a5f7a;
  font-weight: 600;
  font-size: 11px;
  letter-spacing: 0.3px;
  min-height: 50px;
}

ion-tab-button.custom-tab-button ion-icon {
  font-size: 26px;
  margin-bottom: 4px;
}

ion-tab-button.custom-tab-button ion-label {
  font-weight: 600;
  font-size: 11px;
}
</style>
