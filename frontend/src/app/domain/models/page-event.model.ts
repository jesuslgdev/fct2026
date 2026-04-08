export interface PageEvent {
  first?: number;
  rows?: number;
  page?: number;
  pageCount?: number;
  query?: string;
  status?: string;
  isActive?: boolean;
}
