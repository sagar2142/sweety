export type FieldErrors = Record<string, string>;

/**
 * An error that is safe to show to the user. The error handler turns it into
 * a JSON response: { error: { message, fields? } } with the given HTTP status.
 */
export class AppError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly fields?: FieldErrors,
  ) {
    super(message);
    this.name = 'AppError';
  }

  /** 400 – the request data is invalid. `fields` maps each bad field to its message. */
  static validation(fields: FieldErrors): AppError {
    const firstMessage = Object.values(fields)[0] ?? 'Invalid request.';
    return new AppError(400, firstMessage, fields);
  }

  static badRequest(message: string, field?: string): AppError {
    return new AppError(400, message, field ? { [field]: message } : undefined);
  }

  static unauthorized(message = 'Please log in to continue.'): AppError {
    return new AppError(401, message);
  }

  static notFound(message = 'Not found.'): AppError {
    return new AppError(404, message);
  }

  /** 409 – the request clashes with existing data (duplicate slot, full day, used email). */
  static conflict(message: string, field?: string): AppError {
    return new AppError(409, message, field ? { [field]: message } : undefined);
  }
}
