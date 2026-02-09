# front-route

This template should help get you started developing with Vue 3 in Vite.

## Recommended IDE Setup

[VS Code](https://code.visualstudio.com/) + [Vue (Official)](https://marketplace.visualstudio.com/items?itemName=Vue.volar) (and disable Vetur).

## Recommended Browser Setup

- Chromium-based browsers (Chrome, Edge, Brave, etc.):
  - [Vue.js devtools](https://chromewebstore.google.com/detail/vuejs-devtools/nhdogjmejiglipccpnnnanhbledajbpd)
  - [Turn on Custom Object Formatter in Chrome DevTools](http://bit.ly/object-formatters)
- Firefox:
  - [Vue.js devtools](https://addons.mozilla.org/en-US/firefox/addon/vue-js-devtools/)
  - [Turn on Custom Object Formatter in Firefox DevTools](https://fxdx.dev/firefox-devtools-custom-object-formatters/)

## Type Support for `.vue` Imports in TS

TypeScript cannot handle type information for `.vue` imports by default, so we replace the `tsc` CLI with `vue-tsc` for type checking. In editors, we need [Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar) to make the TypeScript language service aware of `.vue` types.

## Customize configuration

See [Vite Configuration Reference](https://vite.dev/config/).

## Configuration imgbb

Ce projet utilise [imgbb](https://imgbb.com/) pour stocker les images des signalements.

### Étapes de configuration :

1. **Créer un compte imgbb** : Allez sur [https://imgbb.com/](https://imgbb.com/) et créez un compte gratuit.

2. **Obtenir votre clé API** :
   - Connectez-vous à votre compte imgbb
   - Allez dans vos paramètres API
   - Copiez votre clé API

3. **Configurer les variables d'environnement** :
   ```sh
   cp .env.example .env
   ```
   Puis éditez le fichier `.env` et remplacez `votre_cle_api_imgbb_ici` par votre vraie clé API :
   ```
   VITE_IMGBB_API_KEY=votre_vraie_cle_api_ici
   ```

### Comment ça fonctionne :

- 📸 **Compression locale** : Les images sont compressées en JPEG (qualité 70%) avant l'envoi
- 📦 **Upload multipart/form-data** : Les images compressées sont envoyées directement en binaire via FormData
- ☁️ **Stockage imgbb** : imgbb héberge les images et fournit des URLs permanentes
- 🔗 **Stockage URL** : Seule l'URL de l'image est stockée dans Firestore
- 💰 **Économique** : Réduction massive des coûts Firestore et des performances améliorées

## Project Setup

```sh
npm install
```

### Compile and Hot-Reload for Development

```sh
npm run dev
```

### Type-Check, Compile and Minify for Production

```sh
npm run build
```
