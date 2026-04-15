import { Injectable, computed, inject, signal } from '@angular/core';
import { AuthService } from '@core/services/auth.service';
import { PurchaseStatus } from '@domain/enums/purchase-status.enum';
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
<<<<<<< Updated upstream
import { finalize, forkJoin, take } from 'rxjs';
=======
import { catchError, finalize, forkJoin, map, of, take } from 'rxjs';
>>>>>>> Stashed changes

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

  private readonly purchasesDepartmentId = 2;

  readonly purchases = signal<PurchaseSummary[]>([]);
  readonly total = signal(0);
  readonly page = signal(1);
  readonly pageSize = signal(DEFAULT_PURCHASES_PAGE_SIZE);
  readonly loading = signal(false);
  readonly loadingDetail = signal(false);
  readonly loadingOptions = signal(false);
  readonly loadingSupplierProducts = signal(false);
<<<<<<< Updated upstream
=======
  readonly loadingSupplierCatalog = signal(false);
>>>>>>> Stashed changes
  readonly error = signal<string | null>(null);
  readonly dialogError = signal<string | null>(null);

  readonly statusFilter = signal<PurchaseStatus | null>(null);
  readonly supplierFilter = signal<number | null>(null);
  readonly supplierSearch = signal('');
  readonly dateRange = signal<{ from: string | null; to: string | null }>({
    from: null,
    to: null,
  });
  readonly sort = signal<PurchaseSort>(DEFAULT_PURCHASES_SORT);

  readonly selectedPurchase = signal<PurchaseDetail | null>(null);
  readonly dialogVisible = signal(false);
  readonly dialogMode = signal<PurchaseDialogMode>('create');

  readonly deleteConfirmVisible = signal(false);
  readonly purchaseToDelete = signal<PurchaseSummary | null>(null);

  readonly cancelConfirmVisible = signal(false);
  readonly purchaseToCancel = signal<PurchaseSummary | null>(null);

  readonly statusConfirmVisible = signal(false);
  readonly purchaseToChangeStatus = signal<PurchaseSummary | null>(null);
  readonly nextStatusToApply = signal<PurchaseStatus | null>(null);

  readonly suppliers = signal<PurchaseSupplierOption[]>([]);
  readonly warehouses = signal<PurchaseWarehouseOption[]>([]);
  readonly supplierProducts = signal<PurchaseSupplierProductOption[]>([]);
<<<<<<< Updated upstream
=======
  readonly supplierProductsBySupplier = signal<Record<number, PurchaseSupplierProductOption[]>>({});
>>>>>>> Stashed changes

  readonly canManage = computed(() => canManagePurchases(this.buildPermissionContext()));
  readonly totalPages = computed(() => Math.ceil(this.total() / this.pageSize()));

  loadPurchases(): void {
    this.loading.set(true);
    this.error.set(null);

    this.getPurchasesUseCase
      .execute(this.buildQueryParams(), this.buildPermissionContext())
      .pipe(
        take(1),
        finalize(() => this.loading.set(false)),
      )
      .subscribe({
        next: (result) => {
          this.purchases.set(result.data);
          this.total.set(result.total);
          this.page.set(result.page);
          this.pageSize.set(result.pageSize);
        },
        error: (err: unknown) => {
          this.error.set(this.resolveErrorMessage(err, 'Unable to load purchases.'));
        },
      });
  }

  loadPurchaseById(purchaseId: number): void {
    this.loadingDetail.set(true);
    this.dialogError.set(null);

    this.getPurchaseByIdUseCase
      .execute(purchaseId, this.buildPermissionContext())
      .pipe(
        take(1),
        finalize(() => this.loadingDetail.set(false)),
      )
      .subscribe({
        next: (purchase) => {
          this.selectedPurchase.set(purchase);
          if (this.dialogMode() !== 'view') {
            this.loadSupplierProducts(purchase.supplierId);
          }
        },
        error: (err: unknown) => {
          this.dialogError.set(this.resolveErrorMessage(err, 'Unable to load purchase detail.'));
        },
      });
  }

  loadFormOptions(): void {
    this.loadingOptions.set(true);
    this.dialogError.set(null);

    forkJoin({
      suppliers: this.getActivePurchaseSuppliersUseCase
        .execute(this.buildPermissionContext())
        .pipe(take(1)),
      warehouses: this.getDeliveryWarehousesUseCase
        .execute(this.buildPermissionContext())
        .pipe(take(1)),
    })
      .pipe(finalize(() => this.loadingOptions.set(false)))
      .subscribe({
        next: ({ suppliers, warehouses }) => {
          this.suppliers.set(suppliers);
          this.warehouses.set(warehouses);
<<<<<<< Updated upstream
=======

          if (this.dialogMode() === 'create') {
            this.loadSupplierProductsCatalog();
          }
>>>>>>> Stashed changes
        },
        error: (err: unknown) => {
          this.dialogError.set(this.resolveErrorMessage(err, 'Unable to load purchase options.'));
        },
      });
  }

  loadSupplierProducts(supplierId: number): void {
    this.loadingSupplierProducts.set(true);
    this.dialogError.set(null);

    this.getSupplierProductsForPurchaseUseCase
      .execute(supplierId, this.buildPermissionContext())
      .pipe(
        take(1),
        finalize(() => this.loadingSupplierProducts.set(false)),
      )
      .subscribe({
        next: (products) => this.supplierProducts.set(products),
        error: (err: unknown) => {
          this.dialogError.set(
            this.resolveErrorMessage(err, 'Unable to load supplier products.'),
          );
        },
      });
  }

<<<<<<< Updated upstream
  openCreateDialog(): void {
    this.selectedPurchase.set(null);
    this.supplierProducts.set([]);
=======
  loadSupplierProductsCatalog(): void {
    const suppliers = this.suppliers();
    if (suppliers.length === 0) {
      this.supplierProductsBySupplier.set({});
      return;
    }

    this.loadingSupplierCatalog.set(true);
    this.dialogError.set(null);

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
      .pipe(finalize(() => this.loadingSupplierCatalog.set(false)))
      .subscribe({
        next: (results) => {
          const catalogBySupplier: Record<number, PurchaseSupplierProductOption[]> = {};

          for (const result of results) {
            catalogBySupplier[result.supplierId] = result.products;
          }

          this.supplierProductsBySupplier.set(catalogBySupplier);
        },
        error: (err: unknown) => {
          this.dialogError.set(
            this.resolveErrorMessage(err, 'Unable to load supplier product catalog.'),
          );
        },
      });
  }

  openCreateDialog(): void {
    this.selectedPurchase.set(null);
    this.supplierProducts.set([]);
    this.supplierProductsBySupplier.set({});
>>>>>>> Stashed changes
    this.dialogMode.set('create');
    this.dialogError.set(null);
    this.dialogVisible.set(true);
    this.loadFormOptions();
  }

  openEditDialog(purchase: PurchaseSummary | PurchaseDetail): void {
    this.dialogMode.set('edit');
    this.dialogError.set(null);
    this.dialogVisible.set(true);
    this.loadFormOptions();
    this.loadPurchaseById(purchase.purchaseId);
  }

  openViewDialog(purchase: PurchaseSummary | PurchaseDetail): void {
    this.dialogMode.set('view');
    this.dialogError.set(null);
    this.dialogVisible.set(true);
    this.loadPurchaseById(purchase.purchaseId);
  }

  closeDialog(): void {
    this.dialogVisible.set(false);
    this.dialogError.set(null);
    this.selectedPurchase.set(null);
    this.supplierProducts.set([]);
<<<<<<< Updated upstream
=======
    this.supplierProductsBySupplier.set({});
>>>>>>> Stashed changes
  }

  savePurchase(payload: CreatePurchasePayload | UpdatePurchasePayload): void {
    this.loadingDetail.set(true);
    this.dialogError.set(null);

    const context = this.buildPermissionContext();

    if (this.dialogMode() === 'edit' && this.selectedPurchase()) {
      this.updatePurchaseUseCase
        .execute(this.selectedPurchase()!.purchaseId, payload as UpdatePurchasePayload, context)
        .pipe(
          take(1),
          finalize(() => this.loadingDetail.set(false)),
        )
        .subscribe({
          next: () => {
            this.closeDialog();
            this.loadPurchases();
          },
          error: (err: unknown) => {
            this.dialogError.set(this.resolveErrorMessage(err, 'Unable to update purchase.'));
          },
        });
      return;
    }

    this.createPurchaseUseCase
      .execute(payload as CreatePurchasePayload, context)
      .pipe(
        take(1),
        finalize(() => this.loadingDetail.set(false)),
      )
      .subscribe({
        next: () => {
          this.closeDialog();
          this.page.set(1);
          this.loadPurchases();
        },
        error: (err: unknown) => {
          this.dialogError.set(this.resolveErrorMessage(err, 'Unable to create purchase.'));
        },
      });
  }

  requestDeletePurchase(purchase: PurchaseSummary): void {
    this.purchaseToDelete.set(purchase);
    this.deleteConfirmVisible.set(true);
  }

  cancelDeletePurchase(): void {
    this.purchaseToDelete.set(null);
    this.deleteConfirmVisible.set(false);
  }

  confirmDeletePurchase(): void {
    const purchase = this.purchaseToDelete();
    if (!purchase) {
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    this.deletePurchaseUseCase
      .execute(purchase.purchaseId, this.buildPermissionContext())
      .pipe(
        take(1),
        finalize(() => this.loading.set(false)),
      )
      .subscribe({
        next: () => {
          this.purchases.update((list) =>
            list.filter((item) => item.purchaseId !== purchase.purchaseId),
          );
          this.total.update((value) => Math.max(0, value - 1));
          this.cancelDeletePurchase();
        },
        error: (err: unknown) => {
          this.error.set(this.resolveErrorMessage(err, 'Unable to delete purchase.'));
        },
      });
  }

  requestCancelPurchase(purchase: PurchaseSummary): void {
    this.purchaseToCancel.set(purchase);
    this.cancelConfirmVisible.set(true);
  }

  cancelCancelPurchase(): void {
    this.purchaseToCancel.set(null);
    this.cancelConfirmVisible.set(false);
  }

  confirmCancelPurchase(reason?: string): void {
    const purchase = this.purchaseToCancel();
    if (!purchase) {
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    const payload: CancelPurchasePayload = {
      cancelledByUserId: this.resolveActorId(),
      cancelledByName: this.resolveActorName(),
      cancelledAt: new Date().toISOString(),
      reason: reason ?? null,
    };

    this.cancelPurchaseUseCase
      .execute(purchase.purchaseId, payload, this.buildPermissionContext())
      .pipe(
        take(1),
        finalize(() => this.loading.set(false)),
      )
      .subscribe({
        next: (updatedPurchase) => {
          this.purchases.update((list) =>
            list.map((item) =>
              item.purchaseId === updatedPurchase.purchaseId
                ? {
                    ...item,
                    status: updatedPurchase.status,
                    total: updatedPurchase.total,
                  }
                : item,
            ),
          );

          if (this.selectedPurchase()?.purchaseId === updatedPurchase.purchaseId) {
            this.selectedPurchase.set(updatedPurchase);
          }

          this.cancelCancelPurchase();
        },
        error: (err: unknown) => {
          this.error.set(this.resolveErrorMessage(err, 'Unable to cancel purchase.'));
        },
      });
  }

  requestStatusChange(purchase: PurchaseSummary, nextStatus: PurchaseStatus): void {
    this.purchaseToChangeStatus.set(purchase);
    this.nextStatusToApply.set(nextStatus);
    this.statusConfirmVisible.set(true);
  }

  cancelStatusChange(): void {
    this.purchaseToChangeStatus.set(null);
    this.nextStatusToApply.set(null);
    this.statusConfirmVisible.set(false);
  }

  confirmStatusChange(): void {
    const purchase = this.purchaseToChangeStatus();
    const nextStatus = this.nextStatusToApply();

    if (!purchase || !nextStatus) {
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    const payload: ChangePurchaseStatusPayload = {
      toStatus: nextStatus,
      changedByUserId: this.resolveActorId(),
      changedByName: this.resolveActorName(),
      changedAt: new Date().toISOString(),
    };

    this.changePurchaseStatusUseCase
      .execute(purchase.purchaseId, payload, this.buildPermissionContext())
      .pipe(
        take(1),
        finalize(() => this.loading.set(false)),
      )
      .subscribe({
        next: (updatedPurchase) => {
          this.purchases.update((list) =>
            list.map((item) =>
              item.purchaseId === updatedPurchase.purchaseId
                ? {
                    ...item,
                    status: updatedPurchase.status,
                    total: updatedPurchase.total,
                  }
                : item,
            ),
          );

          if (this.selectedPurchase()?.purchaseId === updatedPurchase.purchaseId) {
            this.selectedPurchase.set(updatedPurchase);
          }

          this.cancelStatusChange();
        },
        error: (err: unknown) => {
          this.error.set(this.resolveErrorMessage(err, 'Unable to change purchase status.'));
        },
      });
  }

  onStatusFilterChange(status: PurchaseStatus | null): void {
    this.statusFilter.set(status);
    this.page.set(1);
    this.loadPurchases();
  }

  onSupplierFilterChange(supplierId: number | null): void {
    this.supplierFilter.set(supplierId);
    this.page.set(1);
    this.loadPurchases();
  }

  onSupplierSearch(value: string): void {
    this.supplierSearch.set(value);
    this.page.set(1);
    this.loadPurchases();
  }

  onDateRangeChange(range: { from: string | null; to: string | null }): void {
    this.dateRange.set(range);
    this.page.set(1);
    this.loadPurchases();
  }

  onSortChange(sort: PurchaseSort): void {
    this.sort.set(sort);
    this.page.set(1);
    this.loadPurchases();
  }

  onPageChange(event: { first: number; rows: number }): void {
    this.page.set(Math.floor(event.first / event.rows) + 1);
    this.pageSize.set(event.rows);
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

    return {
      role: user?.role,
      departmentId: user?.departmentId ?? null,
      purchasesDepartmentId: this.purchasesDepartmentId,
    };
  }

  private resolveActorId(): number {
    const rawUid = this.authService.user()?.uid ?? '';
    const digitsOnly = rawUid.replace(/\D/g, '');
    const numericUid = Number.parseInt(digitsOnly, 10);

    if (Number.isInteger(numericUid) && numericUid > 0) {
      return numericUid;
    }

    return 1;
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
