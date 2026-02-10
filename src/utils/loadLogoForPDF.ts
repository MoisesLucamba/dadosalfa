/**
 * Utility to load the AlphaData logo as base64 for embedding in PDF documents
 */

import alphadataLogo from '@/assets/alphadata-logo.png';

let cachedLogoData: string | null = null;

export const loadLogoAsBase64 = (): Promise<string> => {
  if (cachedLogoData) return Promise.resolve(cachedLogoData);

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }
        ctx.drawImage(img, 0, 0);
        const dataUrl = canvas.toDataURL('image/png');
        cachedLogoData = dataUrl;
        resolve(dataUrl);
      } catch (e) {
        reject(e);
      }
    };
    img.onerror = () => reject(new Error('Failed to load logo image'));
    img.src = alphadataLogo;
  });
};
