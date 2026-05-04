import { PurchaseStatus } from '@domain/enums/purchase-status.domain.enum';
import { UserRole } from '@domain/enums/purchase-user-role.enum';
import { PurchaseValidationError } from '@domain/models/purchase-errors';
import {
  DiscountType,
  PurchaseLine,
  PurchaseLineInput,
  PurchaseSummaryTotals,
} from '@domain/types/purchase.types';

/**
 * Formato obligatorio del numero de compra.
 */
export const PURCHASE_NUMBER_REGEX = /^COM-\d{4}-\d{4}$/;

/**
 * IVA fijo del dominio de compras: 21%.
 */
export const PURCHASE_VAT_RATE = 0.21;

const MAX_SEQUENCE_PER_YEAR = 9999;

/**
 * Redondea un valor monetario a 2 decimales.
 */
export function roundTo2Decimals(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

/**
 * Verifica si un numero de compra cumple el patron COM-YYYY-NNNN.
 */
export function isValidPurchaseNumberFormat(purchaseNumber: string): boolean {
  return PURCHASE_NUMBER_REGEX.test(purchaseNumber);
}

/**
 * Genera un numero de compra secuencial por anio con formato COM-YYYY-NNNN.
 */
export function generatePurchaseNumber(year: number, sequence: number): string {
  if (!Number.isInteger(year) || year < 1000 || year > 9999) {
    throw new PurchaseValidationError({ field: 'year', value: year }, 'Anio de compra invalido.');
  }

  if (!Number.isInteger(sequence) || sequence <= 0 || sequence > MAX_SEQUENCE_PER_YEAR) {
    throw new PurchaseValidationError(
      { field: 'sequence', value: sequence },
      'Secuencia de compra invalida.',
    );
  }

  return `COM-${year}-${String(sequence).padStart(4, '0')}`;
}

/**
 * Calcula el siguiente numero de compra para un anio dado a partir del ultimo numero conocido.
 */
export function getNextPurchaseNumber(lastPurchaseNumber: string | null, year: number): string {
  if (lastPurchaseNumber === null) {
    return generatePurchaseNumber(year, 1);
  }

  if (!isValidPurchaseNumberFormat(lastPurchaseNumber)) {
    throw new PurchaseValidationError(
      { field: 'lastPurchaseNumber', value: lastPurchaseNumber },
      'Formato de numero de compra invalido.',
    );
  }

  const [, lastYearRaw, lastSequenceRaw] = lastPurchaseNumber.split('-');
  const lastYear = Number(lastYearRaw);
  const lastSequence = Number(lastSequenceRaw);

  if (!Number.isInteger(lastYear) || !Number.isInteger(lastSequence)) {
    throw new PurchaseValidationError(
      { field: 'lastPurchaseNumber', value: lastPurchaseNumber },
      'Numero de compra no parseable.',
    );
  }

  if (lastYear !== year) {
    return generatePurchaseNumber(year, 1);
  }

  return generatePurchaseNumber(year, lastSequence + 1);
}

function calculateDiscountAmount(
  grossAmount: number,
  discountType: DiscountType,
  discountValue: number,
): number {
  if (!Number.isFinite(discountValue) || discountValue < 0) {
    throw new PurchaseValidationError(
      { field: 'discountValue', value: discountValue },
      'Descuento invalido.',
    );
  }

  if (discountType === 'percentage') {
    if (discountValue > 100) {
      throw new PurchaseValidationError(
        { field: 'discountValue', value: discountValue },
        'Descuento porcentual invalido.',
      );
    }

    return roundTo2Decimals(grossAmount * (discountValue / 100));
  }

  return roundTo2Decimals(Math.min(discountValue, grossAmount));
}

/**
 * Calcula una linea de compra con descuento (% o fijo) y subtotal final.
 */
export function calculatePurchaseLine(line: PurchaseLineInput): PurchaseLine {
  if (!Number.isFinite(line.quantity) || line.quantity <= 0) {
    throw new PurchaseValidationError(
      { field: 'line.quantity', value: line.quantity },
      'Cantidad invalida.',
    );
  }

  if (!Number.isFinite(line.unitPrice) || line.unitPrice < 0) {
    throw new PurchaseValidationError(
      { field: 'line.unitPrice', value: line.unitPrice },
      'Precio unitario invalido.',
    );
  }

  const grossAmount = roundTo2Decimals(line.quantity * line.unitPrice);
  const discountAmount = calculateDiscountAmount(
    grossAmount,
    line.discountType,
    line.discountValue,
  );
  const lineSubtotal = roundTo2Decimals(Math.max(0, grossAmount - discountAmount));

  return {
    ...line,
    discountAmount,
    lineSubtotal,
  };
}

/**
 * Reglas de validacion para forzar al menos 1 linea antes de guardar.
 */
export function hasAtLeastOneLine(lines: readonly PurchaseLineInput[]): boolean {
  return lines.length > 0;
}

/**
 * Lanza error de negocio si no hay lineas en la compra.
 */
export function assertAtLeastOneLine(lines: readonly PurchaseLineInput[]): void {
  if (!hasAtLeastOneLine(lines)) {
    throw new PurchaseValidationError(
      { field: 'lines', value: lines },
      'Debe incluir al menos una linea',
    );
  }
}

/**
 * Resumen economico global determinista:
 * subtotalGeneral = suma de subtotales de linea
 * ivaTotal = subtotalGeneral * 0.21
 * totalFinal = subtotalGeneral + ivaTotal
 */
export function calculatePurchaseTotals(
  lines: readonly PurchaseLineInput[],
): PurchaseSummaryTotals {
  const subtotalGeneral = roundTo2Decimals(
    lines.reduce((accumulator, line) => accumulator + calculatePurchaseLine(line).lineSubtotal, 0),
  );
  const ivaTotal = roundTo2Decimals(subtotalGeneral * PURCHASE_VAT_RATE);
  const totalFinal = roundTo2Decimals(subtotalGeneral + ivaTotal);

  return {
    subtotalGeneral,
    ivaTotal,
    totalFinal,
  };
}

/**
 * Si cambia el proveedor, la accion de dominio debe limpiar las lineas de forma sincrona.
 */
export function resetLinesOnSupplierChange(
  currentSupplierId: number,
  nextSupplierId: number,
  lines: readonly PurchaseLineInput[],
): PurchaseLineInput[] {
  if (currentSupplierId !== nextSupplierId) {
    return [];
  }

  return [...lines];
}

/**
 * Politica de permisos: solo Admin y Compras pueden crear, editar o cancelar compras.
 */
export function canManagePurchases(role: UserRole): boolean {
  return role === UserRole.Admin || role === UserRole.Compras;
}

/**
 * Indica si una compra puede editarse o cancelarse.
 */
export function isPurchaseMutable(status: PurchaseStatus): boolean {
  return status === PurchaseStatus.Pendiente;
}

/**
 * Si el estado no es Pendiente, todas las lineas se consideran de solo lectura.
 */
export function areLinesReadOnly(status: PurchaseStatus): boolean {
  return !isPurchaseMutable(status);
}
