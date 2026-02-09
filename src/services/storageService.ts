/**
 * Service pour gérer le stockage des images avec imgbb API
 *
 * AVANTAGES :
 * - Service gratuit et simple
 * - Compression automatique côté serveur
 * - URLs permanentes
 * - Pas de configuration Firebase complexe
 */

export class StorageService {

  // Clé API imgbb (depuis les variables d'environnement)
  private static readonly IMGBB_API_KEY = '02c82d69f8c0a91976cfe6ee32331075';
  private static readonly IMGBB_UPLOAD_URL = 'https://api.imgbb.com/1/upload';

  /**
   * Compresse une image pour réduire sa taille
   * 
   * @param dataUrl - L'image en format data:image/jpeg;base64,...
   * @param maxWidth - Largeur maximale (défaut: 1200px)
   * @param quality - Qualité JPEG de 0 à 1 (défaut: 0.7 = 70%)
   * @returns Promise<Blob> - L'image compressée en format binaire
   */
  static async compressImage(
    dataUrl: string, 
    maxWidth: number = 1200, 
    quality: number = 0.7
  ): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      
      img.onload = () => {
        // Calculer les nouvelles dimensions en gardant le ratio
        let width = img.width;
        let height = img.height;
        
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
        
        // Créer un canvas pour redimensionner
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Impossible de créer le contexte canvas'));
          return;
        }
        
        // Dessiner l'image redimensionnée
        ctx.drawImage(img, 0, 0, width, height);
        
        // Convertir en Blob avec compression JPEG
        canvas.toBlob(
          (blob) => {
            if (blob) {
              console.log(`📸 Image compressée: ${(blob.size / 1024).toFixed(1)} KB`);
              resolve(blob);
            } else {
              reject(new Error('Échec de la conversion en Blob'));
            }
          },
          'image/jpeg',
          quality
        );
      };
      
      img.onerror = () => {
        reject(new Error('Échec du chargement de l\'image'));
      };
      
      img.src = dataUrl;
    });
  }

  /**
   * Upload une image vers imgbb
   *
   * @param dataUrl - L'image en format base64 (data:image/jpeg;base64,...)
   * @param index - Index de l'image (pour les logs)
   * @returns Promise<string> - L'URL publique de l'image
   */
  static async uploadImage(
    dataUrl: string,
    index: number
  ): Promise<string> {
    if (!this.IMGBB_API_KEY) {
      throw new Error('Clé API imgbb non configurée. Ajoutez VITE_IMGBB_API_KEY dans votre fichier .env');
    }

    try {
      // Étape 1: Compresser l'image localement
      console.log(`🔄 Compression de l'image ${index + 1}...`);
      const compressedBlob = await this.compressImage(dataUrl);

      // Étape 2: Préparer les données pour imgbb avec multipart/form-data
      const formData = new FormData();
      formData.append('key', this.IMGBB_API_KEY);
      formData.append('image', compressedBlob, `signalement_image_${index}_${Date.now()}.jpg`);
      formData.append('name', `signalement_image_${index}_${Date.now()}`);

      // Étape 3: Upload vers imgbb
      console.log(`☁️ Upload de l'image ${index + 1} vers imgbb...`);
      const response = await fetch(this.IMGBB_UPLOAD_URL, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(`Upload imgbb échoué: ${result.error?.message || 'Erreur inconnue'}`);
      }

      const imageUrl = result.data.url;
      console.log(`✅ Image uploadée: ${imageUrl}`);

      return imageUrl;
    } catch (error) {
      console.error('❌ Erreur upload image vers imgbb:', error);
      throw error;
    }
  }

  /**
   * Upload plusieurs images vers imgbb
   *
   * @param dataUrls - Tableau des images en base64
   * @returns Promise<string[]> - Tableau des URLs publiques
   */
  static async uploadMultipleImages(dataUrls: string[]): Promise<string[]> {
    console.log(`📤 Upload de ${dataUrls.length} image(s) vers imgbb...`);

    const uploadPromises = dataUrls.map((dataUrl, index) =>
      this.uploadImage(dataUrl, index)
    );

    const urls = await Promise.all(uploadPromises);
    console.log(`✅ ${urls.length} image(s) uploadée(s) avec succès vers imgbb`);

    return urls;
  }

  /**
   * Vérifie si une chaîne est une URL ou un base64
   */
  static isDataUrl(str: string): boolean {
    return str.startsWith('data:image/');
  }

  /**
   * Vérifie si une chaîne est une URL imgbb
   */
  static isImgbbUrl(str: string): boolean {
    return str.includes('ibb.co') || str.includes('imgbb.com');
  }
}
