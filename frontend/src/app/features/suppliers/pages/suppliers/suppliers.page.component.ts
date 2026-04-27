import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnInit,
  effect,
  inject,
  viewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Select } from 'primeng/select';
import { TableComponent } from '@shared/ui/table/table.component';
import { ButtonComponent } from '@shared/ui/button/button.component';
import { DialogComponent } from '@shared/ui/dialog/dialog.component';
import { InputComponent } from '@shared/ui/input/input.component';
import { CardComponent } from '@shared/ui/card/card.component';
import { BadgeComponent } from '@shared/ui/badge/badge.component';
import { SuppliersStore } from '@features/suppliers/state/suppliers.store';
import { SupplierFormDialogComponent } from '@features/suppliers/components/supplier-form-dialog/supplier-form-dialog.component';
import { ImportDialogComponent } from '@features/suppliers/components/import-dialog/import-dialog.component';
import { SupplierStatus } from '@domain/enums/supplier-status.enum';
import { Supplier } from '@domain/models/supplier.model';

// Types for filter selects
interface StatusOption { label: string; value: SupplierStatus | null; }

@Component({
  selector: 'app-suppliers-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [SuppliersStore],
  imports: [
    FormsModule,
    Select,
    InputComponent,
    TableComponent,
    ButtonComponent,
    DialogComponent,
    CardComponent,
    BadgeComponent,
    SupplierFormDialogComponent,
    ImportDialogComponent,
  ],
  templateUrl: './suppliers.page.component.html',
})
export class SuppliersPageComponent implements OnInit {
  readonly store = inject(SuppliersStore);
  private readonly cdr = inject(ChangeDetectorRef);
  readonly importDialog = viewChild(ImportDialogComponent);

  // Force CD when suppliers list changes.
  private readonly suppliersEffect = effect(() => {
    this.store.filteredSuppliers();
    this.cdr.markForCheck();
  });

  // Properties for details dialog
  detailsDialogVisible = false;
  selectedSupplierForDetails: Supplier | null = null;

  // Filter options (with "all" represented as null)
  readonly statusOptions: StatusOption[] = [
    { label: 'Todos los estados', value: null },
    { label: 'Activo', value: SupplierStatus.ACTIVE },
    { label: 'Inactivo', value: SupplierStatus.INACTIVE },
  ];

  ngOnInit(): void {
    this.store.loadSuppliers();
  }

  trackById(_: number, supplier: Supplier): number {
    return parseInt(supplier.id);
  }

  // Open supplier details dialog
  async openDetailsDialog(supplier: Supplier): Promise<void> {
    const fullSupplier = await this.store.loadSupplierById(supplier.id);
    if (fullSupplier) {
      this.selectedSupplierForDetails = fullSupplier;
      this.detailsDialogVisible = true;
    }
  }

  // Close details dialog
  closeDetailsDialog(): void {
    this.detailsDialogVisible = false;
    this.selectedSupplierForDetails = null;
  }

  // Status label mapping (enum -> UI text)
  getStatusLabel(status: Supplier['status']): string {
    switch (status) {
      case SupplierStatus.ACTIVE: return 'Activo';
      case SupplierStatus.INACTIVE: return 'Inactivo';
      default: return status;
    }
  }

  // Helper for badge variant by status
  getStatusBadgeVariant(status: Supplier['status']): 'success' | 'danger' {
    return status === SupplierStatus.ACTIVE ? 'success' : 'danger';
  }

  // Import actions
  openImportDialog(): void {
    this.importDialog()?.open();
  }

  onImportCompleted(): void {
    // After import, force first page so newly imported suppliers are visible immediately.
    this.store.loadSuppliers({
      page: 1,
      rows: this.store.pageSize(),
      first: 0,
    });
  }
}

