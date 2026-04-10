export class StockDistributionValidationError extends Error {
  override readonly name = 'StockDistributionValidationError';

  constructor(
    public readonly details: unknown,
    message = 'Stock distribution validation failed.',
  ) {
    super(message);
  }
}

export class StockDistributionNotFoundError extends Error {
  override readonly name = 'StockDistributionNotFoundError';

  constructor(message = 'Stock distribution record not found.') {
    super(message);
  }
}

export class InvalidQuantityError extends Error {
  override readonly name = 'InvalidQuantityError';

  constructor(message = 'Quantity must be greater than or equal to 0.') {
    super(message);
  }
}

export class ReasonTooLongError extends Error {
  override readonly name = 'ReasonTooLongError';

  constructor(message = 'Reason cannot exceed 300 characters.') {
    super(message);
  }
}

export class WarehouseNotFoundError extends Error {
  override readonly name = 'WarehouseNotFoundError';

  constructor(message = 'Warehouse not found.') {
    super(message);
  }
}

export class ProductNotFoundError extends Error {
  override readonly name = 'ProductNotFoundError';

  constructor(message = 'Product not found.') {
    super(message);
  }
}

export class ProductNotActiveError extends Error {
  override readonly name = 'ProductNotActiveError';

  constructor(message = 'Product is not active.') {
    super(message);
  }
}

export class StockDistributionApiError extends Error {
  override readonly name = 'StockDistributionApiError';

  constructor(message = 'Unexpected error in stock distribution API.') {
    super(message);
  }
}
