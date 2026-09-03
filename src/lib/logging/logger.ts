const SENSITIVE_KEY_PATTERN =
  /password|secret|token|authorization|api[_-]?key|email|phone|ssn|dni/i;

function redactValue(key: string, value: unknown): unknown {
  if (SENSITIVE_KEY_PATTERN.test(key)) {
    return "[REDACTED]";
  }

  if (typeof value === "string" && value.includes("@")) {
    return "[REDACTED_EMAIL]";
  }

  if (value && typeof value === "object" && !Array.isArray(value)) {
    return redactRecord(value as Record<string, unknown>);
  }

  return value;
}

function redactRecord(record: Record<string, unknown>): Record<string, unknown> {
  const redacted: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(record)) {
    redacted[key] = redactValue(key, value);
  }
  return redacted;
}

export interface LogEntry {
  level: "info" | "warn" | "error";
  message: string;
  timestamp: string;
  context?: string;
  requestId?: string;
  meta?: Record<string, unknown>;
}

export function createLogger(context: string) {
  function write(level: LogEntry["level"], message: string, meta?: Record<string, unknown>, requestId?: string) {
    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      context,
      ...(requestId ? { requestId } : {}),
      ...(meta ? { meta: redactRecord(meta) } : {}),
    };

    const line = JSON.stringify(entry);
    if (level === "error") {
      console.error(line);
    } else if (level === "warn") {
      console.warn(line);
    } else {
      console.log(line);
    }
  }

  return {
    info: (message: string, meta?: Record<string, unknown>, requestId?: string) =>
      write("info", message, meta, requestId),
    warn: (message: string, meta?: Record<string, unknown>, requestId?: string) =>
      write("warn", message, meta, requestId),
    error: (message: string, meta?: Record<string, unknown>, requestId?: string) =>
      write("error", message, meta, requestId),
  };
}

export const appLogger = createLogger("coveru");
