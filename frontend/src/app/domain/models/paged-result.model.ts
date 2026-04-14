export interface PagedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}