import { Injectable, computed, inject, signal } from '@angular/core';
import { AuthService } from '@core/services/auth.service';
import { PurchaseStatus } from '@domain/enums/purchase-status.enum';
import { UserPermission } from '@domain/enums/user-permission.enum';
import {
  PurchaseApiError,
  PurchaseBusinessRuleError,
  PurchaseForbiddenError,
  PurchaseInvalidStatusTransitionError,
  PurchaseNotFoundError,
  PurchaseUnauthorizedError,
  PurchaseValidationError,
} from '@domain/models/purchase-errors';
import {
  CancelPurchasePayload,
  ChangePurchaseStatusPayload,
  CreatePurchasePayload,
  DEFAULT_PURCHASES_PAGE_SIZE,
  DEFAULT_PURCHASES_SORT,
  PurchaseDetail,
  PurchasePermissionContext,
  PurchaseQueryParams,
  PurchaseSort,
  PurchaseSummary,
  PurchaseSupplierOption,
  PurchaseSupplierProductOption,
  PurchaseWarehouseOption,
  UpdatePurchasePayload,
} from '@domain/models/purchase.model';
import { canManagePurchases } from '@domain/models/purchase-rules';
import { CancelPurchaseUseCase } from '@domain/usecases/purchase/cancel-purchase.usecase';
import { ChangePurchaseStatusUseCase } from '@domain/usecases/purchase/change-purchase-status.usecase';
import { CreatePurchaseUseCase } from '@domain/usecases/purchase/create-purchase.usecase';
import { DeletePurchaseUseCase } from '@domain/usecases/purchase/delete-purchase.usecase';
import { GetActivePurchaseSuppliersUseCase } from '@domain/usecases/purchase/get-active-purchase-suppliers.usecase';
import { GetDeliveryWarehousesUseCase } from '@domain/usecases/purchase/get-delivery-warehouses.usecase';
import { GetPurchaseByIdUseCase } from '@domain/usecases/purchase/get-purchase-by-id.usecase';
import { GetPurchasesUseCase } from '@domain/usecases/purchase/get-purchases.usecase';
import { GetSupplierProductsForPurchaseUseCase } from '@domain/usecases/purchase/get-supplier-products-for-purchase.usecase';
import { UpdatePurchaseUseCase } from '@domain/usecases/purchase/update-purchase.usecase';
import { catchError, finalize, forkJoin, map, of, take } from 'rxjs';

export type PurchaseDialogMode = 'create' | 'edit' | 'view';

@Injectable()
export class PurchasesStore {
  private readonly authService = inject(AuthService);
  private readonly getPurchasesUseCase = inject(GetPurchasesUseCase);
  private readonly getPurchaseByIdUseCase = inject(GetPurchaseByIdUseCase);
  private readonly createPurchaseUseCase = inject(CreatePurchaseUseCase);
  private readonly updatePurchaseUseCase = inject(UpdatePurchaseUseCase);
  private readonly deletePurchaseUseCase = inject(DeletePurchaseUseCase);
  private readonly cancelPurchaseUseCase = inject(CancelPurchaseUseCase);
  private readonly changePurchaseStatusUseCase = inject(ChangePurchaseStatusUseCase);
  private readonly getActivePurchaseSuppliersUseCase = inject(GetActivePurchaseSuppliersUseCase);
  private readonly getDeliveryWarehousesUseCase = inject(GetDeliveryWarehousesUseCase);
  private readonly getSupplierProductsForPurchaseUseCase = inject(
    GetSupplierProductsForPurchaseUseCase,
  );

  private readonly _purchases = signal<PurchaseSummary[]>([]);
  readonly purchases = this._purchases.asReadonly();
  private readonly _total = signal(0);
  readonly total = this._total.asReadonly();
  private readonly _page = signal(1);
  readonly page = this._page.asReadonly();
  private readonly _pageSize = signal(DEFAULT_PURCHASES_PAGE_SIZE);
  readonly pageSize = this._pageSize.asReadonly();
  private readonly _loading = signal(false);
  readonly loading = this._loading.asReadonly();
  private readonly _loadingDetail = signal(false);
  readonly loadingDetail = this._loadingDetail.asReadonly();
  private readonly _loadingOptions = signal(false);
  readonly loadingOptions = this._loadingOptions.asReadonly();
  private readonly _loadingSupplierProducts = signal(false);
  readonly loadingSupplierProducts = this._loadingSupplierProducts.asReadonly();
  private readonly _loadingSupplierCatalog = signal(false);
  readonly loadingSupplierCatalog = this._loadingSupplierCatalog.asReadonly();
  private readonly _error = signal<string | null>(null);
  readonly error = this._error.asReadonly();
  private readonly _dialogError = signal<string | null>(null);
  readonly dialogError = this._dialogError.asReadonly();

  private readonly _statusFilter = signal<PurchaseStatus | null>(null);
  readonly statusFilter = this._statusFilter.asReadonly();
  private readonly _supplierFilter = signal<number | null>(null);
  readonly supplierFilter = this._supplierFilter.asReadonly();
  private readonly _supplierSearch = signal('');
  readonly supplierSearch = this._supplierSearch.asReadonly();
  private readonly _dateRange = signal<{ from: string | null; to: string | null }>({
    from: null,
    to: null,
  });
  readonly dateRange = this._dateRange.asReadonly();
  private readonly _sort = signal<PurchaseSort>(DEFAULT_PURCHASES_SORT);
  readonly sort = this._sort.asReadonly();

  private readonly _selectedPurchase = signal<PurchaseDetail | null>(null);
  readonly selectedPurchase = this._selectedPurchase.asReadonly();
  private readonly _dialogVisible = signal(false);
  readonly dialogVisible = this._dialogVisible.asReadonly();
  private readonly _dialogMode = signal<PurchaseDialogMode>('create');
  readonly dialogMode = this._dialogMode.asReadonly();

  private readonly _deleteConfirmVisible = signal(false);
  readonly deleteConfirmVisible = this._deleteConfirmVisible.asReadonly();
  private readonly _purchaseToDelete = signal<PurchaseSummary | null>(null);
  readonly purchaseToDelete = this._purchaseToDelete.asReadonly();

  private readonly _cancelConfirmVisible = signal(false);
  readonly cancelConfirmVisible = this._cancelConfirmVisible.asReadonly();
  private readonly _purchaseToCancel = signal<PurchaseSummary | null>(null);
  readonly purchaseToCancel = this._purchaseToCancel.asReadonly();

  private readonly _statusConfirmVisible = signal(false);
  readonly statusConfirmVisible = this._statusConfirmVisible.asReadonly();
  private readonly _purchaseToChangeStatus = signal<PurchaseSummary | null>(null);
  readonly purchaseToChangeStatus = this._purchaseToChangeStatus.asReadonly();
  private readonly _nextStatusToApply = signal<PurchaseStatus | null>(null);
  readonly nextStatusToApply = this._nextStatusToApply.asReadonly();

  private readonly _suppliers = signal<PurchaseSupplierOption[]>([]);
  readonly suppliers = this._suppliers.asReadonly();
  private readonly _warehouses = signal<PurchaseWarehouseOption[]>([]);
  readonly warehouses = this._warehouses.asReadonly();
  private readonly _supplierProducts = signal<PurchaseSupplierProductOption[]>([]);
  readonly supplierProducts = this._supplierProducts.asReadonly();
  private readonly _supplierProductsBySupplier = signal<Record<number, PurchaseSupplierProductOption[]>>({});
  readonly supplierProductsBySupplier = this._supplierProductsBySupplier.asReadonly();

  readonly canManage = computed(() => canManagePurchases(this.buildPermissionContext()));
  readonly totalPages = computed(() => Math.ceil(this.total() / this.pageSize()));

  loadPurchases(): void {
    this._loading.set(true);
    this._error.set(null);

    this.getPurchasesUseCase
      .execute(this.buildQueryParams(), this.buildPermissionContext())
      .pipe(
        take(1),
        finalize(() => this._loading.set(false)),
      )
      .subscribe({
        next: (result) => {
          this._purchases.set(result.data);
          this._total.set(result.total);
          this._page.set(result.page);
          this._pageSize.set(result.pageSize);
        },
        error: (err: unknown) => {
          this._error.set(this.resolveErrorMessage(err, 'Unable to load purchases.'));
        },
      });
  }

  loadPurchaseById(purchaseId: number): void {
    this._loadingDetail.set(true);
    this._dialogError.set(null);

    this.getPurchaseByIdUseCase
      .execute(purchaseId, this.buildPermissionContext())
      .pipe(
        take(1),
        finalize(() => this._loadingDetail.set(false)),
      )
      .subscribe({
        next: (purchase) => {
          this._selectedPurchase.set(purchase);
          if (this.dialogMode() !== 'view') {
            this.loadSupplierProducts(purchase.supplierId);
          }
        },
        error: (err: unknown) => {
          this._dialogError.set(this.resolveErrorMessage(err, 'Unable to load purchase detail.'));
        },
      });
  }

  loadFormOptions(preloadSupplierCatalog = false): void {
    this._loadingOptions.set(true);
    this._dialogError.set(null);

    forkJoin({
      suppliers: this.getActivePurchaseSuppliersUseCase
        .execute(this.buildPermissionContext())
        .pipe(take(1)),
      warehouses: this.getDeliveryWarehousesUseCase
        .execute(this.buildPermissionContext())
        .pipe(take(1)),
    })
      .pipe(finalize(() => this._loadingOptions.set(false)))
      .subscribe({
        next: ({ suppliers, warehouses }) => {
          this._suppliers.set(suppliers);
          this._warehouses.set(warehouses);

          if (preloadSupplierCatalog && this.dialogMode() === 'create') {
            this.loadSupplierProductsCatalog();
          }
        },
        error: (err: unknown) => {
          this._dialogError.set(this.resolveErrorMessage(err, 'Unable to load purchase options.'));
        },
      });
  }

  loadSupplierProducts(supplierId: number): void {
    this._loadingSupplierProducts.set(true);
    this._dialogError.set(null);

    this.getSupplierProductsForPurchaseUseCase
      .execute(supplierId, this.buildPermissionContext())
      .pipe(
        take(1),
        finalize(() => this._loadingSupplierProducts.set(false)),
      )
      .subscribe({
        next: (products) => this._supplierProducts.set(products),
        error: (err: unknown) => {
          this._dialogError.set(
            this.resolveErrorMessage(err, 'Unable to load supplier products.'),
          );
        },
      });
  }

  setSupplierProducts(products: PurchaseSupplierProductOption[]): void {
    this._supplierProducts.set(products);
  }

  clearSupplierProducts(): void {
    this._supplierProducts.set([]);
  }

  loadSupplierProductsCatalog(): void {
    const suppliers = this.suppliers();
    if (suppliers.length === 0) {
      this._supplierProductsBySupplier.set({});
      return;
    }

    this._loadingSupplierCatalog.set(true);
    this._dialogError.set(null);

    const requests = suppliers.map((supplier) =>
      this.getSupplierProductsForPurchaseUseCase
        .execute(supplier.supplierId, this.buildPermissionContext())
        .pipe(
          take(1),
          map((products) => ({
            supplierId: supplier.supplierId,
            products,
          })),
          catchError(() =>
            of({
              supplierId: supplier.supplierId,
              products: [] as PurchaseSupplierProductOption[],
            }),
          ),
        ),
    );

    forkJoin(requests)
      .pipe(finalize(() => this._loadingSupplierCatalog.set(false)))
      .subscribe({
        next: (results) => {
          const catalogBySupplier: Record<number, PurchaseSupplierProductOption[]> = {};

          for (const result of results) {
            catalogBySupplier[result.supplierId] = result.products;
          }

          this._supplierProductsBySupplier.set(catalogBySupplier);
        },
        error: (err: unknown) => {
          this._dialogError.set(
            this.resolveErrorMessage(err, 'Unable to load supplier product catalog.'),
          );
        },
      });
  }

  openCreateDialog(): void {
    this._selectedPurchase.set(null);
    this._supplierProducts.set([]);
    this._supplierProductsBySupplier.set({});
    this._dialogMode.set('create');
    this._dialogError.set(null);
    this._dialogVisible.set(true);
    this.loadFormOptions(true);
  }

  openEditDialog(purchase: PurchaseSummary | PurchaseDetail): void {
    this.openEditDialogById(purchase.purchaseId);
  }

  openEditDialogById(purchaseId: number): void {
    this._dialogMode.set('edit');
    this._dialogError.set(null);
    this._dialogVisible.set(true);
    this.loadFormOptions(true);
    this.loadPurchaseById(purchaseId);
  }

  openViewDialog(purchase: PurchaseSummary | PurchaseDetail): void {
    this._dialogMode.set('view');
    this._dialogError.set(null);
    this._dialogVisible.set(true);
    this.loadPurchaseById(purchase.purchaseId);
  }

  openViewDialogById(purchaseId: number): void {
    this._dialogMode.set('view');
    this._dialogError.set(null);
    this._dialogVisible.set(true);
    this.loadPurchaseById(purchaseId);
  }

  closeDialog(): void {
    this._dialogVisible.set(false);
    this._dialogError.set(null);
    this._selectedPurchase.set(null);
    this._supplierProducts.set([]);
    this._supplierProductsBySupplier.set({});
  }

  savePurchase(payload: CreatePurchasePayload | UpdatePurchasePayload): void {
    this._loadingDetail.set(true);
    this._dialogError.set(null);

    const context = this.buildPermissionContext();

    if (this.dialogMode() === 'edit' && this.selectedPurchase()) {
      this.updatePurchaseUseCase
        .execute(this.selectedPurchase()!.purchaseId, payload as UpdatePurchasePayload, context)
        .pipe(
          take(1),
          finalize(() => this._loadingDetail.set(false)),
        )
        .subscribe({
          next: () => {
            this.closeDialog();
            this.loadPurchases();
          },
          error: (err: unknown) => {
            this._dialogError.set(this.resolveErrorMessage(err, 'Unable to update purchase.'));
          },
        });
      return;
    }

    this.createPurchaseUseCase
      .execute(payload as CreatePurchasePayload, context)
      .pipe(
        take(1),
        finalize(() => this._loadingDetail.set(false)),
      )
      .subscribe({
        next: () => {
          this.closeDialog();
          this._page.set(1);
          this.loadPurchases();
        },
        error: (err: unknown) => {
          this._dialogError.set(this.resolveErrorMessage(err, 'Unable to create purchase.'));
        },
      });
  }

  requestDeletePurchase(purchase: PurchaseSummary): void {
    this._purchaseToDelete.set(purchase);
    this._deleteConfirmVisible.set(true);
  }

  cancelDeletePurchase(): void {
    this._purchaseToDelete.set(null);
    this._deleteConfirmVisible.set(false);
  }

  confirmDeletePurchase(): void {
    const purchase = this.purchaseToDelete();
    if (!purchase) {
      return;
    }

    this._loading.set(true);
    this._error.set(null);

    this.deletePurchaseUseCase
      .execute(purchase.purchaseId, this.buildPermissionContext())
      .pipe(
        take(1),
        finalize(() => this._loading.set(false)),
      )
      .subscribe({
        next: () => {
          this._purchases.update((list) =>
            list.filter((item) => item.purchaseId !== purchase.purchaseId),
          );
          this._total.update((value) => Math.max(0, value - 1));
          this.cancelDeletePurchase();
        },
        error: (err: unknown) => {
          this._error.set(this.resolveErrorMessage(err, 'Unable to delete purchase.'));
        },
      });
  }

  requestCancelPurchase(purchase: PurchaseSummary): void {
    this._purchaseToCancel.set(purchase);
    this._cancelConfirmVisible.set(true);
  }

  cancelCancelPurchase(): void {
    this._purchaseToCancel.set(null);
    this._cancelConfirmVisible.set(false);
  }

  confirmCancelPurchase(reason?: string): void {
    const purchase = this.purchaseToCancel();
    if (!purchase) {
      return;
    }

    const actorId = this.resolveActorId();

    this._loading.set(true);
    this._error.set(null);

    const payload: CancelPurchasePayload = {
      cancelledByUserId: actorId,
      cancelledByName: this.resolveActorName(),
      cancelledAt: new Date().toISOString(),
      reason: reason ?? null,
    };

    this.cancelPurchaseUseCase
      .execute(purchase.purchaseId, payload, this.buildPermissionContext())
      .pipe(
        take(1),
        finalize(() => this._loading.set(false)),
      )
      .subscribe({
        next: (updatedPurchase) => {
          this._purchases.update((list) =>
            list.map((item) =>
              item.purchaseId === updatedPurchase.purchaseId
                ? {
                    ...item,
                    status: updatedPurchase.status,
                    allowedTransitions:
                      updatedPurchase.allowedTransitions ?? item.allowedTransitions,
                    total: updatedPurchase.total,
                  }
                : item,
            ),
          );

          if (this.selectedPurchase()?.purchaseId === updatedPurchase.purchaseId) {
            this._selectedPurchase.set(updatedPurchase);
          }

          this.cancelCancelPurchase();
        },
        error: (err: unknown) => {
          this._error.set(this.resolveErrorMessage(err, 'Unable to cancel purchase.'));
        },
      });
  }

  requestStatusChange(purchase: PurchaseSummary, nextStatus: PurchaseStatus): void {
    this._purchaseToChangeStatus.set(purchase);
    this._nextStatusToApply.set(nextStatus);
    this._statusConfirmVisible.set(true);
  }

  cancelStatusChange(): void {
    this._purchaseToChangeStatus.set(null);
    this._nextStatusToApply.set(null);
    this._statusConfirmVisible.set(false);
  }

  confirmStatusChange(): void {
    const purchase = this.purchaseToChangeStatus();
    const nextStatus = this.nextStatusToApply();

    if (!purchase || !nextStatus) {
      return;
    }

    const actorId = this.resolveActorId();

    this._loading.set(true);
    this._error.set(null);

    const payload: ChangePurchaseStatusPayload = {
      toStatus: nextStatus,
      changedByUserId: actorId,
      changedByName: this.resolveActorName(),
      changedAt: new Date().toISOString(),
    };

    this.changePurchaseStatusUseCase
      .execute(purchase.purchaseId, payload, this.buildPermissionContext())
      .pipe(
        take(1),
        finalize(() => this._loading.set(false)),
      )
      .subscribe({
        next: (updatedPurchase) => {
          this._purchases.update((list) =>
            list.map((item) =>
              item.purchaseId === updatedPurchase.purchaseId
                ? {
                    ...item,
                    status: updatedPurchase.status,
                    allowedTransitions:
                      updatedPurchase.allowedTransitions ?? item.allowedTransitions,
                    total: updatedPurchase.total,
                  }
                : item,
            ),
          );

          if (this.selectedPurchase()?.purchaseId === updatedPurchase.purchaseId) {
            this._selectedPurchase.set(updatedPurchase);
          }

          this.cancelStatusChange();
        },
        error: (err: unknown) => {
          this._error.set(this.resolveErrorMessage(err, 'Unable to change purchase status.'));
        },
      });
  }

  onStatusFilterChange(status: PurchaseStatus | null): void {
    this._statusFilter.set(status);
    this._page.set(1);
    this.loadPurchases();
  }

  onSupplierFilterChange(supplierId: number | null): void {
    this._supplierFilter.set(supplierId);
    this._page.set(1);
    this.loadPurchases();
  }

  onSupplierSearch(value: string): void {
    this._supplierSearch.set(value);
    this._page.set(1);
    this.loadPurchases();
  }

  onDateRangeChange(range: { from: string | null; to: string | null }): void {
    this._dateRange.set(range);
    this._page.set(1);
    this.loadPurchases();
  }

  onSortChange(sort: PurchaseSort): void {
    this._sort.set(sort);
    this._page.set(1);
    this.loadPurchases();
  }

  onPageChange(event: { first: number; rows: number }): void {
    this._page.set(Math.floor(event.first / event.rows) + 1);
    this._pageSize.set(event.rows);
    this.loadPurchases();
  }

  private buildQueryParams(): PurchaseQueryParams {
    return {
      page: this.page(),
      pageSize: this.pageSize(),
      status: this.statusFilter() ?? undefined,
      supplierId: this.supplierFilter() ?? undefined,
      supplierSearch: this.supplierSearch().trim() || undefined,
      createdFrom: this.dateRange().from ?? undefined,
      createdTo: this.dateRange().to ?? undefined,
      sort: this.sort(),
    };
  }

  private buildPermissionContext(): PurchasePermissionContext {
    const user = this.authService.user();
    const purchasesDepartmentId = this.authService.hasPermission(UserPermission.PurchasesDepartment)
      ? (user?.departmentId ?? -1)
      : -1;

    return {
      role: user?.role,
      departmentId: user?.departmentId ?? null,
      purchasesDepartmentId,
      permissions: user?.permissions ?? [],
    };
  }

  private resolveActorId(): number {
    const user = this.authService.user();
    const uidAsNumber = this.extractPositiveInteger(user?.uid);

    if (uidAsNumber !== null) {
      return uidAsNumber;
    }

    const emailAsNumber = this.extractPositiveInteger(user?.email);

    if (emailAsNumber !== null) {
      return emailAsNumber;
    }

    const stableSource = (user?.uid ?? '').trim() || (user?.email ?? '').trim();

    if (stableSource.length > 0) {
      return this.toStablePositiveId(stableSource);
    }

    throw new PurchaseValidationError(
      { field: 'actorId' },
      'Unable to resolve actor identifier for purchase action.',
    );
  }

  private extractPositiveInteger(value: string | null | undefined): number | null {
    if (!value) {
      return null;
    }

    const digitsOnly = value.replace(/\D/g, '');
    if (!digitsOnly) {
      return null;
    }

    const parsedValue = Number.parseInt(digitsOnly, 10);

    if (!Number.isInteger(parsedValue) || parsedValue <= 0) {
      return null;
    }

    return parsedValue;
  }

  private toStablePositiveId(source: string): number {
    let hash = 0;

    for (let index = 0; index < source.length; index += 1) {
      hash = (hash * 31 + source.charCodeAt(index)) % 2147483647;
    }

    return hash > 0 ? hash : source.length;
  }

  private resolveActorName(): string {
    const user = this.authService.user();
    return user?.displayName || user?.email || 'System';
  }

  private resolveErrorMessage(error: unknown, fallback: string): string {
    if (error instanceof PurchaseValidationError) {
      return error.message || 'Please verify the provided data.';
    }

    if (error instanceof PurchaseBusinessRuleError) {
      return error.message || 'Operation not allowed for the current purchase state.';
    }

    if (error instanceof PurchaseInvalidStatusTransitionError) {
      return error.message || 'Invalid purchase status transition.';
    }

    if (error instanceof PurchaseNotFoundError) {
      return error.message || 'Selected purchase no longer exists.';
    }

    if (error instanceof PurchaseUnauthorizedError) {
      return error.message || 'Session expired. Please sign in again.';
    }

    if (error instanceof PurchaseForbiddenError) {
      return error.message || 'You do not have permission to manage purchases.';
    }

    if (error instanceof PurchaseApiError) {
      return error.message || fallback;
    }

    if (error instanceof Error && error.message) {
      return error.message;
    }

    return fallback;
  }
}

