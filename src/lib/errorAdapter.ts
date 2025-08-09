export interface OperationErrorPayload {
    code?: 'RATE_LIMIT' | 'TIMEOUT' | 'INVALID_INPUT' | 'PROVIDER_ERROR' | 'NETWORK_ERROR' | 'UNKNOWN' | string;
    message: string;
    retryAfter?: number | null;
    provider?: string | null;
    operation?: string | null;
    requestId?: string | null;
}

export interface FriendlyError {
    userMessage: string;
    details?: string;
    canRetry: boolean;
}

export function toFriendlyError(error: OperationErrorPayload): FriendlyError {
    const code = (error.code || 'UNKNOWN').toUpperCase();
    const provider = (error.provider || '').toLowerCase();

    switch (code) {
        case 'RATE_LIMIT': {
            const minutes = error.retryAfter ? Math.max(1, Math.ceil((error.retryAfter as number) / 60)) : undefined;
            const wait = minutes ? ` Try again in about ${minutes} min.` : '';
            return {
                userMessage: `You\'ve hit the hourly limit.${wait}`,
                details: error.message,
                canRetry: true,
            };
        }
        case 'TIMEOUT':
            return {
                userMessage: 'The request took too long. Please try again in a moment or simplify your prompt.',
                details: error.message,
                canRetry: true,
            };
    case 'INVALID_INPUT': {
      // If provider indicates API key or auth issues but came through as INVALID_INPUT, upgrade UX to provider error
      const msg = (error.message || '').toLowerCase();
      if (msg.includes('api key') || msg.includes('apikey') || msg.includes('unauthorized')) {
        return {
          userMessage: 'This provider is misconfigured. Please choose a different provider for now.',
          details: error.message,
          canRetry: false,
        };
      }
      return {
        userMessage: 'Your input seems invalid. Please adjust and try again.',
        details: error.message,
        canRetry: true,
      };
    }
        case 'NETWORK_ERROR':
            return {
                userMessage: 'Network issue detected. Please check your connection and try again.',
                details: error.message,
                canRetry: true,
            };
        case 'PROVIDER_ERROR': {
            // Special UX for deprecated/misconfigured Gemini image generation
            if (provider === 'gemini') {
                return {
                    userMessage: 'Google Gemini image generation is not currently available. Please choose a different provider.',
                    details: error.message,
                    canRetry: false,
                };
            }
            return {
                userMessage: 'The AI service is temporarily unavailable. Please try another provider or try again later.',
                details: error.message,
                canRetry: false,
            };
        }
        default:
            return {
                userMessage: 'Something went wrong. Please try again or use a different provider.',
                details: error.message,
                canRetry: true,
            };
    }
}


