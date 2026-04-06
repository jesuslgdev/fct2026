export class CategoryValidationError extends Error {
  override readonly name = 'CategoryValidationError';

  constructor(
    public readonly details: unknown,
    message = 'La validación de la categoría falló.',
  ) {
    super(message);
  }
}

export class CategoryNotFoundError extends Error {
  override readonly name = 'CategoryNotFoundError';

  constructor(message = 'Categoría no encontrada.') {
    super(message);
  }
}

export class CategoryAlreadyExistsError extends Error {
  override readonly name = 'CategoryAlreadyExistsError';

  constructor(message = 'El nombre de la categoría ya existe.') {
    super(message);
  }
}

export class CategoryHasProductsError extends Error {
  override readonly name = 'CategoryHasProductsError';

  constructor(message = 'La categoría tiene productos asociados.') {
    super(message);
  }
}

export class CategoryUnauthorizedError extends Error {
  override readonly name = 'CategoryUnauthorizedError';

  constructor(message = 'Autenticación requerida.') {
    super(message);
  }
}

export class CategoryForbiddenError extends Error {
  override readonly name = 'CategoryForbiddenError';

  constructor(message = 'Se requieren permisos de administrador.') {
    super(message);
  }
}

export class CategoryApiError extends Error {
  override readonly name = 'CategoryApiError';

  constructor(message = 'Error inesperado en la API de categorías.') {
    super(message);
  }
}
