<script setup lang="ts">
import { ref, onMounted } from 'vue'

defineProps<{
  msg: string
}>()

const apiMsg = ref('Chargement...')

onMounted(async () => {
  try {
    // depuis le conteneur frontend, le service backend est accessible via "backend:8080"
    const res = await fetch('http://localhost:8080/test')
    if (!res.ok) throw new Error(await res.text())
    apiMsg.value = await res.text()
  } catch (e: any) {
    apiMsg.value = 'Erreur: ' + (e.message ?? e)
  }
})
</script>

<template>
  <div class="greetings">
    <h1 class="green">{{ msg }}</h1>
    <h3>
      You’ve successfully created a project with
      <a href="https://vite.dev/" target="_blank" rel="noopener">Vite</a> +
      <a href="https://vuejs.org/" target="_blank" rel="noopener">Vue 3</a>.
    </h3>

    <!-- afficher la réponse de l'API backend -->
    <p style="margin-top:1rem">Backend API: {{ apiMsg }}</p>
  </div>
</template>

<style scoped>
h1 {
  font-weight: 500;
  font-size: 2.6rem;
  position: relative;
  top: -10px;
}

h3 {
  font-size: 1.2rem;
}

.greetings h1,
.greetings h3 {
  text-align: center;
}

@media (min-width: 1024px) {
  .greetings h1,
  .greetings h3 {
    text-align: left;
  }
}
</style>
