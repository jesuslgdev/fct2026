import { inject } from '@angular/core';
import { AuthRepository } from '@domain/repositories/auth.repository';
import { Session } from '@domain/models/session.model';

export class SignInWithGoogleUseCase {
  private authRepository = inject(AuthRepository);

  execute(): Promise<Session> {
    return this.authRepository.signInWithGoogle();
  }
}
