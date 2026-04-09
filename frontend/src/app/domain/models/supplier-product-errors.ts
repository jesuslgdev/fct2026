export class SupplierProductValidationError extends Error {
  override readonly name = 'SupplierProductValidationError';

  constructor(
    public readonly details: unknown,
    message = 'Supplier product validation failed.',
  ) {
    super(message);
  }
}

export class SupplierProductUnauthorizedError extends Error {
  override readonly name = 'SupplierProductUnauthorizedError';

  constructor(message = 'Authentication required.') {
    super(message);
  }
}

export class SupplierProductForbiddenError extends Error {
  override readonly name = 'SupplierProductForbiddenError';

  constructor(message = 'Insufficient permissions.') {
    super(message);
  }
}

export class SupplierProductNotFoundError extends Error {
  override readonly name = 'SupplierProductNotFoundError';

  constructor(message = 'Supplier product association not found.') {
    super(message);
  }
}

export class SupplierProductDuplicateError extends Error {
  override readonly name = 'SupplierProductDuplicateError';

  constructor(message = 'Product already associated with this supplier.') {
    super(message);
  }
}

export class SupplierProductSupplierInactiveError extends Error {
  override readonly name = 'SupplierProductSupplierInactiveError';

  constructor(message = 'Supplier is not active.') {
    super(message);
  }
}

export class SupplierProductItemInactiveError extends Error {
  override readonly name = 'SupplierProductItemInactiveError';

  constructor(message = 'Product is not active.') {
    super(message);
  }
}

export class SupplierProductApiError extends Error {
  override readonly name = 'SupplierProductApiError';

  constructor(message = 'Unexpected supplier product API error.') {
    super(message);
  }
}
