import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Select } from 'primeng/select';
import { TableComponent } from '@shared/ui/table/table.component';
import { ButtonComponent } from '@shared/ui/button/button.component';
import { DialogComponent } from '@shared/ui/dialog/dialog.component';
import { InputComponent } from '@shared/ui/input/input.component';
import { UsersStore } from '@features/users/state/users.store';
import { UserStatusBadgeComponent } from '@features/users/components/user-status-badge/user-status-badge.component';
import { UserFormDialogComponent } from '@features/users/components/user-form-dialog/user-form-dialog.component';
import { USER_ROLES, UserRole } from '@domain/enums/user-role.enum';
import { User } from '@domain/models/user.model';

interface StatusOption { label: string; value: boolean | null; }
interface RoleOption   { label: string; value: UserRole | null; }

@Component({
  selector: 'app-users-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [UsersStore],
  imports: [
    FormsModule,
    Select,
    InputComponent,
    TableComponent,
    ButtonComponent,
    DialogComponent,
    UserStatusBadgeComponent,
    UserFormDialogComponent,
  ],
  templateUrl: './users.page.component.html',
})
export class UsersPageComponent implements OnInit {
  readonly store = inject(UsersStore);

  readonly roleOptions: RoleOption[] = [
    { label: 'Todos los roles', value: null },
    ...USER_ROLES.map((r) => ({
      label: r === 'Employee' ? 'Empleado' : r === 'Manager' ? 'Gerente' : r === 'Administrator' ? 'Administrador' : r,
      value: r,
    })),
  ];

  readonly statusOptions: StatusOption[] = [
    { label: 'Todos los estados', value: null },
    { label: 'Activo',       value: true  },
    { label: 'Inactivo',     value: false },
  ];

  ngOnInit(): void {
    this.store.loadUsers();
    this.store.loadDepartments();
  }

  trackById(_: number, user: User): number {
    return user.id;
  }
  
  getRoleLabel(role: User['role']): string {
    switch (role) {
      case 'Employee':
        return 'Empleado';
      case 'Manager':
        return 'Gerente';
      case 'Administrator':
        return 'Administrador';
      default:
        return role;
    }
  }
}
