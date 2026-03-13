import { Injectable, inject } from '@angular/core';
import { UserRepository } from '@domain/repositories/user.repository';
import { User, UpdateUserPayload } from '@domain/models/user.model';

@Injectable({
  providedIn: 'root',
})
export class UpdateUserUseCase {
  private readonly userRepository = inject(UserRepository);

  execute(id: number, payload: UpdateUserPayload): Promise<User> {
    return this.userRepository.updateUser(id, payload);
  }
}
