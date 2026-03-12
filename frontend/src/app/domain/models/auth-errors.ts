export class AccessDeniedError extends Error {
  override readonly name = 'AccessDeniedError';

  constructor() {
    super('ACCESS_DENIED');
  }
}
