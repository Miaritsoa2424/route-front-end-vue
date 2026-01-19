import { createRouter, createWebHistory } from '@ionic/vue-router';
import type { RouteRecordRaw } from 'vue-router';
import LoginView from '../views/LoginView.vue';
import Home from '../views/Home.vue';
import Map from '../views/Map.vue';
import Signalements from '../views/Signalements.vue';
import CreateSignalement from '../views/CreateSignalement.vue';

const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    redirect: '/login'
  },
  {
    path: '/login',
    name: 'Login',
    component: LoginView
  },
  {
    path: '/home',
    name: 'Home',
    component: Home
  },
  {
    path: '/map',
    name: 'Map',
    component: Map
  },
  {
    path: '/signalements',
    name: 'Signalements',
    component: Signalements
  },
  {
    path: '/create-signalement',
    name: 'CreateSignalement',
    component: CreateSignalement
  }
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
});

export default router;
