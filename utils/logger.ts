import type { LogLevel } from '@aws-lambda-powertools/logger';

// Determine log level from environment. Next.js exposes NEXT_PUBLIC_ variables to the client.
const LOG_LEVEL = (process.env.NEXT_PUBLIC_LOG_LEVEL || process.env.LOG_LEVEL || 'INFO').toUpperCase() as LogLevel;

// The logger implementation will use @aws-lambda-powertools/logger in Node
// environments and fallback to console methods in the browser.

interface LogMethods {
  debug: (...args: unknown[]) => void;
  info: (...args: unknown[]) => void;
  warn: (...args: unknown[]) => void;
  error: (...args: unknown[]) => void;
}

let logger: LogMethods;

if (typeof window === 'undefined') {
  // Dynamically require to avoid bundling in the browser
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { Logger } = require('@aws-lambda-powertools/logger');
  const base = new Logger({ logLevel: LOG_LEVEL });
  logger = {
    debug: (...args) => base.debug(...args),
    info: (...args) => base.info(...args),
    warn: (...args) => base.warn(...args),
    error: (...args) => base.error(...args),
  };
} else {
  const levels = ['DEBUG', 'INFO', 'WARN', 'ERROR'];
  const shouldLog = (level: string) =>
    levels.indexOf(level) >= levels.indexOf(LOG_LEVEL);

  logger = {
    debug: (...args) => {
      if (shouldLog('DEBUG')) console.debug(...args);
    },
    info: (...args) => {
      if (shouldLog('INFO')) console.log(...args);
    },
    warn: (...args) => {
      if (shouldLog('WARN')) console.warn(...args);
    },
    error: (...args) => {
      if (shouldLog('ERROR')) console.error(...args);
    },
  };
}

export default logger;
