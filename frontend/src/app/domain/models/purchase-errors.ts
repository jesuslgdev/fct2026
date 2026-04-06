import { PurchaseStatus } from '@domain/enums/purchase-status.enum';

export class PurchaseValidationError extends Error {
  override readonly name = 'PurchaseValidationError';

  constructor(
    public readonly details: unknown,
    message = 'Purchase validation failed.',
  ) {
    super(message);
  }
}

export class PurchaseUnauthorizedError extends Error {
  override readonly name = 'PurchaseUnauthorizedError';

  constructor(message = 'Authentication required.') {
    super(message);
  }
}

export class PurchaseForbiddenError extends Error {
  override readonly name = 'PurchaseForbiddenError';

  constructor(message = 'Insufficient permissions to manage purchases.') {
    super(message);
  }
}

export class PurchaseNotFoundError extends Error {
  override readonly name = 'PurchaseNotFoundError';

  constructor(message = 'Purchase not found.') {
    super(message);
  }
}

export class PurchaseBusinessRuleError extends Error {
  override readonly name: string = 'PurchaseBusinessRuleError';

  constructor(message = 'Purchase business rule violation.') {
    super(message);
  }
}

export class PurchaseInvalidStatusTransitionError extends PurchaseBusinessRuleError {
  override readonly name: string = 'PurchaseInvalidStatusTransitionError';

  constructor(
    public readonly fromStatus: PurchaseStatus,
    public readonly toStatus: PurchaseStatus,
    message = `Cannot change purchase status from ${fromStatus} to ${toStatus}.`,
  ) {
    super(message);
  }
}

export class PurchaseApiError extends Error {
  override readonly name = 'PurchaseApiError';

  constructor(message = 'Unexpected purchases API error.') {
    super(message);
  }
}
