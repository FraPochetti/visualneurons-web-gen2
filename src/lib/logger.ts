type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
    level: LogLevel;
    message: string;
    timestamp: string;
    context?: Record<string, unknown>;
}

class Logger {
    private isDevelopment = process.env.NODE_ENV === 'development';

    private formatMessage(level: LogLevel, message: string, context?: Record<string, unknown>): LogEntry {
        return {
            level,
            message,
            timestamp: new Date().toISOString(),
            context,
        };
    }

    private log(level: LogLevel, message: string, context?: Record<string, unknown>): void {
        const logEntry = this.formatMessage(level, message, context);

        if (this.isDevelopment) {
            // In development, use console
            const consoleMethod = level === 'debug' ? 'log' : level;
            // eslint-disable-next-line no-console
            console[consoleMethod](`[${level.toUpperCase()}] ${message}`, context || '');
        } else {
            // In production, send to monitoring service (CloudWatch, etc.)
            this.sendToMonitoring(logEntry);
        }
    }

    private sendToMonitoring(logEntry: LogEntry): void {
        // TODO: Implement CloudWatch or other monitoring service
        // For now, only log errors to console in production
        if (logEntry.level === 'error') {
            // eslint-disable-next-line no-console
            console.error(logEntry);
        }
    }

    debug(message: string, context?: Record<string, unknown>): void {
        this.log('debug', message, context);
    }

    info(message: string, context?: Record<string, unknown>): void {
        this.log('info', message, context);
    }

    warn(message: string, context?: Record<string, unknown>): void {
        this.log('warn', message, context);
    }

    error(message: string, context?: Record<string, unknown>): void {
        this.log('error', message, context);
    }
}

export const logger = new Logger(); 