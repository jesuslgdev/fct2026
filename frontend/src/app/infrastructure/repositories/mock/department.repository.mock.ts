import { Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { DepartmentRepository } from '@domain/repositories/department.repository';
import { Department } from '@domain/models/department.model';
import { DepartmentNameDuplicateError, DepartmentHasUsersError } from '@domain/models/department-errors';

// TODO add base url for API REST

const INITIAL_DEPARTMENTS: Department[] = [
  { id: '1', name: 'Tecnología', userCount: 3 },
  { id: '2', name: 'Ventas', userCount: 2 },
  { id: '3', name: 'Recursos Humanos', userCount: 0 },
];

@Injectable()
export class MockDepartmentRepository implements DepartmentRepository {
  private departments: Department[] = INITIAL_DEPARTMENTS.map(d => ({ ...d }));
  private nextId = INITIAL_DEPARTMENTS.length + 1;

  getAll(): Observable<Department[]> {
    return of([...this.departments]);
  }

  create(name: string): Observable<Department> {
    if (this.departments.some(d => d.name.toLowerCase() === name.toLowerCase())) {
      return throwError(() => new DepartmentNameDuplicateError());
    }
    const dept: Department = { id: String(this.nextId++), name, userCount: 0 };
    this.departments.push(dept);
    return of({ ...dept });
  }

  update(id: string, name: string): Observable<Department> {
    if (this.departments.some(d => d.id !== id && d.name.toLowerCase() === name.toLowerCase())) {
      return throwError(() => new DepartmentNameDuplicateError());
    }
    const index = this.departments.findIndex(d => d.id === id);
    if (index === -1) return throwError(() => new Error(`Department ${id} not found`));
    this.departments[index] = { ...this.departments[index], name };
    return of({ ...this.departments[index] });
  }

  delete(id: string): Observable<void> {
    const index = this.departments.findIndex(d => d.id === id);
    if (index === -1) return throwError(() => new Error(`Department ${id} not found`));
    if (this.departments[index].userCount > 0) {
      return throwError(() => new DepartmentHasUsersError());
    }
    this.departments.splice(index, 1);
    return of(void 0);
  }
}
