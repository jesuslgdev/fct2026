import { Injectable, inject } from '@angular/core';
import { UserRepository } from '@domain/repositories/user.repository';
import { Department } from '@domain/models/department.model';
import { Observable } from 'rxjs';

/** Fetches the lightweight department list used to populate dropdowns in user forms. */
@Injectable({
  providedIn: 'root',
})
export class GetDepartmentsForUsersUseCase {
  private readonly userRepository = inject(UserRepository);

  execute(): Observable<Department[]> {
    return this.userRepository.getDepartments();
  }
}
