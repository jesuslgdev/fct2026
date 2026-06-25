import { SaleStatus } from '@domain/enums/sale-status.enum';
import { BadgeVariant } from '@shared/ui';

export function getSaleStatusLabel(status: SaleStatus | string): string {
  switch (status) {
    case SaleStatus.PENDING:
    case 'pending':
      return 'Pendiente';
    case SaleStatus.APPROVED:
    case 'approved':
      return 'Aprobada';
    case SaleStatus.IN_PROCESS:
    case 'inprocess':
    case 'in process':
    case 'in_process':
      return 'En proceso';
    case SaleStatus.SHIPPED:
    case 'shipped':
      return 'Enviada';
    case SaleStatus.DELIVERED:
    case 'delivered':
      return 'Entregada';
    case SaleStatus.CANCELLED:
    case 'cancelled':
      return 'Cancelada';
    default:
      return status;
  }
}

export function getSaleStatusBadgeVariant(status: SaleStatus): BadgeVariant {
  switch (status) {
    case SaleStatus.PENDING:
      return 'warning';
    case SaleStatus.APPROVED:
      return 'info';
    case SaleStatus.IN_PROCESS:
      return 'secondary';
    case SaleStatus.SHIPPED:
      return 'contrast';
    case SaleStatus.DELIVERED:
      return 'success';
    case SaleStatus.CANCELLED:
      return 'danger';
    default:
      return 'default';
  }
}

export function getSaleStatusBadgeIcon(status: SaleStatus): string {
  switch (status) {
    case SaleStatus.PENDING:
      return 'pi pi-clock';
    case SaleStatus.CANCELLED:
      return 'pi pi-times-circle';
    case SaleStatus.DELIVERED:
      return 'pi pi-check-circle';
    default:
      return 'pi pi-check';
  }
}

export function getNextLifecycleSaleStatus(
  allowedTransitions: readonly SaleStatus[],
): SaleStatus | null {
  for (const status of allowedTransitions) {
    if (status !== SaleStatus.CANCELLED) {
      return status;
    }
  }

  return null;
}

export function getSaleAdvanceActionLabel(status: SaleStatus): string {
  switch (status) {
    case SaleStatus.APPROVED:
      return 'Aprobar';
    case SaleStatus.IN_PROCESS:
      return 'Pasar a En proceso';
    case SaleStatus.SHIPPED:
      return 'Marcar como enviada';
    case SaleStatus.DELIVERED:
      return 'Marcar como entregada';
    default:
      return getSaleStatusLabel(status);
  }
}

export function getSaleStatusImpactMessage(status: SaleStatus): string {
  switch (status) {
    case SaleStatus.APPROVED:
      return 'Se congelaran las lineas y se reservara el stock.';
    case SaleStatus.CANCELLED:
      return 'La venta quedara cancelada y, si habia stock reservado, se liberara.';
    case SaleStatus.IN_PROCESS:
      return 'La venta pasara a en proceso.';
    case SaleStatus.SHIPPED:
      return 'La venta pasara a enviada.';
    case SaleStatus.DELIVERED:
      return 'La venta se marcara como entregada y se generara la salida de stock automatica.';
    default:
      return 'Se actualizara el estado de la venta.';
  }
}
