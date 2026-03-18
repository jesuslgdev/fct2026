import { Injectable, inject } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { DepartmentRepository } from '@domain/repositories/department.repository';
import { Department } from '@domain/models/department.model';
import { DepartmentHasUsersError } from '@domain/models/department-errors';

@Injectable({ providedIn: 'root' })
export class DeleteDepartmentUseCase {
  private readonly repo = inject(DepartmentRepository);

  execute(department: Department): Observable<void> {
    if (department.userCount > 0) {
      return throwError(() => new DepartmentHasUsersError());
    }
    return this.repo.delete(department.id);
  }
}
