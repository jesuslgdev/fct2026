import { inject } from '@angular/core';
import { UserRepository } from '@domain/repositories/user.repository';
import { User, CreateUserPayload } from '@domain/models/user.model';

export class CreateUserUseCase {
  private readonly userRepository = inject(UserRepository);

  execute(payload: CreateUserPayload): Promise<User> {
    return this.userRepository.createUser(payload);
  }
}
