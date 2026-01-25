#!/bin/bash

# Script de déploiement Android pour Route Signalement
# Usage: ./deploy-android.sh [debug|release]

set -e

MODE=${1:-debug}

echo "🚀 Déploiement Route Signalement sur Android"
echo "Mode: $MODE"
echo ""

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 1. Build Vue
echo -e "${YELLOW}📦 1. Construction du projet Vue...${NC}"
npm run build
echo -e "${GREEN}✅ Build Vue réussi${NC}"
echo ""

# 2. Sync Capacitor
echo -e "${YELLOW}🔄 2. Synchronisation avec Capacitor...${NC}"
npx cap sync android
echo -e "${GREEN}✅ Sync réussi${NC}"
echo ""

# 3. Build Android
echo -e "${YELLOW}🔨 3. Construction APK Android ($MODE)...${NC}"
cd android

if [ "$MODE" = "debug" ]; then
    ./gradlew assembleDebug
    APK_PATH="app/build/outputs/apk/debug/app-debug.apk"
    echo -e "${GREEN}✅ APK Debug généré${NC}"
elif [ "$MODE" = "release" ]; then
    echo -e "${YELLOW}⚠️  Pour la version Release, vous devez signer l'APK${NC}"
    ./gradlew assembleRelease
    APK_PATH="app/build/outputs/apk/release/app-release-unsigned.apk"
    echo -e "${GREEN}✅ APK Release généré (unsigned)${NC}"
else
    echo -e "${RED}❌ Mode invalide. Utilisez: debug ou release${NC}"
    exit 1
fi

cd ..

echo ""
echo -e "${GREEN}🎉 Déploiement terminé!${NC}"
echo ""
echo "📱 Fichier APK généré:"
echo "   $APK_PATH"
echo ""
echo "📋 Prochaines étapes:"
if [ "$MODE" = "debug" ]; then
    echo "   1. Connecter un appareil Android via USB"
    echo "   2. Activer le mode développeur"
    echo "   3. Installer: adb install -r $APK_PATH"
    echo ""
    echo "   Ou ouvrir Android Studio:"
    echo "   npx cap open android"
else
    echo "   1. Signer l'APK:"
    echo "   jarsigner -verbose -sigalg SHA1withRSA -digestalg SHA1 \\"
    echo "      -keystore mon-cle.keystore \\"
    echo "      $APK_PATH \\"
    echo "      mon-alias"
    echo ""
    echo "   2. Aligner l'APK:"
    echo "   zipalign -v 4 $APK_PATH app-release-aligned.apk"
fi
echo ""
