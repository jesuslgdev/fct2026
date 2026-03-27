import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Select } from 'primeng/select';
import { TableComponent } from '@shared/ui/table/table.component';
import { ButtonComponent } from '@shared/ui/button/button.component';
import { DialogComponent } from '@shared/ui/dialog/dialog.component';
import { InputComponent } from '@shared/ui/input/input.component';
import { ClientsStore } from '@features/clients/state/clients.store';
import { ClientStatusBadgeComponent } from '@features/clients/components/client-status-badge/client-status-badge.component';
import { ClientFormDialogComponent } from '@features/clients/components/client-form-dialog/client-form-dialog.component';

interface StatusOption { label: string; value: boolean | null; }

@Component({
  selector: 'app-clients-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [ClientsStore],
  imports: [
    FormsModule,
    Select,
    InputComponent,
    TableComponent,
    ButtonComponent,
    DialogComponent,
    ClientStatusBadgeComponent,
    ClientFormDialogComponent,
  ],
  templateUrl: './clients.page.component.html',

})
export class ClientsPageComponent implements OnInit {
  readonly store = inject(ClientsStore);

  readonly statusOptions: StatusOption[] = [
    { label: 'Todos los estados', value: null },
    { label: 'Activo', value: true },
    { label: 'Inactivo', value: false },
  ];

  ngOnInit(): void {
    this.store.loadClients();
  }
}
