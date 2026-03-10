import { inject } from '@angular/core';
import { UserRepository } from '@domain/repositories/user.repository';
import { User } from '@domain/models/user.model';

export class ToggleUserStatusUseCase {
  private readonly userRepository = inject(UserRepository);

  execute(id: string, active: boolean): Promise<User> {
    return this.userRepository.toggleUserStatus(id, active);
  }
}
