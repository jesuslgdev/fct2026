import { Injectable, inject } from '@angular/core';
import { UserRepository } from '@domain/repositories/user.repository';

@Injectable({
  providedIn: 'root',
})
export class ToggleUserStatusUseCase {
  private readonly userRepository = inject(UserRepository);

  execute(id: number, active: boolean): Promise<void> {
    return this.userRepository.toggleUserStatus(id, active);
  }
}
