import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { DepartmentRepository } from '@domain/repositories/department.repository';
import { Department } from '@domain/models/department.model';
import { DepartmentHasUsersError, DepartmentNameDuplicateError, UnauthorizedError } from '@domain/models/department-errors';
import { DepartmentDto } from '@infrastructure/dtos/department.dto';
import { UserDto } from '@infrastructure/dtos/user.dto';
import { PaginatedResponse } from '@infrastructure/dtos/paginated-response.dto';
import { DepartmentMapper } from '@infrastructure/mappers/department.mapper';
import { environment } from 'environments/environment';

@Injectable()
export class HttpDepartmentRepository implements DepartmentRepository {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/api/v1/admin/departments`;

  getAll(): Observable<Department[]> {
    return forkJoin({
      departments: this.http.get<DepartmentDto[]>(this.base),
      usersResponse: this.http.get<PaginatedResponse<UserDto>>(`${environment.apiUrl}/api/v1/admin/users?page_size=100`)
    }).pipe(
      map(({ departments, usersResponse }) => {
        const users = usersResponse.items || [];
        
        console.log('Departments from API:', departments);
        console.log('Users from API:', users);
        
        return departments.map(dto => {
          const userCount = users.filter(user => 
            user.department_id === dto.department_id && user.is_active
          ).length;
          
          console.log(`Department ${dto.name} (${dto.department_id}): ${userCount} users`);
          return DepartmentMapper.toDomain(dto, userCount);
        });
      }),
      catchError(err => {
        console.error('Error fetching departments or users:', err);
        if (err instanceof HttpErrorResponse) {
          if (err.status === 401 || err.status === 403) {
            return throwError(() => new UnauthorizedError());
          }
        }
        return throwError(() => err);
      })
    );
  }

  create(name: string): Observable<Department> {
    return this.http.post<DepartmentDto>(this.base, { name }).pipe(
      map(DepartmentMapper.toDomain),
      catchError(err => {
        if (err instanceof HttpErrorResponse) {
          if (err.status === 401 || err.status === 403) {
            return throwError(() => new UnauthorizedError());
          }
          if (err.status === 409 || err.status === 400) {
            return throwError(() => new DepartmentNameDuplicateError());
          }
        }
        return throwError(() => err);
      })
    );
  }

  update(id: string, name: string): Observable<Department> {
    return this.http.put<DepartmentDto>(`${this.base}/${id}`, { name }).pipe(
      map(DepartmentMapper.toDomain),
      catchError(err => {
        if (err instanceof HttpErrorResponse) {
          if (err.status === 401 || err.status === 403) {
            return throwError(() => new UnauthorizedError());
          }
          if (err.status === 409 || err.status === 400) {
            return throwError(() => new DepartmentNameDuplicateError());
          }
        }
        return throwError(() => err);
      })
    );
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`).pipe(
      catchError(err => {
        if (err instanceof HttpErrorResponse) {
          if (err.status === 401 || err.status === 403) {
            return throwError(() => new UnauthorizedError());
          }
          if (err.status === 409 || err.status === 400) {
            return throwError(() => new DepartmentHasUsersError());
          }
        }
        return throwError(() => err);
      })
    );
  }
}
