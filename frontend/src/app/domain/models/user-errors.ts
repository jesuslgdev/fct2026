export class UserValidationError extends Error {
  override readonly name = 'UserValidationError';

  constructor(
    public readonly details: unknown,
    message = 'Validation failed.',
  ) {
    super(message);
  }
}

export class UserUnauthorizedError extends Error {
  override readonly name = 'UserUnauthorizedError';

  constructor(message = 'Authentication required.') {
    super(message);
  }
}

export class UserForbiddenError extends Error {
  override readonly name = 'UserForbiddenError';

  constructor(message = 'Insufficient permissions.') {
    super(message);
  }
}

export class UserNotFoundError extends Error {
  override readonly name = 'UserNotFoundError';

  constructor(message = 'User not found.') {
    super(message);
  }
}

export class UserAlreadyExistsError extends Error {
  override readonly name = 'UserAlreadyExistsError';

  constructor(message = 'User already exists.') {
    super(message);
  }
}

export class UserAlreadyActiveError extends Error {
  override readonly name = 'UserAlreadyActiveError';

  constructor(message = 'User is already active.') {
    super(message);
  }
}

export class UserAlreadyInactiveError extends Error {
  override readonly name = 'UserAlreadyInactiveError';

  constructor(message = 'User is already inactive.') {
    super(message);
  }
}

export class UserDeletedError extends Error {
  override readonly name = 'UserDeletedError';

  constructor(message = 'User has been deleted.') {
    super(message);
  }
}

export class UserApiError extends Error {
  override readonly name = 'UserApiError';

  constructor(message = 'Unexpected users API error.') {
    super(message);
  }
}
