export const PURCHASE_STATUSES = [
  'Pending',
  'Approved',
  'InProcess',
  'Shipped',
  'Received',
  'Cancelled',
] as const;

export type PurchaseStatus = (typeof PURCHASE_STATUSES)[number];

export const FINAL_PURCHASE_STATUSES: readonly PurchaseStatus[] = [
  'Received',
  'Cancelled',
];
