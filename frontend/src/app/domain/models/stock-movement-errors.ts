export class StockMovementValidationError extends Error {
  override readonly name = 'StockMovementValidationError';

  constructor(
    public readonly field: string,
    message = 'Validation failed.',
  ) {
    super(message);
  }
}

export class StockMovementUnauthorizedError extends Error {
  override readonly name = 'StockMovementUnauthorizedError';

  constructor(message = 'Authentication required.') {
    super(message);
  }
}

export class StockMovementForbiddenError extends Error {
  override readonly name = 'StockMovementForbiddenError';

  constructor(message = 'Insufficient permissions.') {
    super(message);
  }
}

export class StockMovementNotFoundError extends Error {
  override readonly name = 'StockMovementNotFoundError';

  constructor(message = 'Stock movement not found.') {
    super(message);
  }
}

export class StockMovementApiError extends Error {
  override readonly name = 'StockMovementApiError';

  constructor(message = 'Unexpected stock movements API error.') {
    super(message);
  }
}
