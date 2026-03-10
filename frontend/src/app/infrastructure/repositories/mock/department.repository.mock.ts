import { Injectable } from '@angular/core';
import { DepartmentRepository } from '@domain/repositories/department.repository';
import { Department } from '@domain/models/department.model';
import { DepartmentNameDuplicateError } from '@domain/models/department-errors';

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

  async getAll(): Promise<Department[]> {
    return [...this.departments];
  }

  async create(name: string): Promise<Department> {
    if (this.departments.some(d => d.name.toLowerCase() === name.toLowerCase())) {
      throw new DepartmentNameDuplicateError();
    }
    const dept: Department = { id: String(this.nextId++), name, userCount: 0 };
    this.departments.push(dept);
    return { ...dept };
  }

  async update(id: string, name: string): Promise<Department> {
    if (this.departments.some(d => d.id !== id && d.name.toLowerCase() === name.toLowerCase())) {
      throw new DepartmentNameDuplicateError();
    }
    const index = this.departments.findIndex(d => d.id === id);
    if (index === -1) throw new Error(`Department ${id} not found`);
    this.departments[index] = { ...this.departments[index], name };
    return { ...this.departments[index] };
  }

  async delete(id: string): Promise<void> {
    const index = this.departments.findIndex(d => d.id === id);
    if (index === -1) throw new Error(`Department ${id} not found`);
    this.departments.splice(index, 1);
  }
}
