export class SaleNotFoundError extends Error {
  override readonly name = 'SaleNotFoundError';
  constructor(message = 'Sale not found.') {
    super(message);
  }
}

export class SaleClientNotFoundError extends Error {
  override readonly name = 'SaleClientNotFoundError';
  constructor(message = 'Client not found.') {
    super(message);
  }
}

export class SaleClientNotActiveError extends Error {
  override readonly name = 'SaleClientNotActiveError';
  constructor(message = 'Client is not active and cannot receive sales.') {
    super(message);
  }
}

export class SaleProductNotFoundError extends Error {
  override readonly name = 'SaleProductNotFoundError';
  constructor(message = 'One or more products were not found.') {
    super(message);
  }
}

export class SaleProductNotActiveError extends Error {
  override readonly name = 'SaleProductNotActiveError';
  constructor(message = 'One or more products are inactive.') {
    super(message);
  }
}

export class SaleInsufficientStockError extends Error {
  override readonly name = 'SaleInsufficientStockError';
  constructor(message = 'Insufficient stock for one or more products.') {
    super(message);
  }
}

export class SaleInvalidStatusTransitionError extends Error {
  override readonly name = 'SaleInvalidStatusTransitionError';
  constructor(message = 'Invalid sale status transition.') {
    super(message);
  }
}

export class SaleNotCancellableError extends Error {
  override readonly name = 'SaleNotCancellableError';
  constructor(message = 'Sale can only be cancelled in allowed statuses.') {
    super(message);
  }
}

export class SaleTerminalStateError extends Error {
  override readonly name = 'SaleTerminalStateError';
  constructor(message = 'Sale is in a terminal state.') {
    super(message);
  }
}

export class SaleWarehouseNotFoundError extends Error {
  override readonly name = 'SaleWarehouseNotFoundError';
  constructor(message = 'Warehouse not found.') {
    super(message);
  }
}

export class SaleNotPendingError extends Error {
  override readonly name = 'SaleNotPendingError';
  constructor(message = 'Sale must be in Pending status to be edited.') {
    super(message);
  }
}

export class SaleDeliveryAddressRequiredError extends Error {
  override readonly name = 'SaleDeliveryAddressRequiredError';
  constructor(message = 'Delivery address is required.') {
    super(message);
  }
}

export class SaleNotDeletableError extends Error {
  override readonly name = 'SaleNotDeletableError';
  constructor(message = 'Only pending sales can be deleted.') {
    super(message);
  }
}

export class SaleInvalidDiscountError extends Error {
  override readonly name = 'SaleInvalidDiscountError';
  constructor(message = 'Discount cannot make the line subtotal negative.') {
    super(message);
  }
}

export class SaleLineNotFoundError extends Error {
  override readonly name = 'SaleLineNotFoundError';
  constructor(message = 'Sale line not found.') {
    super(message);
  }
}

export class SaleMinimumOneLineError extends Error {
  override readonly name = 'SaleMinimumOneLineError';
  constructor(message = 'A sale must have at least one line.') {
    super(message);
  }
}

export class SaleEmptyLinesError extends Error {
  override readonly name = 'SaleEmptyLinesError';
  constructor(message = 'At least one sale line is required.') {
    super(message);
  }
}

export class SaleUnauthorizedError extends Error {
  override readonly name = 'SaleUnauthorizedError';
  constructor(message = 'Authentication required.') {
    super(message);
  }
}

export class SaleForbiddenError extends Error {
  override readonly name = 'SaleForbiddenError';
  constructor(message = 'Insufficient permissions to manage sales.') {
    super(message);
  }
}

export class SaleApiError extends Error {
  override readonly name = 'SaleApiError';
  constructor(message = 'Unexpected sales API error.') {
    super(message);
  }
}

export class SaleValidationError extends Error {
  override readonly name = 'SaleValidationError';
  constructor(public readonly details: unknown, message = 'Sale validation failed.') {
    super(message);
  }
}
