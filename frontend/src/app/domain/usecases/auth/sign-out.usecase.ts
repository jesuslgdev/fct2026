import { Injectable, inject } from '@angular/core';
import { AuthRepository } from '@domain/repositories/auth.repository';

@Injectable({ providedIn: 'root' })
export class SignOutUseCase {
  private authRepository = inject(AuthRepository);

  execute(): Promise<void> {
    return this.authRepository.signOut();
  }
}
