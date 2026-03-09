import { inject } from '@angular/core';
import { AuthRepository } from '@domain/repositories/auth.repository';

export class SignOutUseCase {
  private authRepository = inject(AuthRepository);

  execute(): Promise<void> {
    return this.authRepository.signOut();
  }
}
