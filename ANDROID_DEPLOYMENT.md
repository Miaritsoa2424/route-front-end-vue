# Guide de Déploiement Android - Route Signalement

## 📋 Prérequis

Avant de commencer, assurez-vous d'avoir installé:
- **Node.js** (v20.19.0 ou >=22.12.0)
- **Java JDK** (version 11 ou supérieure)
- **Android SDK** (API level 33+)
- **Android Studio** (recommandé)
- **Gradle** (inclus avec Android Studio)

## 🔧 Configuration initiale (Une seule fois)

### 1. Installer les dépendances Node
```bash
npm install
```

### 2. Ajouter la plateforme Android (si non présente)
```bash
npx cap add android
```

## 🚀 Étapes de Déploiement

### 1. Construire le projet Vue
```bash
npm run build
```
Cette commande génère les fichiers optimisés dans le dossier `dist/`.

### 2. Synchroniser avec Capacitor
```bash
npx cap sync android
```
Cela copie les fichiers compilés vers le projet Android.

### 3. Ouvrir le projet Android dans Android Studio
```bash
npx cap open android
```
Ou ouvrir directement: `android/` dans Android Studio

## 📦 Générer une version APK (pour test)

### Option 1: Via Android Studio
1. Ouvrir Android Studio
2. Aller à `Build` → `Build Bundle(s) / APK(s)` → `Build APK(s)`
3. Le fichier `.apk` sera généré dans `android/app/build/outputs/apk/debug/`

### Option 2: Via ligne de commande
```bash
cd android
./gradlew assembleDebug
```
Le fichier APK sera dans: `app/build/outputs/apk/debug/app-debug.apk`

## 🔐 Générer une version Release (pour Google Play)

### 1. Créer un keystored (une seule fois)
```bash
keytool -genkey -v -keystore my-release-key.keystore -keyalg RSA -keysize 2048 -validity 10000 -alias my-key-alias
```

### 2. Générer l'APK Release
```bash
cd android
./gradlew assembleRelease -Pandroid.injected.signing.store.file=/chemin/vers/my-release-key.keystore \
  -Pandroid.injected.signing.store.password=VOTRE_PASSWORD \
  -Pandroid.injected.signing.key.alias=my-key-alias \
  -Pandroid.injected.signing.key.password=VOTRE_PASSWORD
```

### 3. Ou générer Bundle AAB (recommandé pour Google Play)
```bash
./gradlew bundleRelease -Pandroid.injected.signing.store.file=/chemin/vers/my-release-key.keystore \
  -Pandroid.injected.signing.store.password=VOTRE_PASSWORD \
  -Pandroid.injected.signing.key.alias=my-key-alias \
  -Pandroid.injected.signing.key.password=VOTRE_PASSWORD
```

Le fichier `.aab` sera dans: `app/build/outputs/bundle/release/app-release.aab`

## 📱 Installer sur un appareil Android

### Via USB (Développement)
```bash
adb install android/app/build/outputs/apk/debug/app-debug.apk
```

### Via Android Studio
1. Connecter l'appareil via USB
2. Activer "Mode développeur" sur l'appareil
3. Cliquer sur le bouton "Run" (▶) dans Android Studio

## ☁️ Charger sur Google Play Console

1. Aller sur [Google Play Console](https://play.google.com/console)
2. Créer une nouvelle application
3. Remplir les détails (nom, description, captures d'écran, etc.)
4. Aller à `Version de votre application` → `Versions de production`
5. Télécharger le fichier `.aab`
6. Soumettre pour examen

## 🔄 Workflow de développement

Pour chaque modification:
```bash
# 1. Modifier le code Vue
# 2. Build le projet
npm run build

# 3. Synchroniser avec Capacitor
npx cap sync android

# 4. Ouvrir dans Android Studio (optionnel)
npx cap open android

# 5. Tester sur émulateur ou appareil
```

## 🐛 Dépannage

### APK ne s'installe pas
- Vérifier que l'appareil est en mode développeur
- Désactiver les apps de même ID: `adb uninstall com.example.routesignalement`

### Erreurs de build
```bash
# Nettoyer le projet
cd android
./gradlew clean

# Reconstruire
./gradlew assembleDebug
```

### Problèmes de géolocalisation sur Android
- Vérifier les permissions dans `android/app/src/AndroidManifest.xml`
- Demander l'accès à la géolocalisation au runtime sur Android 6+

## 📝 Configuration des permissions (déjà dans AndroidManifest.xml)

```xml
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
<uses-permission android:name="android.permission.INTERNET" />
```

## 📌 Informations importantes

- **App ID**: `com.example.routesignalement`
- **App Name**: `Route Signalement`
- **Min SDK**: 21
- **Target SDK**: 33+

## 🔗 Ressources utiles

- [Capacitor Android Docs](https://capacitorjs.com/docs/android)
- [Ionic Vue Guide](https://ionicframework.com/docs/vue/overview)
- [Google Play Console](https://play.google.com/console)
- [Android Studio Guide](https://developer.android.com/studio)

