import winston from 'winston';
import { v4 as uuidv4 } from 'uuid';

// Extend Express Request to include correlation ID
declare global {
  namespace Express {
    interface Request {
      correlationId?: string;
    }
  }
}

export interface LogContext {
  [key: string]: any;
}

export interface LogEntry {
  timestamp: string;
  level: string;
  message: string;
  correlationId?: string | undefined;
  context?: LogContext | undefined;
  requestId?: string | undefined;
  userId?: string | null | undefined;
  environment: string;
}

class Logger {
  private logger: winston.Logger;
  private environment: string;

  constructor() {
    this.environment = process.env.NODE_ENV || 'development';
    this.logger = this.createLogger();
  }

  private createLogger(): winston.Logger {
    const logLevel = this.getLogLevel();
    const transports = this.getTransports();

    return winston.createLogger({
      level: logLevel,
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
      ),
      transports,
      exitOnError: false
    });
  }

  private getLogLevel(): string {
    switch (this.environment) {
      case 'production':
        return 'info';
      case 'test':
        return 'error';
      default:
        return 'debug';
    }
  }

  private getTransports(): winston.transport[] {
    const transports: winston.transport[] = [];

    // Console transport
    if (this.environment === 'development') {
      transports.push(
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple()
          )
        })
      );
    } else {
      // Production console transport (errors only)
      transports.push(
        new winston.transports.Console({
          level: 'error',
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.json()
          )
        })
      );
    }

    // File transport
    const logDir = 'logs';
    const filename = this.environment === 'production' ? 'application.log' : 'development.log';

    transports.push(
      new winston.transports.File({
        filename: `${logDir}/${filename}`,
        maxsize: this.environment === 'production' ? 52428800 : 10485760, // 50MB : 10MB
        maxFiles: this.environment === 'production' ? 10 : 5,
        format: winston.format.combine(
          winston.format.timestamp(),
          winston.format.json()
        )
      })
    );

    return transports;
  }

  private formatLogEntry(
    level: string,
    message: string,
    context?: LogContext,
    correlationId?: string
  ): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level: level.toUpperCase(),
      message,
      correlationId,
      context,
      requestId: correlationId,
      userId: null, // Will be populated when user authentication is added
      environment: this.environment
    };
  }

  // Public logging methods
  public info(message: string, context?: LogContext, correlationId?: string): void {
    const logEntry = this.formatLogEntry('info', message, context, correlationId);
    this.logger.info(logEntry);
  }

  public error(message: string, error?: Error, context?: LogContext, correlationId?: string): void {
    const errorContext = {
      ...context,
      error: error ? {
        message: error.message,
        stack: error.stack,
        name: error.name
      } : undefined
    };
    const logEntry = this.formatLogEntry('error', message, errorContext, correlationId);
    this.logger.error(logEntry);
  }

  public warn(message: string, context?: LogContext, correlationId?: string): void {
    const logEntry = this.formatLogEntry('warn', message, context, correlationId);
    this.logger.warn(logEntry);
  }

  // Generate correlation ID
  public generateCorrelationId(): string {
    return `req-${uuidv4()}`;
  }

  // Server lifecycle logging
  public logServerStart(port: number): void {
    this.info('Server started', {
      port,
      pid: process.pid,
      nodeVersion: process.version,
      platform: process.platform
    });
  }

  public logServerShutdown(signal: string): void {
    this.info('Server shutting down', {
      signal,
      pid: process.pid
    });
  }

  // Health check logging
  public logHealthCheck(status: string, responseTime?: number): void {
    this.info('Health check performed', {
      status,
      responseTime,
      timestamp: new Date().toISOString()
    });
  }
}

// Create singleton instance
const logger = new Logger();

export default logger;
