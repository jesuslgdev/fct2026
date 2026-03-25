import { Injectable, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { Department } from '@domain/models/department.model';
import { DepartmentNameDuplicateError } from '@domain/models/department-errors';
import { GetDepartmentsUseCase } from '@domain/usecases/departments/get-departments.usecase';
import { CreateDepartmentUseCase } from '@domain/usecases/departments/create-department.usecase';
import { UpdateDepartmentUseCase } from '@domain/usecases/departments/update-department.usecase';
import { DeleteDepartmentUseCase } from '@domain/usecases/departments/delete-department.usecase';

@Injectable({ providedIn: 'root' })
export class DepartmentsStore {
  private readonly getDepts = inject(GetDepartmentsUseCase);
  private readonly createDept = inject(CreateDepartmentUseCase);
  private readonly updateDept = inject(UpdateDepartmentUseCase);
  private readonly deleteDept = inject(DeleteDepartmentUseCase);

  private readonly _departments = signal<Department[]>([]);
  private readonly _loading = signal(false);

  readonly departments = this._departments.asReadonly();
  readonly loading = this._loading.asReadonly();

  async load(): Promise<void> {
    this._loading.set(true);
    try {
      this._departments.set(await firstValueFrom(this.getDepts.execute()));
    } catch {
      this._departments.set([]);
    } finally {
      this._loading.set(false);
    }
  }

  async create(name: string): Promise<void> {
    const trimmed = name.trim();
    if (this._departments().some(d => d.name.toLowerCase() === trimmed.toLowerCase())) {
      throw new DepartmentNameDuplicateError();
    }
    const dept = await firstValueFrom(this.createDept.execute(trimmed));
    this._departments.update(list => [...list, dept]);
  }

  async update(id: string, name: string): Promise<void> {
    const trimmed = name.trim();
    if (this._departments().some(d => d.id !== id && d.name.toLowerCase() === trimmed.toLowerCase())) {
      throw new DepartmentNameDuplicateError();
    }
    const updated = await firstValueFrom(this.updateDept.execute(id, trimmed));
    this._departments.update(list => list.map(d => d.id === id ? updated : d));
  }

  async delete(department: Department): Promise<void> {
    await firstValueFrom(this.deleteDept.execute(department));
    this._departments.update(list => list.filter(d => d.id !== department.id));
  }
}
