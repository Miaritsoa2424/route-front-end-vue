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
      <IonTabBar slot="bottom">
        <IonTabButton tab="home" href="/home">
          <IonIcon :icon="home" />
          <IonLabel>Accueil</IonLabel>
        </IonTabButton>
        <IonTabButton tab="map" href="/map">
          <IonIcon :icon="map" />
          <IonLabel>Carte</IonLabel>
        </IonTabButton>
        <IonTabButton tab="signalements" href="/signalements">
          <IonIcon :icon="document" />
          <IonLabel>Signalements</IonLabel>
        </IonTabButton>
      </IonTabBar>
    </IonTabs>
  </IonApp>
</template>

<style scoped>
</style>
