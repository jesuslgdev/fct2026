import { Injectable, inject } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { DepartmentRepository } from '@domain/repositories/department.repository';
import { Department } from '@domain/models/department.model';

@Injectable({ providedIn: 'root' })
export class CreateDepartmentUseCase {
  private readonly repo = inject(DepartmentRepository);

  execute(name: string): Observable<Department> {
    const trimmedName = name.trim();
    
    if (!trimmedName) {
      return throwError(() => new Error('Department name cannot be empty'));
    }
    
    return this.repo.create(trimmedName);
  }
}
