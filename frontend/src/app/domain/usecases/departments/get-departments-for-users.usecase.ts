import { Injectable, inject } from '@angular/core';
import { UserRepository } from '@domain/repositories/user.repository';
import { Department } from '@domain/models/user.model';
import { from, Observable } from 'rxjs';

/** Fetches the lightweight department list used to populate dropdowns in user forms. */
@Injectable({
  providedIn: 'root',
})
export class GetDepartmentsForUsersUseCase {
  private readonly userRepository = inject(UserRepository);

  execute(): Observable<Department[]> {
    return from(this.userRepository.getDepartments());
  }
}
