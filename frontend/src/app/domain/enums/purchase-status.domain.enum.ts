/**
 * Estados canonicos de una compra en dominio.
 *
 * Nota: se mantienen en espanol para alinearse con reglas de negocio.
 */
export enum PurchaseStatus {
  Pendiente = 'Pendiente',
  En_proceso = 'En_proceso',
  Recibido = 'Recibido',
  Cancelado = 'Cancelado',
}
