import { Injectable, inject } from '@angular/core';
import { DepartmentRepository } from '@domain/repositories/department.repository';
import { Department } from '@domain/models/department.model';

@Injectable({ providedIn: 'root' })
export class GetDepartmentsUseCase {
  private readonly repo = inject(DepartmentRepository);

  execute(): Promise<Department[]> {
    return this.repo.getAll();
  }
}
