import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { DepartmentRepository } from '@domain/repositories/department.repository';
import { Department } from '@domain/models/department.model';
import { DepartmentHasUsersError, DepartmentNameDuplicateError } from '@domain/models/department-errors';
import { DepartmentDto } from '@infrastructure/dtos/department.dto';
import { DepartmentMapper } from '@infrastructure/mappers/department.mapper';
import { environment } from 'environments/environment';

@Injectable()
export class HttpDepartmentRepository implements DepartmentRepository {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/api/v1/admin/departments`;

  async getAll(): Promise<Department[]> {
    const dtos = await firstValueFrom(this.http.get<DepartmentDto[]>(this.base));
    return dtos.map(DepartmentMapper.toDomain);
  }

  async create(name: string): Promise<Department> {
    try {
      const dto = await firstValueFrom(
        this.http.post<DepartmentDto>(this.base, { name }),
      );
      return DepartmentMapper.toDomain(dto);
    } catch (err) {
      console.error('create error', err);
      if (err instanceof HttpErrorResponse) {
        if (err.status === 401 || err.status === 403) {
          throw new Error('No autorizado para crear departamentos');
        }
        if (err.status === 409 || err.status === 400) {
          throw new DepartmentNameDuplicateError();
        }
      }
      throw err;
    }
  }

  async update(id: string, name: string): Promise<Department> {
    try {
      const dto = await firstValueFrom(
        this.http.put<DepartmentDto>(`${this.base}/${id}`, { name }),
      );
      return DepartmentMapper.toDomain(dto);
    } catch (err) {
      console.error('update error', err);
      if (err instanceof HttpErrorResponse) {
        if (err.status === 401 || err.status === 403) {
          throw new Error('No autorizado para editar departamentos');
        }
        if (err.status === 409 || err.status === 400) {
          throw new DepartmentNameDuplicateError();
        }
      }
      throw err;
    }
  }

  async delete(id: string): Promise<void> {
    try {
      await firstValueFrom(this.http.delete<void>(`${this.base}/${id}`));
    } catch (err) {
      console.error('delete error', err);
      if (err instanceof HttpErrorResponse) {
        if (err.status === 401 || err.status === 403) {
          throw new Error('No autorizado para eliminar departamentos');
        }
        if (err.status === 409 || err.status === 400) {
          throw new DepartmentHasUsersError();
        }
      }
      throw err;
    }
  }
}
