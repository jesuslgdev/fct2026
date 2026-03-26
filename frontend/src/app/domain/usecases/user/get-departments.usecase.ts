import { Injectable, inject } from '@angular/core';
import { UserRepository } from '@domain/repositories/user.repository';
import { Department } from '@domain/models/user.model';

@Injectable({
  providedIn: 'root',
})
export class GetDepartmentsUseCase {
  private readonly userRepository = inject(UserRepository);

  execute(): Promise<Department[]> {
    return this.userRepository.getDepartments();
  }
}
