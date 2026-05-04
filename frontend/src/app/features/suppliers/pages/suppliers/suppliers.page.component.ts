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
import { Router } from '@angular/router';
import { Select } from 'primeng/select';
import { SupplierStatus } from '@domain/enums/supplier-status.enum';
import { Supplier } from '@domain/models/supplier.model';
import { ImportDialogComponent } from '@features/suppliers/components/import-dialog/import-dialog.component';
import { SupplierFormDialogComponent } from '@features/suppliers/components/supplier-form-dialog/supplier-form-dialog.component';
import { SuppliersStore } from '@features/suppliers/state/suppliers.store';
import { BadgeComponent } from '@shared/ui/badge/badge.component';
import { ButtonComponent } from '@shared/ui/button/button.component';
import { CardComponent } from '@shared/ui/card/card.component';
import { DialogComponent } from '@shared/ui/dialog/dialog.component';
import { InputComponent } from '@shared/ui/input/input.component';
import { TableComponent } from '@shared/ui/table/table.component';

interface StatusOption {
  label: string;
  value: SupplierStatus | null;
}

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
  private readonly router = inject(Router);
  readonly importDialog = viewChild(ImportDialogComponent);

  private readonly suppliersEffect = effect(() => {
    this.store.filteredSuppliers();
    this.cdr.markForCheck();
  });

  readonly statusOptions: StatusOption[] = [
    { label: 'Todos los estados', value: null },
    { label: 'Activo', value: SupplierStatus.ACTIVE },
    { label: 'Inactivo', value: SupplierStatus.INACTIVE },
  ];

  ngOnInit(): void {
    this.store.loadSuppliers();
  }

  trackById(_: number, supplier: Supplier): number {
    return parseInt(supplier.id, 10);
  }

  openSupplierDetail(supplier: Supplier): void {
    this.router.navigate(['/suppliers', supplier.id]);
  }

  getStatusLabel(status: Supplier['status']): string {
    switch (status) {
      case SupplierStatus.ACTIVE:
        return 'Activo';
      case SupplierStatus.INACTIVE:
        return 'Inactivo';
      default:
        return status;
    }
  }

  getStatusBadgeVariant(status: Supplier['status']): 'success' | 'danger' {
    return status === SupplierStatus.ACTIVE ? 'success' : 'danger';
  }

  openImportDialog(): void {
    this.importDialog()?.open();
  }

  onImportCompleted(): void {
    this.store.loadSuppliers({
      page: 1,
      rows: this.store.pageSize(),
      first: 0,
    });
  }
}
