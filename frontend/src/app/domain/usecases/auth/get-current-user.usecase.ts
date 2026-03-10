import { inject } from '@angular/core';
import { AuthService } from '@core/services/auth.service';
import { AuthUser } from '@domain/models/auth-user.model';

export class GetCurrentUserUseCase {
  private readonly authService = inject(AuthService);

  execute(): AuthUser | null {
    return this.authService.user();
  }
}
