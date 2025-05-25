import { logger } from './logger';

export class AppError extends Error {
    constructor(
        message: string,
        public code?: string,
        public statusCode?: number,
        public context?: Record<string, unknown>
    ) {
        super(message);
        this.name = 'AppError';
    }
}

export function handleError(error: unknown, context?: Record<string, unknown>): AppError {
    if (error instanceof AppError) {
        logger.error(error.message, { ...error.context, ...context });
        return error;
    }

    if (error instanceof Error) {
        const appError = new AppError(error.message, 'UNKNOWN_ERROR', 500, context);
        logger.error(error.message, { stack: error.stack, ...context });
        return appError;
    }

    const appError = new AppError('An unknown error occurred', 'UNKNOWN_ERROR', 500, context);
    logger.error('Unknown error', { error, ...context });
    return appError;
}

export function getErrorMessage(error: unknown): string {
    if (error instanceof Error) {
        return error.message;
    }
    return 'An unknown error occurred';
} 