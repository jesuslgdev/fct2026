import { Injectable, inject } from '@angular/core';
import { UserRepository } from '@domain/repositories/user.repository';
import { Department } from '@domain/models/user.model';

/** Fetches the lightweight department list used to populate dropdowns in user forms. */
@Injectable({
  providedIn: 'root',
})
export class GetDepartmentsForUsersUseCase {
  private readonly userRepository = inject(UserRepository);

  execute(): Promise<Department[]> {
    return this.userRepository.getDepartments();
  }
}
