export class ClientValidationError extends Error {
  override readonly name = 'ClientValidationError';

  constructor(
    public readonly details: unknown,
    message = 'Client validation failed.',
  ) {
    super(message);
  }
}

export class ClientNotFoundError extends Error {
  override readonly name = 'ClientNotFoundError';

  constructor(message = 'Client not found.') {
    super(message);
  }
}

export class ClientAlreadyExistsError extends Error {
  override readonly name = 'ClientAlreadyExistsError';

  constructor(message = 'A client with this tax ID already exists.') {
    super(message);
  }
}

export class ClientInvalidTaxIdError extends Error {
  override readonly name = 'ClientInvalidTaxIdError';

  constructor(message = 'Invalid Spanish NIF/NIE/CIF format.') {
    super(message);
  }
}

export class ClientUnauthorizedError extends Error {
  override readonly name = 'ClientUnauthorizedError';

  constructor(message = 'Authentication required.') {
    super(message);
  }
}

export class ClientForbiddenError extends Error {
  override readonly name = 'ClientForbiddenError';

  constructor(message = 'Insufficient permissions to manage clients.') {
    super(message);
  }
}

export class ClientApiError extends Error {
  override readonly name = 'ClientApiError';

  constructor(message = 'Unexpected clients API error.') {
    super(message);
  }
}
