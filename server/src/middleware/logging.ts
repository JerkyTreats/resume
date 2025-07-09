import { Request, Response, NextFunction } from 'express';
import morgan from 'morgan';
import logger from '../services/logger';

// Custom morgan token for correlation ID
morgan.token('correlation-id', (req: Request) => req.correlationId || 'unknown');

// Custom morgan format for structured logging
const morganFormat = ':method :url :status :res[content-length] - :response-time ms - :correlation-id';

// Create morgan middleware with custom format
const morganMiddleware = morgan(morganFormat, {
  stream: {
    write: (message: string) => {
      // Parse morgan message to extract components
      const parts = message.trim().split(' ');
      const method = parts[0] || '';
      const url = parts[1] || '';
      const status = parseInt(parts[2] || '0');
      const contentLength = parts[3] || '0';
      const responseTime = parseFloat(parts[5] || '0');
      const correlationId = parts[7] || 'unknown';

      // Log with structured format only for API requests
      if (url.startsWith('/api')) {
        logger.info('HTTP Request', {
          method,
          url,
          status,
          contentLength: contentLength === '-' ? 0 : parseInt(contentLength),
          responseTime,
          correlationId
        });
      }
    }
  }
});

// Request correlation middleware
export const correlationMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  // Generate correlation ID if not present
  if (!req.correlationId) {
    req.correlationId = logger.generateCorrelationId();
  }

  // Log request start only for API requests
  if (req.originalUrl.startsWith('/api')) {
    logger.info('Request started', {
      method: req.method,
      url: req.originalUrl,
      userAgent: req.get('User-Agent'),
      ip: req.ip,
      correlationId: req.correlationId
    }, req.correlationId);
  }

  // Track response time
  const startTime = Date.now();

      // Override res.end to log request completion
  const originalEnd = res.end;
  res.end = function(chunk?: any, encoding?: any, cb?: () => void) {
    const responseTime = Date.now() - startTime;

    // Log request completion only for API requests
    if (req.originalUrl.startsWith('/api')) {
      logger.info('Request completed', {
        method: req.method,
        url: req.originalUrl,
        statusCode: res.statusCode,
        responseTime,
        contentLength: res.get('Content-Length') || 0,
        correlationId: req.correlationId
      }, req.correlationId);
    }

    return originalEnd.call(this, chunk, encoding, cb);
  };

  next();
};

// Error logging middleware
export const errorLoggingMiddleware = (err: Error, req: Request, res: Response, next: NextFunction): void => {
  logger.error('Unhandled error', err, {
    method: req.method,
    url: req.originalUrl,
    statusCode: res.statusCode,
    correlationId: req.correlationId
  }, req.correlationId);

  next(err);
};

// Performance monitoring middleware
export const performanceMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const startTime = process.hrtime.bigint();

  res.on('finish', () => {
    const endTime = process.hrtime.bigint();
    const duration = Number(endTime - startTime) / 1000000; // Convert to milliseconds

    // Log slow requests
    if (duration > 1000) { // Log requests taking more than 1 second
      logger.warn('Slow request detected', {
        method: req.method,
        url: req.originalUrl,
        duration,
        statusCode: res.statusCode,
        correlationId: req.correlationId
      }, req.correlationId);
    }
  });

  next();
};

// Export morgan middleware for direct use
export { morganMiddleware };

// Combined logging middleware
export const loggingMiddleware = [
  correlationMiddleware,
  performanceMiddleware,
  morganMiddleware
];
