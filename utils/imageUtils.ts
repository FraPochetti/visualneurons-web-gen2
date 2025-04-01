// utils/imageUtils.ts
export async function getImageAsBase64(imageUrl: string): Promise<string> {
    if (imageUrl.startsWith('data:')) {
        return imageUrl.split(',')[1];
    }
    const img = new Image();
    img.crossOrigin = 'anonymous';
    return new Promise((resolve, reject) => {
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            ctx?.drawImage(img, 0, 0);
            const dataUrl = canvas.toDataURL('image/png');
            resolve(dataUrl.split(',')[1]);
        };
        img.onerror = reject;
        img.src = imageUrl;
    });
}