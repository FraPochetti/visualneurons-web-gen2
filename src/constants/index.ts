export const APP_CONFIG = {
    PHOTOS_PER_PAGE: 6,
    MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
    SUPPORTED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/webp'],
    POLLING_INTERVAL: 3000, // 3 seconds
} as const;

export const AI_PROVIDERS = {
    GEMINI: 'gemini',
    REPLICATE: 'replicate',
} as const;

export const ROUTES = {
    HOME: '/',
    DASHBOARD: '/dashboard',
    UPLOAD: '/upload',
    GENERATE_IMAGE: '/generate-image',
    STYLE_TRANSFER: '/style-transfer',
    IMAGE_CHAT: '/image-chat',
    EDIT_IMAGE: '/edit-image',
    MY_USAGE: '/my-usage',
} as const; 