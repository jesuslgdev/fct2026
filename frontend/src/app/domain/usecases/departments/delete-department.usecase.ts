import { Injectable, inject } from '@angular/core';
import { DepartmentRepository } from '@domain/repositories/department.repository';
import { Department } from '@domain/models/department.model';
import { DepartmentHasUsersError } from '@domain/models/department-errors';

@Injectable({ providedIn: 'root' })
export class DeleteDepartmentUseCase {
  private readonly repo = inject(DepartmentRepository);

  async execute(department: Department): Promise<void> {
    if (department.userCount > 0) {
      throw new DepartmentHasUsersError();
    }
    return this.repo.delete(department.id);
  }
}
