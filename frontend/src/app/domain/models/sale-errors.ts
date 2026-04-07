export class SaleError extends Error {
  override name = 'SaleError';
  constructor(message: string) {
    super(message);
  }
}

export class SaleNotFoundError extends SaleError {
  override readonly name = 'SaleNotFoundError';
  constructor(message = 'Sale not found.') {
    super(message);
  }
}

export class SaleClientNotFoundError extends SaleError {
  override readonly name = 'SaleClientNotFoundError';
  constructor(message = 'Client not found.') {
    super(message);
  }
}

export class SaleClientNotActiveError extends SaleError {
  override readonly name = 'SaleClientNotActiveError';
  constructor(message = 'Client is not active and cannot receive sales.') {
    super(message);
  }
}

export class SaleProductNotFoundError extends SaleError {
  override readonly name = 'SaleProductNotFoundError';
  constructor(message = 'One or more products were not found.') {
    super(message);
  }
}

export class SaleProductNotActiveError extends SaleError {
  override readonly name = 'SaleProductNotActiveError';
  constructor(message = 'One or more products are inactive.') {
    super(message);
  }
}

export class SaleInsufficientStockError extends SaleError {
  override readonly name = 'SaleInsufficientStockError';
  constructor(message = 'Insufficient stock for one or more products.') {
    super(message);
  }
}

export class SaleEmptyLinesError extends SaleError {
  override readonly name = 'SaleEmptyLinesError';
  constructor(message = 'At least one sale line is required.') {
    super(message);
  }
}

export class SaleUnauthorizedError extends SaleError {
  override readonly name = 'SaleUnauthorizedError';
  constructor(message = 'Authentication required.') {
    super(message);
  }
}

export class SaleForbiddenError extends SaleError {
  override readonly name = 'SaleForbiddenError';
  constructor(message = 'Insufficient permissions to manage sales.') {
    super(message);
  }
}

export class SaleApiError extends SaleError {
  override readonly name = 'SaleApiError';
  constructor(message = 'Unexpected sales API error.') {
    super(message);
  }
}

export class SaleValidationError extends SaleError {
  override readonly name = 'SaleValidationError';
  constructor(public readonly details: unknown, message = 'Sale validation failed.') {
    super(message);
  }
}
