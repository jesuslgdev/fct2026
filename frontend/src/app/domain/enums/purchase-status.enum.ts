export type PurchaseStatus =
  | 'Pending'
  | 'Approved'
  | 'InProcess'
  | 'Shipped'
  | 'Received'
  | 'Cancelled';

export const PURCHASE_STATUSES: PurchaseStatus[] = [
  'Pending',
  'Approved',
  'InProcess',
  'Shipped',
  'Received',
  'Cancelled',
];

export const FINAL_PURCHASE_STATUSES: PurchaseStatus[] = ['Received', 'Cancelled'];