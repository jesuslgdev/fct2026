import { Department } from '@domain/models/department.model';

export abstract class DepartmentRepository {
  abstract getAll(): Promise<Department[]>;
  abstract create(name: string): Promise<Department>;
  abstract update(id: string, name: string): Promise<Department>;
  abstract delete(id: string): Promise<void>;
}
