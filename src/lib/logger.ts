type LogContext = Record<string, unknown>

const SENSITIVE_KEY_PATTERN = /hand|tile|tiles|password|token|secret|key|session/i

function sanitizeValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return `[array:${value.length}]`
  }

  if (!value || typeof value !== 'object') {
    return value
  }

  if (value instanceof Error) {
    return {
      name: value.name,
      message: value.message,
    }
  }

  return Object.fromEntries(
    Object.entries(value as LogContext).map(([key, nestedValue]) => [
      key,
      SENSITIVE_KEY_PATTERN.test(key) ? '[redacted]' : sanitizeValue(nestedValue),
    ]),
  )
}

function sanitizeContext(context?: LogContext) {
  if (!context) {
    return undefined
  }

  return sanitizeValue(context)
}

export function logDebug(message: string, context?: LogContext) {
  if (import.meta.env.DEV) {
    console.debug(message, sanitizeContext(context) ?? '')
  }
}

export function logWarn(message: string, context?: LogContext) {
  if (import.meta.env.DEV) {
    console.warn(message, sanitizeContext(context) ?? '')
  }
}

export function logError(message: string, context?: LogContext) {
  if (import.meta.env.DEV) {
    console.error(message, sanitizeContext(context) ?? '')
  }
}
