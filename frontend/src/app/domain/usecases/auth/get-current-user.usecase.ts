import { inject } from '@angular/core';
import { AuthRepository } from '@domain/repositories/auth.repository';
import { AuthUser } from '@domain/models/auth-user.model';

export class GetCurrentUserUseCase {
  private authRepository = inject(AuthRepository);

  execute(): Promise<AuthUser | null> {
    return this.authRepository.getCurrentUser();
  }
}
