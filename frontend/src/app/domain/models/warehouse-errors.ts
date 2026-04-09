export class WarehouseValidationError extends Error {
  override readonly name = 'WarehouseValidationError';

  constructor(
    public readonly field: string,
    message = 'Validación fallida.',
  ) {
    super(message);
  }
}

export class WarehouseUnauthorizedError extends Error {
  override readonly name = 'WarehouseUnauthorizedError';

  constructor(message = 'Autenticación requerida.') {
    super(message);
  }
}

export class WarehouseForbiddenError extends Error {
  override readonly name = 'WarehouseForbiddenError';

  constructor(message = 'Permisos insuficientes.') {
    super(message);
  }
}

export class WarehouseNotFoundError extends Error {
  override readonly name = 'WarehouseNotFoundError';

  constructor(message = 'Almacén no encontrado.') {
    super(message);
  }
}

export class WarehouseAlreadyExistsError extends Error {
  override readonly name = 'WarehouseAlreadyExistsError';

  constructor(message = 'Ya existe un almacén con este nombre.') {
    super(message);
  }
}

export class WarehouseHasStockError extends Error {
  override readonly name = 'WarehouseHasStockError';

  constructor(message = 'No se puede eliminar un almacén con stock existente.') {
    super(message);
  }
}

export class WarehouseApiError extends Error {
  override readonly name = 'WarehouseApiError';

  constructor(message = 'Error inesperado en la API de almacenes.') {
    super(message);
  }
}
