import { Injectable, inject, signal } from '@angular/core';
import { Department } from '@domain/models/department.model';
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
      this._departments.set(await this.getDepts.execute());
    } finally {
      this._loading.set(false);
    }
  }

  async create(name: string): Promise<void> {
    const dept = await this.createDept.execute(name);
    this._departments.update(list => [...list, dept]);
  }

  async update(id: string, name: string): Promise<void> {
    const updated = await this.updateDept.execute(id, name);
    this._departments.update(list => list.map(d => d.id === id ? updated : d));
  }

  async delete(department: Department): Promise<void> {
    await this.deleteDept.execute(department);
    this._departments.update(list => list.filter(d => d.id !== department.id));
  }
}
