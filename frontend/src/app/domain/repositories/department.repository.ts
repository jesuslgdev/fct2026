import { Observable } from 'rxjs';
import { Department } from '@domain/models/department.model';

export abstract class DepartmentRepository {
  abstract getAll(): Observable<Department[]>;
  abstract create(name: string): Observable<Department>;
  abstract update(id: string, name: string): Observable<Department>;
  abstract delete(id: string): Observable<void>;
}
