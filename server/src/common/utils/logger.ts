/*
  Centralized Winston Logger
  - Outputs structured JSON logs to stdout (for Promtail/Loki collection)
  - Supports log levels: error, warn, info, http, debug
  - Each service should set its own SERVICE_NAME via environment variable
*/
import { createLogger, format, transports, Logger } from 'winston';

const { combine, timestamp, json, errors, printf } = format;

const SERVICE_NAME = process.env.SERVICE_NAME || 'unknown-service';
const LOG_LEVEL = process.env.LOG_LEVEL || 'info';

const winstonLogger: Logger = createLogger({
  level: LOG_LEVEL,
  defaultMeta: { service: SERVICE_NAME },
  format: combine(
    errors({ stack: true }),
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
    json(),
  ),
  transports: [
    new transports.Console(),
  ],
});

/**
 * LoggerCls — backward-compatible wrapper around Winston.
 * Existing services already import { LoggerCls } from this file,
 * so we keep the same API surface while upgrading the internals.
 */
class LoggerCls {
  static getPureError(err: unknown) {
    return JSON.parse(JSON.stringify(err, Object.getOwnPropertyNames(err)));
  }

  static info(message: string, details?: unknown): void {
    if (message) {
      winstonLogger.info(message, { meta: details ?? null });
    }
  }

  static warn(message: string, details?: unknown): void {
    if (message) {
      winstonLogger.warn(message, { meta: details ?? null });
    }
  }

  static error(message: string, details?: unknown): void {
    if (message) {
      winstonLogger.error(message, { meta: details ?? null });
    }
  }

  static http(message: string, details?: unknown): void {
    if (message) {
      winstonLogger.http(message, { meta: details ?? null });
    }
  }

  static debug(message: string, details?: unknown): void {
    if (message) {
      winstonLogger.debug(message, { meta: details ?? null });
    }
  }
}

export { LoggerCls, winstonLogger };

