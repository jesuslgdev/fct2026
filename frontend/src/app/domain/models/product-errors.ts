export class ProductValidationError extends Error {
  override readonly name = 'ProductValidationError';

  constructor(
    public readonly details: unknown,
    message = 'Product validation failed.',
  ) {
    super(message);
  }
}

export class ProductNotFoundError extends Error {
  override readonly name = 'ProductNotFoundError';

  constructor(message = 'Product not found.') {
    super(message);
  }
}

export class ProductCodeAlreadyExistsError extends Error {
  override readonly name = 'ProductCodeAlreadyExistsError';

  constructor(message = 'Product code already exists.') {
    super(message);
  }
}

export class ProductUnauthorizedError extends Error {
  override readonly name = 'ProductUnauthorizedError';

  constructor(message = 'Authentication required.') {
    super(message);
  }
}

export class ProductForbiddenError extends Error {
  override readonly name = 'ProductForbiddenError';

  constructor(message = 'Insufficient permissions.') {
    super(message);
  }
}

export class ProductApiError extends Error {
  override readonly name = 'ProductApiError';

  constructor(message = 'Unexpected products API error.') {
    super(message);
  }
}
