import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { TooltipModule } from 'primeng/tooltip';
import { ButtonComponent } from '@shared/ui/button/button.component';
import { InputComponent } from '@shared/ui/input/input.component';
import { TableComponent } from '@shared/ui/table/table.component';
import { DialogComponent } from '@shared/ui/dialog/dialog.component';
import { BadgeComponent } from '@shared/ui/badge/badge.component';
import { AuthService } from '@core/services/auth.service';
import { UserRole } from '@domain/enums/user-role.enum';
import { isAdminRole } from '@core/guards/admin.guard';
import { DepartmentsStore } from '../../departments.store';
import { Department } from '@domain/models/department.model';
import { DepartmentHasUsersError, DepartmentNameDuplicateError } from '@domain/models/department-errors';

@Component({
  selector: 'app-departments-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    TableComponent,
    ButtonComponent,
    InputComponent,
    DialogComponent,
    BadgeComponent,
    TooltipModule,
  ],
  templateUrl: './departments.page.component.html',
  styleUrls: [],
})
export class DepartmentsPageComponent implements OnInit {
  readonly store = inject(DepartmentsStore);
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);

  readonly isAdmin = computed(() =>
    isAdminRole(this.authService.user()?.role)
  );

  readonly formVisible = signal(false);
  readonly deleteVisible = signal(false);
  readonly selectedDept = signal<Department | null>(null);
  readonly saving = signal(false);
  readonly formError = signal('');
  readonly canDelete = computed(() => (this.selectedDept()?.userCount ?? 0) === 0);

  readonly form = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(100)]],
  });

  ngOnInit(): void {
    this.store.load();
  }

  openCreate(): void {
    this.selectedDept.set(null);
    this.form.reset();
    this.formError.set('');
    this.formVisible.set(true);
  }

  openEdit(dept: Department): void {
    this.selectedDept.set(dept);
    this.form.reset({ name: dept.name });
    this.formError.set('');
    this.formVisible.set(true);
  }

  openDelete(dept: Department): void {
    this.selectedDept.set(dept);
    this.deleteVisible.set(true);
  }

  async onSave(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const name = (this.form.value.name ?? '').trim();
    this.saving.set(true);
    this.formError.set('');
    try {
      const editing = this.selectedDept();
      if (editing) {
        await this.store.update(editing.id, name);
      } else {
        await this.store.create(name);
      }
      this.formVisible.set(false);
    } catch (err) {
      this.formError.set(
        err instanceof DepartmentNameDuplicateError
          ? 'Ya existe un departamento con ese nombre.'
          : 'Error al guardar el departamento.',
      );
    } finally {
      this.saving.set(false);
    }
  }

  async onDelete(): Promise<void> {
    const dept = this.selectedDept();
    if (!dept) return;
    this.saving.set(true);
    try {
      await this.store.delete(dept);
      this.deleteVisible.set(false);
    } catch (err) {
      // DepartmentHasUsersError is prevented by canDelete() check in template;
      // still handle defensively for unexpected errors
      console.error(err);
    } finally {
      this.saving.set(false);
    }
  }
}
