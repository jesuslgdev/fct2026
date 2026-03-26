import { Injectable, inject } from '@angular/core';
import { Observable, forkJoin } from 'rxjs';
import { map } from 'rxjs/operators';
import { DepartmentRepository } from '@domain/repositories/department.repository';
import { UserRepository } from '@domain/repositories/user.repository';
import { Department } from '@domain/models/department.model';
import { AuthService } from '@core/services/auth.service';

@Injectable({ providedIn: 'root' })
export class GetDepartmentsUseCase {
  private readonly repo = inject(DepartmentRepository);
  private readonly userRepo = inject(UserRepository);
  private readonly authService = inject(AuthService);

  execute(): Observable<Department[]> {
    if (!this.authService.isAdmin()) {
      return this.repo.getAll();
    }

    return forkJoin({
      departments: this.repo.getAll(),
      users: this.userRepo.getUsers({ page: 1, pageSize: 100 }),
    }).pipe(
      map(({ departments, users }) =>
        departments.map(dept => ({
          ...dept,
          userCount: users.data.filter(
            u => u.departmentId === parseInt(dept.id) && u.active,
          ).length,
        })),
      ),
    );
  }
}
