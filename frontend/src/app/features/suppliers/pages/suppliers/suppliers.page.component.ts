import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Select } from 'primeng/select';
import { TableComponent } from '@shared/ui/table/table.component';
import { ButtonComponent } from '@shared/ui/button/button.component';
import { DialogComponent } from '@shared/ui/dialog/dialog.component';
import { InputComponent } from '@shared/ui/input/input.component';
import { CardComponent } from '@shared/ui/card/card.component';
import { BadgeComponent } from '@shared/ui/badge/badge.component';
import { SuppliersStore } from '@features/suppliers/state/suppliers.store';
import { ProviderFormDialogComponent } from '@features/suppliers/components/provider-form-dialog/provider-form-dialog.component';
import { ProviderStatus } from '@domain/enums/provider-status.enum';
import { Provider } from '@domain/models/provider.model';

// Types for filter selects
interface StatusOption { label: string; value: ProviderStatus | null; }

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
    ProviderFormDialogComponent,
  ],
  templateUrl: './suppliers.page.component.html',
})
export class SuppliersPageComponent implements OnInit {
  readonly store = inject(SuppliersStore);

  // Filter options (with "all" represented as null)
  readonly statusOptions: StatusOption[] = [
    { label: 'Todos los estados', value: null },
    { label: 'Activo', value: ProviderStatus.ACTIVE },
    { label: 'Inactivo', value: ProviderStatus.INACTIVE },
  ];

  ngOnInit(): void {
    this.store.loadProviders();
  }

  trackById(_: number, provider: Provider): number {
    return parseInt(provider.id);
  }

  // Status label mapping (enum -> UI text)
  getStatusLabel(status: Provider['status']): string {
    switch (status) {
      case ProviderStatus.ACTIVE: return 'Activo';
      case ProviderStatus.INACTIVE: return 'Inactivo';
      default: return status;
    }
  }

  // Helper for badge variant by status
  getStatusBadgeVariant(status: Provider['status']): 'success' | 'danger' {
    return status === ProviderStatus.ACTIVE ? 'success' : 'danger';
  }
}
