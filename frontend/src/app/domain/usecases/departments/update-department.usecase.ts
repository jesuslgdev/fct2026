import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { DepartmentRepository } from '@domain/repositories/department.repository';
import { Department } from '@domain/models/department.model';

@Injectable({ providedIn: 'root' })
export class UpdateDepartmentUseCase {
  private readonly repo = inject(DepartmentRepository);

  execute(id: string, name: string): Observable<Department> {
    const trimmed = name.trim();
    if (!trimmed) {
      throw new Error('Department name cannot be empty.');
    }
    return this.repo.update(id, trimmed);
  }
}
