export type ErrorRecord = Record<string, unknown>;

export function isRecord(value: unknown): value is ErrorRecord {
  return typeof value === 'object' && value !== null;
}

export function getErrorMessage(
  error: unknown,
  fallback = 'Error inesperado',
): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  if (isRecord(error)) {
    const message = error.message;
    if (typeof message === 'string' && message.trim()) {
      return message;
    }

    if (Array.isArray(message)) {
      const normalized = message
        .filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
        .join(', ');

      if (normalized) {
        return normalized;
      }
    }

    const alt = error.error;
    if (typeof alt === 'string' && alt.trim()) {
      return alt;
    }
  }

  return fallback;
}

export function getErrorStatus(error: unknown): number | null {
  if (!isRecord(error)) {
    return null;
  }

  if (typeof error.status === 'number') {
    return error.status;
  }

  const response = error.response;
  if (isRecord(response) && typeof response.status === 'number') {
    return response.status;
  }

  return null;
}
