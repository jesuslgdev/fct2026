import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { DepartmentRepository } from '@domain/repositories/department.repository';
import { Department } from '@domain/models/department.model';

@Injectable({ providedIn: 'root' })
export class UpdateDepartmentUseCase {
  private readonly repo = inject(DepartmentRepository);

  execute(id: string, name: string): Observable<Department> {
    return this.repo.update(id, name.trim());
  }
}
