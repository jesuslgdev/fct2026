export class WarehouseValidationError extends Error {
  override readonly name = 'WarehouseValidationError';

  constructor(
    public readonly details: unknown,
    message = 'Validation failed.',
  ) {
    super(message);
  }
}

export class WarehouseUnauthorizedError extends Error {
  override readonly name = 'WarehouseUnauthorizedError';

  constructor(message = 'Authentication required.') {
    super(message);
  }
}

export class WarehouseForbiddenError extends Error {
  override readonly name = 'WarehouseForbiddenError';

  constructor(message = 'Insufficient permissions.') {
    super(message);
  }
}

export class WarehouseNotFoundError extends Error {
  override readonly name = 'WarehouseNotFoundError';

  constructor(message = 'Warehouse not found.') {
    super(message);
  }
}

export class WarehouseAlreadyExistsError extends Error {
  override readonly name = 'WarehouseAlreadyExistsError';

  constructor(message = 'Warehouse with this name already exists.') {
    super(message);
  }
}

export class WarehouseHasStockError extends Error {
  override readonly name = 'WarehouseHasStockError';

  constructor(message = 'Cannot delete warehouse with existing stock.') {
    super(message);
  }
}

export class WarehouseApiError extends Error {
  override readonly name = 'WarehouseApiError';

  constructor(message = 'Unexpected warehouse API error.') {
    super(message);
  }
}
