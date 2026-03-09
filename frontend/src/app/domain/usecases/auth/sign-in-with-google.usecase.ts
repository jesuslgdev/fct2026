import { inject } from '@angular/core';
import { AuthRepository } from '@domain/repositories/auth.repository';
import { AuthUser } from '@domain/models/auth-user.model';

export class SignInWithGoogleUseCase {
  private authRepository = inject(AuthRepository);

  execute(): Promise<AuthUser> {
    return this.authRepository.signInWithGoogle();
  }
}
