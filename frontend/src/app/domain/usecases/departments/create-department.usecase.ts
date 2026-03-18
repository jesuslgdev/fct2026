import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { DepartmentRepository } from '@domain/repositories/department.repository';
import { Department } from '@domain/models/department.model';

@Injectable({ providedIn: 'root' })
export class CreateDepartmentUseCase {
  private readonly repo = inject(DepartmentRepository);

  execute(name: string): Observable<Department> {
    return this.repo.create(name.trim());
  }
}
