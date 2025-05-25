export const APP_CONFIG = {
    PHOTOS_PER_PAGE: 6,
    MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
    SUPPORTED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/webp'],
    POLLING_INTERVAL: 3000, // 3 seconds
} as const;

export const VIDEO_RATIOS = [
    "1280:720",
    "720:1280",
    "1104:832",
    "832:1104",
    "960:960",
    "1584:672",
    "1280:768",
    "768:1280",
] as const;

export const VIDEO_DURATIONS = [5, 10] as const;

export const AI_PROVIDERS = {
    GEMINI: 'gemini',
    RUNWAY: 'runway',
    REPLICATE: 'replicate',
} as const;

export const ROUTES = {
    HOME: '/',
    DASHBOARD: '/dashboard',
    UPLOAD: '/upload',
    GENERATE_IMAGE: '/generate-image',
    GENERATE_VIDEO: '/generate-video',
    STYLE_TRANSFER: '/style-transfer',
    IMAGE_CHAT: '/image-chat',
    EDIT_IMAGE: '/edit-image',
} as const; 