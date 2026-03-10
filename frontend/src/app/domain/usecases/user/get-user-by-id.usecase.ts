import { inject } from '@angular/core';
import { UserRepository } from '@domain/repositories/user.repository';
import { User } from '@domain/models/user.model';

export class GetUserByIdUseCase {
  private readonly userRepository = inject(UserRepository);

  execute(id: string): Promise<User> {
    return this.userRepository.getUserById(id);
  }
}
