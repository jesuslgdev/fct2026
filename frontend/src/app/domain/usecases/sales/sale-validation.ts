import {
  AddSaleLine,
  CreateSaleLineInput,
  SaleDiscountType,
  UpdateSale,
  UpdateSaleLine,
} from '@domain/models/sale.model';
import { SaleStatus } from '@domain/enums/sale-status.enum';
import {
  SaleDeliveryAddressRequiredError,
  SaleEmptyLinesError,
  SaleInvalidDiscountError,
  SaleValidationError,
} from '@domain/models/sale-errors';

function validateDiscount(discount: number | undefined, discountType: SaleDiscountType | undefined): void {
  if (discountType !== undefined && !['percent', 'amount'].includes(discountType)) {
    throw new SaleValidationError(
      { field: 'discountType', discountType },
      'Discount type is invalid.'
    );
  }

  if (discount === undefined) {
    return;
  }

  if (discount < 0) {
    throw new SaleInvalidDiscountError('Discount must be greater than or equal to 0.');
  }

  if (discountType === 'percent' && discount >= 100) {
    throw new SaleInvalidDiscountError('Percentage discount must be less than 100.');
  }
}

function validateLine(line: CreateSaleLineInput | AddSaleLine, index: number): void {
  if (line.productId <= 0) {
    throw new SaleValidationError(
      { field: 'lines', index, productId: line.productId },
      'All lines must have a valid product.'
    );
  }

  if (line.quantity <= 0) {
    throw new SaleValidationError(
      { field: 'lines', index, quantity: line.quantity },
      'All lines must have quantity greater than 0.'
    );
  }

  validateDiscount(line.discount, line.discountType);
}

export function normalizeSearch(search: string | undefined): string | undefined {
  const trimmedSearch = search?.trim();
  return trimmedSearch ? trimmedSearch : undefined;
}

export function validateSaleId(saleId: number): void {
  if (saleId <= 0) {
    throw new SaleValidationError({ field: 'saleId' }, 'Sale ID must be greater than 0.');
  }
}

export function validateSaleLineId(saleLineId: number): void {
  if (saleLineId <= 0) {
    throw new SaleValidationError(
      { field: 'saleLineId' },
      'Sale line ID must be greater than 0.'
    );
  }
}

export function validateWarehouseId(warehouseId: number): void {
  if (warehouseId <= 0) {
    throw new SaleValidationError(
      { field: 'warehouseId' },
      'Warehouse ID must be greater than 0.'
    );
  }
}

export function validateClientId(clientId: number): void {
  if (clientId <= 0) {
    throw new SaleValidationError({ field: 'clientId' }, 'Client ID is required.');
  }
}

export function validateCreateSaleLines(lines: CreateSaleLineInput[]): void {
  if (!lines.length) {
    throw new SaleEmptyLinesError();
  }

  lines.forEach((line, index) => validateLine(line, index));
}

export function normalizeUpdateSale(data: UpdateSale): UpdateSale {
  return {
    ...data,
    deliveryAddress: data.deliveryAddress.trim(),
  };
}

export function validateUpdateSale(data: UpdateSale): void {
  validateClientId(data.clientId);

  if (!data.deliveryAddress.trim()) {
    throw new SaleDeliveryAddressRequiredError();
  }

  validateCreateSaleLines(data.lines);
}

export function validateAddSaleLine(data: AddSaleLine): void {
  validateLine(data, 0);
}

export function validateUpdateSaleLine(data: UpdateSaleLine): void {
  if (data.quantity <= 0) {
    throw new SaleValidationError(
      { field: 'quantity', quantity: data.quantity },
      'Quantity must be greater than 0.'
    );
  }

  validateDiscount(data.discount, data.discountType);
}

export function validateAdvanceStatus(newStatus: SaleStatus): void {
  if (!Object.values(SaleStatus).includes(newStatus)) {
    throw new SaleValidationError({ field: 'newStatus' }, 'Sale status is invalid.');
  }
}
