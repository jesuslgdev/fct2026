export class CategoryValidationError extends Error {
  override readonly name = 'CategoryValidationError';

  constructor(
    public readonly details: unknown,
    message = 'Category validation failed.',
  ) {
    super(message);
  }
}

export class CategoryNotFoundError extends Error {
  override readonly name = 'CategoryNotFoundError';

  constructor(message = 'Category not found.') {
    super(message);
  }
}

export class CategoryAlreadyExistsError extends Error {
  override readonly name = 'CategoryAlreadyExistsError';

  constructor(message = 'Category name already exists.') {
    super(message);
  }
}

export class CategoryHasProductsError extends Error {
  override readonly name = 'CategoryHasProductsError';

  constructor(message = 'Category has associated products.') {
    super(message);
  }
}

export class CategoryUnauthorizedError extends Error {
  override readonly name = 'CategoryUnauthorizedError';

  constructor(message = 'Authentication required.') {
    super(message);
  }
}

export class CategoryForbiddenError extends Error {
  override readonly name = 'CategoryForbiddenError';

  constructor(message = 'Admin permissions required.') {
    super(message);
  }
}

export class CategoryApiError extends Error {
  override readonly name = 'CategoryApiError';

  constructor(message = 'Unexpected categories API error.') {
    super(message);
  }
}
